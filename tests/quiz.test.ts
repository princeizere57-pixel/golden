import { describe, expect, it } from "vitest";
import { QUESTIONS, prefsFromAnswers, skillFromAnswers } from "@/lib/skill/quiz";
import { formatDuration, recipeHref } from "@/lib/links";

describe("skill quiz", () => {
  it("scores new cooks as beginners", () => {
    expect(skillFromAnswers({ confidence: ["new"] }).skill).toBe("beginner");
    expect(skillFromAnswers({ confidence: ["follow"], techniques: ["rice"] }).skill).toBe("beginner");
    expect(skillFromAnswers({}).skill).toBe("beginner");
  });

  it("scores recipe-followers with some techniques as intermediate", () => {
    expect(skillFromAnswers({ confidence: ["follow"], techniques: ["rice", "sear"] }).skill).toBe("intermediate");
    expect(skillFromAnswers({ confidence: ["riff"] }).skill).toBe("intermediate");
  });

  it("scores confident cooks with technique as chefs", () => {
    expect(skillFromAnswers({ confidence: ["riff"], techniques: ["sear", "pan-sauce", "roux", "rescue"] })).toEqual({ skill: "chef", score: 9 });
    expect(skillFromAnswers({ confidence: ["pro"], techniques: ["rescue"] }).skill).toBe("chef");
  });

  it("ignores unknown answers", () => {
    expect(skillFromAnswers({ confidence: ["nonsense"], techniques: ["x"] }).score).toBe(0);
  });

  it("turns answers into preferences with defaults", () => {
    expect(prefsFromAnswers({ household: ["family"], time: ["60"], goals: ["knife"] })).toEqual({ serves: 4, weeknightMinutes: 60, goals: ["knife"] });
    expect(prefsFromAnswers({})).toEqual({ serves: 2, weeknightMinutes: 30, goals: [] });
  });

  it("has a highlighted word and options in every question", () => {
    for (const q of QUESTIONS) {
      expect(q.title[1].length).toBeGreaterThan(0);
      expect(q.options.length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("links", () => {
  it("routes each kind of recipe", () => {
    expect(recipeHref({ slug: "fluffy-rice" })).toBe("/recipes/fluffy-rice");
    expect(recipeHref({ slug: "mealdb-52771" })).toBe("/meals/52771");
    expect(recipeHref({ slug: "my-abc" })).toBe("/my/my-abc");
  });

  it("formats durations", () => {
    expect(formatDuration(40)).toBe("40 mins");
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(70)).toBe("1 hr 10 mins");
  });
});

it("only accepts meal-plan back links", async () => {
  const { safePlanBack } = await import("@/lib/links");
  expect(safePlanBack("/plan?dish=fluffy-rice&dish=mealdb-52893&active=fluffy-rice")).toBe("/plan?dish=fluffy-rice&dish=mealdb-52893&active=fluffy-rice");
  expect(safePlanBack("https://evil.example")).toBeUndefined();
  expect(safePlanBack("//evil.example")).toBeUndefined();
  expect(safePlanBack("/planner")).toBeUndefined();
  expect(safePlanBack(undefined)).toBeUndefined();
});
