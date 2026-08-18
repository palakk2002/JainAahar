import mongoose from "mongoose";
import StockTransfer, {
  TRANSFER_STATUS,
  isValidTransferTransition,
} from "../models/stockTransfer.js";
import WarehouseInventory from "../models/warehouseInventory.js";
import InventoryTransaction, {
  INVENTORY_TRANSACTION_TYPES,
} from "../models/inventoryTransaction.js";
import Product from "../models/product.js";
import Warehouse from "../models/warehouse.js";
import { getOrCreateWarehouseInventory } from "./warehouseInventoryService.js";

/**
 * Generate unique human-readable transfer ID: TRF-YYYYMMDD-XXXX
 */
function generateTransferId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TRF-${dateStr}-${randomSuffix}`;
}

/**
 * List transfers with filtering and pagination.
 * - Warehouse users only see transfers where they are source or destination.
 * - Admin sees all.
 */
export async function getTransfersList({
  warehouseId = null,
  status = "all",
  search = "",
  page = 1,
  limit = 25,
  skip = 0,
}) {
  const query = {};

  if (warehouseId && warehouseId !== "all") {
    const whObjId = new mongoose.Types.ObjectId(warehouseId);
    query.$or = [{ fromWarehouse: whObjId }, { toWarehouse: whObjId }];
  }

  if (status && status !== "all") {
    query.status = String(status).toUpperCase();
  }

  if (search) {
    query.transferId = new RegExp(search.trim(), "i");
  }

  const [items, total] = await Promise.all([
    StockTransfer.find(query)
      .populate("fromWarehouse", "warehouseName name city address phone")
      .populate("toWarehouse", "warehouseName name city address phone")
      .populate("items.product", "name title sku price images image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StockTransfer.countDocuments(query),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Get transfer detail by ID (or transferId string).
 */
export async function getTransferById(idOrTransferId, user = null) {
  const isObjectId = mongoose.Types.ObjectId.isValid(idOrTransferId);
  const query = isObjectId
    ? { _id: idOrTransferId }
    : { transferId: idOrTransferId };

  const transfer = await StockTransfer.findOne(query)
    .populate("fromWarehouse", "warehouseName name city address phone")
    .populate("toWarehouse", "warehouseName name city address phone")
    .populate("items.product", "name title sku price images image")
    .lean();

  if (!transfer) {
    const error = new Error("Stock transfer not found");
    error.statusCode = 404;
    throw error;
  }

  // Security check: If warehouse user, ensure they are sender or receiver
  if (user && user.role === "warehouse") {
    const whId = String(user.id || user._id);
    const fromId = String(transfer.fromWarehouse?._id || transfer.fromWarehouse);
    const toId = String(transfer.toWarehouse?._id || transfer.toWarehouse);
    if (whId !== fromId && whId !== toId) {
      const error = new Error("Access denied to this transfer");
      error.statusCode = 403;
      throw error;
    }
  }

  return transfer;
}

/**
 * Create a new stock transfer request.
 */
export async function createStockTransferRequest({
  fromWarehouseId,
  toWarehouseId,
  items = [],
  notes = "",
  requestedBy,
  userRole = "Warehouse",
}) {
  if (!fromWarehouseId || !toWarehouseId) {
    const error = new Error("Source and destination warehouses are required");
    error.statusCode = 400;
    throw error;
  }

  if (String(fromWarehouseId) === String(toWarehouseId)) {
    const error = new Error("Source and destination warehouse cannot be the same");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("Transfer must include at least one item");
    error.statusCode = 400;
    throw error;
  }

  // Validate warehouses exist
  const [fromWh, toWh] = await Promise.all([
    Warehouse.findById(fromWarehouseId).select("warehouseName isVerified isActive").lean(),
    Warehouse.findById(toWarehouseId).select("warehouseName isVerified isActive").lean(),
  ]);

  if (!fromWh || !toWh) {
    const error = new Error("One or both warehouses do not exist");
    error.statusCode = 404;
    throw error;
  }

  // Validate item stock availability in source warehouse
  const sanitizedItems = [];
  for (const item of items) {
    const productId = item.productId || item.product || item._id;
    const qty = Number(item.quantity || item.qty);

    if (!productId || !Number.isFinite(qty) || qty <= 0) {
      const error = new Error("Each transfer item must have a valid product and positive quantity");
      error.statusCode = 400;
      throw error;
    }

    const productDoc = await Product.findById(productId).select("name title sku").lean();
    if (!productDoc) {
      const error = new Error(`Product not found: ${productId}`);
      error.statusCode = 404;
      throw error;
    }

    const inv = await WarehouseInventory.findOne({
      warehouse: fromWarehouseId,
      product: productId,
    }).lean();

    const available = inv ? Number(inv.available || 0) : 0;
    if (available < qty) {
      const error = new Error(
        `Insufficient available stock for "${productDoc.name || productDoc.title}" in source warehouse. Available: ${available}, Requested: ${qty}`,
      );
      error.statusCode = 400;
      throw error;
    }

    sanitizedItems.push({
      product: productId,
      name: productDoc.name || productDoc.title || "",
      sku: productDoc.sku || item.sku || "",
      quantity: qty,
    });
  }

  const transfer = await StockTransfer.create({
    transferId: generateTransferId(),
    fromWarehouse: fromWarehouseId,
    toWarehouse: toWarehouseId,
    status: TRANSFER_STATUS.REQUESTED,
    items: sanitizedItems,
    requestedBy,
    requestedAt: new Date(),
    notes,
  });

  return transfer;
}

/**
 * Approve a transfer and dispatch it into IN_TRANSIT.
 * Deducts stock from source warehouse and logs TRANSFER_OUT transaction.
 */
export async function approveAndDispatchTransfer({
  transferId,
  approvedBy,
  user,
}) {
  const transfer = await StockTransfer.findOne({
    $or: [{ _id: mongoose.Types.ObjectId.isValid(transferId) ? transferId : null }, { transferId }],
  });

  if (!transfer) {
    const error = new Error("Stock transfer not found");
    error.statusCode = 404;
    throw error;
  }

  if (transfer.status !== TRANSFER_STATUS.REQUESTED) {
    const error = new Error(`Cannot approve transfer in status "${transfer.status}"`);
    error.statusCode = 400;
    throw error;
  }

  // Security: only source warehouse or admin can approve/dispatch
  if (user && user.role === "warehouse") {
    const whId = String(user.id || user._id);
    if (whId !== String(transfer.fromWarehouse)) {
      const error = new Error("Only the source warehouse or admin can approve and dispatch this transfer");
      error.statusCode = 403;
      throw error;
    }
  }

  // Deduct available stock from source warehouse atomically
  for (const item of transfer.items) {
    const updated = await WarehouseInventory.findOneAndUpdate(
      {
        warehouse: transfer.fromWarehouse,
        product: item.product,
        available: { $gte: item.quantity },
      },
      {
        $inc: { available: -item.quantity },
        $set: { lastUpdated: new Date() },
      },
      { new: true },
    );

    if (!updated) {
      const current = await WarehouseInventory.findOne({
        warehouse: transfer.fromWarehouse,
        product: item.product,
      }).lean();
      const available = current ? current.available : 0;
      const error = new Error(
        `Insufficient stock in source warehouse for item "${item.name}". Available: ${available}, Required: ${item.quantity}`,
      );
      error.statusCode = 400;
      throw error;
    }

    const afterQty = Number(updated.available || 0);
    const beforeQty = afterQty + item.quantity;

    await InventoryTransaction.create({
      warehouse: transfer.fromWarehouse,
      product: item.product,
      sku: item.sku || updated.sku || "",
      type: INVENTORY_TRANSACTION_TYPES.TRANSFER_OUT,
      quantity: -item.quantity,
      beforeQty,
      afterQty,
      reference: transfer.transferId,
      reason: `Transfer dispatched to warehouse #${transfer.toWarehouse}`,
      performedBy: approvedBy,
      performedByModel: user.role === "admin" ? "Admin" : "Warehouse",
    });
  }

  transfer.status = TRANSFER_STATUS.IN_TRANSIT;
  transfer.approvedBy = approvedBy;
  transfer.approvedAt = new Date();
  transfer.inTransitAt = new Date();
  await transfer.save();

  return transfer;
}

