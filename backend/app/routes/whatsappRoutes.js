import express from "express";
import {
  getAdminWhatsAppSettings,
  updateAdminWhatsAppSettings,
  getAdminWhatsAppLogs,
  sendAdminTestMessage,
  getCustomerWhatsAppPreferences,
  updateCustomerWhatsAppPreferences,
} from "../controller/whatsappController.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Admin Endpoints ---
router.get("/settings", verifyToken, allowRoles("admin"), getAdminWhatsAppSettings);
router.put("/settings", verifyToken, allowRoles("admin"), updateAdminWhatsAppSettings);
router.get("/logs", verifyToken, allowRoles("admin"), getAdminWhatsAppLogs);
router.post("/test", verifyToken, allowRoles("admin"), sendAdminTestMessage);

// --- Customer Endpoints ---
router.get("/preferences", verifyToken, allowRoles("user"), getCustomerWhatsAppPreferences);
router.put("/preferences", verifyToken, allowRoles("user"), updateCustomerWhatsAppPreferences);

export default router;
