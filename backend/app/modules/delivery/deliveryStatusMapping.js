import { WORKFLOW_STATUS } from "../../constants/orderWorkflow.js";

/**
 * Shiprocket raw status to canonical WORKFLOW_STATUS map
 */
const SHIPROCKET_MAP = {
  "PICKUP SCHEDULED": WORKFLOW_STATUS.DELIVERY_ASSIGNED,
  "OUT FOR PICKUP": WORKFLOW_STATUS.DELIVERY_ASSIGNED,
  "PICKUP COMPLETE": WORKFLOW_STATUS.OUT_FOR_DELIVERY,
  "OUT FOR DELIVERY": WORKFLOW_STATUS.OUT_FOR_DELIVERY,
  "DELIVERED": WORKFLOW_STATUS.DELIVERED,
  "UNDELIVERED": WORKFLOW_STATUS.OUT_FOR_DELIVERY, // Attempted delivery
  "RTO INITIATED": WORKFLOW_STATUS.CANCELLED,
  "CANCELLED": WORKFLOW_STATUS.CANCELLED,
  "1": WORKFLOW_STATUS.DELIVERY_ASSIGNED, // AWBs generated / Pickup Scheduled
  "6": WORKFLOW_STATUS.OUT_FOR_DELIVERY, // Shipped
  "7": WORKFLOW_STATUS.DELIVERED, // Delivered
  "8": WORKFLOW_STATUS.CANCELLED, // Cancelled
  "9": WORKFLOW_STATUS.CANCELLED, // RTO Initiated
  "13": WORKFLOW_STATUS.OUT_FOR_DELIVERY, // Undelivered
};

/**
 * Porter raw status to canonical WORKFLOW_STATUS map
 */
const PORTER_MAP = {
  "order_accepted": WORKFLOW_STATUS.DELIVERY_ASSIGNED,
  "driver_arrived_pickup": WORKFLOW_STATUS.PICKUP_READY,
  "order_picked_up": WORKFLOW_STATUS.OUT_FOR_DELIVERY,
  "order_delivered": WORKFLOW_STATUS.DELIVERED,
  "order_cancelled": WORKFLOW_STATUS.CANCELLED,
};

const PROVIDER_MAPS = {
  shiprocket: SHIPROCKET_MAP,
  porter: PORTER_MAP,
};

/**
 * Map raw third-party status to canonical WORKFLOW_STATUS.
 * Returns null if status cannot be mapped (callers keep order state unchanged, log history).
 */
export function providerStatusToWorkflowStatus(providerName, providerStatus) {
  if (!providerName || !providerStatus) return null;
  const map = PROVIDER_MAPS[providerName.toLowerCase()];
  if (!map) return null;

  const key = String(providerStatus).trim();
  const directMatch = map[key] || map[key.toUpperCase()];
  if (directMatch) return directMatch;

  return null;
}
