import { describe, expect, it } from "vitest";
import { OFFERS, TRIAL_HEADLINE_DAYS, newOrderId, offerById, priceLine } from "@/lib/billing/offers";
import { covers, isStaple, pantryMatch } from "@/lib/pantry";

describe("offers", () => {
  it("matches the plans configured in Whop", () => {
    expect(offerById("year")).toMatchObject({ name: "Golden Year", price: 45.09, planType: "renewal", billingPeriodDays: 365, trialDays: 3, planEnv: "WHOP_PLAN_YEAR" });
    expect(offerById("month")).toMatchObject({ price: 7.99, planType: "renewal", billingPeriodDays: 30, trialDays: 3, planEnv: "WHOP_PLAN_MONTH" });
    expect(OFFERS.map((o) => o.id)).toEqual(["year", "month"]);
    expect(offerById("lifetime")).toBeUndefined();
  });

  it("describes prices for buyers", () => {
    expect(priceLine(offerById("year")!)).toBe("3 days free, then $45.09/year");
    expect(priceLine(offerById("month")!)).toBe("3 days free, then $7.99/month");
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
