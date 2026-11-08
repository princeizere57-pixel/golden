import { describe, expect, it } from "vitest";
import { OFFERS, TRIAL_HEADLINE_DAYS, newOrderId, offerById, perMonth, percentOff, priceLine } from "@/lib/billing/offers";
import { covers, isStaple, pantryMatch } from "@/lib/pantry";

describe("offers", () => {
  it("follows the Grand Slam money model", () => {
    expect(offerById("executive")).toMatchObject({ name: "Golden Executive Chef System", price: 100, regularPrice: 500, planType: "renewal", billingPeriodDays: 365, trialDays: 3, planEnv: "WHOP_PLAN_EXECUTIVE" });
    expect(offerById("experience")).toMatchObject({ name: "The Golden Experience", price: 50, billingPeriodDays: 365, trialDays: 3, planEnv: "WHOP_PLAN_EXPERIENCE" });
    expect(OFFERS.map((o) => o.id)).toEqual(["executive", "experience"]);
    expect(offerById("year")).toBeUndefined();
    expect(percentOff(offerById("executive")!)).toBe(80);
  });

  it("describes prices for buyers", () => {
    expect(priceLine(offerById("executive")!)).toBe("3 days free, then $100/year");
    expect(priceLine(offerById("experience")!)).toBe("3 days free, then $50/year");
    expect(perMonth(offerById("executive")!)).toBe("$8.33");
    expect(TRIAL_HEADLINE_DAYS).toBe(3);
  });

  it("makes unique, recognisable order IDs", () => {
    const a = newOrderId();
    expect(a).toMatch(/^gld_[a-z0-9]+_[0-9a-f]{12}$/);
    expect(newOrderId()).not.toBe(a);
  });
});

describe("pantry", () => {
  it("matches ingredients by word, singular or plural", () => {
    expect(covers("chicken", "Chicken Thighs")).toBe(true);
    expect(covers("tomato", "Chopped Tomatoes")).toBe(true);
    expect(covers("egg", "Eggplant")).toBe(false);
    expect(isStaple("Olive Oil")).toBe(true);
  });

  it("ignores staples and reports what's missing", () => {
    const m = pantryMatch(["Chicken Breast", "Rice", "Salt", "Olive Oil", "Lemon"], ["chicken", "rice"]);
    expect(m.have).toEqual(["Chicken Breast", "Rice"]);
    expect(m.missing).toEqual(["Lemon"]);
    expect(m.ratio).toBeCloseTo(2 / 3);
    expect(pantryMatch(["Salt"], []).ratio).toBe(0);
  });
});
