import { WORKFLOW_STATUS } from "../../../constants/orderWorkflow.js";

const INITIAL_DELIVERY_RADIUS_M = () =>
  parseInt(process.env.INITIAL_DELIVERY_RADIUS_METERS || "5000", 10);

/**
 * Builds socket broadcast payload for delivery riders
 */
export function deliveryBroadcastPayloadFromOrder(order, extra = {}) {
  const seller =
    order.seller && typeof order.seller === "object" && order.seller !== null
      ? order.seller
      : null;
  const pickup = seller?.shopName || "Seller";
  const drop =
    typeof order.address?.address === "string" && order.address.address.trim()
      ? order.address.address.trim()
      : "Customer address";
  const meta = order.deliverySearchMeta || {};
  const sid = seller?._id ?? order.seller;

  return {
    orderId: order.orderId,
    workflowStatus: order.workflowStatus || WORKFLOW_STATUS.DELIVERY_SEARCH,
    sellerId: sid != null ? String(sid) : undefined,
    radiusMeters: meta.radiusMeters ?? INITIAL_DELIVERY_RADIUS_M(),
    preview: {
      pickup,
      drop,
      total: order.pricing?.total ?? 0,
    },
    deliverySearchExpiresAt: order.deliverySearchExpiresAt,
    ...extra,
  };
}
