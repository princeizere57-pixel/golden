"use server";

import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { newOrderId, offerById, type GoldenMetadata } from "@/lib/billing/offers";
import { hostedCheckoutUrl, prepareWhopCheckout } from "@/lib/billing/whop-checkout";
import { REF_COOKIE, isValidCode, referralCode } from "@/lib/giveaway";
import { requestShell } from "@/lib/native/shell";
import { SKILL_COOKIE } from "@/lib/viewer";

export type StartCheckout =
  | { ok: true; orderId: string; metadata: Record<string, string>; plan?: string; checkoutConfiguration?: string; returnUrl: string }
  | { ok: false; error: string };

/** Starts a Whop checkout for the chosen offer with Golden's order and user IDs attached. */
export async function startCheckout(offerId: string, payLater: boolean, origin: string): Promise<StartCheckout> {
  // Inside the store apps, subscriptions go through the store's own billing, never Whop.
  if (await requestShell()) return { ok: false, error: "In the app, subscribe through Google Play." };
  const user = await getUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  const jar = await cookies();
  if (!jar.has(SKILL_COOKIE)) return { ok: false, error: "Please answer the quick questions first." };
  const offer = offerById(offerId);
  if (!offer) return { ok: false, error: "Unknown plan." };
  if (!/^https?:\/\/[^/]+$/.test(origin)) return { ok: false, error: "Bad origin." };

  const orderId = newOrderId();
  const ref = jar.get(REF_COOKIE)?.value;
  const metadata: GoldenMetadata = {
    order_id: orderId,
    golden_user_id: user.id,
    offer: offer.id,
    ...(isValidCode(ref) && ref !== referralCode(user.id) ? { referred_by: ref } : {}),
  };
  const returnUrl = `${origin}/checkout/return?order=${orderId}`;
  const prepared = await prepareWhopCheckout(offer, metadata, returnUrl, payLater);
  if (!prepared.ok) return prepared;
  await recordOrder(metadata);
  return { ok: true, orderId, metadata: { ...metadata }, plan: prepared.plan, checkoutConfiguration: prepared.checkoutConfiguration, returnUrl };
}

/** Best-effort "pending" order row; the webhook marks it paid. */
async function recordOrder(m: GoldenMetadata) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  await fetch(`${url}/rest/v1/orders`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ order_id: m.order_id, golden_user_id: m.golden_user_id, offer: m.offer, referred_by: m.referred_by ?? null }),
  }).catch(() => {});
}

/**
 * Whop's hosted checkout page for the order already started, used when the embedded form is slow.
 * The account, plan and order come from the server (never trusted from the browser).
 */
export async function openHostedCheckout(offerId: string, orderId: string, origin: string): Promise<{ url: string } | { error: string }> {
  if (await requestShell()) return { error: "In the app, subscribe through Google Play." };
  const user = await getUser();
  if (!user) return { error: "Please sign in first." };
  const offer = offerById(offerId);
  if (!offer || !/^gld_[a-z0-9]+_[0-9a-f]{12}$/.test(orderId) || !/^https?:\/\/[^/]+$/.test(origin)) return { error: "Please start checkout again." };
  const ref = (await cookies()).get(REF_COOKIE)?.value;
  const metadata: GoldenMetadata = {
    order_id: orderId,
    golden_user_id: user.id,
    offer: offer.id,
    ...(isValidCode(ref) && ref !== referralCode(user.id) ? { referred_by: ref } : {}),
  };
  const url = await hostedCheckoutUrl(offer, metadata, `${origin}/checkout/return?order=${orderId}`);
  return url ? { url } : { error: "Whop isn't answering right now. Please try again in a minute." };
}
