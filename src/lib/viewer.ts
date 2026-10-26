// The current viewer's skill level and plan, kept in cookies so Server Components can
// personalise the feed. A signed-in Supabase profile replaces these in production.

import "server-only";
import { cookies } from "next/headers";
import { SKILL_LEVELS, type SkillLevel, type Viewer } from "@/lib/types";

export const SKILL_COOKIE = "bac-skill";
export const PLAN_COOKIE = "bac-plan";

export const parseSkill = (value: unknown): SkillLevel =>
  SKILL_LEVELS.includes(value as SkillLevel) ? (value as SkillLevel) : "beginner";

export async function getViewer(): Promise<Viewer> {
  const jar = await cookies();
  return {
    skill: parseSkill(jar.get(SKILL_COOKIE)?.value),
    plan: jar.get(PLAN_COOKIE)?.value === "premium" ? "premium" : "free",
  };
}
