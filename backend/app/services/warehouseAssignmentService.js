import mongoose from "mongoose";
import Order from "../models/order.js";
import Warehouse from "../models/warehouse.js";
import WarehouseInventory from "../models/warehouseInventory.js";
import WarehouseFulfillment, {
  FULFILLMENT_STATUS,
} from "../models/warehouseFulfillment.js";
import {
  reserveWarehouseStock,
  releaseWarehouseStockReservation,
} from "./warehouseInventoryService.js";
import { distanceMeters } from "../utils/geoUtils.js";
import { emitNotificationEvent } from "../modules/notifications/notification.emitter.js";
import { NOTIFICATION_EVENTS } from "../modules/notifications/notification.constants.js";
import * as logger from "./logger.js";

/**
 * Generate human-readable fulfillment ID: FUL-XXXXXX
 */
function generateFulfillmentId(orderId) {
  const cleanOrderId = String(orderId || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `FUL-${cleanOrderId || "ORD"}-${randomSuffix}`;
}

/**
 * Extract lat/lng coordinates from an entity's location.
 */
function extractCoords(entityLocation) {
  if (!entityLocation) return null;

  // GeoJSON format: { type: 'Point', coordinates: [lng, lat] }
  if (
    Array.isArray(entityLocation.coordinates) &&
    entityLocation.coordinates.length >= 2
  ) {
    const lng = Number(entityLocation.coordinates[0]);
    const lat = Number(entityLocation.coordinates[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  // Object format: { lat, lng }
  if (entityLocation.lat != null && entityLocation.lng != null) {
    const lat = Number(entityLocation.lat);
    const lng = Number(entityLocation.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

/**
 * Evaluates all active warehouses against an order's items and delivery location.
 */
export async function evaluateWarehousesForOrder(order) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    return { eligible: [], ineligible: [] };
  }

  const customerCoords = extractCoords(order.address?.location);

  const warehouses = await Warehouse.find({
    isActive: true,
    isVerified: true,
  }).lean();

  const evaluations = [];

  for (const wh of warehouses) {
    const whCoords = extractCoords(wh.location);
    let distanceKm = null;
    let withinServiceRadius = true;

    if (customerCoords && whCoords) {
      const meters = distanceMeters(
        customerCoords.lat,
        customerCoords.lng,
        whCoords.lat,
        whCoords.lng,
      );
      distanceKm = Math.round((meters / 1000) * 10) / 10;

      const maxRadiusKm = Number(wh.serviceRadius || 50);
      if (distanceKm > maxRadiusKm) {
        withinServiceRadius = false;
      }
    }

    // Check stock for all items
    const itemStockBreakdown = [];
    let hasAllStock = true;
    let fulfilledItemCount = 0;

    for (const item of order.items) {
      const productId = item.product || item.productId || item._id;
      const requiredQty = Number(item.quantity || 1);

      const inv = await WarehouseInventory.findOne({
        warehouse: wh._id,
        product: productId,
      }).lean();

      const available = inv ? Number(inv.available || 0) : 0;
      const hasStock = available >= requiredQty;

      if (!hasStock) {
        hasAllStock = false;
      } else {
        fulfilledItemCount++;
      }

      itemStockBreakdown.push({
        product: productId,
        name: item.name || "",
        sku: item.sku || (inv ? inv.sku : ""),
        requiredQty,
        availableQty: available,
        hasStock,
      });
    }

    const stockFulfillmentPercent = Math.round(
      (fulfilledItemCount / order.items.length) * 100,
    );

    evaluations.push({
      warehouseId: String(wh._id),
      warehouseName: wh.warehouseName || wh.name || "Warehouse",
      city: wh.city || "",
      address: wh.address || "",
      distanceKm,
      withinServiceRadius,
      hasAllStock,
      stockFulfillmentPercent,
      itemStockBreakdown,
      isActive: wh.isActive,
      isVerified: wh.isVerified,
    });
  }

  // Sort candidate rank:
  // 1. Has 100% stock & within radius (nearest first)
  // 2. Has 100% stock outside radius (nearest first)
  // 3. Partial stock (highest fulfillment % first)
  evaluations.sort((a, b) => {
    if (a.hasAllStock && !b.hasAllStock) return -1;
    if (!a.hasAllStock && b.hasAllStock) return 1;

    if (a.hasAllStock && b.hasAllStock) {
      if (a.withinServiceRadius && !b.withinServiceRadius) return -1;
      if (!a.withinServiceRadius && b.withinServiceRadius) return 1;
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    }

    return b.stockFulfillmentPercent - a.stockFulfillmentPercent;
  });

  const eligible = evaluations.filter((e) => e.hasAllStock);
  const ineligible = evaluations.filter((e) => !e.hasAllStock);

  return { eligible, ineligible, allEvaluations: evaluations };
}

/**
 * Finds the single best warehouse for an order.
 * Returns { bestWarehouseId, evaluation } or null if none capable.
 */
export async function findBestWarehouseForOrder(order) {
  const { eligible } = await evaluateWarehousesForOrder(order);
  if (eligible.length > 0) {
    return {
      bestWarehouseId: eligible[0].warehouseId,
      evaluation: eligible[0],
    };
  }
  return null;
}

/**
 * Assigns an order to a warehouse (automatically or manually by Admin).
 * Handles idempotency, stock reservation, fulfillment record creation, and failure alerts.
 */
export async function assignWarehouseToOrder({
  orderId,
  warehouseId = null,
  assignedBy = "system",
  force = false,
  session = null,
}) {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
  const order = await Order.findOne(
    isObjectId ? { _id: orderId } : { orderId },
    null,
    session ? { session } : {},
  );

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  let targetWarehouseId = warehouseId;

  // If no explicit warehouse provided, run automatic selection algorithm
  if (!targetWarehouseId) {
    const bestMatch = await findBestWarehouseForOrder(order);
    if (!bestMatch) {
      // Auto-assignment failed because no active warehouse has 100% stock
      order.warehouseAssignmentStatus = "FAILED_STOCK";
      await order.save({ session });

      logger.warn(
        `[WarehouseAssignment] Order #${order.orderId || order._id} auto-assignment failed: insufficient stock across all active warehouses.`,
      );

      // Notify Admin
      try {
        await emitNotificationEvent({
          event: NOTIFICATION_EVENTS.WAREHOUSE_ASSIGNMENT_FAILED,
          recipients: [{ role: "admin", id: "all" }],
          data: {
            orderId: order.orderId,
            reason: "Insufficient stock in warehouses",
          },
        });
      } catch (notifErr) {
        logger.error("[WarehouseAssignment] Failed to emit admin notification:", notifErr);
      }

      return {
        success: false,
        reason: "No active warehouse has sufficient available stock for all order items",
        order,
      };
    }

    targetWarehouseId = bestMatch.bestWarehouseId;
  }

  // Target warehouse existence check
  const warehouseDoc = await Warehouse.findById(targetWarehouseId)
    .select("warehouseName isActive isVerified")
    .lean();

  if (!warehouseDoc) {
    const error = new Error("Selected warehouse does not exist");
    error.statusCode = 404;
    throw error;
  }

  // Idempotency: Check if already assigned to the same warehouse
  const existingFulfillment = await WarehouseFulfillment.findOne({
    order: order._id,
    status: { $ne: FULFILLMENT_STATUS.CANCELLED },
  });

  if (
    existingFulfillment &&
    String(existingFulfillment.warehouse) === String(targetWarehouseId)
  ) {
    // Already cleanly assigned to this warehouse
    return {
      success: true,
      alreadyAssigned: true,
      fulfillment: existingFulfillment,
      order,
    };
  }

  // If re-assigning to a DIFFERENT warehouse, check safety
  if (existingFulfillment) {
    const activeStatuses = [
      FULFILLMENT_STATUS.PICKING,
      FULFILLMENT_STATUS.PACKING,
      FULFILLMENT_STATUS.PACKED,
      FULFILLMENT_STATUS.READY_TO_SHIP,
    ];

    if (activeStatuses.includes(existingFulfillment.status) && !force) {
      const error = new Error(
        `Cannot reassign order: fulfillment is already in progress (${existingFulfillment.status}). Admin override required.`,
      );
      error.statusCode = 400;
      throw error;
    }

    // Release old warehouse reservation
    try {
      await releaseWarehouseStockReservation({
        warehouseId: existingFulfillment.warehouse,
        items: order.items,
        reference: order.orderId || String(order._id),
        reason: `Reassigned to warehouse #${targetWarehouseId}`,
        performedBy: typeof assignedBy === "object" ? assignedBy : order._id,
        performedByModel: "Admin",
        session,
      });
    } catch (relErr) {
      logger.warn(
        `[WarehouseAssignment] Non-fatal error releasing previous reservation for order ${order.orderId}: ${relErr.message}`,
      );
    }

    // Cancel old fulfillment
    existingFulfillment.status = FULFILLMENT_STATUS.CANCELLED;
    existingFulfillment.cancelledAt = new Date();
    existingFulfillment.cancelReason = `Reassigned to warehouse #${targetWarehouseId}`;
    await existingFulfillment.save({ session });
  }

  // Reserve stock in new warehouse
  await reserveWarehouseStock({
    warehouseId: targetWarehouseId,
    items: order.items,
    reference: order.orderId || String(order._id),
    performedBy: typeof assignedBy === "object" ? assignedBy : order._id,
    performedByModel: "Admin",
    session,
  });

  // Prepare fulfillment items
  const fulfillmentItems = (order.items || []).map((item) => ({
    product: item.product || item.productId || item._id,
    name: item.name || "",
    sku: item.sku || item.variantSku || "",
    image: item.image || "",
    requiredQty: Number(item.quantity || 1),
    pickedQty: 0,
    status: "PENDING",
  }));

  const fulfillmentId = generateFulfillmentId(order.orderId || order._id);

  const fulfillment = await WarehouseFulfillment.create(
    [
      {
        fulfillmentId,
        order: order._id,
        orderId: order.orderId || String(order._id),
        warehouse: targetWarehouseId,
        status: FULFILLMENT_STATUS.ASSIGNED,
        items: fulfillmentItems,
        assignedAt: new Date(),
        assignedBy: typeof assignedBy === "object" ? assignedBy : "system",
      },
    ],
    session ? { session } : {},
  );

  // Update order model
  order.warehouse = targetWarehouseId;
  order.warehouseId = targetWarehouseId;
  order.warehouseAssignmentStatus = "ASSIGNED";
  order.warehouseAssignedAt = new Date();
  await order.save({ session });

  // Notify the assigned warehouse
  try {
    await emitNotificationEvent({
      event: NOTIFICATION_EVENTS.WAREHOUSE_ORDER_ASSIGNED,
      recipients: [{ role: "warehouse", id: String(targetWarehouseId) }],
      data: {
        orderId: order.orderId,
        fulfillmentId,
        itemCount: order.items?.length || 0,
      },
    });
  } catch (notifErr) {
    logger.warn("[WarehouseAssignment] Notification to warehouse failed:", notifErr);
  }

  return {
    success: true,
    fulfillment: fulfillment[0],
    order,
  };
}

/**
 * Get paginated list of orders requiring warehouse assignment.
 */
export async function getUnassignedOrdersList({
  page = 1,
  limit = 25,
  skip = 0,
  search = "",
}) {
  const query = {
    $or: [
      { warehouse: null },
      { warehouseId: null },
      { warehouseAssignmentStatus: { $in: ["UNASSIGNED", "FAILED_STOCK", "FAILED_LOCATION", "MANUAL_REQUIRED"] } },
    ],
    status: { $nin: ["cancelled", "refunded"] },
  };

  if (search) {
    query.orderId = new RegExp(search.trim(), "i");
  }

  const [items, total] = await Promise.all([
    Order.find(query)
      .populate("customer", "name phone email")
      .populate("items.product", "name title sku price images image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(query),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
