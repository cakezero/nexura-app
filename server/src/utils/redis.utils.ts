import { redis } from "@/config/redis";
import logger from "@/config/logger";

// Check once per tick — if the Redis client never connected (or the socket
// dropped), skip the actual network call so we don't block every request for
// 5 seconds waiting for node-redis's internal command timeout.
const redisAvailable = (): boolean => {
  try {
    // isReady is stricter than isOpen — it waits for the Redis handshake.
    // Commands on a client that isOpen-but-not-ready can still be queued
    // internally and hang, so we gate on isReady.
    return redis.isReady;
  } catch {
    return false;
  }
};

export const REDIS = {
  set: async ({ key, data, ttl }: { key: string; data: Record<string, any> | string[], ttl?: number }) => {
    if (!redisAvailable()) return;
    try {
      if (ttl) {
        await redis.set(key, JSON.stringify(data), { EX: ttl });
      } else {
        await redis.set(key, JSON.stringify(data));
      }
    } catch (error: any) {
      logger.warn(`Redis set failed for "${key}", skipping cache write: ${error?.message}`);
    }
  },

  get: async (key: string): Promise<Record<string, any> | string[] | null> => {
    if (!redisAvailable()) return null;
    try {
      const redisData = await redis.get(key);

      return redisData ? JSON.parse(redisData) : null;
    } catch (error: any) {
      logger.warn(`Redis get failed for "${key}", treating as cache miss: ${error?.message}`);
      return null;
    }
  }
}
