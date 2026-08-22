import { noopDeliveryProvider } from "./providers/noopDeliveryProvider.js";
import { internalDeliveryProvider } from "./providers/internalDeliveryProvider.js";
import { mockDeliveryProvider } from "./providers/mockDeliveryProvider.js";
import { shiprocketProvider } from "./providers/shiprocket/shiprocketProvider.js";
import { porterProvider } from "./providers/porter/porterProvider.js";
import { getDeliveryProviderName, isDeliveryModuleEnabled } from "./deliveryFlags.js";
import logger from "../../services/logger.js";

const REGISTRY = new Map();

// Register built-in delivery providers
REGISTRY.set("noop", noopDeliveryProvider);
REGISTRY.set("internal", internalDeliveryProvider);
REGISTRY.set("mock", mockDeliveryProvider);
REGISTRY.set("shiprocket", shiprocketProvider);
REGISTRY.set("courier", shiprocketProvider);
REGISTRY.set("shipment", shiprocketProvider);
REGISTRY.set("tracking", shiprocketProvider);
REGISTRY.set("porter", porterProvider);

/**
 * Register custom delivery provider
 */
export function registerDeliveryProvider(name, provider) {
  if (!name || typeof name !== "string") {
    throw new Error("Provider name must be a non-empty string");
  }
  REGISTRY.set(name.toLowerCase(), provider);
  logger.info({ domain: "delivery", provider: name }, "Registered delivery provider");
}

/**
 * Retrieves registered provider by name
 */
export function getRegisteredProvider(name) {
  if (!name) return null;
  return REGISTRY.get(name.toLowerCase()) || null;
}

/**
 * Returns all currently registered providers
 */
export function getRegisteredProviders() {
  return Array.from(REGISTRY.values());
}

/**
 * Returns current default delivery provider based on environment and module flags
 */
export function getDeliveryProvider(overrideName = null) {
  if (!isDeliveryModuleEnabled()) {
    return noopDeliveryProvider;
  }

  const name = (overrideName || getDeliveryProviderName()).toLowerCase();

  if (name === "auto") {
    // In auto mode, default to shiprocket if available, else internal
    return REGISTRY.get("shiprocket") || internalDeliveryProvider;
  }

  const provider = REGISTRY.get(name);
  if (!provider) {
    logger.warn({ domain: "delivery", requested: name }, "Requested provider not found, falling back to internal");
    return internalDeliveryProvider;
  }

  return provider;
}
