import mongoose from "mongoose";
import WarehouseInventory from "../models/warehouseInventory.js";
import InventoryTransaction, {
  INVENTORY_TRANSACTION_TYPES,
} from "../models/inventoryTransaction.js";
import Product from "../models/product.js";
import Warehouse from "../models/warehouse.js";
import StockHistory from "../models/stockHistory.js";

/**
 * Syncs Product.stock with the aggregate of WarehouseInventory.available
 * across ALL warehouses stocking that product.
 *
 * Product.stock = SUM(WarehouseInventory.available) for the product.
 *
 * This keeps the legacy Product.stock field (used by the customer checkout
 * flow and the product listing) in sync with the warehouse-based system.
 * Call this after any warehouse inventory change (inward, outward,
 * adjustment, damaged, transfer, reservation, release, fulfillment).
 */
export async function syncProductStockFromWarehouse(productId) {
  if (!productId) return null;

  const aggregation = await WarehouseInventory.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        totalAvailable: { $sum: "$available" },
      },
    },
  ]);

  const totalAvailable = aggregation.length > 0 ? aggregation[0].totalAvailable : 0;

  const updated = await Product.findByIdAndUpdate(
    productId,
    { $set: { stock: Math.max(0, totalAvailable) } },
    { new: true },
  );

  return updated;
}

/**
 * Resolves the effective warehouse ID:
 * - If user is "warehouse", strictly use their own ID (prevents IDOR).
 * - If user is "admin", allow explicit targetWarehouseId from query/body or fallback.
 */
export function resolveEffectiveWarehouseId(user, explicitTargetId = null) {
  if (!user) return null;
  if (user.role === "warehouse") {
    return String(user.id || user._id);
  }
  if (user.role === "admin" && explicitTargetId) {
    return String(explicitTargetId);
  }
  return explicitTargetId ? String(explicitTargetId) : null;
}

/**
 * Get paginated inventory for a warehouse with optional search and filters.
 */
