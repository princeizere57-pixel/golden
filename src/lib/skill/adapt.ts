// Module A: the skill-level engine. Pure and deterministic, so it works offline, in tests,
// and as the fallback whenever the AI rewrite is unavailable or returns something invalid.

import type { AdaptedRecipe, AdaptedStep, Recipe, SkillLevel, StepBlock } from "@/lib/types";

/** Splits a block's text into short micro-steps at sentence and "then" boundaries. */
export function microSteps(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|,\s*then\s+|;\s*/i)
    .map((s) => s.trim().replace(/^then\s+/i, ""))
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/[.!?]?$/, "."));
}

const formatMinutes = (m: number) => (m < 1 ? `${Math.round(m * 60)} s` : `~${Math.round(m)} min`);

function beginner(block: StepBlock): AdaptedStep {
  const steps = microSteps(block.text);
  if (block.kind === "heat") steps.unshift(`Set the ${block.vessel} over ${block.heat} heat.`);
  if (block.cue) steps.push(`It's ready when ${block.cue} (${formatMinutes(block.minutes)}).`);
  return {
    blockId: block.id,
    kind: block.kind,
    instructions: steps,
    minutes: block.minutes,
    attention: block.attention,
    timerLabel: block.kind === "timing" ? block.timerLabel : undefined,
    notes: Object.entries(block.terms ?? {}).map(([term, meaning]) => `${term}: ${meaning}`),
  };
}

function intermediate(block: StepBlock): AdaptedStep {
  const heat = block.kind === "heat" ? `${block.heat} heat, ${block.vessel}: ` : "";
  return {
    blockId: block.id,
    kind: block.kind,
    instructions: [`${heat}${block.text} (${formatMinutes(block.minutes)}).`.replace(/\.\s*\(/, " (")],
    minutes: block.minutes,
    attention: block.attention,
    timerLabel: block.kind === "timing" ? block.timerLabel : undefined,
    notes: block.attention === "passive" ? ["Passive: start your next prep while this runs."] : [],
  };
}

function chef(block: StepBlock): AdaptedStep {
  const heat = block.kind === "heat" ? `${block.heat.toUpperCase()} · ` : "";
  return {
    blockId: block.id,
    kind: block.kind,
    instructions: [`${heat}${block.text.replace(/\.$/, "")}.`],
    minutes: block.minutes,
    attention: block.attention,
    timerLabel: block.kind === "timing" ? block.timerLabel : undefined,
    notes: block.science ? [block.science] : [],
  };
}

const ADAPTERS: Record<SkillLevel, (block: StepBlock) => AdaptedStep> = { beginner, intermediate, chef };

/** Rewrites a recipe's steps for the chosen skill level. */
export function adaptRecipe(recipe: Recipe, skill: SkillLevel): AdaptedRecipe {
  return { slug: recipe.slug, skill, steps: recipe.blocks.map(ADAPTERS[skill]), source: "engine" };
}

/** Total minutes of hands-on work (what the discovery rails filter on). */
export function activeMinutes(recipe: Recipe): number {
  return recipe.blocks.filter((b) => b.attention === "active").reduce((sum, b) => sum + b.minutes, 0);
}

/** Validates an AI-rewritten recipe against the original structure; returns null if it doesn't fit. */
export function validateAdapted(recipe: Recipe, skill: SkillLevel, value: unknown): AdaptedRecipe | null {
  if (!value || typeof value !== "object") return null;
  const steps = (value as { steps?: unknown }).steps;
  if (!Array.isArray(steps) || steps.length !== recipe.blocks.length) return null;
  const out: AdaptedStep[] = [];
  for (const [i, block] of recipe.blocks.entries()) {
    const s = steps[i] as { instructions?: unknown; notes?: unknown };
    const instructions = Array.isArray(s?.instructions) ? s.instructions.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
    if (!instructions.length) return null;
    const notes = Array.isArray(s?.notes) ? s.notes.filter((x): x is string => typeof x === "string") : [];
    // Timings, attention and structure always come from the recipe, never from the model.
    const base = ADAPTERS[skill](block);
    out.push({ ...base, instructions, notes });
  }
  return { slug: recipe.slug, skill, steps: out, source: "ai" };
}
