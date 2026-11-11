import { describe, expect, it } from "vitest";
import { convexity, modifiedDuration } from "../../src/lib/finance/bonds";
import {
  capletPayoff,
  cmsConvexityAdjustment,
  collarEffectiveRate,
  floorletPayoff,
  payerSwapPayoffAtFixing,
  sabrImpliedVol,
} from "../../src/lib/finance/options";

const b10 = { face: 100, couponRate: 0.03, maturity: 10, frequency: 1 as const };

describe("caplet, floorlet and collar", () => {
  it("caplet and floorlet pay L max(...) delta (note 09)", () => {
    expect(capletPayoff(0.035, 0.03, 10e6, 0.25)).toBeCloseTo(12500, 6);
    expect(floorletPayoff(0.015, 0.02, 10e6, 0.25)).toBeCloseTo(12500, 6);
  });
  it("out of the money pays 0", () => {
    expect(capletPayoff(0.02, 0.03, 10e6, 0.25)).toBe(0);
    expect(floorletPayoff(0.03, 0.02, 10e6, 0.25)).toBe(0);
  });
  it("collar effective rate is bounded by the strikes", () => {
    expect(collarEffectiveRate(0.05, 0.03, 0.02)).toBeCloseTo(0.03, 10);
    expect(collarEffectiveRate(0.01, 0.03, 0.02)).toBeCloseTo(0.02, 10);
    expect(collarEffectiveRate(0.025, 0.03, 0.02)).toBeCloseTo(0.025, 10);
  });
  it("is finite with a rate of exactly 0 and with delta = 0", () => {
    expect(capletPayoff(0, 0, 10e6, 0.25)).toBe(0);
    expect(floorletPayoff(0, 0, 10e6, 0.25)).toBe(0);
    expect(capletPayoff(0.04, 0.03, 10e6, 0)).toBe(0);
    expect(collarEffectiveRate(0, 0.03, 0.02)).toBeCloseTo(0.02, 10);
    expect(Number.isFinite(collarEffectiveRate(0, 0, 0))).toBe(true);
  });
});

describe("sabrImpliedVol", () => {
  const base = { f: 0.03, t: 5, alpha: 0.035, beta: 0.5, rho: -0.3, nu: 0.4 };
  it("lognormal case with no vol-of-vol is flat", () => {
    expect(sabrImpliedVol({ f: 0.03, k: 0.03, t: 5, alpha: 0.2, beta: 1, rho: 0, nu: 0 })).toBeCloseTo(0.2, 10);
    expect(sabrImpliedVol({ f: 0.03, k: 0.05, t: 5, alpha: 0.2, beta: 1, rho: 0, nu: 0 })).toBeCloseTo(0.2, 10);
  });
  it("is continuous at the money", () => {
    const d = sabrImpliedVol({ ...base, k: 0.03 }) - sabrImpliedVol({ ...base, k: 0.030001 });
    expect(Math.abs(d)).toBeLessThan(1e-5);
  });
  it("rho < 0 gives a downward skew", () =>
    expect(sabrImpliedVol({ ...base, k: 0.02 })).toBeGreaterThan(sabrImpliedVol({ ...base, k: 0.04 })));
  it("is finite for strikes far below and far above the forward", () => {
    for (const k of [0.002, 0.01, 0.03, 0.08, 0.15]) expect(Number.isFinite(sabrImpliedVol({ ...base, k }))).toBe(true);
    for (const k of [1e-8, 1e-5, 1, 10]) {
      const v = sabrImpliedVol({ ...base, k });
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
  });
  it("is finite at k = f, nu = 0, t = 0, beta = 0 and beta = 1", () => {
    for (const p of [
      { ...base, k: base.f },
      { ...base, k: 0.05, nu: 0 },
      { ...base, k: 0.05, t: 0 },
      { ...base, k: 0.05, beta: 0 },
      { ...base, k: 0.05, beta: 1, alpha: 0.2 },
      { ...base, k: 0.03, nu: 0, t: 0 },
    ]) {
      const v = sabrImpliedVol(p);
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
  });
  it("is finite and positive for rho close to +1 and -1, at every strike", () => {
    for (const rho of [0.999, -0.999]) {
      for (const k of [0.002, 0.01, 0.0299, 0.03, 0.0301, 0.05, 0.15, 1]) {
        const v = sabrImpliedVol({ ...base, k, rho });
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThan(0);
      }
    }
  });
  it("with t = 0 the time correction disappears", () => {
    const a = { f: 0.03, k: 0.03, t: 0, alpha: 0.2, beta: 1, rho: 0.2, nu: 0.5 };
    expect(sabrImpliedVol(a)).toBeCloseTo(0.2, 12);
  });
  it("is NaN for a forward or a strike that is zero or negative", () => {
    expect(sabrImpliedVol({ ...base, k: 0 })).toBeNaN();
    expect(sabrImpliedVol({ ...base, k: -0.01 })).toBeNaN();
    expect(sabrImpliedVol({ ...base, f: 0, k: 0.03 })).toBeNaN();
    expect(sabrImpliedVol({ ...base, f: -0.01, k: 0.03 })).toBeNaN();
  });
});

describe("cmsConvexityAdjustment", () => {
  it("uses C / D_mod of a 10-year par bond at 3% (note 09)", () => {
    expect(modifiedDuration(b10, 0.03)).toBeCloseTo(8.5, 1);
    expect(convexity(b10, 0.03) / modifiedDuration(b10, 0.03)).toBeCloseTo(10.2, 1);
    expect(cmsConvexityAdjustment({ sF: 0.03, sigma: 0.2, t: 5, tenor: 10, m: 1 })).toBeCloseTo(
      (0.5 * 0.03 ** 2 * 0.2 ** 2 * 5 * convexity(b10, 0.03)) / modifiedDuration(b10, 0.03),
      12,
    );
  });
  it("is 0 with sigma = 0 and with t = 0", () => {
    expect(cmsConvexityAdjustment({ sF: 0.03, sigma: 0, t: 5, tenor: 10, m: 1 })).toBe(0);
    expect(cmsConvexityAdjustment({ sF: 0.03, sigma: 0.2, t: 0, tenor: 10, m: 1 })).toBe(0);
  });
  it("is finite with a swap rate of exactly 0", () =>
    expect(Number.isFinite(cmsConvexityAdjustment({ sF: 0, sigma: 0.2, t: 5, tenor: 10, m: 1 }))).toBe(true));
});

describe("payerSwapPayoffAtFixing", () => {
  const payoff = (s: number) => payerSwapPayoffAtFixing({ sT: s, sF: 0.03, tenor: 30, m: 1 });
  it("is 0 when the swap rate equals the forward swap rate", () => expect(payoff(0.03)).toBe(0));
  it("is concave: the midpoint lies above the chord", () =>
    expect(payoff(0.03)).toBeGreaterThan((payoff(0.02) + payoff(0.04)) / 2));
  it("is finite at rate 0 (annuity = periods times tau)", () => {
    expect(payoff(0)).toBeCloseTo(30 * (0 - 0.03), 12);
    expect(payerSwapPayoffAtFixing({ sT: 0, sF: 0, tenor: 30, m: 2 })).toBe(0);
  });
});
