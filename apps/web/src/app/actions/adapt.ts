"use server";

import { generateJson } from "@/lib/ai/gemini";
import { catalogueRecipe } from "@/lib/catalogue";
import { findRecipe } from "@/lib/mealdb/client";
import { adaptRecipe, validateAdapted } from "@/lib/skill/adapt";
import { fixMistake, type Fix, type MistakeId } from "@/lib/recovery/fixes";
import { parseSkill } from "@/lib/viewer";
import type { AdaptedRecipe } from "@/lib/types";

const VOICE = {
  beginner: "a patient teacher for a first-time cook: short micro-steps, sensory cues and plain-English definitions of any jargon",
  intermediate: "a line cook: standard kitchen shorthand, concise, with notes on what can run in parallel",
  chef: "a head chef: technique-forward, precise temperatures and reduction targets, flavour and food-science notes",
};

/** Rewrites a recipe for a skill level with Gemini; falls back to the deterministic engine. */
export async function adaptRecipeAction(slug: string, skillInput: string): Promise<AdaptedRecipe | null> {
  const recipe = await findRecipe(slug, catalogueRecipe);
  if (!recipe) return null;
  const skill = parseSkill(skillInput);
  const fallback = adaptRecipe(recipe, skill);
  const prompt = [
    `Rewrite each step of this recipe in the voice of ${VOICE[skill]}.`,
    "Keep the same number of steps, in the same order. Don't change quantities, times or temperatures.",
    'Reply only with JSON: {"steps":[{"instructions":["..."],"notes":["..."]}]}.',
    JSON.stringify({ title: recipe.title, ingredients: recipe.ingredients, steps: recipe.blocks }),
  ].join("\n");
  return validateAdapted(recipe, skill, await generateJson(prompt)) ?? fallback;
}

/** The deterministic fix, plus one optional AI tip for this dish. */
export async function fixMistakeAction(slug: string, mistake: MistakeId, volumeMl: number, severity: 1 | 2 | 3): Promise<Fix & { tip?: string }> {
  const fix = fixMistake(mistake, { volumeMl, severity });
  const recipe = await findRecipe(slug, catalogueRecipe);
  if (!recipe) return fix;
  const answer = (await generateJson(
    `A cook making "${recipe.title}" has this problem: ${mistake}. The standard fix is: ${fix.steps.join(" ")} ` +
      'Add one short extra tip specific to this dish. Reply only with JSON: {"tip":"..."}.',
  )) as { tip?: unknown } | null;
  return typeof answer?.tip === "string" && answer.tip.length < 300 ? { ...fix, tip: answer.tip } : fix;
}
