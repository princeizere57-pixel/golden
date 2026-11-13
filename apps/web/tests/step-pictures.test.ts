import { existsSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RECIPES } from "@/lib/data/recipes";
import { STEP_PICTURES } from "@/lib/data/step-pictures";

describe("step pictures", () => {
  it("point at real steps and real files", () => {
    for (const [slug, blocks] of Object.entries(STEP_PICTURES)) {
      const recipe = RECIPES.find((r) => r.slug === slug);
      expect(recipe, slug).toBeDefined();
      for (const id of blocks) {
        const block = recipe!.blocks.find((b) => b.id === id);
        expect(block?.picture, `${slug}/${id}`).toBe(`/steps/${slug}/${id}.webp`);
        expect(existsSync(`public${block!.picture}`), `${slug}/${id}.webp`).toBe(true);
      }
    }
  });

  it("covers every step of the real-time recipes", () => {
    for (const r of RECIPES.filter((x) => x.realTime)) for (const b of r.blocks) expect(b.picture, `${r.slug}/${b.id}`).toBeDefined();
  });

  it("has no stray files", () => {
    for (const slug of readdirSync("public/steps")) {
      for (const file of readdirSync(`public/steps/${slug}`)) expect(STEP_PICTURES[slug]).toContain(file.replace(/\.webp$/, ""));
    }
  });
});
