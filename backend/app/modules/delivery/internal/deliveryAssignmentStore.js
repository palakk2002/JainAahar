import DeliveryAssignment from "../../../models/deliveryAssignment.js";
import logger from "../../../services/logger.js";

/**
 * Isolated data access store for DeliveryAssignment records
 */

export async function createAssignment(data) {
  return DeliveryAssignment.create(data);
}

export async function findLatestByOrderId(orderId) {
  return DeliveryAssignment.findOne({ orderId }).sort({ createdAt: -1 });
}

export async function markLatestBroadcastAssigned({ orderId, winnerDeliveryId }) {
  const latest = await findLatestByOrderId(orderId);
  if (!latest) {
    logger.warn({ domain: "delivery", orderId }, "No broadcast assignment found to mark assigned");
    return null;
  }

  latest.status = "assigned";
  latest.winnerDeliveryId = winnerDeliveryId;
  await latest.save();

  // Supersede other active broadcast attempts for this order
  await DeliveryAssignment.updateMany(
    { orderId, _id: { $ne: latest._id }, status: "broadcasting" },
    { $set: { status: "superseded" } }
  );

  return latest;
}

export async function updateThirdPartyShipmentDetails(orderId, details) {
  return DeliveryAssignment.findOneAndUpdate(
    { orderId },
    {
      $set: {
        providerName: details.providerName || "shiprocket",
        externalShipmentId: details.externalShipmentId,
        trackingUrl: details.trackingUrl,
        providerStatus: details.providerStatus,
        shipmentCreatedAt: new Date(),
      },
    },
    { sort: { createdAt: -1 }, new: true }
  );
}
