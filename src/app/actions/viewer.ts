"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { JOURNEY_COOKIE } from "@/lib/journey";
import { parseTier, planCookieValue, type Tier } from "@/lib/billing/entitlements";
import { demoPaymentsAllowed } from "@/lib/billing/demo";
import { ATTRACTION } from "@/lib/billing/offers";
import { signValue } from "@/lib/signed-cookie";
import { PLAN_COOKIE, PREFS_COOKIE, SKILL_COOKIE, parseSkill } from "@/lib/viewer";

const YEAR = 60 * 60 * 24 * 365;

export async function setSkill(skill: string) {
  (await cookies()).set(SKILL_COOKIE, parseSkill(skill), { maxAge: YEAR, sameSite: "lax", path: "/" });
}

/** Level switch used by forms (e.g. on Explore); the page re-renders with the new level. */
export async function chooseSkill(form: FormData) {
  await setSkill(String(form.get("skill")));
}

/** Saves the onboarding answers. The level itself is scored on the client (see skillFromAnswers). */
export async function saveOnboarding(answers: { skill: string; serves: number; weeknightMinutes: number; goals: string[] }) {
  await setSkill(answers.skill);
  const prefs = {
    serves: Math.min(12, Math.max(1, Math.round(Number(answers.serves) || 2))),
    weeknightMinutes: Math.min(240, Math.max(10, Math.round(Number(answers.weeknightMinutes) || 30))),
    goals: (Array.isArray(answers.goals) ? answers.goals : []).filter((g) => typeof g === "string").slice(0, 8),
  };
  (await cookies()).set(PREFS_COOKIE, JSON.stringify(prefs), { maxAge: YEAR, sameSite: "lax", path: "/" });
}

/** Marks the first-run sequence as finished so the rest of the app opens. */
export async function markJourneyDone(): Promise<boolean> {
  // Only after the earlier steps really happened: signed in and a level from the questions.
  const jar = await cookies();
  if (!(await getUser())) return false;
  if (!jar.has(SKILL_COOKIE)) return false;
  jar.set(JOURNEY_COOKIE, "done", { maxAge: YEAR, sameSite: "lax", path: "/", httpOnly: true });
  return true;
}

/** "Not now" on checkout: finish the sequence and open the app. */
export async function finishJourney() {
  // If the earlier steps weren't really finished, "/" simply shows the welcome page again.
  await markJourneyDone();
  redirect("/");
}

/** Demo-only plan switch (no real accounts or payments configured). Real plans come from webhooks. */
export async function setDemoPlan(plan: Tier | "premium") {
  if (!demoPaymentsAllowed()) throw new Error("Demo plans are disabled when real accounts or payments are configured");
  const tier = parseTier(plan);
  // Demo trial: everything unlocked for the free days, then the chosen plan.
  const trialEnds = tier === "free" ? undefined : Date.now() + ATTRACTION.days * 86_400_000;
  (await cookies()).set(PLAN_COOKIE, signValue(planCookieValue(tier, trialEnds)), { maxAge: YEAR, sameSite: "lax", path: "/", httpOnly: true });
  await markJourneyDone();
  redirect(tier === "free" ? "/account" : "/?trial=started");
}
