// Imported recipes: a device copy plus the account's private `imported_recipes` table (only ever
// read by their owner; never in the feed, search, segments or share). Client-side only.

import { STORE_EVENT, schedulePush } from "@/lib/sync";
import type { Recipe } from "@/lib/types";

const KEY = "bac-imports";

export function listImports(): Recipe[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export const getImport = (slug: string) => listImports().find((r) => r.slug === slug);

function write(recipes: Recipe[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(recipes));
  } catch {
    // Storage full or blocked: the import still works for this visit.
  }
  window.dispatchEvent(new Event(STORE_EVENT));
  schedulePush(KEY);
}

export function saveImport(recipe: Recipe) {
  // Re-importing the same page replaces it. Generated recipes have no source link, so they're
  // only ever replaced by the same slug.
  const url = recipe.source?.url;
  write([recipe, ...listImports().filter((r) => r.slug !== recipe.slug && !(url && r.source?.url === url))]);
}

export function removeImport(slug: string) {
  write(listImports().filter((r) => r.slug !== slug));
}
