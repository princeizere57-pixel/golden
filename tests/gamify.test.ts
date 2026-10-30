import { describe, expect, it } from "vitest";
import { RANKS, XP, currentMood, dayKey, liveStreak, nextStreak, rankFor } from "@/lib/gamify";

describe("ranks", () => {
  it("starts as Kitchen Porter and climbs with XP", () => {
    expect(rankFor(0).title).toBe("Kitchen Porter");
    expect(rankFor(99).title).toBe("Kitchen Porter");
    expect(rankFor(100).title).toBe("Commis Chef");
    expect(rankFor(3000)).toMatchObject({ title: "Head Chef", next: undefined, progress: 1, toNext: 0 });
  });

  it("reports progress to the next rank", () => {
    expect(rankFor(200)).toMatchObject({ title: "Commis Chef", next: "Line Cook", progress: 0.5, toNext: 100 });
  });

  it("needs two cooked dishes for the first promotion", () => {
    expect(rankFor(XP.cooked).index).toBe(0);
    expect(rankFor(XP.cooked * 2).index).toBe(1);
    expect(RANKS.map((r) => r.xp)).toEqual([...RANKS.map((r) => r.xp)].sort((a, b) => a - b));
  });
});

describe("streaks", () => {
  it("starts, extends, holds and resets", () => {
    expect(nextStreak(null, 0, "2026-10-27")).toBe(1);
    expect(nextStreak("2026-10-26", 4, "2026-10-27")).toBe(5);
    expect(nextStreak("2026-10-27", 5, "2026-10-27")).toBe(5);
    expect(nextStreak("2026-10-24", 5, "2026-10-27")).toBe(1);
    expect(nextStreak("2026-10-31", 3, "2026-11-01")).toBe(4);
  });

  it("shows a live streak only if you cooked today or yesterday", () => {
    expect(liveStreak("2026-10-26", 3, "2026-10-27")).toBe(3);
    expect(liveStreak("2026-10-25", 3, "2026-10-27")).toBe(0);
    expect(liveStreak(null, 0, "2026-10-27")).toBe(0);
  });

  it("formats local day keys", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

it("lets moods fade back to neutral", () => {
  const now = Date.now();
  expect(currentMood(undefined, now)).toBe("neutral");
  expect(currentMood({ state: "happy", at: now - 60_000 }, now)).toBe("happy");
  expect(currentMood({ state: "sad", at: now - 7 * 3_600_000 }, now)).toBe("neutral");
});
