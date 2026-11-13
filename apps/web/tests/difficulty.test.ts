import { describe, expect, it } from "vitest";
import { RECIPES, getRecipe } from "@/lib/data/recipes";
import { thumb } from "@/lib/mealdb/convert";
import { difficulty, levelDistance, rankForSkill } from "@/lib/skill/difficulty";
import type { Recipe, StepBlock } from "@/lib/types";

const block = (text: string, minutes = 5): StepBlock => ({ id: text, kind: "prep", ingredientIds: [], text, minutes, attention: "active" });
const make = (ingredients: number, blocks: StepBlock[]): Recipe => ({
  ...getRecipe("fluffy-rice")!,
  ingredients: Array.from({ length: ingredients }, (_, i) => ({ id: `i${i}`, name: `x${i}`, quantity: 1, unit: "pc" })),
  blocks,
});

describe("difficulty", () => {
  it("rates short, simple recipes Easy", () => {
    expect(difficulty(getRecipe("fluffy-rice")!)).toMatchObject({ level: "beginner", label: "Easy" });
  });

  it("rates long, technique-heavy recipes Advanced", () => {
    const hard = make(14, Array.from({ length: 9 }, (_, i) => block(i === 0 ? "Make a roux, then temper the eggs and fold in the meringue." : "Stir.", 12)));
    expect(difficulty(hard)).toMatchObject({ level: "chef", label: "Advanced" });
  });

  it("lands in between for moderate recipes", () => {
    expect(difficulty(make(10, [block("Braise the beef.", 50)])).level).toBe("intermediate");
  });

  it("rates every seed recipe", () => {
    for (const r of RECIPES) expect(["beginner", "intermediate", "chef"]).toContain(difficulty(r).level);
  });
});

describe("rankForSkill", () => {
  const items = [
    { id: "a", level: "chef" as const },
    { id: "b", level: "beginner" as const },
    { id: "c", level: "intermediate" as const },
    { id: "d", level: undefined },
    { id: "e", level: "beginner" as const },
  ];

  it("puts the best fit first, then neighbours, unknowns last, stable within tiers", () => {
    expect(rankForSkill(items, "beginner", (x) => x.level).map((x) => x.id)).toEqual(["b", "e", "c", "a", "d"]);
    expect(rankForSkill(items, "chef", (x) => x.level).map((x) => x.id)).toEqual(["a", "c", "b", "e", "d"]);
  });

  it("measures level distance", () => {
    expect(levelDistance("beginner", "chef")).toBe(2);
    expect(levelDistance("intermediate", "intermediate")).toBe(0);
  });
});

it("uses TheMealDB's 350 px variant (at least 300 px)", () => {
  expect(thumb("https://x/a.jpg")).toBe("https://x/a.jpg/medium");
  expect(thumb("https://x/a.jpg/preview")).toBe("https://x/a.jpg/medium");
  expect(thumb("/recipes/a.jpg")).toBe("/recipes/a.jpg");
  for (const r of RECIPES) expect(r.image).toMatch(/\/medium$|^\/recipes\/[a-z0-9-]+\.jpg$/);
});
