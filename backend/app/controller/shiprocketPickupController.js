import Warehouse from "../models/warehouse.js";
import {
  addPickupLocation,
  listPickupLocations,
  formatWarehouseForShiprocket,
} from "../modules/delivery/providers/shiprocket/shiprocketPickupService.js";
import { handleResponse } from "../utils/helper.js";
import logger from "../services/logger.js";

/* ===============================
   SYNC PICKUP ADDRESS TO SHIPROCKET
================================ */
/**
 * POST /api/warehouse/shiprocket-pickup/sync/:warehouseId
 *
 * Syncs a warehouse's address to Shiprocket as a registered pickup location.
 * Admin can optionally override fields via request body.
 */
export const syncPickupAddress = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    if (!warehouseId) {
      return handleResponse(res, 400, "warehouseId is required");
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return handleResponse(res, 404, "Warehouse not found");
    }

    // Build Shiprocket pickup payload — use body overrides if provided, else auto-format from warehouse
    const bodyOverrides = req.body || {};
    const autoFormatted = formatWarehouseForShiprocket(warehouse);

    const pickupData = {
      pickup_location: bodyOverrides.pickup_location || autoFormatted.pickup_location,
      name: bodyOverrides.name || autoFormatted.name,
      email: bodyOverrides.email || autoFormatted.email,
      phone: bodyOverrides.phone || autoFormatted.phone,
      address: bodyOverrides.address || autoFormatted.address,
      address_2: bodyOverrides.address_2 || autoFormatted.address_2,
      city: bodyOverrides.city || autoFormatted.city,
      state: bodyOverrides.state || autoFormatted.state,
      country: "India",
      pin_code: bodyOverrides.pin_code || autoFormatted.pin_code,
    };

    // Call Shiprocket API
    const result = await addPickupLocation(pickupData);

    // Update warehouse record in DB with all latest address fields + synced pickup location
    if (pickupData.address) warehouse.address = pickupData.address;
    if (pickupData.address_2) warehouse.locality = pickupData.address_2;
    if (pickupData.city) warehouse.city = pickupData.city;
    if (pickupData.state) warehouse.state = pickupData.state;
    if (pickupData.pin_code) warehouse.pincode = pickupData.pin_code;
    if (pickupData.phone) warehouse.phone = pickupData.phone;
    if (pickupData.email) warehouse.email = pickupData.email;
    if (pickupData.name) warehouse.name = pickupData.name;
    warehouse.shiprocketPickupLocation = pickupData.pickup_location;
    warehouse.shiprocketPickupSynced = true;
    await warehouse.save();

    logger.info(
      { domain: "delivery", provider: "shiprocket", warehouseId, pickup: pickupData.pickup_location },
      "Warehouse pickup address synced to Shiprocket"
    );

    return handleResponse(res, 200, "Pickup address synced to Shiprocket successfully", {
      warehouseId: warehouse._id,
      warehouseName: warehouse.warehouseName || warehouse.name,
      pickupLocation: pickupData.pickup_location,
      shiprocketPickupSynced: true,
      shiprocketResponse: result,
    });
  } catch (error) {
    logger.error(
      { domain: "delivery", provider: "shiprocket", error: error.message },
      "syncPickupAddress failed"
    );
    return handleResponse(res, 500, error.message || "Failed to sync pickup address to Shiprocket");
  }
};

/* ===============================
   LIST ALL SHIPROCKET PICKUP LOCATIONS
================================ */
/**
 * GET /api/warehouse/shiprocket-pickup/list
 *
 * Returns all pickup locations registered on the Shiprocket account.
 */
export const listShiprocketPickups = async (req, res) => {
  try {
    const locations = await listPickupLocations();

    return handleResponse(res, 200, "Shiprocket pickup locations fetched", {
      total: locations.length,
      locations,
    });
  } catch (error) {
    logger.error(
      { domain: "delivery", provider: "shiprocket", error: error.message },
      "listShiprocketPickups failed"
    );
    return handleResponse(res, 500, error.message || "Failed to fetch Shiprocket pickup locations");
  }
};

