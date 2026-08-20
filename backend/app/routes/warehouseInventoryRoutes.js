import express from "express";
import {
  getInventoryHandler,
  getLowStockHandler,
  getOutOfStockHandler,
  getInventorySummaryHandler,
  getInventoryTransactionsHandler,
  stockInwardHandler,
  stockOutwardHandler,
  stockAdjustmentHandler,
  stockDamagedHandler,
  stockDefectiveHandler,
  stockRestockHandler,
  getMovementTrendHandler,
} from "../controller/warehouseInventoryController.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all inventory routes: allowed for warehouse and admin roles
router.use(verifyToken, allowRoles("warehouse", "admin"));

// Read routes
router.get("/", getInventoryHandler);
router.get("/summary", getInventorySummaryHandler);
router.get("/analytics/trend", getMovementTrendHandler);
router.get("/low-stock", getLowStockHandler);
router.get("/out-of-stock", getOutOfStockHandler);
router.get("/transactions", getInventoryTransactionsHandler);

// Stock operation mutation routes
router.post("/inward", stockInwardHandler);
router.post("/outward", stockOutwardHandler);
router.post("/adjust", stockAdjustmentHandler);
router.post("/damaged", stockDamagedHandler);
router.post("/defective", stockDefectiveHandler);
router.post("/restock", stockRestockHandler);

export default router;
