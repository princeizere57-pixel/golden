// Reads the local TheMealDB cache written by `npm run data:mealdb`. Optional: when the file is
// missing the app uses the live API. Server-only.

import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fromCached, type CachedMeal, type Meal } from "@/lib/mealdb/convert";

const FILE = join(process.cwd(), "src", "data", "mealdb-recipes.json");

let byId: Map<string, Meal> | undefined;

function load(): Map<string, Meal> {
  if (byId) return byId;
  byId = new Map();
  try {
    const data = JSON.parse(readFileSync(FILE, "utf8")) as { meals?: CachedMeal[] };
    for (const m of data.meals ?? []) byId.set(m.idMeal, fromCached(m));
  } catch {
    // No cache yet (or unreadable): fall back to the API.
  }
  return byId;
}

export const cachedMeal = (id: string): Meal | undefined => load().get(id);
export const cachedMealCount = () => load().size;
