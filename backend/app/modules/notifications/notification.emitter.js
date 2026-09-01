import logger from "../../services/logger.js";

export function emitNotificationEvent(eventType, payload = {}) {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  setImmediate(async () => {
    try {
      const { notify } = await import("./notification.service.js");
      await notify(eventType, payload);
    } catch (error) {
      logger.error("Failed to emit notification event", {
        eventType,
        message: error.message,
      });
    }

    // Trigger WhatsApp notification asynchronously (non-blocking)
    try {
      const { handleLifecycleEvent } = await import("../../services/whatsappService.js");
      await handleLifecycleEvent(eventType, payload);
    } catch (waErr) {
      logger.debug("WhatsApp lifecycle event handling skipped", {
        eventType,
        message: waErr?.message,
      });
    }
  });
}

export default {
  emitNotificationEvent,
};
