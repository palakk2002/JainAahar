import mongoose from "mongoose";
import InventoryTransaction, { INVENTORY_TRANSACTION_TYPES } from "../models/inventoryTransaction.js";

/**
 * Get 7-day inward vs outward movement trends for a warehouse.
 */
export async function getWarehouseMovementTrend(warehouseId = "all") {
  const query = {};
  if (warehouseId && warehouseId !== "all") {
    query.warehouse = new mongoose.Types.ObjectId(warehouseId);
  }

  // Calculate start date (7 days ago, start of the day)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  query.createdAt = { $gte: sevenDaysAgo };

  const transactions = await InventoryTransaction.find(query)
    .select("type quantity createdAt")
    .lean();

  // Initialize 7 days array
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const trendMap = new Map();

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayKey = d.toDateString(); // unique day key
    trendMap.set(dayKey, {
      day: dayNames[d.getDay()],
      inward: 0,
      outward: 0,
      timestamp: d.getTime(),
    });
  }

  // Aggregate values
  transactions.forEach((tx) => {
    const txDateKey = new Date(tx.createdAt).toDateString();
    if (trendMap.has(txDateKey)) {
      const data = trendMap.get(txDateKey);
      const qty = Math.abs(tx.quantity || 0);

      // Inward types
      if (
        tx.type === INVENTORY_TRANSACTION_TYPES.INWARD ||
        tx.type === INVENTORY_TRANSACTION_TYPES.ADJUSTMENT_INCREASE ||
        tx.type === INVENTORY_TRANSACTION_TYPES.RETURN_RESTOCK
      ) {
        data.inward += qty;
      }
      // Outward types
      else if (
        tx.type === INVENTORY_TRANSACTION_TYPES.OUTWARD ||
        tx.type === INVENTORY_TRANSACTION_TYPES.ADJUSTMENT_DECREASE ||
        tx.type === INVENTORY_TRANSACTION_TYPES.FULFILLMENT
      ) {
        data.outward += qty;
      }
    }
  });

  return Array.from(trendMap.values()).sort((a, b) => a.timestamp - b.timestamp);
}
