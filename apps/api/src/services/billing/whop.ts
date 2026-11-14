// Whop, the live web merchant of record: embedded/hosted checkout setup and the signed webhook.
// Membership statuses (docs.whop.com): trialing | active | past_due | completed | canceled | expired | unresolved.

import { offerById, type GoldenMetadata, type Offer, type SubscriptionStatus } from "@golden/shared/billing";
import { WhopClient } from "@whop/sdk";
import * as store from "./store.js";

/** Buy now, pay later and instalment methods Whop supports. */
export const PAY_LATER_METHODS = ["klarna", "afterpay_clearpay", "affirm", "sezzle", "zip", "card_installments_three"] as const;

/** Account ids that may come from outside (webhook metadata, store purchases). */
export const USER_ID = /^[\w-]{8,64}$/;

export const planIdFor = (offer: Offer) => {
  const id = process.env[offer.planEnv] || offer.whopPlan;
  return id && /^plan_[A-Za-z0-9]+$/.test(id) ? id : undefined;
};

export const whopApiConfigured = () => Boolean(process.env.WHOP_API_KEY && process.env.WHOP_COMPANY_ID);
export const whopEmbedConfigured = (offer: Offer) => Boolean(planIdFor(offer)) || whopApiConfigured();

export type PreparedCheckout = { ok: true; plan: string } | { ok: true; checkoutConfiguration: string; purchaseUrl?: string } | { ok: false; error: string };

/**
 * The offer's Whop plan is sold directly with `plan`. Pay-later, hosted pages and offers without a
 * plan id use a checkout configuration (Golden's metadata attached, BNPL methods switched on).
 */
export async function prepareWhopCheckout(offer: Offer, metadata: GoldenMetadata, returnUrl: string, opts: { payLater?: boolean; hosted?: boolean } = {}): Promise<PreparedCheckout> {
  const planId = planIdFor(offer);
  if (planId && !opts.payLater && !opts.hosted) return { ok: true, plan: planId };
  if (!whopApiConfigured()) {
    return { ok: false, error: opts.payLater ? "Pay later needs WHOP_API_KEY and WHOP_COMPANY_ID." : `Set ${offer.planEnv} (or WHOP_API_KEY + WHOP_COMPANY_ID) to sell this offer.` };
  }
  try {
    const config = await new WhopClient({ token: process.env.WHOP_API_KEY! }).checkoutConfigurations.create({
      account_id: process.env.WHOP_COMPANY_ID!,
      metadata: { ...metadata },
      // Whop only accepts https return addresses (not http://localhost); the embed's own returnUrl covers local runs.
      ...(returnUrl.startsWith("https://") ? { redirect_url: returnUrl } : {}),
      ...(planId
        ? { plan_id: planId }
        : {
            plan: {
              title: offer.name,
              description: offer.tagline,
              currency: "usd",
              plan_type: offer.planType,
              initial_price: offer.planType === "one_time" ? offer.price : offer.trialDays ? 0 : offer.price,
              renewal_price: offer.planType === "renewal" ? offer.price : undefined,
              billing_period: offer.billingPeriodDays,
              trial_period_days: offer.trialDays || undefined,
            },
          }),
      ...(opts.payLater ? { payment_method_configuration: { enabled: [...PAY_LATER_METHODS], disabled: [], include_platform_defaults: true } } : {}),
    });
    return { ok: true, checkoutConfiguration: config.id, purchaseUrl: config.purchase_url ?? undefined };
  } catch (err) {
    const body = (err as { body?: unknown }).body;
    console.error("[whop] checkout configuration failed", body ? JSON.stringify(body) : (err as Error).message);
    return { ok: false, error: "Whop couldn't start checkout. Check WHOP_API_KEY and WHOP_COMPANY_ID." };
  }
}

export interface WhopMembership {
  id: string;
  status: string;
  user_id?: string | null;
  cancel_at_period_end?: boolean;
  current_period_end?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface WhopPayment {
  id: string;
  user_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export type WhopEvent = { type?: string; data?: Record<string, unknown> };

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

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const userIn = (meta: Record<string, unknown> | null | undefined) => {
  const id = str(meta?.golden_user_id) ?? str(meta?.app_user_id);
  return id && USER_ID.test(id) ? id : undefined;
};

export type WhopStore = Pick<typeof store, "saveSubscription" | "markOrderPaid" | "userForWhopUser">;

/**
 * payment.succeeded fulfils the order Golden created (metadata.order_id / golden_user_id / offer);
 * membership.* keeps trials, renewals and cancellations in sync. A membership without our metadata
 * (e.g. bought from a static Whop link) is linked through a Whop user an earlier event already tied
 * to an account; otherwise it's kept unlinked rather than guessed.
 */
export async function handleWhopEvent(event: WhopEvent, db: WhopStore = store): Promise<void> {
  if (!event.data) return;
  if (event.type === "payment.succeeded") {
    const payment = event.data as unknown as WhopPayment;
    const userId = userIn(payment.metadata);
    const offer = offerById(str(payment.metadata?.offer) ?? "");
    const orderId = str(payment.metadata?.order_id);
    console.log(`[whop] payment ${payment.id} for order ${orderId ?? "none"} (${offer?.id ?? "unknown offer"})`);
    if (orderId && userId && offer) await db.markOrderPaid({ order_id: orderId, golden_user_id: userId, offer: offer.id }, payment.id);
    // One-time offers have no membership to follow, so access comes from the payment itself.
    if (offer?.planType === "one_time" && userId) {
      await db.saveSubscription({ provider: "whop", externalId: payment.id, status: "active", userId, whopUserId: str(payment.user_id), offer: offer.id });
    }
    return;
  }
  if (event.type?.startsWith("membership.") && str(event.data.id)) {
    const m = event.data as unknown as WhopMembership;
    const status = whopStatus(m);
    if (!status) return;
    const whopUserId = str(m.user_id);
    const userId = userIn(m.metadata) ?? (whopUserId ? await db.userForWhopUser(whopUserId) : undefined);
    await db.saveSubscription({
      provider: "whop",
      externalId: m.id,
      status,
      userId,
      whopUserId,
      currentPeriodEnd: str(m.current_period_end),
      offer: offerById(str(m.metadata?.offer) ?? "")?.id,
    });
  }
}
