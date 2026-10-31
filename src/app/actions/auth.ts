"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USER_COOKIE, sendMagicLink, supabaseConfigured, verifySupabaseToken, type User } from "@/lib/auth";
import { JOURNEY_COOKIE } from "@/lib/journey";
import { PLAN_COOKIE, PREFS_COOKIE, SKILL_COOKIE } from "@/lib/viewer";

const MONTH = 60 * 60 * 24 * 30;

async function remember(user: User) {
  (await cookies()).set(USER_COOKIE, JSON.stringify(user), { maxAge: MONTH, sameSite: "lax", path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production" });
}

/** Called by /auth/callback with the token Supabase returned after Google sign-in. */
export async function completeGoogleSignIn(accessToken: string): Promise<{ ok: boolean; error?: string }> {
  const user = await verifySupabaseToken(accessToken);
  if (!user) return { ok: false, error: "We couldn't confirm your Google sign-in. Please try again." };
  await remember(user);
  return { ok: true };
}

/** Email sign-in: Supabase sends a magic link; the callback signs the user in. */
export async function requestEmailLink(email: string, origin: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseConfigured()) return { ok: false, error: "Email sign-in needs Supabase keys." };
  const ok = await sendMagicLink(email.trim().toLowerCase(), origin);
  return ok ? { ok: true } : { ok: false, error: "We couldn't send the email. Check the address and try again in a minute." };
}

/** Development stand-in for Google when Supabase isn't configured. */
export async function demoSignIn(form: FormData) {
  if (supabaseConfigured()) throw new Error("Demo sign-in is disabled when Supabase is configured");
  const name = String(form.get("name") ?? "").trim().slice(0, 60) || "Chef";
  const email = String(form.get("email") ?? "").trim().slice(0, 120) || "cook@example.com";
  await remember({ id: `demo-${randomUUID()}`, name, email, provider: "demo" });
  redirect("/onboarding");
}

export async function signOut() {
  const jar = await cookies();
  for (const name of [USER_COOKIE, SKILL_COOKIE, PREFS_COOKIE, PLAN_COOKIE, JOURNEY_COOKIE]) jar.delete(name);
  redirect("/welcome");
}
