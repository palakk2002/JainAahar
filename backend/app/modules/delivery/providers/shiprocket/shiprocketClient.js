import axios from "axios";
import ProviderTokenStore from "../../../../models/providerTokenStore.js";
import { ProviderError } from "../../IDeliveryProvider.js";
import { getRedisClient, isRedisEnabled } from "../../../../config/redis.js";
import logger from "../../../../services/logger.js";
// Reloaded env credentials

const BASE_URL = process.env.SHIPROCKET_BASE_URL || "https://apiv2.shiprocket.in/v1/external";

/**
 * Sliding window rate limit check for Shiprocket API (500 req/min limit)
 */
async function checkRateLimit() {
  if (!isRedisEnabled()) return;
  try {
    const redis = getRedisClient();
    if (!redis) return;
    const key = "ratelimit:delivery:shiprocket";
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, 60000); // 60 seconds
    }
    if (count > 500) {
      throw new ProviderError("RATE_LIMITED", "Shiprocket rate limit exceeded (500 RPM)");
    }
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    // Don't fail requests if Redis check experiences transient connection issues
    logger.warn({ domain: "delivery", provider: "shiprocket" }, "Rate limit check skipped: " + err.message);
  }
}

class ShiprocketClient {
  /**
   * Retrieves active access token from ProviderTokenStore or authenticates
   */
  async getToken() {
    try {
      const stored = await ProviderTokenStore.findOne({ providerName: "shiprocket" });
      if (stored && stored.accessToken && stored.expiresAt && new Date(stored.expiresAt) > new Date()) {
        return stored.accessToken;
      }
      return await this.refreshToken();
    } catch (err) {
      logger.error({ domain: "delivery", provider: "shiprocket", error: err.message }, "Error retrieving Shiprocket token");
      if (err instanceof ProviderError) throw err;
      throw new ProviderError("TOKEN_ERROR", err.message || "Failed to retrieve access token", err);
    }
  }

  /**
   * Authenticates with Shiprocket API to issue a new access token (valid 10 days, refreshed daily)
   */
  async refreshToken() {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password || email === "your_shiprocket_email@example.com" || password === "your_shiprocket_password") {
      throw new ProviderError(
        "CONFIG_MISSING",
        "Shiprocket credentials missing in backend/.env. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD."
      );
    }

    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
      const token = response.data?.token;

      if (!token) {
        throw new ProviderError("AUTH_FAILED", "No token returned from Shiprocket authentication endpoint");
      }

      // Expires in 23 hours to safely rotate token before 10-day expiration
      const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000);

      await ProviderTokenStore.findOneAndUpdate(
        { providerName: "shiprocket" },
        {
          accessToken: token,
          expiresAt,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      logger.info({ domain: "delivery", provider: "shiprocket" }, "Shiprocket authentication token refreshed successfully");
      return token;
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      const message = err.response?.data?.message || err.message;
      logger.error({ domain: "delivery", provider: "shiprocket", error: message }, "Shiprocket auth failed");
      throw new ProviderError("AUTH_FAILED", `Shiprocket login failed: ${message}`, err);
    }
  }

  /**
   * Executes HTTP request against Shiprocket REST API with authorization & rate limiting
   */
  async request(method, path, data = null, params = null) {
    await checkRateLimit();
    let token = await this.getToken();

    const url = `${BASE_URL}${path}`;
    const makeCall = (authToken) =>
      axios({
        method,
        url,
        data,
        params,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 10000,
      });

    try {
      const response = await makeCall(token);
      return response.data;
    } catch (err) {
      // Handle 401 Unauthorized by forcing token refresh and retrying once
      if (err.response?.status === 401) {
        logger.warn({ domain: "delivery", provider: "shiprocket" }, "Token 401 received. Refreshing token and retrying request.");
        await ProviderTokenStore.deleteOne({ providerName: "shiprocket" });
        token = await this.refreshToken();
        try {
          const retryResponse = await makeCall(token);
          return retryResponse.data;
        } catch (retryErr) {
          throw new ProviderError(
            "REQUEST_FAILED",
            retryErr.response?.data?.message || retryErr.message,
            retryErr.response?.data
          );
        }
      }

      const status = err.response?.status;
      const apiMessage = err.response?.data?.message || err.message;
      if (status === 429) {
        throw new ProviderError("RATE_LIMITED", "Shiprocket API returned 429 Too Many Requests");
      }

      throw new ProviderError("REQUEST_FAILED", `Shiprocket API call failed (${status || 'NET_ERR'}): ${apiMessage}`, err.response?.data);
    }
  }
}

export const shiprocketClient = new ShiprocketClient();
