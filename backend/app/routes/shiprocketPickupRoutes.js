import express from "express";
import {
  syncPickupAddress,
  listShiprocketPickups,
  getWarehousePickupStatus,
  updatePickupAddress,
} from "../controller/shiprocketPickupController.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Sync a warehouse's address to Shiprocket as a pickup location
router.post(
  "/sync/:warehouseId",
  verifyToken,
  allowRoles("admin", "warehouse"),
  syncPickupAddress
);

// List all pickup locations registered on Shiprocket account
router.get(
  "/list",
  verifyToken,
  allowRoles("admin", "warehouse"),
  listShiprocketPickups
);

// Get sync status for all warehouses
router.get(
  "/status",
  verifyToken,
  allowRoles("admin", "warehouse"),
  getWarehousePickupStatus
);

// Update warehouse address and re-sync to Shiprocket
router.put(
  "/update/:warehouseId",
  verifyToken,
  allowRoles("admin"),
  updatePickupAddress
);

export default router;
