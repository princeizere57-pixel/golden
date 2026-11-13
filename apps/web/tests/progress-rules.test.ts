import { describe, expect, it } from "vitest";
import { EMPTY_PROGRESS, LOG_LIMIT, applyEvent, normalizeProgress, progressEventSchema, trustedToday, type Progress, type ProgressEvent } from "@/lib/types";

// The same reducer runs in the browser and on the API, so these rules are the server's rules too.
let n = 0;
const ctx = (today = "2026-11-13", now = 1_000) => ({ now, today, newId: () => `id-${n++}` });
const run = (events: ProgressEvent[], start: Progress = EMPTY_PROGRESS) => events.reduce((p, e) => applyEvent(p, e, ctx()).progress, start);
const cooked: ProgressEvent = { type: "cooked", title: "Pasta", today: "2026-11-13" };

describe("applyEvent", () => {
  it("cooked: +50 XP, a dish, a streak day, a happy mood and a log entry", () => {
    const r = applyEvent(EMPTY_PROGRESS, cooked, ctx());
    expect(r).toMatchObject({ xp: 50, streak: 1, rankedUp: false });
    expect(r.progress).toMatchObject({ xp: 50, dishes: 1, streak: 1, lastCookDay: "2026-11-13", mood: { state: "happy" } });
    expect(r.progress.log[0]).toMatchObject({ kind: "cooked", title: "Cooked", detail: "Pasta · +50 XP" });
  });

  it("the second dish promotes to Commis Chef: rank entry on top, proud mood", () => {
    const r = applyEvent(run([cooked]), cooked, ctx());
    expect(r.rankedUp).toBe(true);
    expect(r.progress.xp).toBe(100);
    expect(r.progress.mood?.state).toBe("proud");
    expect(r.progress.log.map((e) => e.kind)).toEqual(["rank", "cooked", "cooked"]);
    expect(r.added.map((e) => e.kind)).toEqual(["rank", "cooked"]);
  });

  it("fixed earns 15 XP; a mistake earns none and makes Mini You sad", () => {
    expect(run([{ type: "fixed", headline: "Too Salty" }]).xp).toBe(15);
    const sad = run([{ type: "mistake", label: "Burnt garlic", dish: "Pasta" }]);
    expect(sad.xp).toBe(0);
    expect(sad.mood?.state).toBe("sad");
    expect(sad.log[0].detail).toBe("burnt garlic in Pasta");
  });

  it("saving and listing only log; mood and avatar only change themselves", () => {
    const p = run([{ type: "activity", kind: "saved", title: "Saved", detail: "Pasta" }, { type: "mood", state: "focused" }, { type: "avatar", change: { glasses: true } }]);
    expect(p).toMatchObject({ xp: 0, dishes: 0, mood: { state: "focused" }, avatar: { glasses: true, figure: "boy" } });
    expect(p.log).toHaveLength(1);
  });

  it("keeps the newest 60 log entries", () => {
    const p = run(Array.from({ length: 70 }, (_, i) => ({ type: "activity", kind: "listed", title: "List", detail: String(i) }) as ProgressEvent));
    expect(p.log).toHaveLength(LOG_LIMIT);
    expect(p.log[0].detail).toBe("69");
  });

  it("the event can't carry its own XP: unknown fields are stripped by the schema", () => {
    const parsed = progressEventSchema.parse({ ...cooked, xp: 99_999 });
    expect(applyEvent(EMPTY_PROGRESS, parsed, ctx()).progress.xp).toBe(50);
  });
});

describe("trustedToday", () => {
  const noon = Date.parse("2026-11-13T12:00:00Z");
  it("trusts the cook's calendar within a day of the server's", () => {
    expect(trustedToday("2026-11-14", noon)).toBe("2026-11-14");
    expect(trustedToday("2026-11-12", noon)).toBe("2026-11-12");
  });
  it("falls back to the server date when the day is far off or garbage", () => {
    expect(trustedToday("2026-12-25", noon)).toBe("2026-11-13");
    expect(trustedToday("nonsense", noon)).toBe("2026-11-13");
  });
});

describe("normalizeProgress", () => {
  it("fills defaults and drops unknown avatar fields (old photo options)", () => {
    const p = normalizeProgress({ xp: 10, avatar: { figure: "girl", photo: "data:..." } });
    expect(p.avatar).toMatchObject({ figure: "girl", skin: "#e0ac83" });
    expect("photo" in p.avatar).toBe(false);
    expect(p.log).toEqual([]);
  });
});
