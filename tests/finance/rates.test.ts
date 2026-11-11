import { describe, expect, it } from "vitest";
import { conversionFactor, fraPayoff, fraPayoffAtStart } from "../../src/lib/finance/rates";

const fra = { notional: 100e6, fixedRate: 0.03, realizedRate: 0.035, tau: 0.25, side: "payFixed" as const };

describe("fraPayoff", () => {
  it("payFixed at the end of the period (note 07 example)", () => expect(fraPayoff(fra)).toBeCloseTo(125000, 6));
  it("receiveFixed has the opposite sign", () =>
    expect(fraPayoff({ ...fra, side: "receiveFixed" })).toBeCloseTo(-125000, 6));
  it("is finite with a rate of exactly 0 and with tau = 0", () => {
    expect(Number.isFinite(fraPayoff({ ...fra, fixedRate: 0, realizedRate: 0 }))).toBe(true);
    expect(Number.isFinite(fraPayoffAtStart({ ...fra, fixedRate: 0, realizedRate: 0 }))).toBe(true);
    expect(fraPayoff({ ...fra, tau: 0 })).toBe(0);
    expect(fraPayoffAtStart({ ...fra, tau: 0 })).toBe(0);
  });
});

describe("no negative zero", () => {
  it("receiveFixed at the fixed rate gives +0", () => {
    const a = { ...fra, realizedRate: 0.03, side: "receiveFixed" as const };
    expect(fraPayoff(a)).toBe(0);
    expect(fraPayoffAtStart(a)).toBe(0);
  });
});

describe("fraPayoffAtStart", () => {
  it("discounts the payoff at the realised rate", () => expect(fraPayoffAtStart(fra)).toBeCloseTo(123916, 0));
});

describe("conversionFactor", () => {
  it("note 07 examples", () => {
    expect(conversionFactor(0.1, 20, 2)).toBeCloseTo(1.4623, 4);
    expect(conversionFactor(0.08, 18, 4)).toBeCloseTo(1.2199, 4);
  });
  it("6% coupon gives a factor of 1", () => expect(conversionFactor(0.06, 20, 0)).toBeCloseTo(1, 10));
  it("is finite at 0, 1, 2, 3, 6 and 9 months and with a coupon of 0", () => {
    for (const months of [0, 1, 2, 3, 6, 9]) {
      expect(Number.isFinite(conversionFactor(0.06, 10, months))).toBe(true);
      expect(Number.isFinite(conversionFactor(0.06, 0, months))).toBe(true);
      expect(Number.isFinite(conversionFactor(0, 10, months))).toBe(true);
    }
  });
  it("1 or 2 months are rounded down to 0", () => {
    expect(conversionFactor(0.08, 10, 1)).toBe(conversionFactor(0.08, 10, 0));
    expect(conversionFactor(0.08, 10, 2)).toBe(conversionFactor(0.08, 10, 0));
  });
  it("coupon 0 gives the discounted face", () => expect(conversionFactor(0, 10, 0)).toBeCloseTo(1.03 ** -20, 12));
});
