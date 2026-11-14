// Converts TheMealDB meals into our Recipe shape so the skill engine, cook mode and
// Fix My Mistake work on them. Pure.

import { colourwayFor, parseIngredient, stepToBlock } from "@/lib/import/to-blocks";
import type { Recipe } from "@/lib/types";

/** The fields we use from TheMealDB's `meals[]` objects (strIngredient1..20 / strMeasure1..20). */
export interface Meal {
  idMeal: string;
  strMeal: string;
  strCategory?: string | null;
  strArea?: string | null;
  strInstructions?: string | null;
  strMealThumb?: string | null;
  strYoutube?: string | null;
  strSource?: string | null;
  /** When TheMealDB added or last edited the meal ("YYYY-MM-DD HH:MM:SS"). */
  dateModified?: string | null;
  [key: `strIngredient${number}` | `strMeasure${number}`]: string | null | undefined;
}

/** Summary rows from filter.php (no ingredients or instructions). */
export interface MealSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

export const MEALDB_PREFIX = "mealdb-";

/** The stored shape (API table, web snapshot) lives in @golden/shared with its parser. */
export type { CachedMeal } from "@/lib/types";
import type { CachedMeal } from "@/lib/types";

export function fromCached({ ingredients, ...rest }: CachedMeal): Meal {
  const meal: Meal = { ...rest };
  ingredients.slice(0, 20).forEach((ing, i) => {
    meal[`strIngredient${i + 1}`] = ing.name;
    meal[`strMeasure${i + 1}`] = ing.measure;
  });
  return meal;
}

/** Splits instructions into steps: by line, dropping "STEP 3" / "3." labels and blank lines. */
export function mealSteps(instructions: string | null | undefined): string[] {
  return (instructions ?? "")
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*(?:step\s*\d+\s*[:.)-]?|\d+\s*[.)]|[•▢-])\s*/i, "").trim())
    .filter((line) => line.length > 2 && !/^step\s*\d+$/i.test(line));
}

/** The plain ingredient names, in the same order as mealIngredients. */
export function ingredientNames(meal: Meal): string[] {
  const names: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    if (name) names.push(name);
  }
  return names;
}

/** "https://www.youtube.com/watch?v=abc123" → "abc123". */
export function youtubeId(url: string | null | undefined): string | undefined {
  const m = url?.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m?.[1];
}

export function mealIngredients(meal: Meal): string[] {
  const lines: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    if (!name) continue;
    const measure = meal[`strMeasure${i}`]?.trim();
    lines.push(measure ? `${measure} ${name}` : name);
  }
  return lines;
}

/** TheMealDB's 350 px variant: the smallest size that's at least 300 px (others: 150, 500, 700). */
/** TheMealDB's 350 px variant. Photos we host ourselves ("/recipes/…") are already small. */
export const thumb = (url: string) => (url.startsWith("/") ? url : `${url.replace(/\/(preview|small|medium|large)$/, "")}/medium`);

export function mealToRecipe(meal: Meal): Recipe | null {
  const steps = mealSteps(meal.strInstructions);
  const ingredients = mealIngredients(meal);
  const names = ingredientNames(meal);
  if (!meal.strMeal || !steps.length || !ingredients.length) return null;
  const category = meal.strCategory?.trim() || "Miscellaneous";
  return {
    slug: `${MEALDB_PREFIX}${meal.idMeal}`,
    title: meal.strMeal.trim(),
    summary: [meal.strArea, category].filter((s) => s && s !== "Unknown").join(" · "),
    chef: "TheMealDB",
    category,
    dietary: category === "Vegan" ? ["vegan", "vegetarian"] : category === "Vegetarian" ? ["vegetarian"] : [],
    serves: 4,
    colourway: colourwayFor(meal.strMeal),
    premium: false,
    ingredients: ingredients.map((line, i) => ({ ...parseIngredient(line, i), icon: names[i] })),
    youtube: youtubeId(meal.strYoutube),
    blocks: steps.map(stepToBlock),
    image: meal.strMealThumb?.startsWith("https://") ? meal.strMealThumb : undefined,
    video: undefined,
    source: { url: meal.strSource?.startsWith("http") ? meal.strSource : `https://www.themealdb.com/meal/${meal.idMeal}`, name: "TheMealDB" },
  };
}
