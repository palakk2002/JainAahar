import express from "express";
import {
  getFulfillmentsHandler,
  getFulfillmentStatsHandler,
  getFulfillmentDetailHandler,
  acceptFulfillmentHandler,
  startPickingHandler,
  updateItemPickHandler,
  startPackingHandler,
  markPackedHandler,
  markReadyToShipHandler,
  createShipmentHandler,
  markShippedHandler,
  markCompletedHandler,
  cancelFulfillmentHandler,
} from "../controller/warehouseFulfillmentController.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware: accessible to warehouse and admin roles
router.use(verifyToken, allowRoles("warehouse", "admin"));

router.get("/", getFulfillmentsHandler);
router.get("/stats", getFulfillmentStatsHandler);
router.get("/:id", getFulfillmentDetailHandler);

// Operational stage transition actions
router.post("/:id/accept", acceptFulfillmentHandler);
router.post("/:id/start-picking", startPickingHandler);
router.post("/:id/update-item-pick", updateItemPickHandler);
router.post("/:id/start-packing", startPackingHandler);
router.post("/:id/packed", markPackedHandler);
router.post("/:id/ready-to-ship", markReadyToShipHandler);
router.post("/:id/create-shipment", createShipmentHandler);
router.post("/:id/mark-shipped", markShippedHandler);
router.post("/:id/mark-completed", markCompletedHandler);
router.post("/:id/cancel", cancelFulfillmentHandler);

export default router;
