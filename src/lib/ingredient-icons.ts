// Ingredient pictures from TheMealDB's free ingredient image library (consistent product shots).

import type { Ingredient } from "@/lib/types";

const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

/** Picture URL for an ingredient: TheMealDB's own name when we have it, else a best guess from the name. */
export function ingredientIconUrl(ing: Pick<Ingredient, "icon" | "name">, size: "Small" | "Medium" = "Small"): string {
  const name = ing.icon ?? titleCase(ing.name.replace(/\b(large|small|medium|fresh|chopped|sliced|diced|minced)\b/gi, "").replace(/\s+/g, " ").trim());
  return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(name)}-${size}.png`;
}
