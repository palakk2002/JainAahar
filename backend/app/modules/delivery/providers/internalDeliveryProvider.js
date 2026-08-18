import {
  emitDeliveryBroadcastForSeller,
  retractDeliveryBroadcastForOrder,
  emitReturnBroadcastForCustomer,
  emitToDelivery,
} from "../../../services/orderSocketEmitter.js";

/**
 * Internal Delivery Provider — Broadcasts to internal riders via WebSockets
 */
export const internalDeliveryProvider = {
  name: "internal",

  async createShipment(context) {
    return {
      externalId: `INT-${context.orderId || Date.now()}`,
      trackingUrl: null,
      label: null,
      providerStatus: "BROADCASTING",
    };
  },

  async cancelShipment(context) {
    return { cancelled: true };
  },

  async getTrackingInfo(context) {
    return {
      providerStatus: "INTERNAL_ASSIGNED",
      location: null,
      eta: null,
      events: [],
    };
  },

  async getETA(context) {
    return { etaMinutes: 20, etaTimestamp: new Date(Date.now() + 20 * 60000) };
  },

  async getQuote(context) {
    return {
      price: 25,
      currency: "INR",
      breakdown: { base: 25 },
      estimatedMinutes: 20,
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

  emitDeliveryBroadcastForSeller(sellerId, payload) {
    return emitDeliveryBroadcastForSeller(sellerId, payload);
  },

  retractDeliveryBroadcastForOrder(orderId, winnerDeliveryId) {
    return retractDeliveryBroadcastForOrder(orderId, winnerDeliveryId);
  },

  emitReturnBroadcastForCustomer(customerLocation, payload) {
    return emitReturnBroadcastForCustomer(customerLocation, payload);
  },

  emitToDelivery(deliveryId, payloadObj) {
    return emitToDelivery(deliveryId, payloadObj);
  },
};
