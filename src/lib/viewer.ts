// The current viewer's skill level and plan, kept in cookies so Server Components can
// personalise the feed. A signed-in Supabase profile replaces these in production.

import "server-only";
import { cookies } from "next/headers";
import { SKILL_LEVELS, type SkillLevel, type Viewer } from "@/lib/types";

export const SKILL_COOKIE = "bac-skill";
export const PLAN_COOKIE = "bac-plan";

export const parseSkill = (value: unknown): SkillLevel =>
  SKILL_LEVELS.includes(value as SkillLevel) ? (value as SkillLevel) : "beginner";

export const PREFS_COOKIE = "bac-prefs";

/** Answers from onboarding that shape the feed. */
export interface Prefs {
  serves: number;
  weeknightMinutes: number;
  goals: string[];
}

const DEFAULT_PREFS: Prefs = { serves: 2, weeknightMinutes: 30, goals: [] };

export async function getViewer(): Promise<Viewer & { onboarded: boolean; prefs: Prefs }> {
  const jar = await cookies();
  let prefs = DEFAULT_PREFS;
  try {
    prefs = { ...DEFAULT_PREFS, ...JSON.parse(jar.get(PREFS_COOKIE)?.value ?? "{}") };
  } catch {}
  return {
    skill: parseSkill(jar.get(SKILL_COOKIE)?.value),
    plan: jar.get(PLAN_COOKIE)?.value === "premium" ? "premium" : "free",
    onboarded: jar.has(SKILL_COOKIE),
    prefs,
  };
}
