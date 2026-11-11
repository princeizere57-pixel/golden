// Golden's offers: one source of truth for the landing page, checkout, Whop metadata and the webhook.
//
// The money model (Grand Slam Offer):
// - Attraction offer: the free 5-Day Zero-Waste Cooking Challenge (the trial on both plans). Every
//   feature is unlocked during it, whichever plan was chosen; the chosen plan is charged after.
// - Decoy offer: The Golden Experience, $50/year.
// - Grand Slam offer: the Golden Executive Chef System, $100/year founding price (regular $500/year)
//   for the first FOUNDING_SPOTS members during the launch window, backed by the
//   "10 Perfect Dishes" money-back guarantee.
//
// Whop plans (each with the 5-day free trial): Executive plan_EJWuPToHk9nUw, Experience
// plan_2Tozpw2x8yzvn (`whopPlan` below). WHOP_PLAN_EXECUTIVE / WHOP_PLAN_EXPERIENCE override them;
// with neither, Golden creates the plan inline from these numbers (needs WHOP_API_KEY).

export type OfferId = "executive" | "experience";

export interface Offer {
  id: OfferId;
  name: string;
  tagline: string;
  /** Whop plan type: "renewal" = subscription, "one_time" = single payment. */
  planType: "renewal" | "one_time";
  /** USD; charged after the trial for renewals. */
  price: number;
  /** USD regular price after the founding window, shown struck through. */
  regularPrice?: number;
  billingPeriodDays?: number;
  trialDays: number;
  /** Env var that can override the Whop plan ID (plan_…). */
  planEnv: string;
  /** The Whop plan sold for this offer (5-day free trial, then the yearly price). */
  whopPlan?: string;
  kind: "core" | "upsell";
  badge?: string;
  includes: string[];
  /** What this plan leaves out (shown on the decoy so the comparison is honest). */
  excludes?: string[];
}

/** The founding launch: limited spots and a fixed end date (override with LAUNCH_ENDS_AT). */
export const FOUNDING_SPOTS = 500;
/** Two weeks from the founding launch (fixed, the same for everyone; never resets). */
export const LAUNCH_ENDS_AT = process.env.NEXT_PUBLIC_LAUNCH_ENDS_AT || "2026-11-25T23:59:59Z";

export const GUARANTEE = {
  name: "10 Perfect Dishes Money-Back Guarantee",
  dishes: 10,
  days: 60,
};

export const ATTRACTION = {
  name: "5-Day Zero-Waste Cooking Challenge",
  price: 0,
  days: 5,
};

/**
 * What each plan gets you, one line each: the problem it ends, the value you get instead, then the
 * feature that does it in brackets (rendered quieter on checkout and the landing).
 */
export const EXECUTIVE_FEATURES = [
  "No more cold sides and juggling: every dish hot at the same minute (Multi-Dish Timing Orchestrator)",
  "No more binning a ruined dinner: burnt, salty or split, saved in seconds (Fix My Mistake)",
  "No more food going off in the fridge: tonight's dinner from what you have (Pantry-to-Plate)",
  "No more pricey takeaways: Chinese, Korean and Italian you nail at home (Technique Modules)",
  "No more recipes that lose you halfway: steps written for your level (Skill-Adaptation Engine)",
  "No more wasted shopping: cook hands-free and buy only what you'll use (Cook Mode + Smart Shopping List)",
  "No risk: cook 10 perfect dishes or get your money back (10 Perfect Dishes Guarantee)",
];

export const OFFERS: Offer[] = [
  {
    id: "executive",
    name: "Golden Executive Chef System",
    tagline: "Founding price, 80% off. Just $8.33 a month, billed yearly",
    planType: "renewal",
    price: 100,
    regularPrice: 500,
    billingPeriodDays: 365,
    trialDays: ATTRACTION.days,
    planEnv: "WHOP_PLAN_EXECUTIVE",
    whopPlan: "plan_EJWuPToHk9nUw",
    kind: "core",
    badge: "80% off",
    includes: EXECUTIVE_FEATURES,
  },
  {
    id: "experience",
    name: "The Golden Experience",
    tagline: "Skill-adapted recipes and cook mode, one dish at a time",
    planType: "renewal",
    price: 50,
    billingPeriodDays: 365,
    trialDays: ATTRACTION.days,
    planEnv: "WHOP_PLAN_EXPERIENCE",
    whopPlan: "plan_2Tozpw2x8yzvn",
    kind: "core",
    includes: [
      "No more recipes that lose you halfway: steps written for your level (Skill-Adaptation Engine)",
      "No more burnt or forgotten timings: one step at a time, timers running for you (Cook Mode)",
      "No more wasted shopping: buy only what you'll use, with tips from better cooks (Smart Shopping List + Community)",
    ],
    excludes: ["Multi-Dish Timing Orchestrator", "'Fix My Mistake' AI Doctor", "Pantry-to-Plate Matcher", "Cuisine technique modules", "Money-back guarantee"],
  },
];

export const offerById = (id: string): Offer | undefined => OFFERS.find((o) => o.id === id);
export const DEFAULT_OFFER: OfferId = "executive";

/** Shortest free trial across offers, for headlines like "5 days free". */
export const TRIAL_HEADLINE_DAYS = Math.min(...OFFERS.map((o) => o.trialDays));

export const money = (n: number) => `$${n % 1 ? n.toFixed(2) : n}`;
/** Monthly equivalent: yearly plans divide by 12 ($100/year → $8.33). */
export const perMonth = (o: Offer) => money(Math.round((o.billingPeriodDays === 365 ? o.price / 12 : o.price) * 100) / 100);
export const percentOff = (o: Offer) => (o.regularPrice ? Math.round((1 - o.price / o.regularPrice) * 100) : 0);

export function priceLine(o: Offer): string {
  if (o.planType === "one_time") return `${money(o.price)} once`;
  const per = o.billingPeriodDays === 365 ? "year" : "month";
  return o.trialDays ? `${o.trialDays} days free, then ${money(o.price)}/${per}` : `${money(o.price)}/${per}`;
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
