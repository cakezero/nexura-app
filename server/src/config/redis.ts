import { createClient, type RedisClientType } from "redis";

import logger from "./logger";

import {
  COOLIFY_REDIS,
  REDIS_URI,
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_USERNAME,
} from "@/utils/env.utils";

let redis: RedisClientType;

// Build the full Redis URL. Public Redis Cloud endpoints require TLS, so we
// default to the `rediss://` scheme unless `REDIS_URI` already carries a
// protocol or `REDIS_SCHEME` env var overrides (e.g. REDIS_SCHEME=redis for
// unsecured local dev). Credentials are URI-encoded so `@` / `:` in passwords
// don't break the URL.
const buildUrl = () => {
  if (REDIS_URI && /^[a-z]+:\/\//i.test(REDIS_URI)) return REDIS_URI;
  const user = encodeURIComponent(REDIS_USERNAME ?? "");
  const pass = encodeURIComponent(REDIS_PASSWORD ?? "");
  const host = REDIS_URI ?? "";
  const port = REDIS_PORT ?? "6379";
  const scheme = (process.env.REDIS_SCHEME ?? "rediss").toLowerCase();
  return `${scheme}://${user}:${pass}@${host}:${port}/0`;
};

const logUrl = (raw: string) => raw.replace(/:[^:@/]+@/, ":***@");

if (COOLIFY_REDIS) {
  redis = createClient({ url: COOLIFY_REDIS });
} else {
  redis = createClient({
    url: buildUrl(),
    socket: { reconnectStrategy: false },
  });
}

logger.info(`🔌 Redis target: ${logUrl(buildUrl())}`);

redis.on("connect", () => {
  logger.info("🔌 Redis connected");
});

redis.on("ready", () => {
  logger.info("✅ Redis ready");
});

redis.on("error", (error: any) => {
  logger.error(`❌ Redis error: ${error.message}`);
});

// Non-blocking Redis init. The previous design's `await redis.connect()` at
// module scope caused top-level await to stall server startup whenever the
// Redis Cloud endpoint blackholed the TLS handshake. Calling this *after*
// `server.listen` fires (and without `await`) lets the HTTP server come up
// immediately and degrades gracefully to "no cache" on a hung/transient
// Redis. Resolves once connect either succeeds OR times out (default 5s,
// override via REDIS_CONNECT_TIMEOUT_MS). NEVER throws — all errors are
// logged via `logger.error` and the server continues without cache.
//
// NOTE: `redis.connect()` is one-shot on a `node-redis` client — calling this
// twice will throw. Treat it as startup-only and let process restart handle
// retries.
export async function initRedis(): Promise<void> {
  const timeoutMs = Number(process.env.REDIS_CONNECT_TIMEOUT_MS ?? 5000);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`connect timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });
  try {
    await Promise.race([redis.connect(), timeoutPromise]);
  } catch (error: any) {
    logger.error(
      `❌ Redis connect failed, continuing without cache: ${error?.message}`,
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    // Swallow the timeout promise's late rejection (if `redis.connect()`
    // resolved first) so it never surfaces as UnhandledPromiseRejection.
    timeoutPromise.catch(() => {});
  }
}

export { redis };
