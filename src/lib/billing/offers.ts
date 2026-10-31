// Golden's offers: one source of truth for the checkout page, Whop metadata and the webhook.
// Core prices come from our plan ($45/year with a 7-day trial, $7.99/month). Upsell prices are
// starting points: change them here and in the matching Whop plan together.

export type OfferId = "year" | "month" | "lifetime" | "gift";

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
    name: "Golden Yearly",
    tagline: "Pays for itself in 2–3 rescued dinners",
    planType: "renewal",
    price: 45,
    billingPeriodDays: 365,
    trialDays: 7,
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
    trialDays: 7,
    planEnv: "WHOP_PLAN_MONTH",
    kind: "core",
    includes: CORE_FEATURES,
  },
  {
    id: "lifetime",
    name: "Golden for Life",
    tagline: "One payment, every future update, never renew",
    planType: "one_time",
    price: 99,
    trialDays: 0,
    planEnv: "WHOP_PLAN_LIFETIME",
    kind: "upsell",
    badge: "Upgrade",
    includes: ["Everything in Yearly, forever", "Priority access to new Chef-level masterclasses", "Founding Member badge in the community"],
  },
  {
    id: "gift",
    name: "Gift a Year",
    tagline: "Bring a friend along: they get a full year of Golden",
    planType: "one_time",
    price: 45,
    trialDays: 0,
    planEnv: "WHOP_PLAN_GIFT",
    kind: "upsell",
    includes: ["A year of Golden for someone you cook with", "Cook together: share progress in the community"],
  },
];

export const offerById = (id: string): Offer | undefined => OFFERS.find((o) => o.id === id);

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
