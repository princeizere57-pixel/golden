// The current viewer's skill level, prefs and plan. Skill + prefs belong to the account (the API's
// `profiles` table: written on every change, copied back to a device at sign-in). These cookies are
// the device copy: pages read them without a network call, and the edge middleware checks them.

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { accessFromCookie, type Access, type Tier } from "@/lib/billing/entitlements";
import { activeAccess } from "@/lib/billing/subscriptions";
import { verifyValue } from "@/lib/signed-cookie";
import { SKILL_LEVELS, type Prefs, type SkillLevel, type Viewer } from "@/lib/types";

export const SKILL_COOKIE = "bac-skill";
export const PLAN_COOKIE = "bac-plan";

export const parseSkill = (value: unknown): SkillLevel =>
  SKILL_LEVELS.includes(value as SkillLevel) ? (value as SkillLevel) : "beginner";

export const PREFS_COOKIE = "bac-prefs";

const DEFAULT_PREFS: Prefs = { serves: 2, weeknightMinutes: 30, goals: [] };
const YEAR = 60 * 60 * 24 * 365;

/** This device's prefs over the defaults. */
export function readPrefs(jar: Awaited<ReturnType<typeof cookies>>): Prefs {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(jar.get(PREFS_COOKIE)?.value ?? "{}") };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Writes the device copy of the profile. Only where cookies can be set: actions, route handlers. */
export async function rememberProfile(skill: SkillLevel, prefs: Prefs) {
  const jar = await cookies();
  jar.set(SKILL_COOKIE, skill, { maxAge: YEAR, sameSite: "lax", path: "/" });
  jar.set(PREFS_COOKIE, JSON.stringify(prefs), { maxAge: YEAR, sameSite: "lax", path: "/" });
}

/** One subscription read per request, however many components ask for the viewer. */
const accessForUser = cache((userId: string) => activeAccess(userId));

export async function getViewer(): Promise<Viewer & { tier: Tier; access: Access; onboarded: boolean; prefs: Prefs }> {
  const jar = await cookies();
  // The plan: for real accounts the `subscriptions` table decides (the payment webhooks keep it
  // current, so cancellations, expiries and upgrades count). The signed plan cookie is only the
  // answer when Supabase isn't available: demo mode, or a database outage.
  // During the free days everything is unlocked; afterwards the chosen plan decides.
  const cookieAccess = accessFromCookie(verifyValue(jar.get(PLAN_COOKIE)?.value));
  const user = await getUser();
  const access = (user ? await accessForUser(user.id) : null) ?? cookieAccess;
  const tier = access.tier;
  return {
    skill: parseSkill(jar.get(SKILL_COOKIE)?.value),
    plan: tier === "free" ? "free" : "premium",
    tier,
    access,
    onboarded: jar.has(SKILL_COOKIE),
    prefs: readPrefs(jar),
  };
}
