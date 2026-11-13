// Onboarding quiz: questions and the scoring that turns answers into a skill level. Pure.

import type { SkillLevel } from "@/lib/types";

export interface Option {
  id: string;
  emoji: string;
  label: string;
  /** Points towards the skill level. */
  points?: number;
  /** Optional value a question feeds into preferences. */
  value?: number;
}

export interface Question {
  id: "household" | "confidence" | "techniques" | "time" | "goals";
  title: [string, string, string];
  hint?: string;
  multi?: boolean;
  options: Option[];
}

// Titles are [before, highlighted, after] so the key word can be drawn in the accent colour.
export const QUESTIONS: Question[] = [
  {
    id: "household",
    title: ["Who's at your ", "table", " most nights?"],
    options: [
      { id: "solo", emoji: "🍽️", label: "Just me", value: 1 },
      { id: "two", emoji: "🥂", label: "Two of us", value: 2 },
      { id: "family", emoji: "👨‍👩‍👧", label: "Family with kids", value: 4 },
      { id: "shared", emoji: "🏠", label: "Housemates", value: 4 },
      { id: "crowd", emoji: "🎉", label: "Usually a crowd", value: 6 },
    ],
  },
  {
    id: "confidence",
    title: ["How ", "confident", " are you at the stove?"],
    options: [
      { id: "new", emoji: "🥚", label: "Boiling an egg feels brave", points: 0 },
      { id: "follow", emoji: "📖", label: "I follow recipes step by step", points: 2 },
      { id: "riff", emoji: "🎛️", label: "I tweak recipes as I go", points: 4 },
      { id: "pro", emoji: "🔪", label: "I could run a busy kitchen", points: 6 },
    ],
  },
  {
    id: "techniques",
    title: ["Which could you do ", "without", " a recipe?"],
    hint: "Pick all that apply. It's fine to pick none.",
    multi: true,
    options: [
      { id: "rice", emoji: "🍚", label: "Cook rice so it's fluffy", points: 1 },
      { id: "sear", emoji: "🥩", label: "Sear meat or fish properly", points: 1 },
      { id: "pan-sauce", emoji: "🍳", label: "Make a pan sauce", points: 1 },
      { id: "roux", emoji: "🥛", label: "Make a roux or white sauce", points: 1 },
      { id: "rescue", emoji: "🛟", label: "Rescue a split sauce", points: 2 },
    ],
  },
  {
    id: "time",
    title: ["How much ", "time", " do you usually have to cook?"],
    options: [
      { id: "15", emoji: "⚡", label: "15 minutes, tops", value: 15 },
      { id: "30", emoji: "⏱️", label: "Around half an hour", value: 30 },
      { id: "60", emoji: "⏰", label: "Up to an hour", value: 60 },
      { id: "slow", emoji: "🍲", label: "I love a long, slow cook", value: 120 },
    ],
  },
  {
    id: "goals",
    title: ["What do you want to get ", "better", " at?"],
    hint: "Pick as many as you like.",
    multi: true,
    options: [
      { id: "knife", emoji: "🔪", label: "Knife skills" },
      { id: "timing", emoji: "⏲️", label: "Getting everything ready at once" },
      { id: "flavour", emoji: "🧂", label: "Seasoning and flavour" },
      { id: "healthy", emoji: "🥗", label: "Cooking healthier" },
      { id: "faster", emoji: "🏃", label: "Cooking faster" },
      { id: "impress", emoji: "✨", label: "Dishes that impress" },
    ],
  },
];

export type Answers = Partial<Record<Question["id"], string[]>>;

const option = (q: Question["id"], id: string) => QUESTIONS.find((x) => x.id === q)?.options.find((o) => o.id === id);

/** Confidence (0–6) plus techniques (0–6): 0–3 beginner, 4–7 intermediate, 8+ chef. */
export function skillFromAnswers(answers: Answers): { skill: SkillLevel; score: number } {
  const score = (["confidence", "techniques"] as const)
    .flatMap((q) => (answers[q] ?? []).map((id) => option(q, id)?.points ?? 0))
    .reduce((a, b) => a + b, 0);
  return { skill: score >= 8 ? "chef" : score >= 4 ? "intermediate" : "beginner", score };
}

export function prefsFromAnswers(answers: Answers) {
  return {
    serves: option("household", answers.household?.[0] ?? "")?.value ?? 2,
    weeknightMinutes: option("time", answers.time?.[0] ?? "")?.value ?? 30,
    goals: answers.goals ?? [],
  };
}

/** What each level gets, shown on the result screen. */
export const LEVEL_PITCH: Record<SkillLevel, { name: string; lines: string[] }> = {
  beginner: {
    name: "Beginner",
    lines: ["Small steps with what to look, listen and smell for", "Every cooking term explained as you go", "Easy wins first, then a new technique each week"],
  },
  intermediate: {
    name: "Intermediate",
    lines: ["Kitchen shorthand without the hand-holding", "Timers to juggle two or three dishes at once", "Techniques that level up your weeknight cooking"],
  },
  chef: {
    name: "Chef",
    lines: ["Technique-first methods with temperatures and targets", "The food science behind each step", "Ambitious dishes and multi-course timing"],
  },
};
