import { shiprocketProvider } from "../../app/modules/delivery/providers/shiprocket/shiprocketProvider.js";
import { mapShiprocketStatus } from "../../app/modules/delivery/providers/shiprocket/shiprocketStatusMap.js";
import { verifyShiprocketWebhookSignature, parseShiprocketWebhookPayload } from "../../app/modules/delivery/providers/shiprocket/shiprocketWebhookParser.js";
import { WORKFLOW_STATUS } from "../../app/constants/orderWorkflow.js";

describe("Shiprocket Provider Unit Tests", () => {
  it("should have correct name property", () => {
    expect(shiprocketProvider.name).toBe("shiprocket");
  });

  it("should correctly map Shiprocket status strings to canonical WORKFLOW_STATUS", () => {
    expect(mapShiprocketStatus("PICKUP SCHEDULED")).toBe(WORKFLOW_STATUS.DELIVERY_ASSIGNED);
    expect(mapShiprocketStatus("OUT FOR DELIVERY")).toBe(WORKFLOW_STATUS.OUT_FOR_DELIVERY);
    expect(mapShiprocketStatus("DELIVERED")).toBe(WORKFLOW_STATUS.DELIVERED);
    expect(mapShiprocketStatus("UNDELIVERED")).toBe(WORKFLOW_STATUS.OUT_FOR_DELIVERY);
    expect(mapShiprocketStatus("RTO INITIATED")).toBe(WORKFLOW_STATUS.CANCELLED);
    expect(mapShiprocketStatus("CANCELLED")).toBe(WORKFLOW_STATUS.CANCELLED);
    expect(mapShiprocketStatus("UNKNOWN_STATE")).toBeNull();
  });

  it("should parse webhook payload into canonical object", () => {
    const raw = JSON.stringify({
      order_id: "ORD-999",
      awb_code: "AWB-12345",
      current_status: "OUT FOR DELIVERY",
      location: "Bengaluru Hub",
      etd: "2026-08-20",
    });

    const parsed = parseShiprocketWebhookPayload(raw, {});
    expect(parsed.orderId).toBe("ORD-999");
    expect(parsed.externalId).toBe("AWB-12345");
    expect(parsed.providerStatus).toBe("OUT FOR DELIVERY");
  });

  it("should verify signature correctly", () => {
    delete process.env.SHIPROCKET_WEBHOOK_SECRET;
    const valid = verifyShiprocketWebhookSignature("{}", {});
    expect(valid).toBe(true);
  });
});
