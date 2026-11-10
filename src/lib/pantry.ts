// Pantry-first matching: how much of a recipe can be made from what's already at home. Pure.

/** Things nearly every kitchen has; they never count as missing. */
const STAPLES = ["salt", "pepper", "water", "oil", "olive oil", "vegetable oil", "sugar", "butter", "flour"];

export const normalise = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();

const singular = (w: string) => w.replace(/(oes|ies)$/, (m) => (m === "ies" ? "y" : "o")).replace(/s$/, "");

/** True when a pantry item covers an ingredient ("chicken" covers "chicken thighs"). */
export function covers(pantryItem: string, ingredient: string): boolean {
  const p = normalise(pantryItem).split(" ").map(singular).join(" ");
  const i = normalise(ingredient).split(" ").map(singular).join(" ");
  return p.length > 1 && (i === p || ` ${i} `.includes(` ${p} `));
}

export const isStaple = (ingredient: string) => STAPLES.some((s) => covers(s, ingredient));

export interface PantryMatch {
  have: string[];
  missing: string[];
  /** 0–1 share of non-staple ingredients already at home. */
  ratio: number;
}

export function pantryMatch(ingredients: string[], pantry: string[]): PantryMatch {
  const needed = ingredients.filter((i) => !isStaple(i));
  const have = needed.filter((i) => pantry.some((p) => covers(p, i)));
  const missing = needed.filter((i) => !have.includes(i));
  return { have, missing, ratio: needed.length ? have.length / needed.length : 0 };
}

// Words people add when describing leftovers that aren't the ingredient itself.
const FILLER = new Set([
  "a", "an", "the", "some", "of", "half", "quarter", "few", "bit", "little", "leftover", "leftovers", "old", "fresh",
  "cup", "cups", "g", "kg", "ml", "l", "lb", "lbs", "oz", "tin", "tins", "can", "cans", "bag", "bunch", "handful",
  "piece", "pieces", "slice", "slices", "clove", "cloves", "pack", "packet", "jar", "my", "in", "fridge", "i", "have", "got",
]);

/**
 * Turns what someone types ("2 eggs, half an onion and some rice\nspinach") into pantry items:
 * ["egg", "onion", "rice", "spinach"]. Quantities and filler words are dropped, duplicates removed.
 */
export function parseFridge(text: string): string[] {
  const items = text
    .toLowerCase()
    .split(/,|;|\n|\band\b|\bplus\b|\+|&/)
    .map((part) => normalise(part).split(" ").filter((w) => w && !FILLER.has(w)).join(" "))
    .filter((p) => p.length > 1);
  return [...new Set(items)];
}

export interface RankedMeal<T> {
  recipe: T;
  match: PantryMatch;
  /** Nothing missing apart from staples: cook it right now. */
  instant: boolean;
}

/** How well a meal clears the fridge: every item used counts, every item to buy costs more. */
export const fridgeScore = (m: PantryMatch) => m.have.length - 1.5 * m.missing.length;

/**
 * Cross-references every recipe with what's in the fridge. Best first: uses the most of what's
 * there while needing the fewest extra items (less waste, no shop), then the highest share covered.
 */
export function rankMeals<T extends { ingredients: string[] }>(recipes: T[], pantry: string[], minRatio = 0.5): RankedMeal<T>[] {
  if (!pantry.length) return [];
  return recipes
    .map((recipe) => {
      const match = pantryMatch(recipe.ingredients, pantry);
      return { recipe, match, instant: match.have.length > 0 && match.missing.length === 0 };
    })
    .filter((m) => m.match.have.length > 0 && m.match.ratio >= minRatio)
    .sort((a, b) => fridgeScore(b.match) - fridgeScore(a.match) || b.match.ratio - a.match.ratio);
}
