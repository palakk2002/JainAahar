import { getRegisteredProviders } from "../deliveryProviderRegistry.js";
import { isProviderHealthy } from "./providerHealthStore.js";
import logger from "../../../services/logger.js";

/**
 * Aggregates quotes from all healthy delivery providers for comparison
 */
export async function getBestQuote(context) {
  const allProviders = getRegisteredProviders().filter(
    (p) => p.name !== "noop" && p.name !== "mock"
  );

  const healthyProviders = [];
  for (const provider of allProviders) {
    if (await isProviderHealthy(provider.name)) {
      healthyProviders.push(provider);
    }
  }

  const quotePromises = healthyProviders.map(async (provider) => {
    try {
      const quote = await provider.getQuote(context);
      return {
        providerName: provider.name,
        ...quote,
      };
    } catch (err) {
      logger.warn({ domain: "delivery", provider: provider.name }, "Failed to fetch quote: " + err.message);
      return null;
    }
  });

  const results = await Promise.all(quotePromises);
  const validQuotes = results.filter(Boolean);

  if (validQuotes.length === 0) {
    return {
      best: {
        providerName: "internal",
        price: 25.0,
        currency: "INR",
        breakdown: { base: 25 },
        estimatedMinutes: 30,
      },
      all: [],
    };
  }

  // Sort by price ascending
  validQuotes.sort((a, b) => Number(a.price) - Number(b.price));

  return {
    best: validQuotes[0],
    all: validQuotes,
  };
}