/**
 * Receive a transfer at the destination warehouse.
 * Credits stock to destination warehouse and logs TRANSFER_IN transaction.
 */
export async function receiveTransfer({
  transferId,
  receivedBy,
  user,
  notes = "",
}) {
  const transfer = await StockTransfer.findOne({
    $or: [{ _id: mongoose.Types.ObjectId.isValid(transferId) ? transferId : null }, { transferId }],
  });

  if (!transfer) {
    const error = new Error("Stock transfer not found");
    error.statusCode = 404;
    throw error;
  }

  if (transfer.status !== TRANSFER_STATUS.IN_TRANSIT && transfer.status !== TRANSFER_STATUS.APPROVED) {
    const error = new Error(`Cannot receive transfer in status "${transfer.status}"`);
    error.statusCode = 400;
    throw error;
  }

  // Security: destination warehouse or admin can receive
  if (user && user.role === "warehouse") {
    const whId = String(user.id || user._id);
    if (whId !== String(transfer.toWarehouse)) {
      const error = new Error("Only the destination warehouse or admin can confirm receiving this transfer");
      error.statusCode = 403;
      throw error;
    }
  }

  // Credit stock to destination warehouse
  for (const item of transfer.items) {
    const inventory = await getOrCreateWarehouseInventory({
      warehouseId: transfer.toWarehouse,
      productId: item.product,
      sku: item.sku,
    });

    const beforeQty = Number(inventory.available || 0);
    const updated = await WarehouseInventory.findByIdAndUpdate(
      inventory._id,
      {
        $inc: { available: item.quantity },
        $set: { lastUpdated: new Date() },
      },
      { new: true },
    );

    const afterQty = Number(updated.available || 0);

    await InventoryTransaction.create({
      warehouse: transfer.toWarehouse,
      product: item.product,
      sku: item.sku || updated.sku || "",
      type: INVENTORY_TRANSACTION_TYPES.TRANSFER_IN,
      quantity: item.quantity,
      beforeQty,
      afterQty,
      reference: transfer.transferId,
      reason: `Transfer received from warehouse #${transfer.fromWarehouse}`,
      notes,
      performedBy: receivedBy,
      performedByModel: user.role === "admin" ? "Admin" : "Warehouse",
    });
  }

  transfer.status = TRANSFER_STATUS.RECEIVED;
  transfer.receivedBy = receivedBy;
  transfer.receivedAt = new Date();
  if (notes) {
    transfer.notes = transfer.notes ? `${transfer.notes}\n${notes}` : notes;
  }
  await transfer.save();

  return transfer;
}

