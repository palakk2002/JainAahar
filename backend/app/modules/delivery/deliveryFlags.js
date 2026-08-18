/**
 * Feature flags and environment configuration for delivery module
 */

export function isDeliveryModuleEnabled() {
  const flag = (process.env.DELIVERY_MODULE_ENABLED || "true").toLowerCase();
  return flag === "true" || flag === "1";
}

export function getDeliveryProviderName() {
  return (process.env.DELIVERY_PROVIDER || "auto").toLowerCase();
}

export function isAutoProviderSelectionEnabled() {
  return getDeliveryProviderName() === "auto";
}
