// Golden's own recipes (lib/catalogue) plus the library snapshot of TheMealDB meals (taken from our API at build).
// Powers the Discover and For you pages. Server-only.

import "server-only";
import { allCachedMeals } from "@/lib/mealdb/cache";
import type { PantryRecipe } from "@/components/pantry";
import { catalogue } from "@/lib/catalogue";
import { recipeHref } from "@/lib/links";
import { mealToRecipe, thumb } from "@/lib/mealdb/convert";
import { covers } from "@/lib/pantry";
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
export async function pantryRecipes(limit?: number): Promise<PantryRecipe[]> {
  const lib = libraryRecipes();
  return [...(await catalogue()).filter((r) => r.image), ...(limit ? lib.slice(0, limit) : lib)].map((r) => ({
    slug: r.slug,
    href: recipeHref(r),
    title: r.title,
    image: r.image ? thumb(r.image) : undefined,
    ingredients: r.ingredients.map((i) => i.name),
  }));
}

/** Library meals newest first, by the date TheMealDB added them (works without any key). */
export function justAdded(limit = 10): Recipe[] {
  return allCachedMeals()
    .filter((m) => m.dateModified && m.strMealThumb)
    .sort((a, b) => String(b.dateModified).localeCompare(String(a.dateModified)))
    .slice(0, limit)
    .map(mealToRecipe)
    .filter((r): r is Recipe => r !== null);
}

/** Recipes (ours and the library) that use every listed ingredient ("pasta" covers penne). */
export async function recipesWithIngredients(ingredients: string[]): Promise<Recipe[]> {
  const wanted = ingredients.map((i) => i.trim()).filter((i) => i.length > 1).slice(0, 4);
  if (!wanted.length) return [];
  return [...(await catalogue()), ...libraryRecipes()].filter(
    (r) => r.image && wanted.every((w) => r.ingredients.some((i) => covers(w, i.name))),
  );
}

/** A random recipe that suits the level (for "Surprise me"). */
export async function surpriseRecipe(skill: SkillLevel, random = Math.random): Promise<Recipe | undefined> {
  const all = [...(await catalogue()), ...libraryRecipes()].filter((r) => r.image);
  const pool = all.filter((r) => difficulty(r).level === skill);
  const list = pool.length ? pool : all;
  return list.length ? list[Math.floor(random() * list.length)] : undefined;
}
