import { accessFrom, type Access, type BillingProvider, type GoldenMetadata, type OfferId, type SubscriptionStatus } from "@golden/shared/billing";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { getDb } from "../../db/client.js";
import { orders, subscriptions } from "../../db/schema.js";

export interface SubscriptionUpdate {
  provider: BillingProvider;
  externalId: string;
  status: SubscriptionStatus;
  userId?: string;
  /** Whop's own user id (user_…), so a membership can be linked to an account later. */
  whopUserId?: string;
  /** ISO 8601. */
  currentPeriodEnd?: string;
  offer?: OfferId;
}

const isoDate = (v?: string) => {
  const d = v ? new Date(v) : undefined;
  return d && !Number.isNaN(d.getTime()) ? d : undefined;
};

/**
 * Upserts on (provider, external_id). Only the fields this event knows are written, so a later
 * webhook without metadata never wipes the account or plan an earlier one recorded.
 * Throws on a database error: the webhook then answers 5xx and the provider retries.
 */
export async function saveSubscription(u: SubscriptionUpdate): Promise<void> {
  const known = Object.fromEntries(
    Object.entries({ status: u.status, userId: u.userId, whopUserId: u.whopUserId, currentPeriodEnd: isoDate(u.currentPeriodEnd), offer: u.offer }).filter(([, v]) => v !== undefined),
  );
  await getDb()
    .insert(subscriptions)
    .values({ provider: u.provider, externalId: u.externalId, status: u.status, ...known })
    .onConflictDoUpdate({ target: [subscriptions.provider, subscriptions.externalId], set: { ...known, updatedAt: new Date() } });
}

/** The Golden account an earlier, metadata-carrying Whop event already tied to this Whop user. */
export async function userForWhopUser(whopUserId: string): Promise<string | undefined> {
  const [row] = await getDb()
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(and(eq(subscriptions.whopUserId, whopUserId), isNotNull(subscriptions.userId)))
    .limit(1);
  return row?.userId ?? undefined;
}

export async function accessForUser(userId: string): Promise<Access> {
  const rows = await getDb()
    .select({ status: subscriptions.status, end: subscriptions.currentPeriodEnd, offer: subscriptions.offer })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));
  return accessFrom(rows.map((r) => ({ status: r.status, current_period_end: r.end?.toISOString() ?? null, offer: r.offer })));
}

/** Founding members so far: people (not rows: one person can hold two memberships) on a live plan. */
export async function spotsTaken(): Promise<number> {
  const [row] = await getDb()
    .select({ n: sql<number>`count(distinct coalesce(${subscriptions.userId}, ${subscriptions.provider} || ':' || ${subscriptions.externalId}))::int` })
    .from(subscriptions)
    .where(inArray(subscriptions.status, ["active", "trialing"]));
  return row?.n ?? 0;
}

export async function createOrder(m: GoldenMetadata): Promise<void> {
  await getDb().insert(orders).values({ orderId: m.order_id, userId: m.golden_user_id, offer: m.offer, referredBy: m.referred_by ?? null }).onConflictDoNothing();
}

/** Marks the order paid, creating it if the pending row never got written. */
export async function markOrderPaid(m: Pick<GoldenMetadata, "order_id" | "golden_user_id" | "offer">, paymentId: string): Promise<void> {
  await getDb()
    .insert(orders)
    .values({ orderId: m.order_id, userId: m.golden_user_id, offer: m.offer, status: "paid", whopPaymentId: paymentId })
    .onConflictDoUpdate({ target: orders.orderId, set: { status: "paid", whopPaymentId: paymentId, updatedAt: new Date() } });
}
