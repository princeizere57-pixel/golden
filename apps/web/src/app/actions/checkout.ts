"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { REF_COOKIE, isValidCode, referralCode } from "@/lib/giveaway";
import { requestShell } from "@/lib/native/shell";
import { SKILL_COOKIE } from "@/lib/viewer";

export type StartCheckout =
  | { ok: true; orderId: string; metadata: Record<string, string>; plan?: string; checkoutConfiguration?: string; returnUrl: string }
  | { ok: false; error: string };

const BUSY = "Checkout isn't answering right now. Please try again in a minute.";

/** A referral code from someone else (never your own). */
async function referredBy(userId: string) {
  const ref = (await cookies()).get(REF_COOKIE)?.value;
  return isValidCode(ref) && ref !== referralCode(userId) ? ref : undefined;
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  const res = await apiFetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  return res ? ((await res.json().catch(() => null)) as T | null) : null;
}

/**
 * Starts a Whop checkout for the chosen offer. The API creates the order and attaches the signed-in
 * account; the store apps never show Whop (they use the store's own billing).
 */
export async function startCheckout(offerId: string, payLater: boolean, origin: string): Promise<StartCheckout> {
  if (await requestShell()) return { ok: false, error: "In the app, subscribe through Google Play." };
  const user = await getUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  if (!(await cookies()).has(SKILL_COOKIE)) return { ok: false, error: "Please answer the quick questions first." };
  const started = await post<StartCheckout | { error?: string }>("/billing/checkout", { offerId, payLater, origin, referredBy: await referredBy(user.id) });
  return started && "ok" in started ? started : { ok: false, error: started?.error ?? BUSY };
}

/** Whop's hosted checkout page for the order already started, used when the embedded form is slow. */
export async function openHostedCheckout(offerId: string, orderId: string, origin: string): Promise<{ url: string } | { error: string }> {
  if (await requestShell()) return { error: "In the app, subscribe through Google Play." };
  const user = await getUser();
  if (!user) return { error: "Please sign in first." };
  const res = await post<{ url?: string; error?: string }>("/billing/checkout/hosted", { offerId, orderId, origin, referredBy: await referredBy(user.id) });
  return res?.url ? { url: res.url } : { error: res?.error ?? BUSY };
}
