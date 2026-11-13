import { describe, expect, it } from "vitest";
import { profileSchema } from "@/lib/types";

// The API validates PUT /profile with this schema; onboarding's clamped answers must always pass.
describe("profileSchema", () => {
  it("accepts what onboarding saves", () => {
    expect(profileSchema.safeParse({ skill: "chef", prefs: { serves: 4, weeknightMinutes: 30, goals: ["save-money"] } }).success).toBe(true);
    expect(profileSchema.safeParse({ skill: "beginner", prefs: { serves: 1, weeknightMinutes: 10, goals: [] } }).success).toBe(true);
  });

  it("rejects unknown levels and out-of-range or oversized prefs", () => {
    const prefs = { serves: 2, weeknightMinutes: 30, goals: [] };
    expect(profileSchema.safeParse({ skill: "wizard", prefs }).success).toBe(false);
    expect(profileSchema.safeParse({ skill: "chef", prefs: { ...prefs, serves: 99 } }).success).toBe(false);
    expect(profileSchema.safeParse({ skill: "chef", prefs: { ...prefs, weeknightMinutes: 5 } }).success).toBe(false);
    expect(profileSchema.safeParse({ skill: "chef", prefs: { ...prefs, goals: Array(9).fill("x") } }).success).toBe(false);
    expect(profileSchema.safeParse({ skill: "chef" }).success).toBe(false);
  });
});
