import { providerStatusToWorkflowStatus } from "../../deliveryStatusMapping.js";

/**
 * Porter Provider stub
 */
export const porterProvider = {
  name: "porter",

  async createShipment(context) {
    return {
      externalId: `PORTER-${context.orderId || Date.now()}`,
      trackingUrl: null,
      label: null,
      providerStatus: "order_accepted",
    };
  },

  async cancelShipment(context) {
    return { cancelled: true };
  },

  async getTrackingInfo(context) {
    return {
      providerStatus: "order_accepted",
      location: null,
      eta: 25,
      events: [],
    };
  },

  async getETA(context) {
    return { etaMinutes: 25, etaTimestamp: new Date(Date.now() + 25 * 60000) };
  },

  async getQuote(context) {
    return {
      price: 50.0,
      currency: "INR",
      breakdown: { base: 40, tax: 10 },
      estimatedMinutes: 25,
      validUntil: new Date(Date.now() + 1800000),
    };
  },

  mapStatus(providerStatus) {
    return providerStatusToWorkflowStatus("porter", providerStatus);
  },

  parseWebhookPayload(rawBody, headers) {
    let body = {};
    try {
      body = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
    } catch (e) {}
    return {
      orderId: body.order_id || null,
      externalId: body.porter_order_id || null,
      providerStatus: body.status || null,
      meta: body,
    };
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
