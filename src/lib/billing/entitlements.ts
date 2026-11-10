// What each plan unlocks. One table, used by every page, server action and the account screen,
// so the app always matches what the buyer saw on checkout (src/lib/billing/offers.ts).
//
// - Free trial (the 5-Day Zero-Waste Challenge): every feature below, whichever plan was chosen,
//   so people feel the full value before paying. Afterwards the chosen plan decides.
// - Free (no plan, or the trial not started): browse, read every free recipe at your level, save
//   recipes, import a recipe from a link.
// - The Golden Experience: + hands-free cook mode with timers, Plan a meal for one dish at a time,
//   the smart shopping list, the community and Premium recipes.
// - Golden Executive Chef System: everything, + the Multi-Dish Timing Orchestrator (2–4 dishes),
//   Fix My Mistake, Pantry-to-Plate, the cuisine technique modules and recipes written by Golden AI.
//
// Pure: no cookies or network here, so it is unit-tested.

import type { OfferId } from "@/lib/billing/offers";

export type Tier = "free" | OfferId;

export type Feature =
  | "cookMode"
  | "singleDishPlan"
  | "shoppingList"
  | "community"
  | "premiumRecipes"
  | "multiDish"
  | "fixMyMistake"
  | "pantry"
  | "modules"
  | "recipeWriter";

const EXPERIENCE: Feature[] = ["cookMode", "singleDishPlan", "shoppingList", "community", "premiumRecipes"];
const EXECUTIVE: Feature[] = [...EXPERIENCE, "multiDish", "fixMyMistake", "pantry", "modules", "recipeWriter"];

const FEATURES: Record<Tier, readonly Feature[]> = { free: [], experience: EXPERIENCE, executive: EXECUTIVE };

const RANK: Record<Tier, number> = { free: 0, experience: 1, executive: 2 };

export const can = (tier: Tier, feature: Feature): boolean => FEATURES[tier].includes(feature);

/** The cheapest plan that includes a feature (what a locked screen offers). */
export const planFor = (feature: Feature): OfferId => (EXPERIENCE.includes(feature) ? "experience" : "executive");

/** The best of several plans (someone can hold more than one subscription). */
export const bestTier = (tiers: Tier[]): Tier => tiers.reduce<Tier>((best, t) => (RANK[t] > RANK[best] ? t : best), "free");

export const isPaid = (tier: Tier) => tier !== "free";

export const TIER_NAME: Record<Tier, string> = {
  free: "Free",
  experience: "The Golden Experience",
  executive: "Golden Executive Chef System",
};

/**
 * What someone can use, given the plan they chose and whether their free days are running:
 * everything during the trial, then exactly their plan.
 */
export interface Access {
  /** What the app unlocks right now. */
  tier: Tier;
  /** The plan they chose (charged when the trial ends). */
  plan: Tier;
  /** Free days running: everything is unlocked. */
  trial: boolean;
  /** When the free days end (ms since epoch), when known. */
  trialEndsAt?: number;
}

export const accessFor = (plan: Tier, trial: boolean, trialEndsAt?: number): Access => ({
  tier: trial && plan !== "free" ? "executive" : plan,
  plan,
  trial: trial && plan !== "free",
  ...(trial && trialEndsAt ? { trialEndsAt } : {}),
});

/** The signed plan cookie: "experience", or "experience~<trial end ms>" while the free days run. */
export const planCookieValue = (plan: Tier, trialEndsAt?: number) => (trialEndsAt && plan !== "free" ? `${plan}~${Math.round(trialEndsAt)}` : plan);

export function accessFromCookie(value: string | null | undefined, now = Date.now()): Access {
  const [p, end] = String(value ?? "").split("~");
  const plan = parseTier(p);
  const ends = Number(end);
  return accessFor(plan, Number.isFinite(ends) && ends > now, ends);
}

/** Reads a plan cookie or column value. "premium" (older cookies and rows) means Executive. */
export function parseTier(value: unknown): Tier {
  if (value === "executive" || value === "premium") return "executive";
  if (value === "experience") return "experience";
  return "free";
}

/** Short names for locked screens: "Part of Executive". */
export const SHORT_NAME: Record<OfferId, string> = { executive: "Executive", experience: "Experience" };

/** What a locked screen says about each feature. */
export const LOCKED_COPY: Record<Feature, { title: string; text: string }> = {
  cookMode: { title: "Cook mode is on a plan", text: "One big step at a time, timers that keep running, and the screen stays awake while you cook." },
  singleDishPlan: { title: "Plan a meal is on a plan", text: "Video, ingredients, a timed plan with chimes and the method at your level, all on one page." },
  shoppingList: { title: "Your shopping list is on a plan", text: "Golden adds what each recipe needs and skips what's already in your pantry, so you only buy what you'll use." },
  community: { title: "The community is on a plan", text: "Share what you cooked and get tips from cooks a level above you." },
  premiumRecipes: { title: "This recipe is on a plan", text: "Start your free days to cook it step by step at your level." },
  multiDish: { title: "Cook several dishes at once", text: "The Multi-Dish Timing Orchestrator staggers up to 4 dishes so they all finish hot at the same minute." },
  fixMyMistake: { title: "Fix My Mistake", text: "Too salty, split, burnt or too thin? Get the exact rescue for your dish, from a photo or a tap." },
  pantry: { title: "Pantry-to-Plate", text: "Tell Golden what's in your fridge and get a meal that uses it up before it goes off." },
  modules: { title: "Cuisine technique modules", text: "Chinese, Korean and Italian techniques, taught step by step at your level." },
  recipeWriter: { title: "Golden can write this recipe", text: "On Executive, Golden writes an original recipe for any dish you search for, ready for cook mode." },
};
