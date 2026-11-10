import { describe, expect, it } from "vitest";
import { RECIPES } from "@/lib/data/recipes";
import { REAL_TIME_RECIPES } from "@/lib/data/real-time-recipes";
import { elapsedMinutes, totalMinutes } from "@/lib/links";
import { orchestrate, recipeTasks } from "@/lib/timing/orchestrate";
import type { StepBlock } from "@/lib/types";

const block = (id: string, minutes: number, attention: "active" | "passive", during?: string): StepBlock => ({
  id, kind: "prep", ingredientIds: [], text: id, minutes, attention, during,
});

describe("real-time cooking", () => {
  it("doesn't count prep done while something else cooks", () => {
    const blocks = [block("water", 1, "active"), block("boil", 10, "passive"), block("oil", 4, "active", "boil"), block("tidy", 2, "active", "boil"), block("toss", 2, "active")];
    expect(elapsedMinutes(blocks)).toBe(13);
  });

  it("adds the overrun when the meanwhile work outlasts the wait", () => {
    expect(elapsedMinutes([block("boil", 3, "passive"), block("chop", 5, "active", "boil")])).toBe(5);
  });

  it("folds meanwhile steps into the timeline instead of scheduling them after", () => {
    const tasks = recipeTasks({ slug: "x", title: "X", blocks: [block("boil", 10, "passive"), block("oil", 4, "active", "boil")] });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].label).toBe("boil Meanwhile: oil");
    expect(orchestrate([tasks]).totalMinutes).toBe(10);
  });

  it("ships at least six original real-time recipes, all well formed", () => {
    expect(REAL_TIME_RECIPES.length).toBeGreaterThanOrEqual(6);
    const slugs = RECIPES.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const r of REAL_TIME_RECIPES) {
      expect(r.realTime).toBe(true);
      expect(r.chef).toBe("Golden Kitchen");
      const ids = r.blocks.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
      const ingredientIds = new Set(r.ingredients.map((i) => i.id));
      expect(r.blocks.some((b) => b.during)).toBe(true);
      r.blocks.forEach((b, i) => {
        if (b.kind === "prep") b.ingredientIds.forEach((id) => expect(ingredientIds.has(id)).toBe(true));
        if (b.during) {
          const host = r.blocks.findIndex((x) => x.id === b.during);
          expect(host).toBeGreaterThanOrEqual(0);
          expect(host).toBeLessThan(i);
          expect(r.blocks[host].attention).toBe("passive");
        }
      });
      // Real time beats doing every step one after another.
      expect(totalMinutes(r)).toBeLessThan(r.blocks.reduce((s, b) => s + b.minutes, 0));
      expect(totalMinutes(r)).toBeLessThanOrEqual(45);
    }
  });
});
