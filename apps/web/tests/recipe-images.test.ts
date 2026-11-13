import { describe, expect, it } from "vitest";
import { RECIPES } from "@/lib/data/recipes";

describe("recipe photos", () => {
  it("every Golden recipe has a photo (recipes without one are left out of the app)", () => {
    expect(RECIPES.filter((r) => !r.image).map((r) => r.slug)).toEqual([]);
  });
});

describe("cook-mode technique pictures", () => {
  it("has a transparent picture for every kind of step", async () => {
    const { existsSync } = await import("node:fs");
    for (const kind of ["prep", "heat", "timing"]) expect(existsSync(`public/photos/technique-${kind}.webp`)).toBe(true);
  });
});
