// Builds the local library snapshot the app reads (src/data/mealdb-recipes.json). Runs on every
// build (prebuild) and with `pnpm data:mealdb`.
//
// Source: our API's mealdb_meals table, which mirrors TheMealDB nightly (apps/api GET /cron/mealdb).
// If our API can't be reached or has too few meals, it falls back to sweeping TheMealDB directly
// (the same sweep the API job uses). Fewer than MEALDB_MIN_MEALS → nothing is written and the build
// carries on with the live API.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MEALDB_MIN_MEALS, sweepMealDb, type CachedMeal } from "@golden/shared";

// Same default as src/lib/api-origin.ts (a script can't use the app's "@/" imports).
const API = (process.env.API_ORIGIN ?? "https://golden-api-rho.vercel.app").replace(/\/$/, "");
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "mealdb-recipes.json");
const started = Date.now();

async function fromOurApi(): Promise<CachedMeal[]> {
  try {
    const res = await fetch(`${API}/mealdb/meals`, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as { meals?: CachedMeal[] }).meals ?? [];
  } catch (err) {
    console.warn(`Our API (${API}) didn't answer: ${(err as Error).message}.`);
    return [];
  }
}

let meals = await fromOurApi();
let source = `our API (${API})`;
if (meals.length < MEALDB_MIN_MEALS) {
  console.warn(`Our API gave ${meals.length} meals; sweeping TheMealDB directly instead.`);
  meals = (await sweepMealDb({ key: process.env.MEALDB_API_KEY, log: console.log })).meals;
  source = "TheMealDB (fallback)";
}

if (meals.length < MEALDB_MIN_MEALS) {
  console.error(`Only got ${meals.length} meals (need ${MEALDB_MIN_MEALS}); not writing the snapshot.`);
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ source: "https://www.themealdb.com", fetchedAt: new Date().toISOString(), via: source, count: meals.length, meals }, null, 2) + "\n");
console.log(`Saved ${meals.length} meals from ${source} to ${OUT} in ${((Date.now() - started) / 1000).toFixed(1)} s.`);
