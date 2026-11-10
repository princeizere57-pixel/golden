// Search over recipes Golden already has (seed, real-time and the cached TheMealDB library).
// A recipe matches when every word of the query appears in its title, category or ingredients.
// Pure, so it's tested.

import type { Recipe } from "@/lib/types";

const words = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 1);
const stem = (w: string) => w.replace(/(ies)$/, "y").replace(/(es|s)$/, "");

export function matchesQuery(recipe: Pick<Recipe, "title" | "category" | "ingredients">, query: string): boolean {
  const q = words(query).map(stem);
  if (!q.length) return false;
  const hay = new Set(words(`${recipe.title} ${recipe.category} ${recipe.ingredients.map((i) => i.name).join(" ")}`).map(stem));
  return q.every((w) => hay.has(w));
}

/** Local matches first (title matches before ingredient-only matches), then extra results, de-duplicated by slug. */
export function mergeResults(local: Recipe[], query: string, extra: Recipe[]): Recipe[] {
  const titleHit = (r: Recipe) => words(query).map(stem).every((w) => words(r.title).map(stem).includes(w));
  const matched = local.filter((r) => matchesQuery(r, query)).sort((a, b) => Number(titleHit(b)) - Number(titleHit(a)));
  const seen = new Set<string>();
  return [...matched, ...extra].filter((r) => (seen.has(r.slug) ? false : (seen.add(r.slug), true)));
}
