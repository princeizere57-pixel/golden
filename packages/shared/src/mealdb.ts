// TheMealDB's library as we keep it: one parser and one sweep, used by the API's nightly sync and
// by the web build's fallback (when our API can't be reached). Runs anywhere with global fetch.

/** A meal as stored (API table, web snapshot): TheMealDB's fields, ingredients as a clean list. */
export interface CachedMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string | null;
  strArea: string | null;
  strInstructions: string;
  strMealThumb: string | null;
  strYoutube: string | null;
  strSource: string | null;
  /** When TheMealDB added or last edited it ("YYYY-MM-DD HH:MM:SS"); many meals have none. */
  dateModified?: string | null;
  ingredients: Array<{ name: string; measure: string }>;
}

export type RawMeal = Record<string, string | null | undefined>;

/** Fewer meals than this means TheMealDB answered badly: keep the copy we already have. */
export const MEALDB_MIN_MEALS = 100;

const text = (v: string | null | undefined) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Keeps the fields the app uses; strIngredient1..20 / strMeasure1..20 become a list. Null = unusable. */
export function cleanMeal(meal: RawMeal): CachedMeal | null {
  const ingredients: CachedMeal["ingredients"] = [];
  for (let i = 1; i <= 20; i++) {
    const name = text(meal[`strIngredient${i}`]);
    if (name) ingredients.push({ name, measure: text(meal[`strMeasure${i}`]) ?? "" });
  }
  // Recipes without a photo are left out of Golden.
  if (!text(meal.strMealThumb)) return null;
  const id = text(meal.idMeal);
  const name = text(meal.strMeal);
  const instructions = text(meal.strInstructions);
  if (!id || !name || !instructions || !ingredients.length) return null;
  return {
    idMeal: id,
    strMeal: name,
    strCategory: text(meal.strCategory),
    strArea: text(meal.strArea),
    strInstructions: instructions,
    strMealThumb: text(meal.strMealThumb),
    strYoutube: text(meal.strYoutube),
    strSource: text(meal.strSource),
    dateModified: text(meal.dateModified),
    ingredients,
  };
}

const V1_TEST = "https://www.themealdb.com/api/json/v1/1";
const LETTERS = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
const BATCH = 6;

export interface SweepOptions {
  /** Supporter key (MEALDB_API_KEY); without it the V1 test key, development only. */
  key?: string;
  /** Epoch ms: stop sweeping and return what we have (keeps a serverless run under its limit). */
  deadline?: number;
  log?: (message: string) => void;
}

/**
 * The whole library: the full list (supporter key), every letter, then every category and cuisine
 * with lookups for anything the letters missed. Photo-less meals are dropped; sorted by name.
 */
export async function sweepMealDb({ key, deadline = Infinity, log = () => {} }: SweepOptions = {}) {
  const timeUp = () => Date.now() > deadline;
  let base = V1_TEST;
  const k = key?.trim();
  if (k) {
    for (const candidate of [`https://www.themealdb.com/api/json/v2/${k}`, `https://www.themealdb.com/${k}/json/v2`, `https://www.themealdb.com/api/json/v1/${k}`]) {
      const ok = await fetch(`${candidate}/list.php?c=list`, { signal: AbortSignal.timeout(15_000) })
        .then(async (r) => (r.ok ? Boolean(((await r.json()) as { meals?: unknown[] }).meals?.length) : false))
        .catch(() => false);
      if (ok) {
        base = candidate;
        break;
      }
    }
    log(base === V1_TEST ? "TheMealDB refused the supporter key; using the V1 test key." : "TheMealDB supporter key accepted.");
  }
  const keyed = base !== V1_TEST;

  const getJson = async <T>(path: string, attempts = 2): Promise<T | null> => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const res = await fetch(`${base}/${path}`, { signal: AbortSignal.timeout(20_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as T;
      } catch (err) {
        if (attempt === attempts) log(`  ${path}: failed (${(err as Error).message})`);
        else await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
    return null;
  };

  const byId = new Map<string, CachedMeal>();
  const add = (label: string, meals: RawMeal[] | null | undefined) => {
    let kept = 0;
    for (const raw of meals ?? []) {
      const meal = cleanMeal(raw);
      if (meal && !byId.has(meal.idMeal)) {
        byId.set(meal.idMeal, meal);
        kept++;
      }
    }
    log(`  ${label}: ${meals?.length ?? 0} found, ${kept} new`);
  };

  // Supporters can list the whole database in one call; the sweeps below fill any gap.
  if (keyed) add("full list", (await getJson<{ meals?: RawMeal[] | null }>("search.php?s="))?.meals);

  for (let i = 0; i < LETTERS.length && !timeUp(); i += BATCH) {
    const letters = LETTERS.slice(i, i + BATCH);
    const results = await Promise.all(letters.map((l) => getJson<{ meals?: RawMeal[] | null }>(`search.php?f=${l}`)));
    letters.forEach((l, j) => add(l, results[j]?.meals));
  }

  if (!timeUp()) {
    const [cats, areas] = await Promise.all([
      getJson<{ meals?: Array<{ strCategory: string }> | null }>("list.php?c=list"),
      getJson<{ meals?: Array<{ strArea: string }> | null }>("list.php?a=list"),
    ]);
    const filters = [...(cats?.meals ?? []).map((m) => `filter.php?c=${encodeURIComponent(m.strCategory)}`), ...(areas?.meals ?? []).map((m) => `filter.php?a=${encodeURIComponent(m.strArea)}`)];
    const seen = new Set<string>();
    for (let i = 0; i < filters.length && !timeUp(); i += BATCH) {
      const results = await Promise.all(filters.slice(i, i + BATCH).map((f) => getJson<{ meals?: Array<{ idMeal: string }> | null }>(f)));
      for (const r of results) for (const m of r?.meals ?? []) seen.add(m.idMeal);
    }
    const missing = [...seen].filter((id) => !byId.has(id));
    for (let i = 0; i < missing.length && !timeUp(); i += BATCH) {
      const results = await Promise.all(missing.slice(i, i + BATCH).map((id) => getJson<{ meals?: RawMeal[] | null }>(`lookup.php?i=${id}`)));
      add("lookup", results.flatMap((r) => r?.meals ?? []));
    }
  }
  if (timeUp()) log("  stopped early (time limit); keeping what was found.");

  return { meals: [...byId.values()].sort((a, b) => a.strMeal.localeCompare(b.strMeal)), keyed };
}
