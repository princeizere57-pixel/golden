// Prepares a Whop embedded checkout for one of Golden's offers. Server-only.
// - A plan created in the Whop dashboard (WHOP_PLAN_* env) can be sold directly with `plan`.
// - Pay-later, or offers without a plan ID, use a checkout configuration made here with the
//   SDK (inline plan from offers.ts, Golden's metadata, BNPL methods switched on).

import "server-only";
import { WhopClient } from "@whop/sdk";
import type { GoldenMetadata, Offer } from "@/lib/billing/offers";

/** Buy now, pay later and instalment methods Whop supports. */
export const PAY_LATER_METHODS = ["klarna", "afterpay_clearpay", "affirm", "sezzle", "zip", "card_installments_three"] as const;

export type PreparedCheckout =
  | { ok: true; plan: string; checkoutConfiguration?: undefined }
  | { ok: true; checkoutConfiguration: string; plan?: undefined }
  | { ok: false; error: string };

export const planIdFor = (offer: Offer) => {
  const id = process.env[offer.planEnv];
  return id && /^plan_[A-Za-z0-9]+$/.test(id) ? id : undefined;
};

export const whopApiConfigured = () => Boolean(process.env.WHOP_API_KEY && process.env.WHOP_COMPANY_ID);
export const whopEmbedConfigured = (offer: Offer) => Boolean(planIdFor(offer)) || whopApiConfigured();

export async function prepareWhopCheckout(offer: Offer, metadata: GoldenMetadata, returnUrl: string, payLater: boolean): Promise<PreparedCheckout> {
  const planId = planIdFor(offer);
  if (planId && !payLater) return { ok: true, plan: planId };
  if (!whopApiConfigured()) {
    return { ok: false, error: payLater ? "Pay later needs WHOP_API_KEY and WHOP_COMPANY_ID." : `Set ${offer.planEnv} (or WHOP_API_KEY + WHOP_COMPANY_ID) to sell this offer.` };
  }
  const client = new WhopClient({ token: process.env.WHOP_API_KEY! });
  try {
    const config = await client.checkoutConfigurations.create({
      account_id: process.env.WHOP_COMPANY_ID!,
      metadata: { ...metadata },
      redirect_url: returnUrl,
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
      ...(payLater ? { payment_method_configuration: { enabled: [...PAY_LATER_METHODS], include_platform_defaults: true } } : {}),
    });
    return { ok: true, checkoutConfiguration: config.id };
  } catch (err) {
    console.error("[whop] checkout configuration failed", (err as Error).message);
    return { ok: false, error: "Whop couldn't start checkout. Check WHOP_API_KEY and WHOP_COMPANY_ID." };
  }
}
