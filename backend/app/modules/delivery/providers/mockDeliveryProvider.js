import { WORKFLOW_STATUS } from "../../../constants/orderWorkflow.js";

/**
 * Mock Delivery Provider — Used in test environments (DELIVERY_PROVIDER=mock)
 */
export const mockDeliveryProvider = {
  name: "mock",

  async createShipment(context) {
    return {
      externalId: `MOCK-AWB-${context.orderId || Date.now()}`,
      trackingUrl: `https://mock-tracking.com/track/${context.orderId || "test"}`,
      label: "MOCK_BASE64_LABEL_PDF",
      providerStatus: "PICKUP SCHEDULED",
    };
  },

  async cancelShipment(context) {
    return { cancelled: true, reason: context.reason || "MOCK_CANCELLED" };
  },

  async getTrackingInfo(context) {
    return {
      providerStatus: "OUT FOR DELIVERY",
      location: { lat: 12.9716, lng: 77.5946, label: "Mock City Center" },
      eta: 15,
      events: [
        { status: "PICKUP SCHEDULED", timestamp: new Date() },
        { status: "OUT FOR DELIVERY", timestamp: new Date() },
      ],
    };
  },

  async getETA(context) {
    return { etaMinutes: 15, etaTimestamp: new Date(Date.now() + 15 * 60000) };
  },

  async getQuote(context) {
    return {
      price: 35.0,
      currency: "INR",
      breakdown: { base: 25, tax: 10 },
      estimatedMinutes: 25,
      validUntil: new Date(Date.now() + 1800000),
    };
  },

  mapStatus(providerStatus) {
    if (providerStatus === "PICKUP SCHEDULED") return WORKFLOW_STATUS.DELIVERY_ASSIGNED;
    if (providerStatus === "OUT FOR DELIVERY") return WORKFLOW_STATUS.OUT_FOR_DELIVERY;
    if (providerStatus === "DELIVERED") return WORKFLOW_STATUS.DELIVERED;
    if (providerStatus === "CANCELLED") return WORKFLOW_STATUS.CANCELLED;
    return null;
  },

  parseWebhookPayload(rawBody, headers) {
    let parsed = {};
    try {
      parsed = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
    } catch (e) {
      parsed = {};
    }
    return {
      orderId: parsed.orderId || parsed.order_id || null,
      externalId: parsed.externalId || parsed.awb || "MOCK-AWB",
      providerStatus: parsed.status || "DELIVERED",
      meta: parsed,
    };
  },

  verifyWebhookSignature(rawBody, headers) {
    if (headers && headers["x-mock-signature"] === "invalid") return false;
    return true;
  },

  async refreshToken() {},

  emitDeliveryBroadcastForSeller() {},
  retractDeliveryBroadcastForOrder() {},
  emitReturnBroadcastForCustomer() {},
  emitToDelivery() {},
};
