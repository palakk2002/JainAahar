import WhatsAppSetting from "../models/whatsappSetting.js";
import WhatsAppLog from "../models/whatsappLog.js";
import User from "../models/customer.js";
import handleResponse from "../utils/helper.js";
import {
  getWhatsAppStatus,
  getWhatsAppSettings,
  invalidateWhatsAppSettingsCache,
  sendTestMessage,
  processWebhookStatus,
  formatWhatsAppNumber,
  maskPhoneNumber,
} from "../services/whatsappService.js";
import logger from "../services/logger.js";

/**
 * Admin: Get WhatsApp Integration Settings & Diagnostic Status
 * GET /api/admin/whatsapp/settings
 */
export const getAdminWhatsAppSettings = async (req, res) => {
  try {
    const status = await getWhatsAppStatus();
    return handleResponse(res, 200, "WhatsApp settings retrieved", status);
  } catch (error) {
    logger.error("Error retrieving WhatsApp settings", { error: error.message });
    return handleResponse(res, 500, error.message);
  }
};

/**
 * Admin: Update WhatsApp Integration Settings & Event Toggles
 * PUT /api/admin/whatsapp/settings
 */
export const updateAdminWhatsAppSettings = async (req, res) => {
  try {
    const { enabled, eventToggles, defaultLanguage } = req.body;

    const updateDoc = {};
    if (typeof enabled === "boolean") updateDoc.enabled = enabled;
    if (defaultLanguage) updateDoc.defaultLanguage = defaultLanguage;
    if (eventToggles && typeof eventToggles === "object") {
      for (const [key, value] of Object.entries(eventToggles)) {
        updateDoc[`eventToggles.${key}`] = Boolean(value);
      }
    }

    const updated = await WhatsAppSetting.findOneAndUpdate(
      {},
      { $set: updateDoc },
      { new: true, upsert: true }
    );

    invalidateWhatsAppSettingsCache();

    return handleResponse(res, 200, "WhatsApp settings updated successfully", updated);
  } catch (error) {
    logger.error("Error updating WhatsApp settings", { error: error.message });
    return handleResponse(res, 500, error.message);
  }
};

/**
 * Admin: Get WhatsApp Notification Logs with Pagination & Filtering
 * GET /api/admin/whatsapp/logs
 */
export const getAdminWhatsAppLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
    }
    if (req.query.eventType && req.query.eventType !== "all") {
      query.eventType = req.query.eventType;
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      query.$or = [
        { orderId: searchRegex },
        { phoneNumber: searchRegex },
        { messageId: searchRegex },
        { templateName: searchRegex },
      ];
    }

    const [logs, total] = await Promise.all([
      WhatsAppLog.find(query)
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WhatsAppLog.countDocuments(query),
    ]);

    // Mask phone numbers for UI response
    const sanitizedLogs = logs.map((log) => ({
      ...log,
      maskedPhone: maskPhoneNumber(log.phoneNumber),
    }));

    return handleResponse(res, 200, "WhatsApp logs retrieved", {
      logs: sanitizedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    logger.error("Error retrieving WhatsApp logs", { error: error.message });
    return handleResponse(res, 500, error.message);
  }
};

/**
 * Admin: Send Diagnostic Test Message
 * POST /api/admin/whatsapp/test
 */
export const sendAdminTestMessage = async (req, res) => {
  try {
    const { phone, templateName, customParams } = req.body;
    if (!phone) {
      return handleResponse(res, 400, "Phone number is required");
    }

    const formatted = formatWhatsAppNumber(phone);
    if (!formatted || formatted.length < 10) {
      return handleResponse(res, 400, "Please provide a valid phone number (10+ digits with country code)");
    }

    const result = await sendTestMessage({
      to: formatted,
      templateName: templateName || "order_placed",
      customParams: Array.isArray(customParams) ? customParams : [],
    });

    if (result.success) {
      return handleResponse(res, 200, "Test message dispatched successfully", result);
    } else {
      return handleResponse(res, 400, result.errorMessage || "Failed to dispatch test message", result);
    }
  } catch (error) {
    logger.error("Error in admin test WhatsApp message", { error: error.message });
    return handleResponse(res, 500, error.message);
  }
};

