import crypto from "crypto";
import logger from "../../../../services/logger.js";

/**
 * Verifies HMAC signature for incoming Shiprocket webhook payload.
 * Shiprocket sends custom token header or HMAC signature.
 */
export function verifyShiprocketWebhookSignature(rawBody, headers) {
  const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;

  // If no secret configured in environment, allow in dev/staging or log warning
  if (!webhookSecret) {
    if (process.env.NODE_ENV === "production") {
      logger.error({ domain: "delivery", provider: "shiprocket" }, "SHIPROCKET_WEBHOOK_SECRET not set in production!");
      return false;
    }
    return true;
  }

  // Check header token match (Shiprocket primary verification method)
  const tokenHeader = headers["x-shiprocket-signature"] || headers["x-api-key"] || headers["x-shiprocket-token"];
  if (tokenHeader && tokenHeader === webhookSecret) {
    return true;
  }

  // Check HMAC SHA256 signature if present
  const signatureHeader = headers["x-shiprocket-hmac-sha256"] || headers["x-signature"];
  if (signatureHeader && rawBody) {
    try {
      const computed = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signatureHeader));
    } catch (e) {
      logger.warn({ domain: "delivery", provider: "shiprocket" }, "Error computing HMAC webhook signature: " + e.message);
      return false;
    }
  }

  // In test environment, skip signature error if explicit override provided
  if (process.env.NODE_ENV === "test") return true;

  return false;
}

/**
 * Parses raw webhook body into unified payload object
 */
export function parseShiprocketWebhookPayload(rawBody, headers) {
  let body = {};
  if (typeof rawBody === "string") {
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      body = {};
    }
  } else if (Buffer.isBuffer(rawBody)) {
    try {
      body = JSON.parse(rawBody.toString("utf-8"));
    } catch (e) {
      body = {};
    }
  } else if (typeof rawBody === "object" && rawBody !== null) {
    body = rawBody;
  }

  const orderId = body.order_id || body.channel_order_id || body.order_number || null;
  const externalId = body.awb_code || body.shipment_id || body.awb || null;
  const providerStatus = body.current_status || body.shipment_status || body.status || null;
  const eta = body.etd || body.eta || null;
  const location = body.current_location || body.location || null;

  return {
    orderId,
    externalId,
    providerStatus,
    location,
    eta,
    meta: body,
  };
}
