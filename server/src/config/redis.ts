import { createClient, type RedisClientType } from "redis";

import logger from "./logger";

import { environment, COOLIFY_REDIS, REDIS_URI, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from "@/utils/env.utils";

let redis: RedisClientType;

const uri = `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_URI}:${REDIS_PORT}/0`

if (environment !== "development")
  // client = createClient(COOLIFY_REDIS, { maxRetriesPerRequest: null });
  redis = createClient({ url: COOLIFY_REDIS });
else
  // client = createClient(uri, {
    // host: REDIS_URI,
    // maxRetriesPerRequest: 5,
    // password: REDIS_PASSWORD,
    // port: parseInt(REDIS_PORT, 10),
    // username: REDIS_USERNAME,
  // });

  redis = createClient({ url: uri });

// redis.on("connect", () => {
//   logger.info("🔌 Redis connected");
// });

// redis.on("ready", () => {
//   logger.info("✅ Redis ready");
// });

await redis.connect();

redis.on("error", (error: any) => {
  logger.error(`❌ Redis error: ${error.message}`);
});

// redis.on("end", () => {
//   logger.warn("⚠️ Redis connection closed");
// });

// redis.on("reconnecting", (time: number) => {
//   logger.warn(`♻️ Redis reconnecting in ${time}ms`);
// });

export { redis };