/**
 * Meta WhatsApp Webhook: Challenge Verification
 * GET /api/webhooks/whatsapp
 */
export const verifyWhatsAppWebhook = async (req, res) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "jainahar_wa_verify_token_2026";

    if (mode === "subscribe" && token === verifyToken) {
      logger.info("[WhatsAppWebhook] Webhook subscription verified successfully with Meta");
      await WhatsAppSetting.updateOne({}, { $set: { webhookVerified: true, lastWebhookAt: new Date() } }).catch(() => {});
      return res.status(200).send(challenge);
    } else {
      logger.warn("[WhatsAppWebhook] Webhook verification failed - token mismatch", { token });
      return res.sendStatus(403);
    }
  } catch (error) {
    logger.error("Error in WhatsApp webhook verification", { error: error.message });
    return res.sendStatus(500);
  }
};

/**
 * Meta WhatsApp Webhook: Inbound Delivery Receipts
 * POST /api/webhooks/whatsapp
 */
export const handleWhatsAppWebhook = async (req, res) => {
  try {
    const payload = req.body;

    // Acknowledge Meta immediately with 200 OK so webhook never times out
    res.sendStatus(200);

    // Asynchronously process status updates
    setImmediate(async () => {
      try {
        await processWebhookStatus(payload);
        await WhatsAppSetting.updateOne({}, { $set: { lastWebhookAt: new Date() } }).catch(() => {});
      } catch (procErr) {
        logger.error("Error processing async webhook status", { error: procErr.message });
      }
    });
  } catch (error) {
    logger.error("Error in WhatsApp webhook handler", { error: error.message });
  }
};

/**
 * Customer: Get WhatsApp Preferences
 * GET /api/customer/whatsapp-preferences
 */
export const getCustomerWhatsAppPreferences = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId).select("phone whatsappPhone whatsappNotificationsEnabled whatsappPreferences").lean();

    if (!user) {
      return handleResponse(res, 404, "User not found");
    }

    return handleResponse(res, 200, "WhatsApp preferences retrieved", {
      phone: user.phone,
      whatsappPhone: user.whatsappPhone || user.phone || "",
      whatsappNotificationsEnabled: user.whatsappNotificationsEnabled !== false,
      whatsappPreferences: user.whatsappPreferences || {
        orderUpdates: true,
        deliveryUpdates: true,
        promotions: false,
      },
    });
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

/**
 * Customer: Update WhatsApp Preferences
 * PUT /api/customer/whatsapp-preferences
 */
export const updateCustomerWhatsAppPreferences = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { whatsappPhone, whatsappNotificationsEnabled, whatsappPreferences } = req.body;

    const updateDoc = {};
    if (whatsappPhone !== undefined) {
      updateDoc.whatsappPhone = formatWhatsAppNumber(whatsappPhone) || whatsappPhone;
    }
    if (typeof whatsappNotificationsEnabled === "boolean") {
      updateDoc.whatsappNotificationsEnabled = whatsappNotificationsEnabled;
    }
    if (whatsappPreferences && typeof whatsappPreferences === "object") {
      updateDoc.whatsappPreferences = whatsappPreferences;
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: updateDoc },
      { new: true }
    ).select("phone whatsappPhone whatsappNotificationsEnabled whatsappPreferences");

    return handleResponse(res, 200, "WhatsApp preferences updated successfully", updated);
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

export default {
  getAdminWhatsAppSettings,
  updateAdminWhatsAppSettings,
  getAdminWhatsAppLogs,
  sendAdminTestMessage,
  verifyWhatsAppWebhook,
  handleWhatsAppWebhook,
  getCustomerWhatsAppPreferences,
  updateCustomerWhatsAppPreferences,
};
