import Seller from "../models/seller.js";
import Warehouse from "../models/warehouse.js";
import WarehouseInventory from "../models/warehouseInventory.js";
import { calculateDistance } from "../utils/helper.js";
import { buildKey, getOrSet, getTTL } from "./cacheService.js";
import mongoose from "mongoose";

const MAX_SELLER_SEARCH_DISTANCE_M = 100000;

export function parseCustomerCoordinates(query = {}) {
  const lat = Number(query.lat);
  const lng = Number(query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { valid: false, lat: null, lng: null };
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { valid: false, lat: null, lng: null };
  }

  return { valid: true, lat, lng };
}

/**
 * Round lat/lng to 4 decimal places (~11m precision) for cache key.
 * This groups nearby requests into the same cache bucket.
 */
function buildNearbySellersKey(lat, lng) {
  const rLat = Number(lat).toFixed(4);
  const rLng = Number(lng).toFixed(4);
  return buildKey("sellers", "nearby", `${rLat}:${rLng}`);
}

export async function getNearbySellerIdsForCustomer(lat = null, lng = null) {
  const fetchFn = async () => {
    const [sellers, warehouses] = await Promise.all([
      Seller.find({ isActive: true }).select("_id").lean(),
      Warehouse.find({ isActive: true }).select("_id").lean(),
    ]);

    return [...sellers, ...warehouses].map((entity) => String(entity._id));
  };

  const key = lat != null && lng != null ? buildNearbySellersKey(lat, lng) : "sellers:all:active";
  return getOrSet(key, fetchFn, getTTL("nearbySellers"));
}

/**
 * Returns serviceable active warehouses for customer.
 * PAN-India delivery supported across all active, verified warehouses.
 */
export async function getServiceableWarehouseIdsForCustomer(lat = null, lng = null) {
  const allActive = await Warehouse.find({ isActive: true, isVerified: true })
    .select("_id")
    .lean();
  return allActive.map((w) => String(w._id));
}

/**
 * Batch checks stock availability in warehouse inventory for a list of product IDs.
 * Returns a Map: productId -> { availableStock, isAvailable, isLowStock, isOutOfStock }
 */
export async function getProductWarehouseAvailability(productObjectIds = [], targetWarehouseIds = null) {
  if (!Array.isArray(productObjectIds) || productObjectIds.length === 0) {
    return new Map();
  }

  const matchQuery = {
    product: { $in: productObjectIds.map((id) => new mongoose.Types.ObjectId(id)) },
  };

  if (Array.isArray(targetWarehouseIds) && targetWarehouseIds.length > 0) {
    matchQuery.warehouse = {
      $in: targetWarehouseIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  const aggregation = await WarehouseInventory.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$product",
        totalAvailable: { $sum: "$available" },
        totalReserved: { $sum: "$reserved" },
        minStock: { $min: "$minStock" },
      },
    },
  ]);

  const availabilityMap = new Map();

  for (const row of aggregation) {
    const pId = String(row._id);
    const availableStock = Math.max(0, row.totalAvailable || 0);
    const minStock = row.minStock || 5;

    availabilityMap.set(pId, {
      availableStock,
      isAvailable: availableStock > 0,
      isLowStock: availableStock > 0 && availableStock <= minStock,
      isOutOfStock: availableStock <= 0,
      stockStatus:
        availableStock <= 0
          ? "out_of_stock"
          : availableStock <= minStock
          ? "low_stock"
          : "in_stock",
    });
  }

  return availabilityMap;
}


