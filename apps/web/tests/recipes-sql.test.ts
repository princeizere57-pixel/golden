import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RECIPES } from "@/lib/data/recipes";
import { recipesToSql } from "@/lib/data/recipes-sql";

const MIGRATION = "supabase/migrations/0005_seed_recipes.sql";
const SETUP = "supabase/setup_all.sql";

describe("seed recipes in Supabase", () => {
  it("keeps the migration in sync with the recipes the app ships", () => {
    const sql = recipesToSql(RECIPES);
    if (process.env.UPDATE_SQL) {
      writeFileSync(MIGRATION, sql);
      const setup = readFileSync(SETUP, "utf8");
      const header = `-- ===== ${MIGRATION} =====`;
      const before = setup.includes(header) ? setup.slice(0, setup.indexOf(header)).trimEnd() : setup.trimEnd();
      writeFileSync(SETUP, `${before}\n\n${header}\n${sql}`);
    }
    expect(readFileSync(MIGRATION, "utf8")).toBe(sql);
    expect(readFileSync(SETUP, "utf8")).toContain(sql);
  });

  it("escapes quotes and stores every block", () => {
    const sql = recipesToSql(RECIPES);
    expect(sql).toContain("'Golden Kitchen'");
    expect(sql).toContain("Nothing goes in the bin"); // recipe text made it in
    expect(sql).toContain("isn''t fully hot"); // apostrophes are doubled inside SQL strings
    expect(sql).not.toContain("isn't fully hot");
    for (const r of RECIPES) expect(sql).toContain(`delete from recipe_blocks where recipe_slug = '${r.slug}';`);
  });
});
