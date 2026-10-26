// Shared domain types for Be a Chef. Every module imports from here.

export const SKILL_LEVELS = ["beginner", "intermediate", "chef"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export type Plan = "free" | "premium";

/** Billing entity a customer is routed to (see src/lib/billing/routing.ts). */
export type BillingEntity = "us" | "uk";

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: "g" | "ml" | "tsp" | "tbsp" | "cup" | "pc" | "pinch";
  /** Prep note, e.g. "finely diced". */
  prep?: string;
}

/** Attention a block needs: active blocks need the cook's hands; passive ones run on their own. */
export type Attention = "active" | "passive";

interface BlockBase {
  id: string;
  /** Plain, level-neutral description of the step. The skill engine rewrites it. */
  text: string;
  /** Minutes this block takes. */
  minutes: number;
  attention: Attention;
  /** Sensory cue that tells a beginner the step is done. */
  cue?: string;
  /** Technique or chemistry note for chefs. */
  science?: string;
  /** Jargon used in the step, with plain definitions. */
  terms?: Record<string, string>;
}

/** OneKit-style atomic blocks. */
export interface IngredientPrepBlock extends BlockBase {
  kind: "prep";
  ingredientIds: string[];
}

export interface HeatControlBlock extends BlockBase {
  kind: "heat";
  heat: "low" | "medium-low" | "medium" | "medium-high" | "high";
  vessel: string;
}

export interface TimingBlock extends BlockBase {
  kind: "timing";
  /** Shown on the countdown. */
  timerLabel: string;
}

export type StepBlock = IngredientPrepBlock | HeatControlBlock | TimingBlock;

/** Named colour pair for a card or banner (Mob's "colourways", as tokens). */
export type Colourway = "tomato" | "basil" | "saffron" | "aubergine" | "charcoal";

export interface Recipe {
  slug: string;
  title: string;
  summary: string;
  chef: string;
  category: string;
  dietary: string[];
  serves: number;
  colourway: Colourway;
  /** Optional muted loop for the discovery card. */
  video?: string;
  /** Poster/still image. */
  image?: string;
  premium: boolean;
  ingredients: Ingredient[];
  blocks: StepBlock[];
}

/** A recipe step after the skill engine has adapted it. */
export interface AdaptedStep {
  blockId: string;
  kind: StepBlock["kind"];
  /** One or more instructions (beginners get several micro-steps). */
  instructions: string[];
  minutes: number;
  attention: Attention;
  timerLabel?: string;
  /** Beginner: jargon definitions. Chef: technique notes. */
  notes: string[];
}

export interface AdaptedRecipe {
  slug: string;
  skill: SkillLevel;
  steps: AdaptedStep[];
  /** Where the text came from: the AI rewrite or the deterministic engine. */
  source: "ai" | "engine";
}

/** Who sees a segment or piece of content (Mob's visibility rules, extended with skill). */
export interface Visibility {
  plans?: Plan[];
  skills?: SkillLevel[];
}

/** Home-page building block (Mob's "segments"). */
export type Segment =
  | { id: string; type: "rail"; heading: string; filter: RailFilter; visibility?: Visibility }
  | { id: string; type: "newRecipes"; heading: string; limit: number; visibility?: Visibility }
  | { id: string; type: "continueCooking"; heading: string; visibility?: Visibility }
  | { id: string; type: "premiumPromo"; heading: string; visibility?: Visibility };

export interface RailFilter {
  category?: string;
  dietary?: string;
  maxActiveMinutes?: number;
  chef?: string;
}

export interface Viewer {
  plan: Plan;
  skill: SkillLevel;
}
