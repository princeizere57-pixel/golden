import { describe, expect, it } from "vitest";
import { orchestrate, type Task } from "@/lib/timing/orchestrate";

const t = (id: string, dish: string, minutes: number, attention: Task["attention"]): Task => ({ id, dish, label: id, minutes, attention });

describe("orchestrate", () => {
  it("runs a single dish back to back", () => {
    const s = orchestrate([[t("a", "A", 5, "active"), t("b", "A", 10, "passive")]]);
    expect(s.totalMinutes).toBe(15);
    expect(s.tasks.map((x) => [x.id, x.start, x.end])).toEqual([["a", 0, 5], ["b", 5, 15]]);
  });

  it("finishes every dish at the same time when possible", () => {
    const s = orchestrate([
      [t("rice-boil", "Rice", 2, "active"), t("rice-simmer", "Rice", 20, "passive")],
      [t("salmon-sear", "Salmon", 6, "active"), t("salmon-rest", "Salmon", 2, "passive")],
    ]);
    const ends = ["rice-simmer", "salmon-rest"].map((id) => s.tasks.find((x) => x.id === id)!.end);
    expect(ends).toEqual([s.totalMinutes, s.totalMinutes]);
  });

  it("never overlaps two hands-on tasks", () => {
    const s = orchestrate([
      [t("a1", "A", 4, "active"), t("a2", "A", 3, "active")],
      [t("b1", "B", 5, "active"), t("b2", "B", 2, "active")],
      [t("c1", "C", 1, "active"), t("c2", "C", 15, "passive")],
    ]);
    const active = s.tasks.filter((x) => x.attention === "active").sort((x, y) => x.start - y.start);
    for (let i = 1; i < active.length; i++) expect(active[i].start).toBeGreaterThanOrEqual(active[i - 1].end);
    expect(s.tasks[0].start).toBe(0);
  });

  it("keeps each dish's steps in order", () => {
    const s = orchestrate([
      [t("x1", "X", 3, "active"), t("x2", "X", 3, "active")],
      [t("y1", "Y", 3, "active"), t("y2", "Y", 3, "active")],
    ]);
    const at = (id: string) => s.tasks.find((x) => x.id === id)!;
    expect(at("x2").start).toBeGreaterThanOrEqual(at("x1").end);
    expect(at("y2").start).toBeGreaterThanOrEqual(at("y1").end);
    expect(s.totalMinutes).toBe(12);
  });

  it("handles no dishes", () => {
    expect(orchestrate([])).toEqual({ tasks: [], totalMinutes: 0 });
  });
});
