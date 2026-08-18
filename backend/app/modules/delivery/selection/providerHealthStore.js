import { getRedisClient, isRedisEnabled } from "../../../config/redis.js";
import logger from "../../../services/logger.js";

const HEALTH_KEY_PREFIX = "delivery:provider:health:";
const FAIL_THRESHOLD = 3; // Threshold before opening circuit breaker
const TTL_SECONDS = 300; // 5 minute auto-reset

/**
 * Checks if provider is healthy (circuit breaker is closed)
 */
export async function isProviderHealthy(providerName) {
  if (!providerName || !isRedisEnabled()) return true;
  try {
    const redis = getRedisClient();
    if (!redis) return true;
    const raw = await redis.get(`${HEALTH_KEY_PREFIX}${providerName.toLowerCase()}`);
    if (!raw) return true;
    const state = JSON.parse(raw);
    return !state.open;
  } catch (err) {
    logger.warn({ domain: "delivery", provider: providerName }, "Error checking provider health: " + err.message);
    return true;
  }
}

/**
 * Marks provider operation as successful — clears circuit breaker
 */
export async function markProviderHealthy(providerName) {
  if (!providerName || !isRedisEnabled()) return;
  try {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.del(`${HEALTH_KEY_PREFIX}${providerName.toLowerCase()}`);
  } catch (err) {
    logger.warn({ domain: "delivery", provider: providerName }, "Error clearing provider health: " + err.message);
  }
}

/**
 * Increments provider failure counter and trips circuit breaker if threshold exceeded
 */
export async function markProviderFailure(providerName) {
  if (!providerName || !isRedisEnabled()) return;
  try {
    const redis = getRedisClient();
    if (!redis) return;
    const key = `${HEALTH_KEY_PREFIX}${providerName.toLowerCase()}`;
    const raw = await redis.get(key);

    let state = { failures: 0, lastFailureAt: Date.now(), open: false };
    if (raw) {
      try {
        state = JSON.parse(raw);
      } catch (e) {}
    }

    state.failures += 1;
    state.lastFailureAt = Date.now();

    if (state.failures >= FAIL_THRESHOLD) {
      state.open = true;
      logger.error(
        { domain: "delivery", provider: providerName, failures: state.failures },
        `CIRCUIT OPEN: Provider ${providerName} exceeded failure threshold`
      );
    }

    await redis.set(key, JSON.stringify(state), "EX", TTL_SECONDS);
  } catch (err) {
    logger.warn({ domain: "delivery", provider: providerName }, "Error updating provider health failure: " + err.message);
  }
}