export async function getWarehouseInventory({
  warehouseId,
  search = "",
  status = "all",
  category = "",
  page = 1,
  limit = 25,
  skip = 0,
}) {
  const query = {};

  if (warehouseId && warehouseId !== "all") {
    query.warehouse = new mongoose.Types.ObjectId(warehouseId);
  }

  // Stock status filter
  if (status === "low_stock") {
    query.$expr = {
      $and: [
        { $gt: ["$available", 0] },
        { $lte: ["$available", "$minStock"] },
      ],
    };
  } else if (status === "out_of_stock") {
    query.available = { $lte: 0 };
  } else if (status === "in_stock") {
    query.$expr = { $gt: ["$available", "$minStock"] };
  } else if (status === "damaged") {
    query.$or = [{ damaged: { $gt: 0 } }, { defective: { $gt: 0 } }];
  }

  // Search by SKU or populated product fields
  if (search) {
    const searchRegex = new RegExp(search.trim(), "i");
    // Find matching products first to filter inventory by product ObjectId
    const matchingProducts = await Product.find({
      $or: [
        { name: searchRegex },
        { title: searchRegex },
        { sku: searchRegex },
        { categoryName: searchRegex },
      ],
    })
      .select("_id")
      .lean();

    const productIds = matchingProducts.map((p) => p._id);
    query.$or = [
      { sku: searchRegex },
      { product: { $in: productIds } },
    ];
  }

  const [items, total] = await Promise.all([
    WarehouseInventory.find(query)
      .populate({
        path: "product",
        select: "name title sku price discountedPrice categoryName images image variants status isAvailable",
      })
      .populate({
        path: "warehouse",
        select: "warehouseName name address city state phone",
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    WarehouseInventory.countDocuments(query),
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
 * Get low stock inventory items for a warehouse.
 */
export async function getLowStockInventory({
  warehouseId,
  search = "",
  page = 1,
  limit = 25,
  skip = 0,
}) {
  return getWarehouseInventory({
    warehouseId,
    search,
    status: "low_stock",
    page,
    limit,
    skip,
  });
}

/**
 * Get out of stock inventory items for a warehouse.
 */
export async function getOutOfStockInventory({
  warehouseId,
  search = "",
  page = 1,
  limit = 25,
  skip = 0,
}) {
  return getWarehouseInventory({
    warehouseId,
    search,
    status: "out_of_stock",
    page,
    limit,
    skip,
  });
}

/**
 * Summary metrics for a warehouse inventory dashboard.
 */
export async function getWarehouseInventorySummary({ warehouseId }) {
  const match = {};
  if (warehouseId && warehouseId !== "all") {
    match.warehouse = new mongoose.Types.ObjectId(warehouseId);
  }

  const aggregation = await WarehouseInventory.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalSkus: { $sum: 1 },
        totalAvailable: { $sum: "$available" },
        totalReserved: { $sum: "$reserved" },
        totalDamaged: { $sum: "$damaged" },
        totalDefective: { $sum: "$defective" },
        lowStockCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ["$available", 0] },
                  { $lte: ["$available", "$minStock"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        outOfStockCount: {
          $sum: {
            $cond: [{ $lte: ["$available", 0] }, 1, 0],
          },
        },
      },
    },
  ]);

  const summary = aggregation[0] || {
    totalSkus: 0,
    totalAvailable: 0,
    totalReserved: 0,
    totalDamaged: 0,
    totalDefective: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  delete summary._id;
  summary.totalPhysicalStock =
    (summary.totalAvailable || 0) +
    (summary.totalReserved || 0) +
    (summary.totalDamaged || 0) +
    (summary.totalDefective || 0);

  return summary;
}

/**
 * Helper to ensure a WarehouseInventory record exists (get or create).
 */
export async function getOrCreateWarehouseInventory({
  warehouseId,
  productId,
  sku = "",
  minStock = 5,
  session = null,
}) {
  let inventory = await WarehouseInventory.findOne(
    { warehouse: warehouseId, product: productId },
    null,
    session ? { session } : {},
  );

  if (!inventory) {
    if (!sku) {
      const product = await Product.findById(productId).select("sku").lean();
      sku = product?.sku || "";
    }

    try {
      const created = await WarehouseInventory.create(
        [
          {
            warehouse: warehouseId,
            product: productId,
            sku,
            available: 0,
            reserved: 0,
            damaged: 0,
            defective: 0,
            minStock,
            lastUpdated: new Date(),
          },
        ],
        session ? { session } : {},
      );
      inventory = created[0];
    } catch (err) {
      // Handle race condition where record was created concurrently
      if (err.code === 11000) {
        inventory = await WarehouseInventory.findOne(
          { warehouse: warehouseId, product: productId },
          null,
          session ? { session } : {},
        );
      } else {
        throw err;
      }
    }
  }

  return inventory;
}

/**
 * Atomic Stock Inward (Stock Received at Warehouse).
 *
 * Supports damaged/defective split at inward time:
 *   receivedQty (quantity) = acceptedQty + damagedQty + defectiveQty
 *   acceptedQty → added to `available`
 *   damagedQty  → added to `damaged` (quarantined, not sellable)
 *   defectiveQty → added to `defective` (quarantined, not sellable)
 */
export async function recordStockInward({
  warehouseId,
  productId,
  sku = "",
  quantity,
  damagedQty = 0,
  defectiveQty = 0,
  reason = "Stock Received",
  reference = "",
  notes = "",
  performedBy,
  performedByModel = "Warehouse",
}) {
  const totalReceived = Number(quantity);
  if (!Number.isFinite(totalReceived) || totalReceived <= 0) {
    const error = new Error("Inward quantity must be a positive number");
    error.statusCode = 400;
    throw error;
  }

  const dmg = Math.max(0, Math.floor(Number(damagedQty) || 0));
  const def = Math.max(0, Math.floor(Number(defectiveQty) || 0));

  if (dmg + def > totalReceived) {
    const error = new Error(
      `Damaged (${dmg}) + Defective (${def}) cannot exceed total received (${totalReceived})`,
    );
    error.statusCode = 400;
    throw error;
  }

  const acceptedQty = totalReceived - dmg - def;

  const inventory = await getOrCreateWarehouseInventory({
    warehouseId,
    productId,
    sku,
  });

  // Build atomic update: increment available, damaged, defective
  const incUpdate = { available: acceptedQty };
  if (dmg > 0) incUpdate.damaged = dmg;
  if (def > 0) incUpdate.defective = def;

  const beforeAvailable = Number(inventory.available || 0);
  const beforeDamaged = Number(inventory.damaged || 0);
  const beforeDefective = Number(inventory.defective || 0);

  const updated = await WarehouseInventory.findByIdAndUpdate(
    inventory._id,
    {
      $inc: incUpdate,
      $set: { lastUpdated: new Date() },
    },
    { new: true },
  );

  const afterAvailable = Number(updated.available || 0);
  const refId = reference || `INW-${Date.now()}`;
  const transactions = [];

  // Audit record for accepted stock (into available)
  if (acceptedQty > 0) {
    const tx = await InventoryTransaction.create({
      warehouse: warehouseId,
      product: productId,
      sku: updated.sku || sku,
      type: INVENTORY_TRANSACTION_TYPES.INWARD,
      quantity: acceptedQty,
      beforeQty: beforeAvailable,
      afterQty: afterAvailable,
      reference: refId,
      reason,
      notes: notes
        ? `${notes} | Received: ${totalReceived}, Accepted: ${acceptedQty}`
        : `Received: ${totalReceived}, Accepted: ${acceptedQty}`,
      performedBy,
      performedByModel,
    });
    transactions.push(tx);
  }

  // Audit record for damaged stock (quarantined at inward)
  if (dmg > 0) {
    const tx = await InventoryTransaction.create({
      warehouse: warehouseId,
      product: productId,
      sku: updated.sku || sku,
      type: INVENTORY_TRANSACTION_TYPES.DAMAGED,
      quantity: dmg,
      beforeQty: beforeDamaged,
      afterQty: Number(updated.damaged || 0),
      reference: refId,
      reason: `Damaged at inward: ${reason}`,
      notes: notes || "",
      performedBy,
      performedByModel,
    });
    transactions.push(tx);
  }

  // Audit record for defective stock (quarantined at inward)
  if (def > 0) {
    const tx = await InventoryTransaction.create({
      warehouse: warehouseId,
      product: productId,
      sku: updated.sku || sku,
      type: INVENTORY_TRANSACTION_TYPES.DAMAGED, // Reuses DAMAGED type for defective
      quantity: def,
      beforeQty: beforeDefective,
      afterQty: Number(updated.defective || 0),
      reference: refId,
      reason: `Defective at inward: ${reason}`,
      notes: notes || "",
      performedBy,
      performedByModel,
    });
    transactions.push(tx);
  }

  // Also maintain existing StockHistory for backward-compatibility
  try {
    await StockHistory.create({
      product: productId,
      warehouseId,
      type: "Restock",
      quantity: acceptedQty,
      note: `Warehouse Inward: ${reason} (Received: ${totalReceived}, Accepted: ${acceptedQty}, Damaged: ${dmg}, Defective: ${def})${notes ? ` — ${notes}` : ""}`.trim(),
    });
  } catch (shErr) {
    // Non-critical fallback
  }

  // Sync Product.stock with total warehouse available stock
  try {
    await syncProductStockFromWarehouse(productId);
  } catch (syncErr) {
    // Non-critical — Product.stock sync is best-effort
  }

  return {
    inventory: updated,
    transaction: transactions[0] || null,
    transactions,
    summary: {
      totalReceived,
      acceptedQty,
      damagedQty: dmg,
      defectiveQty: def,
    },
  };
}


/**
 * Atomic Stock Outward (Stock Sent Out / Removed).
 */
export async function recordStockOutward({
  warehouseId,
  productId,
  sku = "",
  quantity,
  reason = "Stock Outward",
  reference = "",
  notes = "",
  performedBy,
  performedByModel = "Warehouse",
}) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    const error = new Error("Outward quantity must be a positive number");
    error.statusCode = 400;
    throw error;
  }

  // Atomic deduction ensuring available >= qty
  const updated = await WarehouseInventory.findOneAndUpdate(
    {
      warehouse: warehouseId,
      product: productId,
      available: { $gte: qty },
    },
    {
      $inc: { available: -qty },
      $set: { lastUpdated: new Date() },
    },
    { new: true },
  );

  if (!updated) {
    const current = await WarehouseInventory.findOne({
      warehouse: warehouseId,
      product: productId,
    }).lean();
    const available = current ? current.available : 0;
    const error = new Error(
      `Insufficient available stock for outward operation. Requested: ${qty}, Available: ${available}`,
    );
    error.statusCode = 400;
    throw error;
  }

  const afterQty = Number(updated.available || 0);
  const beforeQty = afterQty + qty;

  const tx = await InventoryTransaction.create({
    warehouse: warehouseId,
    product: productId,
    sku: updated.sku || sku,
    type: INVENTORY_TRANSACTION_TYPES.OUTWARD,
    quantity: -qty,
    beforeQty,
    afterQty,
    reference: reference || `OUT-${Date.now()}`,
    reason,
    notes,
    performedBy,
    performedByModel,
  });

  try {
    await StockHistory.create({
      product: productId,
      warehouseId,
      type: "Correction",
      quantity: -qty,
      note: `Warehouse Outward: ${reason} ${notes ? `(${notes})` : ""}`.trim(),
    });
  } catch (shErr) {}

  try {
    await syncProductStockFromWarehouse(productId);
  } catch (syncErr) {}

  return { inventory: updated, transaction: tx };
}

/**
 * Atomic Stock Adjustment (+ Increase or - Decrease).
 */
export async function recordStockAdjustment({
  warehouseId,
  productId,
  sku = "",
  adjustmentType, // "INCREASE" or "DECREASE"
  quantity,
  reason = "Stock Adjustment",
  reference = "",
  notes = "",
  performedBy,
  performedByModel = "Warehouse",
}) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    const error = new Error("Adjustment quantity must be a positive number");
    error.statusCode = 400;
    throw error;
  }

  const normalizedType = String(adjustmentType || "").toUpperCase();
  if (normalizedType !== "INCREASE" && normalizedType !== "DECREASE") {
    const error = new Error("Adjustment type must be INCREASE or DECREASE");
    error.statusCode = 400;
    throw error;
  }

  if (normalizedType === "INCREASE") {
    const inventory = await getOrCreateWarehouseInventory({
      warehouseId,
      productId,
      sku,
    });

    const beforeQty = Number(inventory.available || 0);
    const updated = await WarehouseInventory.findByIdAndUpdate(
      inventory._id,
      {
        $inc: { available: qty },
        $set: { lastUpdated: new Date() },
      },
      { new: true },
    );

    const afterQty = Number(updated.available || 0);

    const tx = await InventoryTransaction.create({
      warehouse: warehouseId,
      product: productId,
      sku: updated.sku || sku,
      type: INVENTORY_TRANSACTION_TYPES.ADJUSTMENT_INCREASE,
      quantity: qty,
      beforeQty,
      afterQty,
      reference: reference || `ADJ-INC-${Date.now()}`,
      reason,
      notes,
      performedBy,
      performedByModel,
    });

    try {
      await syncProductStockFromWarehouse(productId);
    } catch (syncErr) {}

    return { inventory: updated, transaction: tx };
  } else {
    // DECREASE
    const updated = await WarehouseInventory.findOneAndUpdate(
      {
        warehouse: warehouseId,
        product: productId,
        available: { $gte: qty },
      },
      {
        $inc: { available: -qty },
        $set: { lastUpdated: new Date() },
      },
      { new: true },
    );

    if (!updated) {
      const current = await WarehouseInventory.findOne({
        warehouse: warehouseId,
        product: productId,
      }).lean();
      const available = current ? current.available : 0;
      const error = new Error(
        `Cannot decrease stock below 0. Requested decrease: ${qty}, Available: ${available}`,
      );
      error.statusCode = 400;
      throw error;
    }

    const afterQty = Number(updated.available || 0);
    const beforeQty = afterQty + qty;

    const tx = await InventoryTransaction.create({
      warehouse: warehouseId,
      product: productId,
      sku: updated.sku || sku,
      type: INVENTORY_TRANSACTION_TYPES.ADJUSTMENT_DECREASE,
      quantity: -qty,
      beforeQty,
      afterQty,
      reference: reference || `ADJ-DEC-${Date.now()}`,
      reason,
      notes,
      performedBy,
      performedByModel,
    });

    try {
      await syncProductStockFromWarehouse(productId);
    } catch (syncErr) {}

    return { inventory: updated, transaction: tx };
  }
}

