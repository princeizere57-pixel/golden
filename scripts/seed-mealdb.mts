// Builds a local cache of full TheMealDB recipes (instructions, ingredients, photos) so the app
// can serve them without per-meal API calls. Run: npm run data:mealdb
//
// Fetches every alphabetical block with search.php?f=<letter> (a–z, six letters at a time), keeps
// only meals with a photo, and writes src/data/mealdb-recipes.json. Fails (keeping the build on the
// live API) if fewer than MIN_MEALS came back.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// Type-only, so Node's type stripping erases it at runtime.
import type { CachedMeal } from "../src/lib/mealdb/convert";

const MIN_MEALS = 100;
const BATCH = 6;
const ALL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const KEY = process.env.MEALDB_API_KEY || "1";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "mealdb-recipes.json");

type RawMeal = Record<string, string | null | undefined>;

async function fetchLetter(letter: string, attempts = 3): Promise<RawMeal[]> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/${KEY}/search.php?f=${letter}`, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { meals?: RawMeal[] | null };
      if (body.meals?.length) return body.meals;
      // An empty answer can be real (no meals for that letter) or a hiccup under parallel load: retry once.
      if (attempt >= 2) return [];
      throw new Error("empty result");
    } catch (err) {
      console.warn(`  ${letter}: attempt ${attempt} failed (${(err as Error).message})`);
      if (attempt === attempts) return [];
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return [];
}

const text = (v: string | null | undefined) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Keeps the fields the app uses and turns strIngredient1..20 / strMeasure1..20 into a clean list. */
function clean(meal: RawMeal): CachedMeal | null {
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
    ingredients,
  };
}

const started = Date.now();
const byId = new Map<string, CachedMeal>();
const add = (letter: string, meals: RawMeal[]) => {
  let kept = 0;
  for (const meal of meals) {
    const c = clean(meal);
    if (c && !byId.has(c.idMeal)) {
      byId.set(c.idMeal, c);
      kept++;
    }
  }
  console.log(`  ${letter}: ${meals.length} found, ${kept} new`);
};

const used: string[] = [];
for (let i = 0; i < ALL_LETTERS.length; i += BATCH) {
  const letters = ALL_LETTERS.slice(i, i + BATCH);
  console.log(`Fetching letters ${letters.join(", ")}…`);
  const results = await Promise.all(letters.map((letter) => fetchLetter(letter)));
  letters.forEach((letter, j) => add(letter, results[j]));
  used.push(...letters);
}

const meals = [...byId.values()].sort((a, b) => a.strMeal.localeCompare(b.strMeal));
if (meals.length < MIN_MEALS) {
  console.error(`Only got ${meals.length} meals (need ${MIN_MEALS}); not writing the cache. Check your connection and retry.`);
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({ source: "https://www.themealdb.com", fetchedAt: new Date().toISOString(), letters: used, count: meals.length, meals }, null, 2) + "\n",
);
console.log(`Saved ${meals.length} meals from letters ${used.join("")} to ${OUT} in ${((Date.now() - started) / 1000).toFixed(1)} s.`);
