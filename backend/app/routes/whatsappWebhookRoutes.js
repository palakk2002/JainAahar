import express from "express";
import {
  verifyWhatsAppWebhook,
  handleWhatsAppWebhook,
} from "../controller/whatsappController.js";

const router = express.Router();

// GET: Meta webhook subscription challenge
router.get("/whatsapp", verifyWhatsAppWebhook);

// POST: Meta delivery status and incoming message receipts
router.post("/whatsapp", handleWhatsAppWebhook);

export default router;
