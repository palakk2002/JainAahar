import { getDeliveryProvider, getRegisteredProvider } from "./deliveryProviderRegistry.js";
import { isDeliveryModuleEnabled } from "./deliveryFlags.js";
import { providerStatusToWorkflowStatus } from "./deliveryStatusMapping.js";
import { selectProvider, withProviderFallback } from "./selection/providerSelector.js";

/**
 * Delivery Manager — Clean facade for all delivery interactions across the application
 */

export async function createShipment(context) {
  if (!isDeliveryModuleEnabled()) return null;
  return withProviderFallback(context, async (provider) => {
    return provider.createShipment(context);
  });
}

export async function cancelShipment(context) {
  if (!isDeliveryModuleEnabled()) return null;
  const provider = context?.preferredProvider
    ? getRegisteredProvider(context.preferredProvider)
    : getDeliveryProvider();
  return provider.cancelShipment(context);
}

export async function getTrackingInfo(context) {
  if (!isDeliveryModuleEnabled()) return null;
  const provider = context?.preferredProvider
    ? getRegisteredProvider(context.preferredProvider)
    : getDeliveryProvider();
  return provider.getTrackingInfo(context);
}

export async function getETA(context) {
  if (!isDeliveryModuleEnabled()) return null;
  const provider = context?.preferredProvider
    ? getRegisteredProvider(context.preferredProvider)
    : getDeliveryProvider();
  return provider.getETA(context);
}

export async function getQuote(context) {
  const provider = context?.preferredProvider
    ? getRegisteredProvider(context.preferredProvider)
    : await selectProvider(context);
  return provider.getQuote(context);
}

export function normalizeProviderStatus(providerName, rawStatus) {
  return providerStatusToWorkflowStatus(providerName, rawStatus);
}

/** Broadcast facades for socket emission */
export function emitDeliveryBroadcastForSeller(sellerId, payload) {
  return getDeliveryProvider().emitDeliveryBroadcastForSeller(sellerId, payload);
}

export function retractDeliveryBroadcastForOrder(orderId, winnerDeliveryId) {
  return getDeliveryProvider().retractDeliveryBroadcastForOrder(orderId, winnerDeliveryId);
}

export function emitReturnBroadcastForCustomer(customerLocation, payload) {
  return getDeliveryProvider().emitReturnBroadcastForCustomer(customerLocation, payload);
}

export function emitToDelivery(deliveryId, payloadObj) {
  return getDeliveryProvider().emitToDelivery(deliveryId, payloadObj);
}

export async function markBroadcastAssigned({ orderId, winnerDeliveryId }) {
  if (!isDeliveryModuleEnabled()) return null;
  const { markLatestBroadcastAssigned } = await import("./internal/deliveryAssignmentStore.js");
  return markLatestBroadcastAssigned({ orderId, winnerDeliveryId });
}
