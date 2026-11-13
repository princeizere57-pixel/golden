import { describe, expect, it } from "vitest";
import { FEEDBACK_MAX_LENGTH, cleanFeedback, feedbackQuestion, shouldAskFeedback, validRating } from "@/lib/feedback";

describe("feedback prompt", () => {
  const fresh = { sent: false, skippedAt: null };

  it("waits for the third finished meal", () => {
    expect(shouldAskFeedback(0, fresh)).toBe(false);
    expect(shouldAskFeedback(2, fresh)).toBe(false);
    expect(shouldAskFeedback(3, fresh)).toBe(true);
    expect(shouldAskFeedback(10, fresh)).toBe(true);
  });

  it("never asks again once sent, and waits three more meals after a skip", () => {
    expect(shouldAskFeedback(50, { sent: true, skippedAt: null })).toBe(false);
    expect(shouldAskFeedback(4, { sent: false, skippedAt: 3 })).toBe(false);
    expect(shouldAskFeedback(5, { sent: false, skippedAt: 3 })).toBe(false);
    expect(shouldAskFeedback(6, { sent: false, skippedAt: 3 })).toBe(true);
  });

  it("keeps only a clean, capped note", () => {
    expect(cleanFeedback("  Love the timer!  ")).toBe("Love the timer!");
    expect(cleanFeedback("   ")).toBeNull();
    expect(cleanFeedback(42)).toBeNull();
    expect(cleanFeedback("x".repeat(5000))?.length).toBe(FEEDBACK_MAX_LENGTH);
  });

  it("accepts ratings 1 to 5 only and asks a question that fits", () => {
    expect([0, 1, 5, 6, 2.5, "3"].map(validRating)).toEqual([false, true, true, false, false, false]);
    expect(feedbackQuestion(1)).toMatch(/went wrong/);
    expect(feedbackQuestion(3)).toMatch(/better/);
    expect(feedbackQuestion(5)).toMatch(/like most/);
  });
});
