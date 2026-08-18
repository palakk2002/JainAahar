/**
 * IDeliveryProvider interface contract documentation & definition stub.
 * All delivery providers (Shiprocket, Porter, Internal, Mock, Noop) must implement this contract.
 *
 * @interface IDeliveryProvider
 */

export const DELIVERY_PROVIDER_INTERFACE = {
  name: String, // e.g. "shiprocket" | "porter" | "internal" | "mock" | "noop"

  // Core lifecycle
  createShipment: "function(context)", // → { externalId, trackingUrl, label, providerStatus }
  cancelShipment: "function(context)", // → { cancelled: boolean, reason?: string }
  getTrackingInfo: "function(context)", // → { providerStatus, location, eta, events[] }
  getETA: "function(context)", // → { etaMinutes, etaTimestamp }
  getQuote: "function(context)", // → { price, currency, breakdown, estimatedMinutes }

  // Status normalization
  mapStatus: "function(providerStatus)", // → canonical WORKFLOW_STATUS | null

  // Webhook integration
  parseWebhookPayload: "function(rawBody, headers)", // → { orderId, externalId, providerStatus, meta }
  verifyWebhookSignature: "function(rawBody, headers)", // → boolean

  // Auth/token lifecycle
  refreshToken: "function()", // → Promise<void>

  // Socket broadcasts (existing interface preserved)
  emitDeliveryBroadcastForSeller: "function(sellerId, payload)",
  retractDeliveryBroadcastForOrder: "function(orderId, winnerDeliveryId)",
  emitReturnBroadcastForCustomer: "function(customerLocation, payload)",
  emitToDelivery: "function(deliveryId, { event, payload })",
};

/**
 * Standard error class for delivery provider issues
 */
export class ProviderError extends Error {
  constructor(code, message, details = null) {
    super(message || code);
    this.name = "ProviderError";
    this.code = code; // e.g. "RATE_LIMITED", "TOKEN_EXPIRED", "CREATION_FAILED", "UNSUPPORTED"
    this.details = details;
  }
}
