import { describe, expect, it } from "vitest";
import { forwardPayoff, forwardPrice, forwardValue, marginAccount } from "../../src/lib/finance/forwards";

describe("forwardPayoff", () => {
  it("long gains when the price rises", () => expect(forwardPayoff(102, 100, "long")).toBe(2));
  it("short loses when the price rises", () => expect(forwardPayoff(102, 100, "short")).toBe(-2));
  it("is exactly 0 (not -0) at the strike", () => {
    expect(Object.is(forwardPayoff(100, 100, "short"), 0)).toBe(true);
    expect(Object.is(forwardPayoff(100, 100, "long"), 0)).toBe(true);
  });
});

describe("forwardPrice", () => {
  it("cost of carry", () => expect(forwardPrice({ spot: 100, r: 0.05, T: 1 })).toBeCloseTo(105.127, 3));
  it("yield equal to the rate gives the spot", () =>
    expect(forwardPrice({ spot: 100, r: 0.05, T: 1, q: 0.05 })).toBeCloseTo(100, 10));
  it("T = 0 gives the spot", () => expect(forwardPrice({ spot: 100, r: 0.05, T: 0 })).toBe(100));
  it("subtracts the present value of income and adds storage, subtracts convenience", () => {
    expect(forwardPrice({ spot: 100, income: 4, r: 0.05, T: 1 })).toBeCloseTo(96 * Math.exp(0.05), 10);
    expect(forwardPrice({ spot: 100, r: 0.05, u: 0.02, y: 0.01, T: 2 })).toBeCloseTo(100 * Math.exp(0.12), 10);
  });
});

describe("forwardValue", () => {
  it("long", () => expect(forwardValue({ f0: 105.127, k: 100, r: 0.05, T: 1, side: "long" })).toBeCloseTo(4.877, 3));
  it("short at the money is 0", () => {
    expect(forwardValue({ f0: 100, k: 100, r: 0.05, T: 1, side: "short" })).toBeCloseTo(0, 10);
    expect(Object.is(forwardValue({ f0: 100, k: 100, r: 0.05, T: 1, side: "short" }), 0)).toBe(true);
  });
  it("short is minus long", () =>
    expect(forwardValue({ f0: 110, k: 100, r: 0.05, T: 1, side: "short" })).toBeCloseTo(-10 * Math.exp(-0.05), 10));
  it("T = 0 is undiscounted", () => expect(forwardValue({ f0: 110, k: 100, r: 0.05, T: 0, side: "long" })).toBe(10));
});

describe("marginAccount", () => {
  const rows = marginAccount([100, 101, 99, 102], 3, 2.5, "long");
  it("balance before top-up", () => expect(rows.map((r) => r.balance)).toEqual([3, 4, 2, 6]));
  it("variation margin", () => expect(rows.map((r) => r.variationMargin)).toEqual([0, 0, 1, 0]));
  it("cumulative P&L", () => expect(rows.map((r) => r.cumPnl)).toEqual([0, 1, -1, 2]));
  it("daily P&L, day and price", () => {
    expect(rows.map((r) => r.dailyPnl)).toEqual([0, 1, -2, 3]);
    expect(rows.map((r) => r.day)).toEqual([0, 1, 2, 3]);
    expect(rows.map((r) => r.price)).toEqual([100, 101, 99, 102]);
  });
  it("short side mirrors the P&L", () => {
    const s = marginAccount([100, 101, 99, 102], 3, 2.5, "short");
    expect(s.map((r) => r.cumPnl)).toEqual([0, -1, 1, -2]);
    expect(s.map((r) => r.balance)).toEqual([3, 2, 5, 2]);
    expect(s.map((r) => r.variationMargin)).toEqual([0, 1, 0, 1]);
  });
});

describe("extremes", () => {
  it("price path of length 1", () => {
    const r = marginAccount([100], 3, 2.5, "long");
    expect(r).toEqual([{ day: 0, price: 100, dailyPnl: 0, cumPnl: 0, balance: 3, variationMargin: 0 }]);
  });
  it("constant path has no -0 and no calls", () => {
    for (const side of ["long", "short"] as const)
      for (const r of marginAccount([100, 100, 100], 3, 2.5, side)) {
        expect(Object.is(r.dailyPnl, 0)).toBe(true);
        expect(Object.is(r.cumPnl, 0)).toBe(true);
        expect(r.variationMargin).toBe(0);
      }
  });
  it("T = 0 and zero rate are finite", () => {
    expect(forwardPrice({ spot: 100, r: 0, T: 0 })).toBe(100);
    expect(forwardPrice({ spot: 100, r: 0, T: 3 })).toBe(100);
    expect(forwardValue({ f0: 100, k: 100, r: 0, T: 0, side: "long" })).toBe(0);
  });
});
