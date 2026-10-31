// Signed-in user. Google sign-in goes through Supabase Auth; the access token is checked
// against Supabase on the server before we trust it. Without Supabase keys, a clearly labelled
// demo sign-in keeps the flow usable in development. Server-only.

import "server-only";
import { cookies } from "next/headers";

export const USER_COOKIE = "bac-user";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: "google" | "demo";
}

export const supabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
export const supabaseConfigured = () => Boolean(supabaseUrl() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function getUser(): Promise<User | null> {
  try {
    const value = JSON.parse((await cookies()).get(USER_COOKIE)?.value ?? "null");
    return value && typeof value.id === "string" && typeof value.email === "string" ? (value as User) : null;
  } catch {
    return null;
  }
}

/** Emails a one-tap sign-in link (Supabase magic link) that returns to /auth/callback. */
export async function sendMagicLink(email: string, origin: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const url = supabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !/^https?:\/\/[^/]+$/.test(origin)) return false;
  try {
    const res = await fetchImpl(`${url}/auth/v1/otp?redirect_to=${encodeURIComponent(`${origin}/auth/callback`)}`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ email, create_user: true }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Asks Supabase who an access token belongs to. Returns null for invalid or expired tokens. */
export async function verifySupabaseToken(accessToken: string, fetchImpl: typeof fetch = fetch): Promise<User | null> {
  const url = supabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !accessToken) return null;
  try {
    const res = await fetchImpl(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const u = (await res.json()) as { id?: string; email?: string; user_metadata?: { full_name?: string; name?: string; avatar_url?: string; picture?: string } };
    if (!u.id || !u.email) return null;
    const meta = u.user_metadata ?? {};
    return { id: u.id, email: u.email, name: meta.full_name ?? meta.name ?? u.email.split("@")[0], avatarUrl: meta.avatar_url ?? meta.picture, provider: "google" };
  } catch {
    return null;
  }
}