/**
 * Move available stock to damaged quarantine.
 */
export async function recordDamagedStock({
  warehouseId,
  productId,
  sku = "",
  quantity,
  reason = "Damaged in Warehouse",
  reference = "",
  notes = "",
  performedBy,
  performedByModel = "Warehouse",
}) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    const error = new Error("Damaged quantity must be a positive number");
    error.statusCode = 400;
    throw error;
  }

  const updated = await WarehouseInventory.findOneAndUpdate(
    {
      warehouse: warehouseId,
      product: productId,
      available: { $gte: qty },
    },
    {
      $inc: { available: -qty, damaged: qty },
      $set: { lastUpdated: new Date() },
    },
    { new: true },
  );

  if (!updated) {
    const current = await WarehouseInventory.findOne({
      warehouse: warehouseId,
      product: productId,
    }).lean();
    const available = current ? current.available : 0;
    const error = new Error(
      `Insufficient available stock to mark as damaged. Requested: ${qty}, Available: ${available}`,
    );
    error.statusCode = 400;
    throw error;
  }

  const afterQty = Number(updated.available || 0);
  const beforeQty = afterQty + qty;

  const tx = await InventoryTransaction.create({
    warehouse: warehouseId,
    product: productId,
    sku: updated.sku || sku,
    type: INVENTORY_TRANSACTION_TYPES.DAMAGED,
    quantity: qty,
    beforeQty,
    afterQty,
    reference: reference || `DMG-${Date.now()}`,
    reason,
    notes,
    performedBy,
    performedByModel,
  });

  try {
    await syncProductStockFromWarehouse(productId);
  } catch (syncErr) {}

  return { inventory: updated, transaction: tx };
}

