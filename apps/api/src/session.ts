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

export async function optionalUserId(c: Context): Promise<string | null> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user.id ?? null;
}

/**
 * True only for the web server's own calls (x-internal-key). Used where the web enforces a rule
 * the API can't yet (paid-plan checks, until subscriptions move here in P4).
 */
export function isInternal(c: Context): boolean {
  const key = env.INTERNAL_API_KEY;
  const sent = c.req.header("x-internal-key");
  if (!key || key.length < 16 || !sent) return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}
