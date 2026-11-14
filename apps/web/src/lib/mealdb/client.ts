// Library meals: our API first (its mealdb_meals table mirrors TheMealDB nightly), TheMealDB itself
// as the fallback. Server-only, cached. With a supporter key (MEALDB_API_KEY) TheMealDB answers on
// V2; without one, the shared V1 test key "1", which is for development only.

import "server-only";
import { apiOrigin } from "@/lib/api-origin";
import { cachedMeal } from "@/lib/mealdb/cache";
import { MEALDB_PREFIX, fromCached, mealToRecipe, type CachedMeal, type Meal, type MealSummary } from "@/lib/mealdb/convert";
import type { Recipe } from "@/lib/types";

const DAY = 60 * 60 * 24;

/** Our API's copy of the library; null when it can't be reached (callers then ask TheMealDB). */
async function ours<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${apiOrigin()}${path}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8_000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}
const toRecipes = (meals: CachedMeal[]) => meals.map((m) => mealToRecipe(fromCached(m))).filter((r): r is Recipe => r !== null && Boolean(r.image));

/** "https://www.themealdb.com/api/json/v2/<key>" with a supporter key, else the V1 test key. */
export function mealdbBase(key = process.env.MEALDB_API_KEY?.trim()): string {
  return key ? `https://www.themealdb.com/api/json/v2/${key}` : "https://www.themealdb.com/api/json/v1/1";
}

async function fetchJson<T>(base: string, path: string): Promise<T | null> {
  try {
    const res = await fetch(`${base}/${path}`, { next: { revalidate: DAY }, signal: AbortSignal.timeout(20_000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Addresses to try for the supporter key, in order (same list as scripts/seed-mealdb.mts). */
function bases(): string[] {
  const key = process.env.MEALDB_API_KEY?.trim();
  if (!key) return [mealdbBase("")];
  return [mealdbBase(key), `https://www.themealdb.com/${key}/json/v2`, `https://www.themealdb.com/api/json/v1/${key}`, mealdbBase("")];
}

/** The first address that answered, remembered for this server instance. */
let working: string | undefined;

/** The supporter key on whichever address TheMealDB accepts it; the V1 test key if none does. */
async function get<T>(path: string): Promise<T | null> {
  if (working) {
    const data = await fetchJson<T>(working, path);
    if (data !== null) return data;
  }
  for (const base of bases()) {
    if (base === working) continue;
    const data = await fetchJson<T>(base, path);
    if (data !== null) {
      working = base;
      return data;
    }
  }
  return null;
}

export async function mealCategories(): Promise<string[]> {
  const mine = await ours<{ categories: string[] }>("/mealdb/categories");
  if (mine?.categories.length) return mine.categories;
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
  // Synced after this build's snapshot? Our API has it.
  const mine = await ours<CachedMeal>(`/mealdb/meals/${id}`);
  if (mine) return mealToRecipe(fromCached(mine));
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
  const mine = await ours<{ meals: CachedMeal[] }>(`/mealdb/meals?category=${encodeURIComponent(category)}`);
  if (mine?.meals.length) return toRecipes(mine.meals);
  const summaries = await mealsByCategory(category);
  const recipes = await mapLimit(summaries, 8, (s) => mealRecipe(s.idMeal));
  return recipes.filter((r): r is Recipe => r !== null && Boolean(r.image));
}

/** Full recipes matching a search (search.php already returns full meals). */
export async function searchRecipes(query: string): Promise<Recipe[]> {
  const mine = await ours<{ meals: CachedMeal[] }>(`/mealdb/meals?q=${encodeURIComponent(query)}&limit=60`);
  if (mine?.meals.length) return toRecipes(mine.meals);
  const data = await get<{ meals?: Meal[] | null }>(`search.php?s=${encodeURIComponent(query)}`);
  return (data?.meals ?? []).map(mealToRecipe).filter((r): r is Recipe => r !== null && Boolean(r.image));
}

/** Golden recipe or TheMealDB recipe, by slug. */
export async function findRecipe(slug: string, own: (slug: string) => Recipe | undefined | Promise<Recipe | undefined>): Promise<Recipe | undefined> {
  return (await own(slug)) ?? (slug.startsWith(MEALDB_PREFIX) ? (await mealRecipe(slug.slice(MEALDB_PREFIX.length))) ?? undefined : undefined);
}

// ---- Premium discovery (V2): popular, latest and multi-ingredient search. A supporter key lifts
// the limits (10 latest, the full multi-ingredient result); without one, V2 still answers with the
// test key in smaller amounts. Every caller has a local fallback, so nothing breaks offline.

const V2_TEST = "https://www.themealdb.com/api/json/v2/1";

/** The supporter key's address first (if it works), then V2 with the test key. */
async function getV2<T>(path: string): Promise<T | null> {
  const key = process.env.MEALDB_API_KEY?.trim();
  const tries = [...(key ? [mealdbBase(key), `https://www.themealdb.com/${key}/json/v2`] : []), V2_TEST];
  for (const base of tries) {
    const data = await fetchJson<T>(base, path);
    if (data !== null) return data;
  }
  return null;
}

const ids = (data: { meals?: Array<{ idMeal: string }> | null } | null) => (data?.meals ?? []).map((m) => m.idMeal).filter((id) => /^\d+$/.test(id));

/** Full recipes (with a photo) for meal IDs, in order, from the cache or a lookup. */
export async function recipesForIds(mealIds: string[]): Promise<Recipe[]> {
  const recipes = await mapLimit([...new Set(mealIds)], 6, (id) => mealRecipe(id));
  return recipes.filter((r): r is Recipe => r !== null && Boolean(r.image));
}

/** TheMealDB's most popular meals (popular.php). */
export async function popularMealIds(): Promise<string[]> {
  return ids(await getV2<{ meals?: Array<{ idMeal: string }> | null }>("popular.php"));
}

/** The meals most recently added to TheMealDB (latest.php: 10 with a supporter key). */
export async function latestMealIds(): Promise<string[]> {
  return ids(await getV2<{ meals?: Array<{ idMeal: string }> | null }>("latest.php"));
}

/** Meals that use every one of up to four ingredients (V2 multi-ingredient filter). */
export async function mealIdsWithIngredients(ingredients: string[]): Promise<string[]> {
  const list = ingredients
    .map((i) => i.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter((i) => /^[a-z0-9_'-]{2,40}$/.test(i))
    .slice(0, 4);
  if (!list.length) return [];
  return ids(await getV2<{ meals?: Array<{ idMeal: string }> | null }>(`filter.php?i=${list.map(encodeURIComponent).join(",")}`));
}
