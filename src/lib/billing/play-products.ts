// Google Play subscriptions that match Golden's offers (src/lib/billing/offers.ts). Create these in
// the Play Console under Monetize → Subscriptions with exactly these IDs: one product per offer,
// a yearly auto-renewing base plan, and a "free trial" offer of 5 days on it.
//
// Pure helpers only (no network), shared by the checkout page and the server.

import type { OfferId } from "@/lib/billing/offers";

export interface PlayProduct {
  offer: OfferId;
  productId: string;
  basePlanId: string;
}

export const PLAY_PRODUCTS: PlayProduct[] = [
  { offer: "executive", productId: "golden_executive", basePlanId: "yearly" },
  { offer: "experience", productId: "golden_experience", basePlanId: "yearly" },
];

export const playProductFor = (offer: string) => PLAY_PRODUCTS.find((p) => p.offer === offer);
export const offerForPlayProduct = (productId: string) => PLAY_PRODUCTS.find((p) => p.productId === productId)?.offer;

/** One pricing phase as the Billing Library reports it (prices are in micros). */
export interface PlayPhase {
  formattedPrice: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  /** ISO 8601 period, e.g. P3D, P1W, P1M, P1Y. */
  billingPeriod: string;
  /** 1 = infinite recurring, 2 = finite recurring, 3 = non-recurring. */
  recurrenceMode: number;
  billingCycleCount: number;
}

export interface PlayOffer {
  basePlanId: string;
  offerId?: string | null;
  offerToken: string;
  phases: PlayPhase[];
}

export interface PlayProductDetails {
  productId: string;
  title?: string;
  offers: PlayOffer[];
}

/**
 * The offer to buy: Play only returns offers this user is eligible for, so prefer one that starts
 * with a free phase (the 5-day trial), otherwise the plain base plan.
 */
export function pickPlayOffer(details: PlayProductDetails, basePlanId: string): PlayOffer | undefined {
  const onPlan = details.offers.filter((o) => o.basePlanId === basePlanId);
  return onPlan.find((o) => o.phases[0]?.priceAmountMicros === 0) ?? onPlan.find((o) => !o.offerId) ?? onPlan[0];
}

const PERIOD: Record<string, [string, string]> = { D: ["day", "days"], W: ["week", "weeks"], M: ["month", "months"], Y: ["year", "years"] };

/** "P3D" → "3 days", "P1Y" → "year" (singular periods read as "per year"). */
export function periodLabel(iso: string, perUnit = false): string {
  const m = /^P(\d+)([DWMY])$/.exec(iso);
  if (!m) return iso;
  const n = Number(m[1]);
  const [one, many] = PERIOD[m[2]];
  if (perUnit && n === 1) return one;
  return `${n} ${n === 1 ? one : many}`;
}

/** Google Play's own price text for an offer, e.g. "5 days free, then US$100.00/year". */
export function describePlayOffer(offer: PlayOffer): string {
  const recurring = offer.phases.find((p) => p.recurrenceMode === 1) ?? offer.phases[offer.phases.length - 1];
  if (!recurring) return "";
  const then = `${recurring.formattedPrice}/${periodLabel(recurring.billingPeriod, true)}`;
  const trial = offer.phases.find((p) => p !== recurring && p.priceAmountMicros === 0);
  return trial ? `${periodLabel(trial.billingPeriod)} free, then ${then}` : then;
}
