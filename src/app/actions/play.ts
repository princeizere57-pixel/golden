"use server";

// Google Play Billing, called by the Android app after Google's purchase sheet closes (or to
// restore purchases). Premium is only granted after Google's API confirms the subscription.

import { cookies } from "next/headers";
import { markJourneyDone } from "@/app/actions/viewer";
import { getUser } from "@/lib/auth";
import { acknowledgePlaySubscription, getPlaySubscription, judgePlaySubscription, playApiConfigured } from "@/lib/billing/google-play-api";
import { offerForPlayProduct } from "@/lib/billing/play-products";
import { ENTITLED, saveSubscription } from "@/lib/billing/subscriptions";
import { signValue } from "@/lib/signed-cookie";
import { PLAN_COOKIE } from "@/lib/viewer";

const YEAR = 60 * 60 * 24 * 365;

export type PlayResult = { ok: true; premium: boolean } | { ok: false; error: string };

export async function verifyPlayPurchase(productId: string, purchaseToken: string): Promise<PlayResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  if (!offerForPlayProduct(productId)) return { ok: false, error: "Unknown plan." };
  if (!/^[\w.:-]{20,2048}$/.test(purchaseToken)) return { ok: false, error: "That purchase couldn't be read." };
  if (!playApiConfigured()) return { ok: false, error: "Google Play purchases aren't switched on yet. You haven't been charged twice; contact support." };

  let verdict;
  try {
    const sub = await getPlaySubscription(purchaseToken);
    verdict = judgePlaySubscription(sub, { userId: user.id, productId }, ENTITLED);
  } catch (e) {
    console.error("[play] verify failed", e);
    return { ok: false, error: "We couldn't reach Google Play to confirm your purchase. Try again in a moment." };
  }
  if (!verdict.ok) return { ok: false, error: verdict.reason };

  await saveSubscription({ provider: "google_play", externalId: purchaseToken, status: verdict.status, userId: user.id, currentPeriodEnd: verdict.expiry }).catch((e) =>
    console.error("[play] could not save subscription", e),
  );
  if (verdict.needsAck) await acknowledgePlaySubscription(productId, purchaseToken).catch((e) => console.error("[play] acknowledge failed", e));

  const jar = await cookies();
  jar.set(PLAN_COOKIE, signValue(verdict.entitled ? "premium" : "free"), { maxAge: YEAR, sameSite: "lax", path: "/", httpOnly: true });
  if (verdict.entitled) await markJourneyDone();
  return { ok: true, premium: verdict.entitled };
}