/**
 * Move available stock to defective quarantine.
 */
export async function recordDefectiveStock({
  warehouseId,
  productId,
  sku = "",
  quantity,
  reason = "Defective Item",
  reference = "",
  notes = "",
  performedBy,
  performedByModel = "Warehouse",
}) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    const error = new Error("Defective quantity must be a positive number");
    error.statusCode = 400;
    throw error;
  }

  const updated = await WarehouseInventory.findOneAndUpdate(
    {
      warehouse: warehouseId,
      product: productId,
      available: { $gte: qty },
    },
    {
      $inc: { available: -qty, defective: qty },
      $set: { lastUpdated: new Date() },
    },
    { new: true },
  );

  if (!updated) {
    const current = await WarehouseInventory.findOne({
      warehouse: warehouseId,
      product: productId,
    }).lean();
    const available = current ? current.available : 0;
    const error = new Error(
      `Insufficient available stock to mark as defective. Requested: ${qty}, Available: ${available}`,
    );
    error.statusCode = 400;
    throw error;
  }

  const afterQty = Number(updated.available || 0);
  const beforeQty = afterQty + qty;

  const tx = await InventoryTransaction.create({
    warehouse: warehouseId,
    product: productId,
    sku: updated.sku || sku,
    type: INVENTORY_TRANSACTION_TYPES.DAMAGED,
    quantity: qty,
    beforeQty,
    afterQty,
    reference: reference || `DEF-${Date.now()}`,
    reason,
    notes,
    performedBy,
    performedByModel,
  });

  try {
    await syncProductStockFromWarehouse(productId);
  } catch (syncErr) {}

  return { inventory: updated, transaction: tx };
}

