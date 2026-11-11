import { describe, expect, it } from "vitest";
import { RECIPES } from "@/lib/data/recipes";

describe("recipe photos", () => {
  it("every Golden recipe has a photo (recipes without one are left out of the app)", () => {
    expect(RECIPES.filter((r) => !r.image).map((r) => r.slug)).toEqual([]);
  });
});
