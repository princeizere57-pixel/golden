"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PLAN_COOKIE, SKILL_COOKIE, parseSkill } from "@/lib/viewer";

const YEAR = 60 * 60 * 24 * 365;

export async function setSkill(skill: string) {
  (await cookies()).set(SKILL_COOKIE, parseSkill(skill), { maxAge: YEAR, sameSite: "lax", path: "/" });
}

/** Level switch used by forms (e.g. on Explore); the page re-renders with the new level. */
export async function chooseSkill(form: FormData) {
  await setSkill(String(form.get("skill")));
}

/** Onboarding quiz: each answer scores 0–2; the total picks a level. */
export async function finishOnboarding(form: FormData) {
  const score = ["q1", "q2", "q3"].reduce((sum, q) => sum + Number(form.get(q) ?? 0), 0);
  await setSkill(score >= 5 ? "chef" : score >= 3 ? "intermediate" : "beginner");
  redirect("/");
}

/** Demo-only plan switch, used when Stripe isn't configured. Real plans come from webhooks. */
export async function setDemoPlan(plan: "free" | "premium") {
  if (process.env.STRIPE_US_SECRET_KEY || process.env.STRIPE_UK_SECRET_KEY) throw new Error("Demo plans are disabled when Stripe is configured");
  (await cookies()).set(PLAN_COOKIE, plan, { maxAge: YEAR, sameSite: "lax", path: "/" });
  redirect(plan === "premium" ? "/account?trial=started" : "/account");
}
