import express from "express";
import {
  getTransfersHandler,
  getTransferDetailHandler,
  createTransferHandler,
  approveTransferHandler,
  receiveTransferHandler,
  cancelTransferHandler,
} from "../controller/warehouseTransferController.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware: accessible to warehouse and admin roles
router.use(verifyToken, allowRoles("warehouse", "admin"));

router.get("/", getTransfersHandler);
router.post("/", createTransferHandler);
router.get("/:id", getTransferDetailHandler);
router.put("/:id/approve", approveTransferHandler);
router.put("/:id/receive", receiveTransferHandler);
router.put("/:id/cancel", cancelTransferHandler);

export default router;
