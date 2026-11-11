import { describe, expect, it } from "vitest";
import {
  accruedInterest,
  cashFlows,
  cleanPrice,
  convexity,
  dv01,
  macaulayDuration,
  modifiedDuration,
  moneyDuration,
  price,
  priceChange,
  type Bond,
} from "../../src/lib/finance/bonds";

const A: Bond = { face: 100, couponRate: 0.05, maturity: 4, frequency: 1 };
const S: Bond = { ...A, frequency: 2 };

describe("cashFlows", () => {
  it("lists coupons and the face at maturity", () => {
    expect(cashFlows(A)).toEqual([
      { t: 1, cf: 5 },
      { t: 2, cf: 5 },
      { t: 3, cf: 5 },
      { t: 4, cf: 105 },
    ]);
  });
  it("drops paid coupons and measures time from today", () => {
    const f = cashFlows(A, 1.25);
    expect(f.map((x) => x.cf)).toEqual([5, 5, 105]);
    expect(f[0].t).toBeCloseTo(0.75, 10);
  });
});

describe("price", () => {
  it("annual bond at 4% (annual)", () => expect(price(A, 0.04)).toBeCloseTo(103.63, 3));
  it("semiannual bond at 4% (semiannual)", () => expect(price(S, 0.04)).toBeCloseTo(103.663, 3));
  it("annual bond, continuous", () => expect(price(A, 0.04, "continuous")).toBeCloseTo(103.329, 3));
  it("semiannual bond, continuous", () => expect(price(S, 0.04, "continuous")).toBeCloseTo(103.512, 3));
  it("yield example of the note, 6%", () =>
    expect(price({ face: 100, couponRate: 0.05, maturity: 2, frequency: 2 }, 0.06, "continuous")).toBeCloseTo(97.975, 2));
  it("yield example of the note, 7%", () =>
    expect(price({ face: 100, couponRate: 0.05, maturity: 2, frequency: 2 }, 0.07, "continuous")).toBeCloseTo(96.105, 2));
  it("coupon equal to yield gives par", () =>
    expect(price({ ...A, couponRate: 0.04 }, 0.04)).toBeCloseTo(100, 10));
  it("zero yield is the sum of the cash flows", () => expect(price(A, 0)).toBe(120));
  it("3% 10-year semiannual bond at 5%", () =>
    expect(price({ face: 100, couponRate: 0.03, maturity: 10, frequency: 2 }, 0.05)).toBeCloseTo(84.41, 2));
});

describe("accrued interest and clean price", () => {
  it("accrues 3 months of a 5% annual coupon", () => expect(accruedInterest(A, 0.25)).toBeCloseTo(1.25, 10));
  it("is zero on a coupon date", () => expect(accruedInterest(A, 1)).toBeCloseTo(0, 10));
  it("clean = dirty - accrued", () =>
    expect(cleanPrice(A, 0.04, 1, 0.25)).toBeCloseTo(price(A, 0.04, 1, 0.25) - 1.25, 10));
});

describe("risk measures", () => {
  it("annual bond at 4%", () => {
    expect(macaulayDuration(A, 0.04)).toBeCloseTo(3.7287, 3);
    expect(modifiedDuration(A, 0.04)).toBeCloseTo(3.5853, 4);
    expect(convexity(A, 0.04)).toBeCloseTo(16.824, 2);
    expect(moneyDuration(A, 0.04)).toBeCloseTo(371.54, 1);
    expect(dv01(A, 0.04)).toBeCloseTo(-0.03715, 4);
  });
  it("semiannual bond at 4%", () => {
    expect(macaulayDuration(S, 0.04)).toBeCloseTo(3.6817, 3);
    expect(modifiedDuration(S, 0.04)).toBeCloseTo(3.61, 2);
    expect(convexity(S, 0.04)).toBeCloseTo(15.474, 2);
  });
  it("continuous convexity", () => {
    expect(convexity(A, 0.04, "continuous")).toBeCloseTo(14.466, 2);
    expect(convexity(S, 0.04, "continuous")).toBeCloseTo(14.257, 2);
  });
  it("continuous: modified equals Macaulay", () =>
    expect(macaulayDuration(A, 0.04, "continuous")).toBe(modifiedDuration(A, 0.04, "continuous")));
});

describe("priceChange", () => {
  it("small shock, exact", () => expect(priceChange(A, 0.04, 0.002).exact).toBeCloseTo(-0.007137, 5));
  it("200 bp shock", () => {
    const c = priceChange(A, 0.04, 0.02);
    expect(c.exact).toBeCloseTo(-0.068465, 5);
    expect(c.linear).toBeCloseTo(-0.071706, 5);
    expect(c.secondOrder).toBeCloseTo(-0.068341, 5);
  });
});

describe("extremes", () => {
  const one: Bond = { face: 100, couponRate: 0.05, maturity: 0.5, frequency: 2 };
  const near = { ...A, maturity: 4 };
  const all = (b: Bond, y: number, comp?: number | "continuous") => [
    price(b, y, comp),
    macaulayDuration(b, y, comp),
    modifiedDuration(b, y, comp),
    convexity(b, y, comp),
    moneyDuration(b, y, comp),
    dv01(b, y, comp),
    priceChange(b, y, 0.01, comp).exact,
    priceChange(b, y, 0.01, comp).linear,
    priceChange(b, y, 0.01, comp).secondOrder,
  ];
  it("yield exactly 0", () => {
    for (const comp of [undefined, 1, 2, "continuous" as const])
      for (const v of all(A, 0, comp)) expect(Number.isFinite(v)).toBe(true);
  });
  it("maturity equal to one coupon period", () => {
    expect(cashFlows(one)).toHaveLength(1);
    for (const y of [0, 0.04])
      for (const comp of [undefined, "continuous" as const])
        for (const v of all(one, y, comp)) expect(Number.isFinite(v)).toBe(true);
    expect(macaulayDuration(one, 0.04)).toBeCloseTo(0.5, 10);
  });
  it("elapsed just below the maturity", () => {
    const e = near.maturity - 1e-6;
    expect(cashFlows(near, e)).toHaveLength(1);
    for (const comp of [1, "continuous" as const]) {
      expect(Number.isFinite(price(near, 0.04, comp, e))).toBe(true);
      expect(Number.isFinite(accruedInterest(near, e))).toBe(true);
      expect(Number.isFinite(cleanPrice(near, 0.04, comp, e))).toBe(true);
    }
    expect(Number.isFinite(price(near, 0, 1, e))).toBe(true);
  });
});
