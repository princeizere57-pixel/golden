// TheMealDB API (https://www.themealdb.com/api.php). Server-only, cached for a day.
// The shared test key "1" is for development; public releases need a supporter key.

import "server-only";
import { cachedMeal } from "@/lib/mealdb/cache";
import { MEALDB_PREFIX, mealToRecipe, type Meal, type MealSummary } from "@/lib/mealdb/convert";
import type { Recipe } from "@/lib/types";

const BASE = "https://www.themealdb.com/api/json/v1";
const DAY = 60 * 60 * 24;

async function get<T>(path: string): Promise<T | null> {
  const key = process.env.MEALDB_API_KEY || "1";
  try {
    const res = await fetch(`${BASE}/${key}/${path}`, { next: { revalidate: DAY }, signal: AbortSignal.timeout(20_000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function mealCategories(): Promise<string[]> {
  const data = await get<{ categories?: Array<{ strCategory: string }> }>("categories.php");
  return data?.categories?.map((c) => c.strCategory) ?? [];
}

export async function mealsByCategory(category: string): Promise<MealSummary[]> {
  const data = await get<{ meals?: MealSummary[] | null }>(`filter.php?c=${encodeURIComponent(category)}`);
  return data?.meals ?? [];
}

export async function searchMeals(query: string): Promise<MealSummary[]> {
  const data = await get<{ meals?: Meal[] | null }>(`search.php?s=${encodeURIComponent(query)}`);
  return (data?.meals ?? []).map(({ idMeal, strMeal, strMealThumb }) => ({ idMeal, strMeal, strMealThumb: strMealThumb ?? "" }));
}

export async function mealRecipe(id: string): Promise<Recipe | null> {
  if (!/^\d+$/.test(id)) return null;
  const cached = cachedMeal(id);
  if (cached) return mealToRecipe(cached);
  const data = await get<{ meals?: Meal[] | null }>(`lookup.php?i=${id}`);
  const meal = data?.meals?.[0];
  return meal ? mealToRecipe(meal) : null;
}

/** Runs `fn` over items with at most `limit` in flight. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

/** Full recipes for a category (each lookup is cached for a day). Meals that fail to load are skipped. */
export async function categoryRecipes(category: string): Promise<Recipe[]> {
  const summaries = await mealsByCategory(category);
  const recipes = await mapLimit(summaries, 8, (s) => mealRecipe(s.idMeal));
  return recipes.filter((r): r is Recipe => r !== null);
}

/** Full recipes matching a search (search.php already returns full meals). */
export async function searchRecipes(query: string): Promise<Recipe[]> {
  const data = await get<{ meals?: Meal[] | null }>(`search.php?s=${encodeURIComponent(query)}`);
  return (data?.meals ?? []).map(mealToRecipe).filter((r): r is Recipe => r !== null);
}

/** Seed recipe or TheMealDB recipe, by slug. */
export async function findRecipe(slug: string, seed: (slug: string) => Recipe | undefined): Promise<Recipe | undefined> {
  return seed(slug) ?? (slug.startsWith(MEALDB_PREFIX) ? (await mealRecipe(slug.slice(MEALDB_PREFIX.length))) ?? undefined : undefined);
}
