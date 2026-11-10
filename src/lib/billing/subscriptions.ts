// Writes subscription state to Supabase through PostgREST with the service-role key. Server-only.

import { bestTier, parseTier, type Tier } from "@/lib/billing/entitlements";
import type { OfferId } from "@/lib/billing/offers";
import type { Channel } from "@/lib/billing/routing";
import type { BillingEntity } from "@/lib/types";

export type SubscriptionStatus = "trialing" | "active" | "grace" | "past_due" | "paused" | "canceled" | "expired" | "revoked";

export interface SubscriptionUpdate {
  provider: Channel | "whop";
  /** Stripe subscription ID, App Store originalTransactionId, Play purchase token or Whop membership ID. */
  externalId: string;
  status: SubscriptionStatus;
  userId?: string;
  /** Whop's own user ID (user_…), so a membership can be linked to an account later. */
  whopUserId?: string;
  entity?: BillingEntity;
  currentPeriodEnd?: string;
  /** Which plan was bought (migration 0007). Rows without one count as Executive. */
  offer?: OfferId;
}

/** Statuses that unlock premium. */
export const ENTITLED: SubscriptionStatus[] = ["trialing", "active", "grace", "canceled"];

export async function saveSubscription(update: SubscriptionUpdate, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn(`[billing] Supabase not configured; dropped ${update.provider} ${update.status}`);
    return false;
  }
  const row = {
    provider: update.provider,
    external_id: update.externalId,
    status: update.status,
    user_id: update.userId,
    whop_user_id: update.whopUserId,
    entity: update.entity,
    current_period_end: update.currentPeriodEnd,
    offer: update.offer,
    updated_at: new Date().toISOString(),
  };
  const post = (body: Record<string, unknown>) =>
    fetchImpl(`${url}/rest/v1/subscriptions?on_conflict=provider,external_id`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined))),
    });
  let res = await post(row);
  // Before migration 0007 there is no `offer` column: save the rest rather than lose the payment.
  if (!res.ok && row.offer && /offer/.test(await res.clone().text())) {
    console.warn("[billing] subscriptions.offer missing: run supabase/migrations/0007_plan_tiers.sql");
    res = await post({ ...row, offer: undefined });
  }
  if (!res.ok) throw new Error(`Supabase returned ${res.status}: ${await res.text()}`);
  return true;
}

export interface SubscriptionRow {
  status: SubscriptionStatus;
  current_period_end: string | null;
  /** Missing before migration 0007, or null on older rows: counts as Executive. */
  offer?: string | null;
}

const rowLive = (r: SubscriptionRow, now: number) => {
  if (!ENTITLED.includes(r.status)) return false;
  if (r.status !== "canceled") return true;
  return r.current_period_end ? Date.parse(r.current_period_end) > now : false;
};

/** The best plan among rows that are active, trialing or in grace, or cancelled but still paid up. */
export function tierFrom(rows: SubscriptionRow[], now = Date.now()): Tier {
  return bestTier(rows.filter((r) => rowLive(r, now)).map((r) => parseTier(r.offer ?? "executive")));
}

/** Premium (any paid plan) from the same rows. */
export const entitledFrom = (rows: SubscriptionRow[], now = Date.now()): boolean => tierFrom(rows, now) !== "free";

/**
 * The plan this account pays for on any channel (Whop, Stripe, App Store, Google Play).
 * Webhooks keep the `subscriptions` table current; this reads it. Null when Supabase isn't
 * configured or can't be reached, so the caller can fall back instead of breaking the page.
 */
export async function activeTier(userId: string, fetchImpl: typeof fetch = fetch): Promise<Tier | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^[0-9a-f-]{36}$/i.test(userId)) return null;
  try {
    const res = await fetchImpl(`${url}/rest/v1/subscriptions?user_id=eq.${userId}&select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 30 },
    } as RequestInit);
    if (!res.ok) return null;
    return tierFrom((await res.json()) as SubscriptionRow[]);
  } catch {
    return null;
  }
}

/** Does this account have a paid subscription? (See activeTier.) */
export async function hasActiveSubscription(userId: string, fetchImpl: typeof fetch = fetch): Promise<boolean | null> {
  const tier = await activeTier(userId, fetchImpl);
  return tier === null ? null : tier !== "free";
}
