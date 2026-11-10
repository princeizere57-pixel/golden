// Imported recipes live on the user's device (and in the private `imported_recipes` table
// once accounts are wired up). Client-side only.

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
