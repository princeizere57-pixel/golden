import { describe, expect, it } from "vitest";
import { MISTAKES, fixMistake } from "@/lib/recovery/fixes";

describe("fixMistake", () => {
  it("has a fix for every catalogued mistake", () => {
    for (const m of MISTAKES) {
      const fix = fixMistake(m.id, { volumeMl: 500 });
      expect(fix.steps.length).toBeGreaterThan(0);
      expect(fix.amounts.length).toBeGreaterThan(0);
    }
  });

  it("dilutes salt by concentration: 1 L at medium severity needs 333 ml", () => {
    expect(fixMistake("too-salty", { volumeMl: 1000, severity: 2 }).amounts[0].amount).toBe("333 ml");
    expect(fixMistake("too-salty", { volumeMl: 1000, severity: 1 }).amounts[0].amount).toBe("176 ml");
  });

  it("scales the cornflour slurry with volume", () => {
    expect(fixMistake("sauce-too-thin", { volumeMl: 500, severity: 2 }).amounts[0].amount).toBe("2 tbsp");
    expect(fixMistake("sauce-too-thin", { volumeMl: 1000, severity: 2 }).amounts[0].amount).toBe("4 tbsp");
  });

  it("scales dairy for heat with severity", () => {
    expect(fixMistake("too-spicy", { volumeMl: 250, severity: 1 }).amounts[0].amount).toBe("2 tbsp");
    expect(fixMistake("too-spicy", { volumeMl: 250, severity: 3 }).amounts[0].amount).toBe("6 tbsp");
  });

  it("clamps tiny batches", () => {
    expect(fixMistake("sauce-too-thick", { volumeMl: 0, severity: 1 }).amounts[0].amount).toBe("5 ml");
  });
});

describe("new mistakes", () => {
  it("rescues dry meat, burnt bottoms and bland dishes with amounts", () => {
    expect(fixMistake("overcooked-meat", { volumeMl: 500 }).amounts[0]).toEqual({ what: "Warm stock or pan juices", amount: "120 ml" });
    expect(fixMistake("burnt-bottom", { volumeMl: 500, severity: 1 }).headline).toMatch(/clean pan/);
    expect(fixMistake("too-bland", { volumeMl: 1000, severity: 2 }).amounts[0]).toEqual({ what: "Salt", amount: "1 tsp" });
  });
});
