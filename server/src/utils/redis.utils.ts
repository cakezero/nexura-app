import { redis } from "@/config/redis";
import logger from "@/config/logger";

export const REDIS = {
  set: async ({ key, data, ttl }: { key: string; data: Record<string, any> | string[], ttl?: number }) => {
    try {
      if (ttl) {
        await redis.set(key, JSON.stringify(data), "EX", ttl);
      } else {
        await redis.set(key, JSON.stringify(data));
      }
    } catch (error: any) {
      logger.warn(`Redis set failed for "${key}", skipping cache write: ${error?.message}`);
    }
  },

  get: async (key: string): Promise<Record<string, any> | string[] | null> => {
    try {
      const redisData = await redis.get(key);

      return redisData ? JSON.parse(redisData) : null;
    } catch (error: any) {
      logger.warn(`Redis get failed for "${key}", treating as cache miss: ${error?.message}`);
      return null;
    }
  }
}
