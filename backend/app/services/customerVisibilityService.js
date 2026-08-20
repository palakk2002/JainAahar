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

export async function getNearbySellerIdsForCustomer(lat, lng) {
  const fetchFn = async () => {
    const [sellers, warehouses] = await Promise.all([
      Seller.find({
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: MAX_SELLER_SEARCH_DISTANCE_M,
          },
        },
      })
        .select("_id location serviceRadius")
        .lean(),
      Warehouse.find({
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: MAX_SELLER_SEARCH_DISTANCE_M,
          },
        },
      })
        .select("_id location serviceRadius")
        .lean()
    ]);

    const allEntities = [...sellers, ...warehouses];

    return allEntities
      .filter((entity) => {
        const coords = entity?.location?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return false;
        const [entityLng, entityLat] = coords;
        if (!Number.isFinite(entityLat) || !Number.isFinite(entityLng)) {
          return false;
        }
        const distanceKm = calculateDistance(lat, lng, entityLat, entityLng);
        return distanceKm <= (entity.serviceRadius || 50);
      })
      .map((entity) => String(entity._id));
  };

  return getOrSet(buildNearbySellersKey(lat, lng), fetchFn, getTTL("nearbySellers"));
}

/**
 * Returns serviceable active warehouses for a given customer coordinate.
 * If no coordinates provided, returns all active warehouses (for PAN-India delivery via Shiprocket).
 */
export async function getServiceableWarehouseIdsForCustomer(lat = null, lng = null) {
  if (lat == null || lng == null) {
    const allActive = await Warehouse.find({ isActive: true, isVerified: true })
      .select("_id")
      .lean();
    return allActive.map((w) => String(w._id));
  }

  const coords = parseCustomerCoordinates({ lat, lng });
  if (!coords.valid) {
    const allActive = await Warehouse.find({ isActive: true, isVerified: true })
      .select("_id")
      .lean();
    return allActive.map((w) => String(w._id));
  }

  return getNearbySellerIdsForCustomer(coords.lat, coords.lng);
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


