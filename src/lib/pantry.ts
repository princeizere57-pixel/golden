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
