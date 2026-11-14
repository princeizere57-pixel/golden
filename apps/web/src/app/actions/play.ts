"use server";

// Google Play Billing, called by the Android app after Google's purchase sheet closes (or to
// restore purchases). The API confirms the subscription with Google before granting anything.

import { cookies } from "next/headers";
import { markJourneyDone } from "@/app/actions/viewer";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { planCookieValue, type OfferId } from "@/lib/billing/entitlements";
import { signValue } from "@/lib/signed-cookie";
import { PLAN_COOKIE } from "@/lib/viewer";

const YEAR = 60 * 60 * 24 * 365;

export type PlayResult = { ok: true; premium: boolean } | { ok: false; error: string };

type Verified = { ok: true; entitled: boolean; offer: OfferId; trialEndsAt?: number } | { ok?: false; error?: string };

export async function verifyPlayPurchase(productId: string, purchaseToken: string): Promise<PlayResult> {
  if (!(await getUser())) return { ok: false, error: "Please sign in first." };
  const res = await apiFetch("/billing/play/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, purchaseToken }) }).catch(() => null);
  const v = res ? ((await res.json().catch(() => null)) as Verified | null) : null;
  if (v?.ok !== true) return { ok: false, error: v?.error && res?.status !== 500 ? v.error : "We couldn't confirm your purchase right now. Try again in a moment." };

  // Device copy of the plan, for when the API can't be reached (the API stays the source).
  (await cookies()).set(PLAN_COOKIE, signValue(v.entitled ? planCookieValue(v.offer, v.trialEndsAt) : "free"), { maxAge: YEAR, sameSite: "lax", path: "/", httpOnly: true });
  if (v.entitled) await markJourneyDone();
  return { ok: true, premium: v.entitled };
}
