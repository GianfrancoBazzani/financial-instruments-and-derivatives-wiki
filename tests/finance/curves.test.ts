import { describe, expect, it } from "vitest";
import {
  carryRollDown,
  discountFactor,
  forwardRate,
  parRate,
  polyZeroCurve,
  type ZeroCurve,
} from "../../src/lib/finance/curves";

const z: ZeroCurve = (t) => ({ 1: 0.03, 2: 0.04, 3: 0.045 } as Record<number, number>)[t];

describe("discountFactor", () => {
  it("annual", () => {
    expect(discountFactor(0.045, 2, 1)).toBeCloseTo(0.9157, 4);
    expect(discountFactor(0.052, 5, 1)).toBeCloseTo(0.7761, 4);
  });
  it("continuous", () => {
    expect(discountFactor(0.045, 2, "continuous")).toBeCloseTo(0.9139, 4);
    expect(discountFactor(0.052, 5, "continuous")).toBeCloseTo(0.7711, 4);
  });
});

describe("parRate", () => {
  it("annual and continuous zero rates", () => {
    expect(parRate(z, 3, 1, 1)).toBeCloseTo(0.04463, 4);
    expect(parRate(z, 3, 1, "continuous")).toBeCloseTo(0.04564, 4);
  });
  it("flat curve: par rate equals zero rate", () => expect(parRate(() => 0.04, 7, 1, 1)).toBeCloseTo(0.04, 10));
});

describe("forwardRate", () => {
  it("annual", () => {
    expect(forwardRate(0.03, 1, 0.04, 2, 1)).toBeCloseTo(0.0501, 4);
    expect(forwardRate(0.04, 2, 0.045, 3, 1)).toBeCloseTo(0.0551, 4);
  });
  it("continuous", () => expect(forwardRate(0.03, 1, 0.04, 2, "continuous")).toBeCloseTo(0.05, 10));
});

describe("polyZeroCurve", () => {
  it("level + slope t + curvature t^2", () => expect(polyZeroCurve(0.02, 0.01, 0.001)(3)).toBeCloseTo(0.059, 12));
});

describe("carryRollDown", () => {
  const c = carryRollDown({ couponRate: 0.05, maturity: 5, yieldNow: 0.045, yieldAtHorizon: 0.043, horizon: 1 });
  it("prices", () => {
    expect(c.priceNow).toBeCloseTo(102.19, 1);
    expect(c.priceNew).toBeCloseTo(102.52, 2);
  });
  it("components", () => {
    expect(c.amortization).toBeCloseTo(-0.4, 2);
    expect(c.carry).toBeCloseTo(0.045, 4);
    expect(c.rollDown).toBeCloseTo(0.0071, 4);
    expect(c.total).toBeCloseTo(0.0521, 4);
  });
});

describe("extremes", () => {
  it("rate exactly 0", () => {
    for (const comp of [1, 2, "continuous" as const]) {
      expect(discountFactor(0, 5, comp)).toBe(1);
      expect(parRate(() => 0, 5, 2, comp)).toBe(0);
      expect(forwardRate(0, 1, 0, 2, comp)).toBe(0);
    }
  });
  it("par rate with maturity equal to one coupon period", () => {
    expect(parRate(() => 0.04, 1, 1, 1)).toBeCloseTo(0.04, 10);
    expect(parRate(() => 0.04, 0.5, 2, "continuous")).toBeGreaterThan(0.03);
  });
  it("equal times in forwardRate stay finite", () => expect(Number.isFinite(forwardRate(0.03, 1, 0.04, 1, 1))).toBe(true));
  it("carryRollDown at zero rates, zero horizon and horizon just below maturity", () => {
    const cases = [
      { couponRate: 0.05, maturity: 5, yieldNow: 0, yieldAtHorizon: 0, horizon: 1 },
      { couponRate: 0.05, maturity: 5, yieldNow: 0.045, yieldAtHorizon: 0.043, horizon: 0 },
      { couponRate: 0.05, maturity: 5, yieldNow: 0.045, yieldAtHorizon: 0.043, horizon: 5 - 1e-6 },
      { couponRate: 0.05, maturity: 1, yieldNow: 0.045, yieldAtHorizon: 0.043, horizon: 1 - 1e-6 },
    ];
    for (const a of cases) for (const v of Object.values(carryRollDown(a))) expect(Number.isFinite(v)).toBe(true);
  });
});
