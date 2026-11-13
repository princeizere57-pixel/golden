import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { auth } from "./auth.js";

/**
 * The signed-in user's id, or a 401. Every user-scoped route takes the owner from here —
 * never from the request body or URL — so one user can't read or write another's rows.
 */
export async function requireUserId(c: Context): Promise<string> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) throw new HTTPException(401, { message: "Sign in required" });
  return session.user.id;
}
