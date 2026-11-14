"use server";

import { apiFetch } from "@/lib/api";
import { catalogueRecipe } from "@/lib/catalogue";
import { findRecipe } from "@/lib/mealdb/client";
import { adaptRecipe } from "@/lib/skill/adapt";
import { fixMistake, type Fix, type MistakeId } from "@/lib/recovery/fixes";
import { parseSkill } from "@/lib/viewer";
import type { AdaptedRecipe } from "@/lib/types";

/** POSTs to our API's AI routes; null on any failure so callers keep their deterministic result. */
async function askAi<T>(path: string, body: unknown, timeoutMs: number): Promise<T | null> {
  try {
    const res = await apiFetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Rewrites a recipe for a skill level with Gemini (via the API); falls back to the deterministic engine. */
export async function adaptRecipeAction(slug: string, skillInput: string): Promise<AdaptedRecipe | null> {
  const recipe = await findRecipe(slug, catalogueRecipe);
  if (!recipe) return null;
  const skill = parseSkill(skillInput);
  const ai = await askAi<{ adapted?: AdaptedRecipe | null }>("/ai/adapt", { recipe, skill }, 15_000);
  return ai?.adapted ?? adaptRecipe(recipe, skill);
}

/** The deterministic fix, plus one optional AI tip for this dish. */
export async function fixMistakeAction(slug: string, mistake: MistakeId, volumeMl: number, severity: 1 | 2 | 3): Promise<Fix & { tip?: string }> {
  const fix = fixMistake(mistake, { volumeMl, severity });
  const recipe = await findRecipe(slug, catalogueRecipe);
  if (!recipe) return fix;
  const ai = await askAi<{ tip?: string }>("/ai/fix-tip", { title: recipe.title, mistake, volumeMl, severity }, 15_000);
  return ai?.tip ? { ...fix, tip: ai.tip } : fix;
}
