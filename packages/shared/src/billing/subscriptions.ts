// Subscription rows → what the app unlocks. Pure: the API stores the rows (apps/api
// services/billing), the web and API both read access through accessFrom.

import { accessFor, bestTier, parseTier, type Access, type Tier } from "./entitlements.js";

export type SubscriptionStatus = "trialing" | "active" | "grace" | "past_due" | "paused" | "canceled" | "expired" | "revoked";

/** Where a subscription was bought. */
export type BillingProvider = "whop" | "google_play" | "app_store";

/** Statuses that unlock premium. */
export const ENTITLED: SubscriptionStatus[] = ["trialing", "active", "grace", "canceled"];

export interface SubscriptionRow {
  status: SubscriptionStatus;
  current_period_end: string | null;
  /** Null on rows without a plan: counts as Executive. */
  offer?: string | null;
}

const rowLive = (r: SubscriptionRow, now: number) => {
  if (!ENTITLED.includes(r.status)) return false;
  if (r.status !== "canceled") return true;
  return r.current_period_end ? Date.parse(r.current_period_end) > now : false;
};

/**
 * Access from live rows (active, trialing or in grace, or cancelled but still paid up): the best
 * plan chosen, and everything unlocked while any of them is still in its free days.
 */
export function accessFrom(rows: SubscriptionRow[], now = Date.now()): Access {
  const live = rows.filter((r) => rowLive(r, now));
  const plan = bestTier(live.map((r) => parseTier(r.offer ?? "executive")));
  // Free days end on their date even if the provider's "trial over" webhook is late or lost:
  // past the end date the row counts as the chosen plan, so the extras lock by themselves.
  const trialRow = live.find((r) => r.status === "trialing" && (!r.current_period_end || Date.parse(r.current_period_end) > now));
  const ends = trialRow?.current_period_end ? Date.parse(trialRow.current_period_end) : undefined;
  return accessFor(plan, Boolean(trialRow), ends);
}

/** What the app unlocks right now (see accessFrom). */
export const tierFrom = (rows: SubscriptionRow[], now = Date.now()): Tier => accessFrom(rows, now).tier;

/** Premium (any paid plan) from the same rows. */
export const entitledFrom = (rows: SubscriptionRow[], now = Date.now()): boolean => tierFrom(rows, now) !== "free";
