"use server";

import { randomUUID } from "node:crypto";
import { ImportError, fetchRecipePage } from "@/lib/import/fetch";
import { extractRecipe } from "@/lib/import/parse";
import { toRecipe } from "@/lib/import/to-blocks";
import { generateRecipe } from "@/lib/ai/generate-recipe";
import { cleanDish, generatedToRecipe } from "@/lib/ai/generated-recipe";
import { geminiConfigured } from "@/lib/ai/gemini";
import { getUser } from "@/lib/auth";
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

export type GenerateResult = { ok: true; recipe: Recipe } | { ok: false; reason: "sign-in" | "unavailable" | "not-a-dish" | "failed"; error: string };

/**
 * Writes an original recipe for a dish nobody has in the library yet. Private to the person who
 * asked, like an import; never added to the public catalogue.
 */
export async function generateRecipeAction(text: string): Promise<GenerateResult> {
  if (!(await getUser())) return { ok: false, reason: "sign-in", error: "Please sign in first." };
  const dish = cleanDish(text);
  if (!dish) return { ok: false, reason: "not-a-dish", error: "Type the name of a dish, like \"chicken katsu curry\"." };
  if (!geminiConfigured()) return { ok: false, reason: "unavailable", error: "Recipe writing isn't switched on yet. You can still import a recipe from a link." };
  const generated = await generateRecipe(dish);
  if (!generated) return { ok: false, reason: "failed", error: `We couldn't write a recipe for "${dish}". Check the spelling, or import one from a link.` };
  return { ok: true, recipe: generatedToRecipe(generated, randomUUID().slice(0, 8)) };
}
