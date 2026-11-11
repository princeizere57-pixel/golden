// Recipes available without network calls: our seed recipes plus the local TheMealDB cache.
// Powers the Discover and For you pages. Server-only.

import "server-only";
import { allCachedMeals } from "@/lib/mealdb/cache";
import type { PantryRecipe } from "@/components/pantry";
import { RECIPES } from "@/lib/data/recipes";
import { recipeHref } from "@/lib/links";
import { mealToRecipe, thumb } from "@/lib/mealdb/convert";
import { difficulty, rankForSkill } from "@/lib/skill/difficulty";
import type { Recipe, SkillLevel } from "@/lib/types";

let library: Recipe[] | undefined;

export function libraryRecipes(): Recipe[] {
  library ??= allCachedMeals()
    .map(mealToRecipe)
    .filter((r): r is Recipe => r !== null && Boolean(r.image));
  return library;
}

export const byCategory = (category: string) => libraryRecipes().filter((r) => r.category === category);

/** Recipes in a category ranked for the cook's level. */
export function forLevel(recipes: Recipe[], skill: SkillLevel): Recipe[] {
  return rankForSkill(recipes, skill, (r) => difficulty(r).level);
}

/** Same pick for everyone on a given day, chosen among recipes that suit the level. */
export function dishOfTheDay(skill: SkillLevel, date = new Date()): Recipe | undefined {
  const pool = libraryRecipes().filter((r) => difficulty(r).level === skill);
  const list = pool.length ? pool : libraryRecipes();
  if (!list.length) return undefined;
  const day = Math.floor(date.getTime() / 86_400_000);
  return list[day % list.length];
}

/**
 * What the pantry suggestions match against (Discover, Shopping list): Golden's own recipes and
 * the library, photo required, only the fields the client needs. `limit` caps the library part
 * to keep the page light.
 */
export function pantryRecipes(limit?: number): PantryRecipe[] {
  const lib = libraryRecipes();
  return [...RECIPES.filter((r) => r.image), ...(limit ? lib.slice(0, limit) : lib)].map((r) => ({
    slug: r.slug,
    href: recipeHref(r),
    title: r.title,
    image: r.image ? thumb(r.image) : undefined,
    ingredients: r.ingredients.map((i) => i.name),
  }));
}
