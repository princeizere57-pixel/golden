// Golden's offers: one source of truth for the checkout page, Whop metadata and the webhook.
// Prices and trials match the plans configured in Whop (WHOP_PLAN_YEAR, WHOP_PLAN_MONTH):
// keep the two in sync when either changes.

export type OfferId = "year" | "month";

export interface Offer {
  id: OfferId;
  name: string;
  tagline: string;
  /** Whop plan type: "renewal" = subscription, "one_time" = single payment. */
  planType: "renewal" | "one_time";
  /** USD; charged after the trial for renewals. */
  price: number;
  billingPeriodDays?: number;
  trialDays: number;
  /** Env var holding the Whop plan ID (plan_…) created in the dashboard. */
  planEnv: string;
  kind: "core" | "upsell";
  badge?: string;
  includes: string[];
}

const CORE_FEATURES = [
  "Every recipe rewritten for your level (Beginner → Intermediate → Chef)",
  "Fix My Mistake: rescue sauces, steaks and seasoning in real time",
  "Multi-dish timing so everything finishes hot together",
  "Hands-free cook mode with timers, chimes and vibration",
  "Pantry-first recipes and smart shopping lists",
];

export const OFFERS: Offer[] = [
  {
    id: "year",
    name: "Golden Year",
    tagline: "Just $3.76 a month, billed once a year",
    planType: "renewal",
    price: 45.09,
    billingPeriodDays: 365,
    trialDays: 3,
    planEnv: "WHOP_PLAN_YEAR",
    kind: "core",
    badge: "Best value",
    includes: CORE_FEATURES,
  },
  {
    id: "month",
    name: "Golden Monthly",
    tagline: "Try the full kitchen coach, cancel any time",
    planType: "renewal",
    price: 7.99,
    billingPeriodDays: 30,
    trialDays: 3,
    planEnv: "WHOP_PLAN_MONTH",
    kind: "core",
    includes: CORE_FEATURES,
  },
];

export const offerById = (id: string): Offer | undefined => OFFERS.find((o) => o.id === id);

/** Shortest free trial across offers, for headlines like "3 days free". */
export const TRIAL_HEADLINE_DAYS = Math.min(...OFFERS.map((o) => o.trialDays));
export const LOWEST_PRICE = Math.min(...OFFERS.map((o) => o.price));

export function priceLine(o: Offer): string {
  const money = `$${o.price % 1 ? o.price.toFixed(2) : o.price}`;
  if (o.planType === "one_time") return `${money} once`;
  const per = o.billingPeriodDays === 365 ? "year" : "month";
  return o.trialDays ? `${o.trialDays} days free, then ${money}/${per}` : `${money}/${per}`;
}

/** Order IDs we attach to every Whop checkout (and see again in webhooks). */
export function newOrderId(): string {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("");
  return `gld_${Date.now().toString(36)}_${rand}`;
}

/** Metadata Golden needs back from Whop to grant access to the right person. */
export interface GoldenMetadata {
  order_id: string;
  golden_user_id: string;
  offer: OfferId;
  referred_by?: string;
}
