// Edge-safe rate limiter.
// Production: hits Upstash Redis via HTTP (works in Edge runtime).
// Local dev: if env vars are missing or hit fails, falls back to in-memory.
//
// Sliding window: 30 req / 10 min per user, 60 req / 10 min per IP (production).
// In development mode the limits are relaxed (100 / 200) so testers aren't blocked.

import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// Only construct the client if both env vars look real.
// The placeholder values in our .env have https://...upstash.io which is the right format,
// so we just check that the URL starts with https:// and the token is long enough.
const useUpstash =
  !!url && url.startsWith("https://") && !!token && token.length > 30;

const redis = useUpstash ? new Redis({ url: url!, token: token! }) : null;

const memory = new Map<string, { count: number; expires: number }>();

const WINDOW_SECONDS = 600;

async function upstashLimit(key: string, limit: number) {
  if (!redis) return { ok: true, remaining: limit };
  try {
    const count = (await redis.incr(key)) as number;
    if (count === 1) await redis.expire(key, WINDOW_SECONDS);
    return { ok: count <= limit, remaining: Math.max(0, limit - count) };
  } catch (e) {
    // If Upstash is unreachable, fail open. Rate limit failures should not break the app.
    console.error("[ratelimit] upstash error, falling back to in-memory", e);
    return memoryLimit(key, limit);
  }
}

function memoryLimit(key: string, limit: number) {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.expires < now) {
    memory.set(key, { count: 1, expires: now + WINDOW_SECONDS * 1000 });
    return { ok: true, remaining: limit - 1 };
  }
  entry.count += 1;
  return { ok: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}

export async function enforceRateLimit(identifier: string, scope: "user" | "ip") {
  const isDev = process.env.NODE_ENV === "development";
  const limit = scope === "user"
    ? (isDev ? 500 : 30)
    : (isDev ? 1000 : 60);
  const key = `rl:${scope}:${identifier}`;
  return redis ? upstashLimit(key, limit) : memoryLimit(key, limit);
}
