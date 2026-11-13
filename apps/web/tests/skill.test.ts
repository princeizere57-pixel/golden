import { describe, expect, it } from "vitest";
import { getRecipe } from "@/lib/data/recipes";
import { activeMinutes, adaptRecipe, microSteps, validateAdapted } from "@/lib/skill/adapt";

const pasta = getRecipe("garlic-butter-pasta")!;

describe("microSteps", () => {
  it("splits sentences and 'then' clauses", () => {
    expect(microSteps("Bring water to a boil, then salt it. Stir.")).toEqual(["Bring water to a boil.", "Salt it.", "Stir."]);
  });
});

describe("adaptRecipe", () => {
  it("keeps one step per block at every level", () => {
    for (const skill of ["beginner", "intermediate", "chef"] as const) {
      expect(adaptRecipe(pasta, skill).steps).toHaveLength(pasta.blocks.length);
    }
  });

  it("gives beginners more, smaller instructions with heat, cues and definitions", () => {
    const beginner = adaptRecipe(pasta, "beginner").steps;
    const chef = adaptRecipe(pasta, "chef").steps;
    const count = (steps: typeof beginner) => steps.reduce((n, s) => n + s.instructions.length, 0);
    expect(count(beginner)).toBeGreaterThan(count(chef));
    expect(beginner[0].instructions[0]).toBe("Set the large pot over high heat.");
    expect(beginner[0].instructions.at(-1)).toMatch(/^It's ready when big bubbles/);
    expect(beginner[0].notes).toContain("rolling boil: bubbles that keep going even when you stir");
  });

  it("gives chefs the science notes", () => {
    expect(adaptRecipe(pasta, "chef").steps[3].notes[0]).toMatch(/160 °C/);
  });

  it("never changes timings", () => {
    const steps = adaptRecipe(pasta, "intermediate").steps;
    expect(steps.map((s) => s.minutes)).toEqual(pasta.blocks.map((b) => b.minutes));
  });
});

describe("validateAdapted", () => {
  const good = { steps: pasta.blocks.map(() => ({ instructions: ["Do it."], notes: ["Note"] })) };

  it("accepts a well-formed rewrite and keeps structure from the recipe", () => {
    const out = validateAdapted(pasta, "chef", good)!;
    expect(out.source).toBe("ai");
    expect(out.steps[2].minutes).toBe(9);
    expect(out.steps[2].timerLabel).toBe("Pasta");
  });

  it("rejects the wrong number of steps, empty instructions or junk", () => {
    expect(validateAdapted(pasta, "chef", { steps: good.steps.slice(1) })).toBeNull();
    expect(validateAdapted(pasta, "chef", { steps: good.steps.map(() => ({ instructions: [] })) })).toBeNull();
    expect(validateAdapted(pasta, "chef", "nope")).toBeNull();
    expect(validateAdapted(pasta, "chef", null)).toBeNull();
  });
});

it("counts only hands-on minutes", () => {
  expect(activeMinutes(pasta)).toBe(8);
});
