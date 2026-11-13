// Ingredient pictures from TheMealDB's free ingredient image library (consistent product shots).

import type { Ingredient } from "@/lib/types";

const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

/** Picture URL for an ingredient: TheMealDB's own name when we have it, else a best guess from the name. */
export function ingredientIconUrl(ing: Pick<Ingredient, "icon" | "name">, size: "Small" | "Medium" = "Small"): string {
  const name = ing.icon ?? titleCase(ing.name.replace(/\b(large|small|medium|fresh|chopped|sliced|diced|minced)\b/gi, "").replace(/\s+/g, " ").trim());
  return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(name)}-${size}.png`;
}

const words = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter((w) => w.length > 2);
const singular = (w: string) => w.replace(/(ies)$/, "y").replace(/(oes)$/, "o").replace(/s$/, "");

/**
 * The ingredients a step mentions, for step pictures in cook mode. Prep blocks list their
 * ingredients; otherwise an ingredient matches when its main word appears in the step text.
 */
export function ingredientsInStep(ingredients: Ingredient[], text: string, ids: string[] = []): Ingredient[] {
  if (ids.length) return ingredients.filter((i) => ids.includes(i.id));
  const stepWords = new Set(words(text).map(singular));
  return ingredients.filter((i) => {
    const name = words(i.icon ?? i.name).map(singular);
    const head = name[name.length - 1];
    return Boolean(head) && stepWords.has(head);
  });
}
