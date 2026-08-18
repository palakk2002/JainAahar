import { getRegisteredProvider, getRegisteredProviders } from "../deliveryProviderRegistry.js";
import { internalDeliveryProvider } from "../providers/internalDeliveryProvider.js";
import { isProviderHealthy, markProviderFailure, markProviderHealthy } from "./providerHealthStore.js";
import { getDeliveryProviderName } from "../deliveryFlags.js";
import logger from "../../../services/logger.js";

const PROVIDER_PRIORITY = ["shiprocket", "porter", "internal"];

/**
 * Gets provider fallback sequence for an execution attempt
 */
export function getProviderFallbackChain(context = {}) {
  const forced = context.preferredProvider || getDeliveryProviderName();
  if (forced && forced !== "auto") {
    const p = getRegisteredProvider(forced);
    return p ? [p, internalDeliveryProvider] : [internalDeliveryProvider];
  }

  const chain = [];
  for (const name of PROVIDER_PRIORITY) {
    const provider = getRegisteredProvider(name);
    if (provider) chain.push(provider);
  }

  if (!chain.some((p) => p.name === "internal")) {
    chain.push(internalDeliveryProvider);
  }

  return chain;
}

/**
 * Selects first healthy provider in priority chain
 */
export async function selectProvider(context = {}) {
  const forced = context.preferredProvider || getDeliveryProviderName();

  if (forced && forced !== "auto") {
    return getRegisteredProvider(forced) || internalDeliveryProvider;
  }

  for (const name of PROVIDER_PRIORITY) {
    const healthy = await isProviderHealthy(name);
    if (healthy) {
      const provider = getRegisteredProvider(name);
      if (provider) return provider;
    } else {
      logger.warn({ domain: "delivery", provider: name }, "Skipping unhealthy provider");
    }
  }

  return internalDeliveryProvider;
}

/**
 * Executes delivery operation with automatic failover across provider fallback chain
 */
export async function withProviderFallback(context, operation) {
  const chain = getProviderFallbackChain(context);
  let lastError = null;

  for (const provider of chain) {
    try {
      const healthy = await isProviderHealthy(provider.name);
      if (!healthy && chain.length > 1) {
        logger.warn({ domain: "delivery", provider: provider.name }, "Bypassing open circuit provider");
        continue;
      }

      const result = await operation(provider);
      await markProviderHealthy(provider.name);
      return { ...result, providerName: provider.name };
    } catch (err) {
      lastError = err;
      await markProviderFailure(provider.name);
      logger.warn(
        { domain: "delivery", provider: provider.name, error: err.message },
        `[providerFallback] ${provider.name} failed. Attempting next fallback.`
      );
    }
  }

  throw lastError || new Error("All delivery providers failed in fallback chain");
}
