import { describe, it, expect } from "vitest";
import { PLANS, getPlan, isProPlan } from "../plans";

describe("PLANS", () => {
  it("defines free plan with 3 scans per month", () => {
    expect(PLANS.free.id).toBe("free");
    expect(PLANS.free.priceMonthly).toBe(0);
    expect(PLANS.free.scansPerMonth).toBe(3);
    expect(PLANS.free.stripePriceId).toBeNull();
  });

  it("defines pro plan with unlimited scans", () => {
    expect(PLANS.pro.id).toBe("pro");
    expect(PLANS.pro.priceMonthly).toBe(29);
    expect(PLANS.pro.scansPerMonth).toBe(Infinity);
  });
});

describe("getPlan", () => {
  it("returns free plan by default for unknown plan ids", () => {
    const plan = getPlan("nonexistent");
    expect(plan.id).toBe("free");
  });

  it("returns correct plan for valid id", () => {
    expect(getPlan("free").id).toBe("free");
    expect(getPlan("pro").id).toBe("pro");
  });
});

describe("isProPlan", () => {
  it("returns true for pro", () => {
    expect(isProPlan("pro")).toBe(true);
  });

  it("returns false for free", () => {
    expect(isProPlan("free")).toBe(false);
  });

  it("returns false for unknown", () => {
    expect(isProPlan("enterprise")).toBe(false);
  });
});
