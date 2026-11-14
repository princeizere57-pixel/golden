import { timingSafeEqual } from "node:crypto";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { auth } from "./auth.js";
import { env } from "./env.js";

/**
 * The signed-in user's id, or a 401. Every user-scoped route takes the owner from here —
 * never from the request body or URL — so one user can't read or write another's rows.
 */
export async function requireUserId(c: Context): Promise<string> {
  const id = await optionalUserId(c);
  if (!id) throw new HTTPException(401, { message: "Sign in required" });
  return id;
}

// One session read per request, however many checks (rate limit, plan gate, owner) ask.
const perRequest = new WeakMap<Request, Promise<string | null>>();

export function optionalUserId(c: Context): Promise<string | null> {
  let id = perRequest.get(c.req.raw);
  if (!id) {
    id = auth.api.getSession({ headers: c.req.raw.headers }).then((s) => s?.user.id ?? null);
    perRequest.set(c.req.raw, id);
  }
  return id;
}

/**
 * True only for the web server's own calls (x-internal-key), e.g. a manual run of a cron job.
 */
export function isInternal(c: Context): boolean {
  const key = env.INTERNAL_API_KEY;
  const sent = c.req.header("x-internal-key");
  if (!key || key.length < 16 || !sent) return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}
