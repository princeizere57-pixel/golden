import { sql } from "drizzle-orm";
import type { Context, MiddlewareHandler } from "hono";
import { getDb } from "../db/client.js";
import { optionalUserId } from "../session.js";

export type Verdict = { allowed: boolean; retryAfter: number };

/**
 * Counts one request in a fixed window, atomically (one statement, so parallel requests can't
 * both slip under the limit). Fails open: a database problem never blocks people.
 */
export async function hit(key: string, max: number, windowSec: number): Promise<Verdict> {
  try {
    const expired = sql`rate_limits.window_start <= now() - make_interval(secs => ${windowSec})`;
    const { rows } = await getDb().execute<{ count: number; retry_after: number }>(sql`
      insert into rate_limits (key, window_start, count) values (${key}, now(), 1)
      on conflict (key) do update set
        count = case when ${expired} then 1 else rate_limits.count + 1 end,
        window_start = case when ${expired} then now() else rate_limits.window_start end
      returning count, ceil(extract(epoch from window_start + make_interval(secs => ${windowSec}) - now()))::int as retry_after`);
    const row = rows[0];
    return { allowed: Number(row.count) <= max, retryAfter: Math.max(1, Number(row.retry_after)) };
  } catch (e) {
    console.error("[rate-limit] check failed, allowing", e);
    return { allowed: true, retryAfter: 0 };
  }
}

/**
 * Per-user limit for one route. Signed-out calls aren't counted unless `anonMax` is set (the route
 * itself answers 401); then they share one bucket per route.
 * shortcut: anonymous callers share one bucket (only feedback allows them); key by client IP once the proxy forwards a trusted one.
 */
export function rateLimit(name: string, max: number, windowSec = 3600, anonMax = 0): MiddlewareHandler {
  return async (c: Context, next) => {
    const userId = await optionalUserId(c);
    if (!userId && !anonMax) return next();
    const v = await hit(`${name}:${userId ?? "anon"}`, userId ? max : anonMax, windowSec);
    if (!v.allowed) {
      c.header("Retry-After", String(v.retryAfter));
      return c.json({ error: "Too many requests, try again in a bit" }, 429);
    }
    await next();
  };
}