/**
 * Cancel a stock transfer.
 * If transfer was already IN_TRANSIT (stock had been deducted from source), refund stock back to source.
 */
export async function cancelStockTransfer({
  transferId,
  cancelledBy,
  user,
  reason = "Transfer Cancelled",
}) {
  const transfer = await StockTransfer.findOne({
    $or: [{ _id: mongoose.Types.ObjectId.isValid(transferId) ? transferId : null }, { transferId }],
  });

  if (!transfer) {
    const error = new Error("Stock transfer not found");
    error.statusCode = 404;
    throw error;
  }

  if (transfer.status === TRANSFER_STATUS.RECEIVED || transfer.status === TRANSFER_STATUS.CANCELLED) {
    const error = new Error(`Cannot cancel transfer already in status "${transfer.status}"`);
    error.statusCode = 400;
    throw error;
  }

  // If already dispatched / in-transit, refund stock back to source warehouse
  if (transfer.status === TRANSFER_STATUS.IN_TRANSIT || transfer.status === TRANSFER_STATUS.APPROVED) {
    for (const item of transfer.items) {
      const inventory = await getOrCreateWarehouseInventory({
        warehouseId: transfer.fromWarehouse,
        productId: item.product,
        sku: item.sku,
      });

      const beforeQty = Number(inventory.available || 0);
      const updated = await WarehouseInventory.findByIdAndUpdate(
        inventory._id,
        {
          $inc: { available: item.quantity },
          $set: { lastUpdated: new Date() },
        },
        { new: true },
      );

      const afterQty = Number(updated.available || 0);

      await InventoryTransaction.create({
        warehouse: transfer.fromWarehouse,
        product: item.product,
        sku: item.sku || updated.sku || "",
        type: INVENTORY_TRANSACTION_TYPES.TRANSFER_IN,
        quantity: item.quantity,
        beforeQty,
        afterQty,
        reference: transfer.transferId,
        reason: `Refunded from cancelled transfer #${transfer.transferId}: ${reason}`,
        performedBy: cancelledBy,
        performedByModel: user.role === "admin" ? "Admin" : "Warehouse",
      });
    }
  }

  transfer.status = TRANSFER_STATUS.CANCELLED;
  transfer.cancelledAt = new Date();
  transfer.cancelReason = reason;
  await transfer.save();

  return transfer;
}
