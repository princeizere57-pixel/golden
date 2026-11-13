// Rates how demanding a recipe is, so discovery can put the right recipes in front of each
// skill level. Pure and deterministic.

import type { Recipe, SkillLevel } from "@/lib/types";
import { SKILL_LEVELS } from "@/lib/types";
import { elapsedMinutes } from "@/lib/links";

/** Techniques that take practice; each one found adds to the score. */
const ADVANCED = /\b(emulsif|deglaz|temper|braise|knead|prove|proof|flamb|julienne|caramelis|carameliz|blanch|confit|poach|sous vide|pastry|meringue|roux|reduc|fold in|whip)/gi;

export interface Difficulty {
  level: SkillLevel;
  label: "Easy" | "Medium" | "Advanced";
  score: number;
}

const LABEL: Record<SkillLevel, Difficulty["label"]> = { beginner: "Easy", intermediate: "Medium", chef: "Advanced" };

export function difficulty(recipe: Recipe): Difficulty {
  const ingredients = recipe.ingredients.length;
  const steps = recipe.blocks.length;
  const minutes = elapsedMinutes(recipe.blocks);
  const techniques = new Set(recipe.blocks.flatMap((b) => (b.text.match(ADVANCED) ?? []).map((t) => t.toLowerCase()))).size;
  const score =
    (ingredients > 12 ? 2 : ingredients > 8 ? 1 : 0) +
    (steps > 8 ? 2 : steps > 5 ? 1 : 0) +
    (minutes > 90 ? 2 : minutes > 45 ? 1 : 0) +
    Math.min(3, techniques);
  const level: SkillLevel = score <= 1 ? "beginner" : score <= 3 ? "intermediate" : "chef";
  return { level, label: LABEL[level], score };
}

/** 0 = made for this cook; 1 = one level away; 2 = two levels away. */
export const levelDistance = (a: SkillLevel, b: SkillLevel) => Math.abs(SKILL_LEVELS.indexOf(a) - SKILL_LEVELS.indexOf(b));

/** Orders items so the best fit for the cook comes first, keeping the original order within a tier. */
export function rankForSkill<T>(items: T[], skill: SkillLevel, levelOf: (item: T) => SkillLevel | undefined): T[] {
  const rank = (item: T) => {
    const level = levelOf(item);
    return level ? levelDistance(level, skill) : 3;
  };
  return items.map((item, i) => ({ item, i, r: rank(item) })).sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.item);
}
