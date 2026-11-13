// Signed-in user, from the Better Auth session held by the API (apps/api). The browser's cookie is
// forwarded server-to-server; an absent, expired or forged session gives null. Server-only.

import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { apiOrigin } from "@/lib/api-origin";
import { SESSION_COOKIES } from "@/lib/journey";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

// Supabase still serves data (subscriptions, feedback, orders) until D2/P4; sign-in no longer uses it.
export const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
export const supabaseConfigured = () => Boolean(supabaseUrl() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Better Auth's get-session body → our User. Anything unexpected counts as signed out. */
export function sessionUser(data: unknown): User | null {
  const u = (data as { user?: { id?: unknown; name?: unknown; email?: unknown; image?: unknown } } | null)?.user;
  if (!u || typeof u.id !== "string" || typeof u.email !== "string") return null;
  // Magic-link sign-ups have no name yet.
  const name = typeof u.name === "string" && u.name.trim() ? u.name : u.email.split("@")[0];
  return { id: u.id, name, email: u.email, avatarUrl: typeof u.image === "string" ? u.image : undefined };
}

/** Once per request (many components ask). No session cookie → no network call. */
export const getUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  if (!SESSION_COOKIES.some((n) => jar.has(n))) return null;
  try {
    const res = await fetch(`${apiOrigin()}/api/auth/get-session`, {
      headers: { cookie: (await headers()).get("cookie") ?? "" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok ? sessionUser(await res.json()) : null;
  } catch {
    return null;
  }
});