/**
 * Restock from damaged or defective quarantine back to available.
 */
export async function recordRestockFromDamaged({
  warehouseId,
  productId,
  sku = "",
  quantity,
  fromType = "damaged", // "damaged" or "defective"
  reason = "Restocked after Inspection/Repair",
  reference = "",
  notes = "",
  performedBy,
  performedByModel = "Warehouse",
}) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    const error = new Error("Restock quantity must be a positive number");
    error.statusCode = 400;
    throw error;
  }

  const fieldToDecrement = fromType === "defective" ? "defective" : "damaged";

  const updated = await WarehouseInventory.findOneAndUpdate(
    {
      warehouse: warehouseId,
      product: productId,
      [fieldToDecrement]: { $gte: qty },
    },
    {
      $inc: { [fieldToDecrement]: -qty, available: qty },
      $set: { lastUpdated: new Date() },
    },
    { new: true },
  );

  if (!updated) {
    const error = new Error(
      `Insufficient ${fromType} stock to restock. Requested: ${qty}`,
    );
    error.statusCode = 400;
    throw error;
  }

  const afterQty = Number(updated.available || 0);
  const beforeQty = afterQty - qty;

  const tx = await InventoryTransaction.create({
    warehouse: warehouseId,
    product: productId,
    sku: updated.sku || sku,
    type: INVENTORY_TRANSACTION_TYPES.RETURN_RESTOCK,
    quantity: qty,
    beforeQty,
    afterQty,
    reference: reference || `RST-${Date.now()}`,
    reason,
    notes,
    performedBy,
    performedByModel,
  });

  try {
    await syncProductStockFromWarehouse(productId);
  } catch (syncErr) {}

  return { inventory: updated, transaction: tx };
}

