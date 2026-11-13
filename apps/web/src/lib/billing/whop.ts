// Whop: signed membership webhooks (checkout itself is embedded: whop-checkout.ts).
// Docs: https://docs.whop.com/developer/guides/webhooks (Standard Webhooks signing) and the
// Membership object (status: trialing | active | past_due | completed | canceled | expired | unresolved).

import { createHmac, timingSafeEqual } from "node:crypto";
import type { SubscriptionStatus } from "@/lib/billing/subscriptions";

/**
 * Verifies a Whop webhook. Whop signs `${webhook-id}.${webhook-timestamp}.${body}` with
 * HMAC-SHA256 and sends `webhook-signature: v1,<base64>` (several may be space-separated).
 * Whop secrets (`ws_…`) are used as given; a Standard Webhooks `whsec_<base64>` secret is decoded.
 */
export function verifyWhopSignature(
  body: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature || !secret) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > toleranceSeconds) return false;
  const key = secret.startsWith("whsec_") ? Buffer.from(secret.slice(6), "base64") : Buffer.from(secret, "utf8");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return signature.split(" ").some((part) => {
    const [version, value] = part.split(",", 2);
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

export interface WhopMembership {
  id: string;
  status: string;
  user_id?: string | null;
  variant_id?: string;
  cancel_at_period_end?: boolean;
  current_period_end?: string | null;
  metadata?: Record<string, unknown>;
}

/** Whop membership status → ours. "canceled" on Whop means access has ended. */
export function whopStatus(m: Pick<WhopMembership, "status" | "cancel_at_period_end">): SubscriptionStatus | null {
  switch (m.status) {
    case "trialing":
      return m.cancel_at_period_end ? "canceled" : "trialing";
    case "active":
      return m.cancel_at_period_end ? "canceled" : "active";
    case "past_due":
    case "unresolved":
      return "past_due";
    case "completed":
    case "canceled":
    case "expired":
      return "expired";
    default:
      return null;
  }
}
