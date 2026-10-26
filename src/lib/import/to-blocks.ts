// Turns an imported recipe's plain steps into OneKit blocks the skill engine can adapt:
// detects heat, timings, hands-off steps, doneness cues and jargon worth defining.

import type { Colourway, HeatControlBlock, Ingredient, Recipe, StepBlock } from "@/lib/types";
import type { ImportedRecipe } from "@/lib/import/parse";

/** Plain definitions shown to beginners when a step uses the term. */
export const GLOSSARY: Record<string, string> = {
  "al dente": "cooked but still firm to the bite",
  blanch: "boil briefly, then cool quickly in cold water",
  braise: "brown, then cook slowly in a little liquid with the lid on",
  deglaze: "add liquid to a hot pan and scrape up the browned bits",
  emulsify: "blend fat and water into one smooth sauce",
  fold: "mix gently with a scooping motion so you keep the air in",
  julienne: "cut into thin matchsticks",
  knead: "push, fold and turn dough until smooth and stretchy",
  reduce: "simmer uncovered so liquid evaporates and the flavour concentrates",
  sauté: "cook quickly in a little fat over fairly high heat, moving it often",
  sear: "brown the surface over high heat without moving it",
  simmer: "small, gentle bubbles, not a full boil",
  whisk: "beat quickly to mix in air or combine smoothly",
  zest: "the thin coloured outer layer of citrus peel, finely grated",
};

const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };
const UNITS: Record<string, [Ingredient["unit"], number]> = {
  g: ["g", 1], gram: ["g", 1], grams: ["g", 1], kg: ["g", 1000],
  ml: ["ml", 1], l: ["ml", 1000], litre: ["ml", 1000], litres: ["ml", 1000], liter: ["ml", 1000],
  tsp: ["tsp", 1], teaspoon: ["tsp", 1], teaspoons: ["tsp", 1],
  tbsp: ["tbsp", 1], tablespoon: ["tbsp", 1], tablespoons: ["tbsp", 1],
  cup: ["cup", 1], cups: ["cup", 1], pinch: ["pinch", 1],
};

function amount(token: string): number {
  if (token in FRACTIONS) return FRACTIONS[token];
  const mixed = token.match(/^(\d+)([½¼¾⅓⅔])$/);
  if (mixed) return Number(mixed[1]) + FRACTIONS[mixed[2]];
  if (token.includes("/")) {
    const [a, b] = token.split("/").map(Number);
    return b ? a / b : NaN;
  }
  return Number(token.replace(",", "."));
}

/** "200g spaghetti, cooked" → { quantity: 200, unit: "g", name: "spaghetti", prep: "cooked" }. */
export function parseIngredient(line: string, index: number): Ingredient {
  const m = line.match(/^(\d+[½¼¾⅓⅔]|\d+(?:[.,]\d+)?|\d+\/\d+|[½¼¾⅓⅔])\s*([a-zA-Z]+\.?)?\s+(.+)$/);
  const base = { id: `i${index}`, raw: line };
  if (!m) return { ...base, name: line, quantity: 0, unit: "pc" };
  const qty = amount(m[1]);
  const unitWord = m[2]?.toLowerCase().replace(/\.$/, "");
  const unit = unitWord ? UNITS[unitWord] : undefined;
  const rest = unit || !unitWord ? m[3] : `${m[2]} ${m[3]}`;
  const [name, ...prep] = rest.split(",");
  return {
    ...base,
    name: name.trim(),
    quantity: Number.isFinite(qty) ? Math.round(qty * (unit?.[1] ?? 1) * 100) / 100 : 0,
    unit: unit?.[0] ?? "pc",
    prep: prep.join(",").trim() || undefined,
  };
}

/** Total explicit time in a step, in minutes (upper bound of each range), or null. */
export function stepMinutes(text: string): number | null {
  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/gi)];
  if (!matches.length) return null;
  const total = matches.reduce((sum, m) => {
    const n = Number(m[2] ?? m[1]);
    const unit = m[3].toLowerCase();
    return sum + (unit.startsWith("h") ? n * 60 : unit.startsWith("s") ? n / 60 : n);
  }, 0);
  return Math.max(0.5, Math.round(total * 10) / 10);
}

const HEAT = /\b(medium-high|medium-low|high|medium|low)(?:\s+to\s+(?:medium|high|low))?\s+heat\b/i;
const COOKING = /\b(fry|sauté|saute|sear|boil|simmer|bake|roast|grill|toast|brown|heat)\b/i;
const OVEN = /\b(oven|bake|roast)\b/i;
const BOIL = /\bboil/i;
const VESSEL = /\b(frying pan|saucepan|skillet|wok|casserole|dutch oven|stockpot|pot|roasting tin|baking tray|tray)\b/i;
const HANDS_OFF = /\b(simmer|bake|roast|rest|marinate|chill|leave|set aside|cool|prove|rise|boil|cook for|soak)/i;

export function stepToBlock(text: string, index: number): StepBlock {
  const explicit = stepMinutes(text);
  const minutes = explicit ?? Math.max(1, Math.round(text.split(/\s+/).length / 12));
  const passive = explicit !== null && explicit >= 5 && HANDS_OFF.test(text);
  const cue = text.match(/\buntil ([^.;]+)/i)?.[1]?.trim();
  const terms = Object.fromEntries(Object.entries(GLOSSARY).filter(([term]) => new RegExp(`\\b${term}`, "i").test(text)));
  const base = {
    id: `s${index}`,
    text,
    minutes,
    attention: passive ? ("passive" as const) : ("active" as const),
    cue,
    terms: Object.keys(terms).length ? terms : undefined,
  };
  if (passive) return { ...base, kind: "timing", timerLabel: `Step ${index + 1}` };
  const heat = text.match(HEAT)?.[1]?.toLowerCase() as HeatControlBlock["heat"] | undefined;
  if (heat || COOKING.test(text)) {
    const vessel = OVEN.test(text) ? "oven" : (text.match(VESSEL)?.[1]?.toLowerCase() ?? "pan");
    return { ...base, kind: "heat", heat: heat ?? (OVEN.test(text) || BOIL.test(text) ? "high" : "medium"), vessel };
  }
  return { ...base, kind: "prep", ingredientIds: [] };
}

const COLOURWAYS: Colourway[] = ["tomato", "basil", "saffron", "aubergine", "charcoal"];

/** Stable colourway for a title. */
export function colourwayFor(title: string): Colourway {
  return COLOURWAYS[[...title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % COLOURWAYS.length];
}

/** Builds a private Recipe from an import. It's never added to the public catalogue. */
export function toRecipe(imported: ImportedRecipe, id: string): Recipe {
  return {
    slug: `my-${id}`,
    title: imported.title,
    summary: imported.summary,
    chef: imported.author ?? imported.sourceName,
    category: "My imports",
    dietary: [],
    serves: imported.serves,
    colourway: colourwayFor(imported.title),
    premium: false,
    ingredients: imported.ingredients.map(parseIngredient),
    blocks: imported.steps.map(stepToBlock),
    // The source's own photo URL, displayed from their server. Never downloaded or re-hosted.
    image: imported.image?.startsWith("https://") ? imported.image : undefined,
    source: { url: imported.sourceUrl, name: imported.sourceName },
  };
}