/* ===============================
   GET WAREHOUSE PICKUP SYNC STATUS
================================ */
/**
 * GET /api/warehouse/shiprocket-pickup/status
 *
 * Returns all warehouses with their Shiprocket pickup sync status.
 */
export const getWarehousePickupStatus = async (req, res) => {
  try {
    const warehouses = await Warehouse.find(
      { isActive: true, isVerified: true },
      {
        _id: 1,
        name: 1,
        warehouseName: 1,
        email: 1,
        phone: 1,
        address: 1,
        locality: 1,
        city: 1,
        state: 1,
        pincode: 1,
        shiprocketPickupLocation: 1,
        shiprocketPickupSynced: 1,
      }
    ).lean();

    const items = warehouses.map((wh) => ({
      id: String(wh._id),
      warehouseName: wh.warehouseName || wh.name || "Warehouse",
      name: wh.name || "",
      email: wh.email || "",
      phone: wh.phone || "",
      address: wh.address || "",
      locality: wh.locality || "",
      city: wh.city || "",
      state: wh.state || "",
      pincode: wh.pincode || "",
      shiprocketPickupLocation: wh.shiprocketPickupLocation || null,
      shiprocketPickupSynced: wh.shiprocketPickupSynced || false,
    }));

    return handleResponse(res, 200, "Warehouse pickup sync status", {
      total: items.length,
      items,
    });
  } catch (error) {
    logger.error(
      { domain: "delivery", error: error.message },
      "getWarehousePickupStatus failed"
    );
    return handleResponse(res, 500, error.message || "Failed to get warehouse pickup status");
  }
};

/* ===============================
   UPDATE PICKUP ADDRESS & RE-SYNC
================================ */
/**
 * PUT /api/warehouse/shiprocket-pickup/update/:warehouseId
 *
 * Updates the warehouse's address fields in DB and re-syncs to Shiprocket.
 */
export const updatePickupAddress = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    if (!warehouseId) {
      return handleResponse(res, 400, "warehouseId is required");
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return handleResponse(res, 404, "Warehouse not found");
    }

    const body = req.body || {};

    // Update warehouse address fields in DB if provided
    if (body.address) warehouse.address = body.address;
    if (body.address_2 || body.locality) warehouse.locality = body.address_2 || body.locality;
    if (body.city) warehouse.city = body.city;
    if (body.state) warehouse.state = body.state;
    if (body.pin_code || body.pincode) warehouse.pincode = body.pin_code || body.pincode;
    if (body.name) warehouse.name = body.name;
    if (body.email) warehouse.email = body.email;
    if (body.phone) warehouse.phone = body.phone;

    await warehouse.save();

    // Now re-sync to Shiprocket
    const autoFormatted = formatWarehouseForShiprocket(warehouse);
    const pickupData = {
      pickup_location: body.pickup_location || autoFormatted.pickup_location,
      name: autoFormatted.name,
      email: autoFormatted.email,
      phone: autoFormatted.phone,
      address: autoFormatted.address,
      address_2: autoFormatted.address_2,
      city: autoFormatted.city,
      state: autoFormatted.state,
      country: "India",
      pin_code: autoFormatted.pin_code,
    };

    const result = await addPickupLocation(pickupData);

    warehouse.shiprocketPickupLocation = pickupData.pickup_location;
    warehouse.shiprocketPickupSynced = true;
    await warehouse.save();

    return handleResponse(res, 200, "Pickup address updated and re-synced to Shiprocket", {
      warehouseId: warehouse._id,
      warehouseName: warehouse.warehouseName || warehouse.name,
      pickupLocation: pickupData.pickup_location,
      shiprocketPickupSynced: true,
      shiprocketResponse: result,
    });
  } catch (error) {
    logger.error(
      { domain: "delivery", provider: "shiprocket", error: error.message },
      "updatePickupAddress failed"
    );
    return handleResponse(res, 500, error.message || "Failed to update and re-sync pickup address");
  }
};
