import DeliveryShipment from "../../../models/deliveryShipment.js";
import Order from "../../../models/order.js";
import { getRegisteredProvider } from "../deliveryProviderRegistry.js";
import { normalizeProviderStatus } from "../deliveryManager.js";
import { emitToCustomer } from "../../../services/orderSocketEmitter.js";
import logger from "../../../services/logger.js";

/**
 * Fallback polling processor for active in-transit shipments
 */
export async function pollShipmentTracking(orderId) {
  try {
    const shipment = await DeliveryShipment.findOne({ orderId });
    if (!shipment || !shipment.externalShipmentId) return;

    if (["delivered", "cancelled", "failed"].includes(shipment.status)) {
      return;
    }

    const provider = getRegisteredProvider(shipment.providerName);
    if (!provider) return;

    const tracking = await provider.getTrackingInfo({
      externalId: shipment.externalShipmentId,
      orderId: shipment.orderId,
    });

    if (!tracking || !tracking.providerStatus) return;

    // Check if status changed
    if (tracking.providerStatus !== shipment.providerStatus) {
      shipment.providerStatus = tracking.providerStatus;
      shipment.timeline.push({
        status: tracking.providerStatus,
        timestamp: new Date(),
        location: tracking.location,
        raw: tracking,
      });
      await shipment.save();

      const canonicalStatus = normalizeProviderStatus(shipment.providerName, tracking.providerStatus);
      if (canonicalStatus) {
        const order = await Order.findOne({ orderId });
        if (order && order.customer) {
          await emitToCustomer(order.customer, {
            event: "order:tracking_update",
            payload: {
              orderId,
              status: canonicalStatus,
              providerStatus: tracking.providerStatus,
              providerName: shipment.providerName,
              location: tracking.location,
              eta: tracking.eta,
              updatedAt: new Date(),
            },
          });
        }
      }
    }
  } catch (err) {
    logger.warn({ domain: "delivery", orderId, error: err.message }, "Polling tracking failed");
  }
}
