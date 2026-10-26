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
  [key: `strIngredient${number}` | `strMeasure${number}`]: string | null | undefined;
}

/** Summary rows from filter.php (no ingredients or instructions). */
export interface MealSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

export const MEALDB_PREFIX = "mealdb-";

/** Splits instructions into steps: by line, dropping "STEP 3" / "3." labels and blank lines. */
export function mealSteps(instructions: string | null | undefined): string[] {
  return (instructions ?? "")
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*(?:step\s*\d+\s*[:.)-]?|\d+\s*[.)]|[•▢-])\s*/i, "").trim())
    .filter((line) => line.length > 2 && !/^step\s*\d+$/i.test(line));
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

/** Small thumbnail variant TheMealDB serves for list views. */
export const thumb = (url: string) => `${url.replace(/\/preview$/, "")}/preview`;

export function mealToRecipe(meal: Meal): Recipe | null {
  const steps = mealSteps(meal.strInstructions);
  const ingredients = mealIngredients(meal);
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
    ingredients: ingredients.map(parseIngredient),
    blocks: steps.map(stepToBlock),
    image: meal.strMealThumb?.startsWith("https://") ? meal.strMealThumb : undefined,
    video: undefined,
    source: { url: meal.strSource?.startsWith("http") ? meal.strSource : `https://www.themealdb.com/meal/${meal.idMeal}`, name: "TheMealDB" },
  };
}
