"use server";

import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { newOrderId, offerById, type GoldenMetadata } from "@/lib/billing/offers";
import { prepareWhopCheckout } from "@/lib/billing/whop-checkout";
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
