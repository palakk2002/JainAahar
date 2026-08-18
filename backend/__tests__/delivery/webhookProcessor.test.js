import { jest } from '@jest/globals';

jest.unstable_mockModule("../../app/models/deliveryShipment.js", () => ({
  default: {
    findOne: jest.fn().mockResolvedValue(null),
  },
}));

jest.unstable_mockModule("../../app/models/order.js", () => ({
  default: {
    findOne: jest.fn().mockResolvedValue(null),
  },
}));

const { processDeliveryWebhook } = await import("../../app/modules/delivery/webhooks/webhookProcessor.js");

describe("Webhook Processor Unit Tests", () => {
  it("should reject unknown provider", async () => {
    const res = await processDeliveryWebhook({
      providerName: "unknown_provider_xyz",
      rawBody: "{}",
      headers: {},
    });

    expect(res.success).toBe(false);
    expect(res.reason).toBe("UNKNOWN_PROVIDER");
  });

  it("should parse and process mock provider webhook successfully", async () => {
    const res = await processDeliveryWebhook({
      providerName: "mock",
      rawBody: JSON.stringify({ orderId: "TEST-ORD-001", status: "DELIVERED" }),
      headers: {},
    });

    expect(res.success).toBe(true);
  });
});
