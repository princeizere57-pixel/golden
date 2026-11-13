import { describe, expect, it } from "vitest";
import { HOME_SEGMENTS, RECIPES } from "@/lib/data/recipes";
import { buildHome, isVisible, matchesFilter } from "@/lib/discovery/segments";

describe("isVisible", () => {
  it("shows everything without a rule and filters by plan and skill", () => {
    const viewer = { plan: "free", skill: "beginner" } as const;
    expect(isVisible(undefined, viewer)).toBe(true);
    expect(isVisible({ plans: ["premium"] }, viewer)).toBe(false);
    expect(isVisible({ skills: ["beginner", "intermediate"] }, viewer)).toBe(true);
    expect(isVisible({ plans: ["free"], skills: ["chef"] }, viewer)).toBe(false);
  });
});

describe("buildHome", () => {
  const ids = (plan: "free" | "premium", skill: "beginner" | "chef", inProgress: string[] = []) =>
    buildHome(HOME_SEGMENTS, { plan, skill }, { recipes: RECIPES, inProgress }).map((s) => s.id);

  it("targets segments by skill and plan", () => {
    expect(ids("free", "beginner")).toContain("first-steps");
    expect(ids("free", "chef")).not.toContain("first-steps");
    expect(ids("free", "chef")).toContain("promo");
    expect(ids("premium", "chef")).not.toContain("promo");
  });

  it("drops empty rails and fills continue cooking", () => {
    expect(ids("free", "beginner")).not.toContain("continue");
    expect(ids("free", "beginner", ["fluffy-rice"])[0]).toBe("continue");
  });

  it("narrows every rail to the chosen category", () => {
    const built = buildHome(HOME_SEGMENTS, { plan: "premium", skill: "chef" }, { recipes: RECIPES, category: "Fish" });
    for (const s of built) if (s.type === "recipes") expect(s.recipes.every((r) => r.category === "Fish")).toBe(true);
  });
});

it("filters by hands-on time and dietary", () => {
  const traybake = RECIPES.find((r) => r.slug === "crispy-chickpea-traybake")!;
  expect(matchesFilter(traybake, { maxActiveMinutes: 6, dietary: "vegan" })).toBe(true);
  expect(matchesFilter(traybake, { maxActiveMinutes: 5 })).toBe(false);
});
