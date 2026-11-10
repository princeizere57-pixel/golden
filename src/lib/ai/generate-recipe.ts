// Writes an original recipe for a dish Golden doesn't have yet (not in the seeds, the local
// TheMealDB cache or a live TheMealDB search). Gemini writes it from general cooking knowledge,
// in its own words: never copied from a website. The result goes through the same pipeline as
// imports (parseIngredient, stepToBlock), so it gets the skill slider, cook mode, timers and
// Fix My Mistake, and it's saved privately on the cook's device like an import.
//
// Fallback without GEMINI_API_KEY (or on any failure): null, and the UI offers importing one
// recipe page from a link instead.

import "server-only";
import { generateJson } from "@/lib/ai/gemini";
import { parseGeneratedRecipe, type GeneratedRecipe } from "@/lib/ai/generated-recipe";

export function recipePrompt(dish: string): string {
  return [
    "You are Golden, a home-cooking coach. Write an ORIGINAL home-cooking recipe for the dish below,",
    "in your own words from general cooking knowledge. Do not reproduce any published recipe or its wording.",
    "Keep it practical for a home kitchen, metric and cup measures, about 4 to 10 steps.",
    "Each step: one action, with the heat level and minutes where they apply, and how to tell it's done.",
    "Start the slow parts first (water, oven, rice) and prep while they heat.",
    'Return JSON only: {"title": string, "summary": string (one sentence), "serves": number,',
    '"ingredients": string[] (each "quantity unit name, prep", e.g. "200 g spaghetti"), "steps": string[]}.',
    'If the text is not a dish or food at all, return {"error": "not a dish"}.',
    `Dish: ${JSON.stringify(dish)}`,
  ].join("\n");
}

export async function generateRecipe(dish: string, opts: { fetchImpl?: typeof fetch } = {}): Promise<GeneratedRecipe | null> {
  const value = await generateJson(recipePrompt(dish), { fetchImpl: opts.fetchImpl, timeoutMs: 20_000 });
  return parseGeneratedRecipe(value);
}