/**
 * Get paginated transaction history for a warehouse / product.
 */
export async function getInventoryTransactionHistory({
  warehouseId,
  productId = null,
  type = "",
  reference = "",
  page = 1,
  limit = 25,
  skip = 0,
}) {
  const query = {};

  if (warehouseId && warehouseId !== "all") {
    query.warehouse = new mongoose.Types.ObjectId(warehouseId);
  }

  if (productId) {
    query.product = new mongoose.Types.ObjectId(productId);
  }

  if (type) {
    query.type = type;
  }

  if (reference) {
    query.reference = new RegExp(reference.trim(), "i");
  }

  const [items, total] = await Promise.all([
    InventoryTransaction.find(query)
      .populate({
        path: "product",
        select: "name title sku images image",
      })
      .populate({
        path: "warehouse",
        select: "warehouseName name city",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InventoryTransaction.countDocuments(query),
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
 * Reserve stock for order items at a specific warehouse atomically.
 * Moves quantity from `available` to `reserved`.
 */
export async function reserveWarehouseStock({
  warehouseId,
  items = [],
  reference = "",
  performedBy,
  performedByModel = "Admin",
  session = null,
}) {
  const reservedItems = [];

  for (const item of items) {
    const productId = item.product || item.productId || item._id;
    const qty = Number(item.quantity || item.requiredQty || 1);

    const updated = await WarehouseInventory.findOneAndUpdate(
      {
        warehouse: warehouseId,
        product: productId,
        available: { $gte: qty },
      },
      {
        $inc: { available: -qty, reserved: qty },
        $set: { lastUpdated: new Date() },
      },
      { new: true, session },
    );

    if (!updated) {
      const current = await WarehouseInventory.findOne(
        { warehouse: warehouseId, product: productId },
        null,
        session ? { session } : {},
      ).lean();
      const available = current ? current.available : 0;
      const error = new Error(
        `Insufficient warehouse stock to reserve for product: ${item.name || productId}. Requested: ${qty}, Available: ${available}`,
      );
      error.statusCode = 409;
      throw error;
    }

    const afterQty = Number(updated.available || 0);
    const beforeQty = afterQty + qty;

    await InventoryTransaction.create(
      [
        {
          warehouse: warehouseId,
          product: productId,
          sku: updated.sku || item.sku || "",
          type: INVENTORY_TRANSACTION_TYPES.RESERVATION,
          quantity: qty,
          beforeQty,
          afterQty,
          reference: reference || `RES-${Date.now()}`,
          reason: `Reserved for fulfillment #${reference}`,
          performedBy,
          performedByModel,
        },
      ],
      session ? { session } : {},
    );

    reservedItems.push(updated);

    try {
      await syncProductStockFromWarehouse(productId);
    } catch (syncErr) {}
  }

  return reservedItems;
}

/**
 * Release reserved stock back to available (e.g. order cancelled before fulfillment).
 */
export async function releaseWarehouseStockReservation({
  warehouseId,
  items = [],
  reference = "",
  reason = "Order Cancelled / Fulfillment Aborted",
  performedBy,
  performedByModel = "Admin",
  session = null,
}) {
  const releasedItems = [];

  for (const item of items) {
    const productId = item.product || item.productId || item._id;
    const qty = Number(item.quantity || item.requiredQty || 1);

    const updated = await WarehouseInventory.findOneAndUpdate(
      {
        warehouse: warehouseId,
        product: productId,
        reserved: { $gte: qty },
      },
      {
        $inc: { reserved: -qty, available: qty },
        $set: { lastUpdated: new Date() },
      },
      { new: true, session },
    );

    if (updated) {
      const afterQty = Number(updated.available || 0);
      const beforeQty = afterQty - qty;

      await InventoryTransaction.create(
        [
          {
            warehouse: warehouseId,
            product: productId,
            sku: updated.sku || item.sku || "",
            type: INVENTORY_TRANSACTION_TYPES.RESERVATION_RELEASE,
            quantity: qty,
            beforeQty,
            afterQty,
            reference: reference || `REL-${Date.now()}`,
            reason,
            performedBy,
            performedByModel,
          },
        ],
        session ? { session } : {},
      );

      releasedItems.push(updated);

      try {
        await syncProductStockFromWarehouse(productId);
      } catch (syncErr) {}
    }
  }

  return releasedItems;
}

/**
 * Commit reserved stock on shipment / completion (removes from reserved permanently).
 */
export async function commitWarehouseStock({
  warehouseId,
  items = [],
  reference = "",
  performedBy,
  performedByModel = "Warehouse",
  session = null,
}) {
  const committedItems = [];

  for (const item of items) {
    const productId = item.product || item.productId || item._id;
    const qty = Number(item.quantity || item.requiredQty || item.pickedQty || 1);

    const updated = await WarehouseInventory.findOneAndUpdate(
      {
        warehouse: warehouseId,
        product: productId,
        reserved: { $gte: qty },
      },
      {
        $inc: { reserved: -qty },
        $set: { lastUpdated: new Date() },
      },
      { new: true, session },
    );

    if (updated) {
      const afterQty = Number(updated.reserved || 0);
      const beforeQty = afterQty + qty;

      await InventoryTransaction.create(
        [
          {
            warehouse: warehouseId,
            product: productId,
            sku: updated.sku || item.sku || "",
            type: INVENTORY_TRANSACTION_TYPES.FULFILLMENT,
            quantity: -qty,
            beforeQty,
            afterQty,
            reference: reference || `FUL-${Date.now()}`,
            reason: `Fulfillment shipped #${reference}`,
            performedBy,
            performedByModel,
          },
        ],
        session ? { session } : {},
      );

      committedItems.push(updated);
    }
  }

  return committedItems;
}
