import { describe, expect, it } from "vitest";
import { annuity, flatSwapPnl, parSwapRate, swapValue } from "../../src/lib/finance/swaps";
import type { ZeroCurve } from "../../src/lib/finance/curves";

const z: ZeroCurve = (t) => ({ 1: 0.03, 2: 0.04, 3: 0.045 } as Record<number, number>)[t];

describe("annuity", () => {
  it("sum of tau DF(t_i)", () => {
    expect(annuity(() => 0.04, 1, 2, 2)).toBeCloseTo(0.5 * (1.02 ** -1 + 1.02 ** -2), 12);
  });
  it("at rate 0 equals periods times tau", () => {
    expect(annuity(() => 0, 30, 1, 1)).toBe(30);
    expect(annuity(() => 0, 5, 4, 4)).toBeCloseTo(5, 12);
    expect(annuity(() => 0, 5, 4, "continuous")).toBeCloseTo(5, 12);
  });
});

describe("parSwapRate", () => {
  it("matches the par rate of note 02", () => expect(parSwapRate(z, 3, 1, 1)).toBeCloseTo(0.04463, 4));
  it("flat curve: par rate equals the zero rate", () =>
    expect(parSwapRate(() => 0.043, 30, 1, 1)).toBeCloseTo(0.043, 10));
  it("is finite at rate 0 and for a minimum maturity", () => {
    expect(parSwapRate(() => 0, 10, 1, 1)).toBe(0);
    expect(Number.isFinite(parSwapRate(() => 0.03, 0, 1, 1))).toBe(true);
    expect(Number.isFinite(parSwapRate(() => 0.03, 0.25, 4, 4))).toBe(true);
  });
});

describe("swapValue", () => {
  it("payer gains when the par rate exceeds the fixed rate", () => {
    const a = { notional: 100e6, fixedRate: 0.04, parRate: 0.05, annuity: 3, side: "payer" as const };
    expect(swapValue(a)).toBeCloseTo(3e6, 6);
    expect(swapValue({ ...a, side: "receiver" })).toBeCloseTo(-3e6, 6);
  });
});

describe("no negative zero", () => {
  it("receiver at the fixed rate gives +0", () => {
    const a = { notional: 1e6, fixedRate: 0.04, parRate: 0.04, annuity: 3, side: "receiver" as const };
    expect(swapValue(a)).toBe(0);
    const r = flatSwapPnl({ notional: 1e6, fixedRate: 0.04, maturity: 5, m: 1, rate: 0.04, side: "receiver" });
    expect(r.value).toBe(0);
    expect(r.dv01Line).toBe(0);
  });
});

describe("flatSwapPnl", () => {
  const p = (rate: number) =>
    flatSwapPnl({ notional: 100e6, fixedRate: 0.043, maturity: 30, m: 1, rate, side: "payer" });
  it("is zero at the fixed rate", () => expect(p(0.043).value).toBeCloseTo(0, 6));
  it("payer lies below the DV01 line in both directions", () => {
    expect(p(0.053).value).toBeLessThan(p(0.053).dv01Line);
    expect(p(0.033).value).toBeLessThan(p(0.033).dv01Line);
    expect(p(0.053).value).toBeGreaterThan(0);
  });
  it("receiver is the opposite of the payer", () => {
    const r = flatSwapPnl({ notional: 100e6, fixedRate: 0.043, maturity: 30, m: 1, rate: 0.053, side: "receiver" });
    expect(r.value).toBeCloseTo(-p(0.053).value, 6);
    expect(r.dv01Line).toBeCloseTo(-p(0.053).dv01Line, 6);
  });
  it("is finite at rate 0 (annuity = periods times tau)", () => {
    const r = flatSwapPnl({ notional: 100e6, fixedRate: 0.043, maturity: 30, m: 1, rate: 0, side: "payer" });
    expect(r.value).toBeCloseTo(100e6 * 30 * (0 - 0.043), 4);
    expect(Number.isFinite(r.dv01Line)).toBe(true);
    const q = flatSwapPnl({ notional: 100e6, fixedRate: 0, maturity: 30, m: 2, rate: 0, side: "payer" });
    expect(q.value).toBe(0);
    expect(q.dv01Line).toBe(0);
  });
});
