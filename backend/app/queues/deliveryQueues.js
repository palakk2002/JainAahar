import Bull from "bull";
import {
  getRedisOptionsForBull,
  isRedisEnabled,
  createBullRedisClient,
} from "../config/redis.js";

const redisOpts = getRedisOptionsForBull();

const queueSettings = {
  stalledInterval: 30000,
  maxStalledCount: 2,
};

function createNoopQueue() {
  return {
    add: async () => ({}),
    getJob: async () => null,
    process: () => {},
    on: () => {},
    close: async () => {},
  };
}

export const deliveryShipmentQueue = isRedisEnabled()
  ? new Bull("delivery-shipment", {
      redis: redisOpts,
      createClient: createBullRedisClient,
      settings: queueSettings,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    })
  : createNoopQueue();

export const deliveryCancellationQueue = isRedisEnabled()
  ? new Bull("delivery-cancellation", {
      redis: redisOpts,
      createClient: createBullRedisClient,
      settings: queueSettings,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    })
  : createNoopQueue();

export const deliveryWebhookQueue = isRedisEnabled()
  ? new Bull("delivery-webhook", {
      redis: redisOpts,
      createClient: createBullRedisClient,
      settings: queueSettings,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "fixed", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    })
  : createNoopQueue();

export const deliveryTrackingQueue = isRedisEnabled()
  ? new Bull("delivery-tracking", {
      redis: redisOpts,
      createClient: createBullRedisClient,
      settings: queueSettings,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
      },
    })
  : createNoopQueue();

export const DELIVERY_JOB_NAMES = {
  CREATE_SHIPMENT: "create-shipment",
  CANCEL_SHIPMENT: "cancel-shipment",
  PROCESS_WEBHOOK: "process-webhook",
  POLL_TRACKING: "poll-tracking",
};
