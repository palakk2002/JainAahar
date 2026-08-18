import { getRegisteredProvider } from "../deliveryProviderRegistry.js";
import { normalizeProviderStatus } from "../deliveryManager.js";
import DeliveryShipment from "../../../models/deliveryShipment.js";
import Order from "../../../models/order.js";
import { emitToCustomer, emitToSeller } from "../../../services/orderSocketEmitter.js";
import { getRedisClient, isRedisEnabled } from "../../../config/redis.js";
import logger from "../../../services/logger.js";

/**
 * Process inbound delivery webhook payload asynchronously
 */
export async function processDeliveryWebhook({ providerName, rawBody, headers }) {
  const provider = getRegisteredProvider(providerName);
  if (!provider) {
    logger.warn({ domain: "delivery", provider: providerName }, "Webhook received for unknown provider");
    return { success: false, reason: "UNKNOWN_PROVIDER" };
  }

  // 1. Verify Webhook Signature
  const isValid = provider.verifyWebhookSignature(rawBody, headers);
  if (!isValid) {
    logger.warn({ domain: "delivery", provider: providerName }, "Invalid webhook signature");
    return { success: false, reason: "INVALID_SIGNATURE" };
  }

  // 2. Parse Raw Payload
  const parsed = provider.parseWebhookPayload(rawBody, headers);
  const { orderId, externalId, providerStatus, location, eta, meta } = parsed;

  if (!orderId && !externalId) {
    logger.warn({ domain: "delivery", provider: providerName }, "Webhook payload missing orderId & externalId");
    return { success: false, reason: "MISSING_IDENTIFIER" };
  }

  // 3. Idempotency Check on Event ID
  const eventId = meta?.event_id || meta?.timestamp || `${externalId}:${providerStatus}`;
  const idemKey = `webhook:${providerName}:${eventId}`;

  if (isRedisEnabled()) {
    try {
      const redis = getRedisClient();
      if (redis) {
        const setOk = await redis.set(`idempotency:webhook:${idemKey}`, "1", "NX", "EX", 86400);
        if (!setOk) {
          logger.info({ domain: "delivery", provider: providerName, eventId }, "Duplicate webhook event ignored (idempotent)");
          return { success: true, duplicate: true };
        }
      }
    } catch (redisErr) {
      logger.warn({ domain: "delivery", error: redisErr.message }, "Idempotency check warning");
    }
  }

  try {
    // 4. Find matching order & delivery shipment record
    const query = orderId ? { orderId } : { externalShipmentId: externalId };
    const shipment = await DeliveryShipment.findOne(query);
    const order = await Order.findOne(query);

    if (shipment) {
      shipment.webhookLog.push({
        receivedAt: new Date(),
        payload: meta,
        processed: true,
      });

      shipment.timeline.push({
        status: providerStatus,
        timestamp: new Date(),
        location,
        raw: meta,
      });

      if (providerStatus) shipment.providerStatus = providerStatus;
      if (location) shipment.location = location;
      await shipment.save();
    }

    // 5. Status Translation & Workflow Transition
    const canonicalStatus = normalizeProviderStatus(providerName, providerStatus);

    if (canonicalStatus && order) {
      const { transitionWorkflowStatus } = await import("../../../services/orderWorkflowService.js");
      try {
        await transitionWorkflowStatus({
          orderId: order.orderId,
          targetStatus: canonicalStatus,
          actor: `webhook:${providerName}`,
          reason: `Provider status update: ${providerStatus}`,
        });
      } catch (transErr) {
        logger.warn(
          { domain: "delivery", orderId: order.orderId, error: transErr.message },
          "Workflow status transition from webhook skipped/handled"
        );
      }
    }

    // 6. Emit Real-time Socket Updates
    if (order) {
      const socketPayload = {
        orderId: order.orderId,
        status: canonicalStatus || order.workflowStatus,
        providerStatus,
        providerName,
        location,
        eta,
        updatedAt: new Date(),
      };

      if (order.customer) {
        await emitToCustomer(order.customer, {
          event: "order:tracking_update",
          payload: socketPayload,
        });
      }

      if (order.seller) {
        await emitToSeller(order.seller, {
          event: "delivery:status_change",
          payload: socketPayload,
        });
      }
    }

    return { success: true };
  } catch (err) {
    logger.error({ domain: "delivery", provider: providerName, error: err.message }, "Error processing webhook");
    throw err;
  }
}
