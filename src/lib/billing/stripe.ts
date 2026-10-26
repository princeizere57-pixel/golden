// Stripe over plain REST (no SDK), one secret key per entity. Server-only.

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { BillingEntity } from "@/lib/types";
import { TRIAL_DAYS, type Interval } from "@/lib/billing/routing";

type Fetch = typeof fetch;

export function stripeKey(entity: BillingEntity): string | undefined {
  return entity === "uk" ? process.env.STRIPE_UK_SECRET_KEY : process.env.STRIPE_US_SECRET_KEY;
}

export function webhookSecret(entity: BillingEntity): string | undefined {
  return entity === "uk" ? process.env.STRIPE_UK_WEBHOOK_SECRET : process.env.STRIPE_US_WEBHOOK_SECRET;
}

/** Price IDs live in env so each entity's dashboard owns its own prices. */
export function stripePriceId(entity: BillingEntity, interval: Interval): string | undefined {
  return process.env[`STRIPE_${entity.toUpperCase()}_PRICE_${interval.toUpperCase()}`];
}

export interface CheckoutInput {
  entity: BillingEntity;
  priceId: string;
  userId: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
}

/** Creates a subscription Checkout Session with a 7-day trial; returns its hosted URL. */
export async function createCheckoutSession(input: CheckoutInput, fetchImpl: Fetch = fetch): Promise<string> {
  const key = stripeKey(input.entity);
  if (!key) throw new Error(`Stripe is not configured for the ${input.entity.toUpperCase()} entity`);
  const form = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": input.priceId,
    "line_items[0][quantity]": "1",
    "subscription_data[trial_period_days]": String(TRIAL_DAYS),
    "subscription_data[metadata][user_id]": input.userId,
    "subscription_data[metadata][entity]": input.entity,
    client_reference_id: input.userId,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    "automatic_tax[enabled]": "true",
    billing_address_collection: "required",
  });
  if (input.email) form.set("customer_email", input.email);
  const res = await fetchImpl("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const body = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !body.url) throw new Error(body.error?.message ?? `Stripe returned ${res.status}`);
  return body.url;
}

/**
 * Verifies a `Stripe-Signature` header: HMAC-SHA256 of `${t}.${payload}` with the endpoint
 * secret, compared in constant time, rejecting timestamps outside the tolerance window.
 */
export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.split("=", 2) as [string, string]);
  const t = Number(parts.find(([k]) => k === "t")?.[1]);
  const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!Number.isFinite(t) || !signatures.length || Math.abs(nowSeconds - t) > toleranceSeconds) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex"));
  return signatures.some((sig) => {
    const given = Buffer.from(sig);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
