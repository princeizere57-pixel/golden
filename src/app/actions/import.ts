"use server";

import { randomUUID } from "node:crypto";
import { ImportError, fetchRecipePage } from "@/lib/import/fetch";
import { extractRecipe } from "@/lib/import/parse";
import { toRecipe } from "@/lib/import/to-blocks";
import type { Recipe } from "@/lib/types";

export type ImportResult = { ok: true; recipe: Recipe } | { ok: false; error: string };

/**
 * Imports one recipe page for the requesting user's private use. The result goes back to
 * that user only; it is never stored in the public catalogue.
 */
export async function importRecipeAction(link: string): Promise<ImportResult> {
  try {
    const { html, url } = await fetchRecipePage(link);
    const imported = extractRecipe(html, url);
    if (!imported) return { ok: false, error: "We couldn't find a recipe on that page. Try the recipe's own page rather than a list or search page." };
    return { ok: true, recipe: toRecipe(imported, randomUUID().slice(0, 8)) };
  } catch (err) {
    if (err instanceof ImportError) return { ok: false, error: err.message };
    if ((err as Error).name === "TimeoutError") return { ok: false, error: "The site took too long to answer. Try again." };
    return { ok: false, error: "Something went wrong fetching that page." };
  }
}
