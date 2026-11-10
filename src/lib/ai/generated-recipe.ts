// Validates an AI-written recipe and turns it into Golden's Recipe shape. Pure, so it's tested
// without the network. Anything malformed, too long or too thin is rejected (null).

import { toRecipe } from "@/lib/import/to-blocks";
import type { Recipe } from "@/lib/types";

export interface GeneratedRecipe {
  title: string;
  summary: string;
  serves: number;
  ingredients: string[];
  steps: string[];
}

/** Marks generated recipes: no external source to link to. */
export const GENERATED_SOURCE = "Golden AI";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const list = (v: unknown, max: number, each: number) =>
  Array.isArray(v) ? v.map((x) => str(x, each)).filter(Boolean).slice(0, max) : [];

export function parseGeneratedRecipe(value: unknown): GeneratedRecipe | null {
  if (!value || typeof value !== "object" || "error" in value) return null;
  const v = value as Record<string, unknown>;
  const title = str(v.title, 80);
  const ingredients = list(v.ingredients, 30, 120);
  const steps = list(v.steps, 20, 500);
  if (!title || ingredients.length < 2 || steps.length < 2) return null;
  const serves = Number(v.serves);
  return {
    title,
    summary: str(v.summary, 200) || `A home-cooked ${title.toLowerCase()}, written for you by Golden.`,
    serves: Number.isInteger(serves) && serves >= 1 && serves <= 12 ? serves : 2,
    ingredients,
    steps,
  };
}

/** Golden's Recipe for a generated dish, private to the cook (slug my-…, like imports). */
export function generatedToRecipe(g: GeneratedRecipe, id: string): Recipe {
  const recipe = toRecipe({ ...g, sourceName: GENERATED_SOURCE, sourceUrl: "", author: GENERATED_SOURCE }, id);
  return { ...recipe, category: "Written for you" };
}

/** Clean dish text from a search box: 2–60 characters of letters, numbers and simple punctuation. */
export function cleanDish(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const dish = text.replace(/[^\p{L}\p{N}\s'&,.-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return dish.length >= 2 ? dish : null;
}
