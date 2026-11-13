// Saved recipes, the shopping list and the pantry. The device copy is what pages read; every write
// is also sent to the signed-in account (lib/sync). Components re-read on the "bac-store" event.

import { STORE_EVENT, schedulePush } from "@/lib/sync";
import type { SavedRecipe, ShoppingItem } from "@/lib/types";

export { STORE_EVENT };
export type { SavedRecipe, ShoppingItem };

const SAVED = "bac-saved";
const SHOPPING = "bac-shopping";

function read<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the change lasts for this visit only.
  }
  window.dispatchEvent(new Event(STORE_EVENT));
  schedulePush(key);
}

export const listSaved = () => read<SavedRecipe>(SAVED);
export const isSaved = (slug: string) => listSaved().some((r) => r.slug === slug);

export function toggleSaved(recipe: SavedRecipe): boolean {
  const saved = listSaved();
  const exists = saved.some((r) => r.slug === recipe.slug);
  write(SAVED, exists ? saved.filter((r) => r.slug !== recipe.slug) : [recipe, ...saved]);
  return !exists;
}

export const listShopping = () => read<ShoppingItem>(SHOPPING);

/** Adds a recipe's ingredients, skipping lines already on the list for that recipe. */
export function addToShopping(recipeSlug: string, recipeTitle: string, href: string, lines: string[]): number {
  const items = listShopping();
  const fresh = lines
    .map((text, i) => ({ id: `${recipeSlug}:${i}`, text, recipeTitle, href, done: false }))
    .filter((item) => !items.some((x) => x.id === item.id));
  write(SHOPPING, [...items, ...fresh]);
  return fresh.length;
}

export function toggleShopping(id: string) {
  write(SHOPPING, listShopping().map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
}

export const clearDone = () => write(SHOPPING, listShopping().filter((x) => !x.done));
export const clearShopping = () => write(SHOPPING, []);

const PANTRY = "bac-pantry";

/** What the cook already has at home (ingredient names, lower-case). */
export const listPantry = () => read<string>(PANTRY);

export function addPantry(item: string) {
  const name = item.trim().toLowerCase().slice(0, 40);
  if (!name) return;
  write(PANTRY, [...new Set([...listPantry(), name])]);
}

export const removePantry = (item: string) => write(PANTRY, listPantry().filter((p) => p !== item));
