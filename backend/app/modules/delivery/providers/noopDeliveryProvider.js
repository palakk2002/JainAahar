import { WORKFLOW_STATUS } from "../../../constants/orderWorkflow.js";

/**
 * Noop Provider — Safe fallback when delivery module is disabled or in dry-run mode
 */
export const noopDeliveryProvider = {
  name: "noop",

  async createShipment(context) {
    return {
      externalId: `NOOP-${Date.now()}`,
      trackingUrl: null,
      label: null,
      providerStatus: "NOOP_CREATED",
    };
  },

  async cancelShipment(context) {
    return { cancelled: true, reason: "NOOP_CANCELLED" };
  },

  async getTrackingInfo(context) {
    return {
      providerStatus: "NOOP_IDLE",
      location: null,
      eta: null,
      events: [],
    };
  },

  async getETA(context) {
    return { etaMinutes: 30, etaTimestamp: new Date(Date.now() + 30 * 60000) };
  },

  async getQuote(context) {
    return {
      price: 0,
      currency: "INR",
      breakdown: { base: 0 },
      estimatedMinutes: 30,
      validUntil: new Date(Date.now() + 3600000),
    };
  },

  mapStatus(providerStatus) {
    return null;
  },

  parseWebhookPayload(rawBody, headers) {
    return { orderId: null, externalId: null, providerStatus: null, meta: {} };
  },

  verifyWebhookSignature(rawBody, headers) {
    return true;
  },

  async refreshToken() {},

  emitDeliveryBroadcastForSeller() {},
  retractDeliveryBroadcastForOrder() {},
  emitReturnBroadcastForCustomer() {},
  emitToDelivery() {},
};
