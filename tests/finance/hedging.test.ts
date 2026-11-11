import { describe, expect, it } from "vitest";
import { effectivePrice, hedgedVariance, minVarianceHedgeRatio } from "../../src/lib/finance/hedging";

describe("minimum variance hedge", () => {
  it("h* = rho sigma_S / sigma_F", () => expect(minVarianceHedgeRatio(0.9, 0.03, 0.04)).toBeCloseTo(0.675, 10));
  it("variance at h* is sigma_S^2 (1 - rho^2)", () =>
    expect(hedgedVariance(0.675, 0.03, 0.04, 0.9)).toBeCloseTo(0.03 ** 2 * (1 - 0.9 ** 2), 12));
  it("another h has a larger variance", () =>
    expect(hedgedVariance(0.5, 0.03, 0.04, 0.9)).toBeGreaterThan(hedgedVariance(0.675, 0.03, 0.04, 0.9)));
  it("perfect correlation, equal volatilities", () => {
    expect(minVarianceHedgeRatio(1, 0.03, 0.03)).toBe(1);
    expect(hedgedVariance(1, 0.03, 0.03, 1)).toBeCloseTo(0, 12);
  });
});

describe("effectivePrice", () => {
  it("F1 + b2", () => expect(effectivePrice(2.2, 2.0 - 1.9)).toBeCloseTo(2.3, 10));
});

describe("extremes", () => {
  it("h = 0 leaves the spot variance", () => expect(hedgedVariance(0, 0.03, 0.04, 0.9)).toBeCloseTo(0.0009, 12));
  it("rho = 1 and rho = -1 give finite, non-negative variances", () => {
    for (const rho of [1, -1]) {
      const h = minVarianceHedgeRatio(rho, 0.03, 0.04);
      expect(h).toBeCloseTo(rho * 0.75, 12);
      const v = hedgedVariance(h, 0.03, 0.04, rho);
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeCloseTo(0, 12);
      for (const hh of [0, 1, 2]) expect(hedgedVariance(hh, 0.03, 0.04, rho)).toBeGreaterThanOrEqual(0);
    }
  });
  it("sigma_F = 0 does not divide by zero", () => {
    expect(minVarianceHedgeRatio(0.5, 0.03, 0)).toBe(0);
    expect(Number.isFinite(hedgedVariance(1, 0.03, 0, 0.5))).toBe(true);
  });
  it("rho = 0 gives h* = 0", () => expect(Object.is(minVarianceHedgeRatio(0, 0.03, 0.04), 0)).toBe(true));
});
