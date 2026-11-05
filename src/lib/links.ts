import type { Recipe } from "@/lib/types";

/** Where a recipe lives: seed recipes, TheMealDB meals and private imports have different routes. */
export function recipeHref(recipe: Pick<Recipe, "slug">): string {
  if (recipe.slug.startsWith("mealdb-")) return `/meals/${recipe.slug.slice("mealdb-".length)}`;
  if (recipe.slug.startsWith("my-")) return `/my/${recipe.slug}`;
  return `/recipes/${recipe.slug}`;
}

export const totalMinutes = (recipe: Pick<Recipe, "blocks">) => Math.round(recipe.blocks.reduce((sum, b) => sum + b.minutes, 0));

/** "45 mins", "1 hr", "1 hr 10 mins". */
export function formatDuration(minutes: number): string {
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m} mins`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} hr ${rest} mins` : `${h} hr`;
}

/** A "back" address from the query string, accepted only when it points inside the meal plan. */
export const safePlanBack = (back: string | undefined) => (back && /^\/plan(\?[\w%=&.-]*)?$/.test(back) ? back : undefined);

/** Meal plans hold up to this many dishes. */
export const MAX_DISHES = 4;

/** Address of a meal plan, optionally opened on one dish. */
export const planHref = (slugs: string[], active?: string) =>
  `/plan?${slugs.map((s) => `dish=${encodeURIComponent(s)}`).join("&")}${active ? `&active=${encodeURIComponent(active)}` : ""}`;
