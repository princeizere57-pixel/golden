// The current viewer's skill level and plan, kept in cookies so Server Components can
// personalise the feed. A signed-in Supabase profile replaces these in production.

import "server-only";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { parseTier, type Tier } from "@/lib/billing/entitlements";
import { activeTier } from "@/lib/billing/subscriptions";
import { verifyValue } from "@/lib/signed-cookie";
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

export async function getViewer(): Promise<Viewer & { tier: Tier; onboarded: boolean; prefs: Prefs }> {
  const jar = await cookies();
  // The plan: for real accounts the `subscriptions` table decides (the payment webhooks keep it
  // current, so cancellations, expiries and upgrades count). The signed plan cookie is only the
  // answer when Supabase isn't available: demo mode, or a database outage.
  const cookieTier = parseTier(verifyValue(jar.get(PLAN_COOKIE)?.value));
  const user = await getUser();
  const tier = (user ? await activeTier(user.id) : null) ?? cookieTier;
  let prefs = DEFAULT_PREFS;
  try {
    prefs = { ...DEFAULT_PREFS, ...JSON.parse(jar.get(PREFS_COOKIE)?.value ?? "{}") };
  } catch {}
  return {
    skill: parseSkill(jar.get(SKILL_COOKIE)?.value),
    plan: tier === "free" ? "free" : "premium",
    tier,
    onboarded: jar.has(SKILL_COOKIE),
    prefs,
  };
}
