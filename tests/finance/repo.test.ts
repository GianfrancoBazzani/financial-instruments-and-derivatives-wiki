import { describe, expect, it } from "vitest";
import {
  REPO_CURVE,
  cashLent,
  collateralNeeded,
  repoCarry,
  repoInterest,
  stripModifiedDuration,
  stripPrice,
} from "../../src/lib/finance/repo";

describe("repo", () => {
  it("interest is ACT/360", () => expect(repoInterest(60e6, 0.02, 21)).toBeCloseTo(70000, 6));
  it("cash lent after the haircut", () => expect(cashLent(100e6, 0.02)).toBeCloseTo(98e6, 6));
  it("collateral needed for a cash amount", () => expect(collateralNeeded(60e6, 0.02)).toBeCloseTo(61224489.8, 0));
  it("a haircut of 0 gives collateral = cash", () => {
    expect(collateralNeeded(60e6, 0)).toBe(60e6);
    expect(cashLent(100e6, 0)).toBe(100e6);
  });
  it("carry is bond yield minus repo rate", () => {
    expect(repoCarry(0.034, 0.028)).toBeCloseTo(0.006, 10);
    expect(repoCarry(0.034, 0.038)).toBeCloseTo(-0.004, 10);
  });
  it("is finite at rate 0 and 0 days", () => {
    expect(repoInterest(60e6, 0, 21)).toBe(0);
    expect(repoInterest(60e6, 0.02, 0)).toBe(0);
    expect(repoCarry(0, 0)).toBe(0);
  });
  it("repo curve", () =>
    expect(REPO_CURVE).toEqual([
      { term: "1D", rate: 0.028 },
      { term: "1W", rate: 0.03 },
      { term: "1M", rate: 0.032 },
      { term: "3M", rate: 0.035 },
      { term: "6M", rate: 0.038 },
    ]));
});

describe("strips", () => {
  it("price = face / (1 + y)^t (note 11 examples)", () => {
    expect(stripPrice(4, 0.03, 1)).toBeCloseTo(3.88, 2);
    expect(stripPrice(100, 0.03, 3)).toBeCloseTo(91.51, 2);
    expect(stripPrice(50000, 0.03, 5)).toBeCloseTo(43130.44, 2);
  });
  it("a bond is the sum of its strips", () => {
    const sum = stripPrice(4, 0.03, 1) + stripPrice(4, 0.03, 2) + stripPrice(4, 0.03, 3) + stripPrice(100, 0.03, 3);
    expect(sum).toBeCloseTo(102.83, 2);
    expect(sum).toBeCloseTo(4 / 1.03 + 4 / 1.03 ** 2 + 4 / 1.03 ** 3 + 100 / 1.03 ** 3, 12);
  });
  it("y = 0 gives the face value", () => expect(stripPrice(100, 0, 30)).toBe(100));
  it("t = 0 gives the face value and duration 0", () => {
    expect(stripPrice(100, 0.03, 0)).toBe(100);
    expect(stripModifiedDuration(0.03, 0)).toBe(0);
  });
  it("modified duration = t / (1 + y)", () => {
    expect(stripModifiedDuration(0.03, 5)).toBeCloseTo(5 / 1.03, 12);
    expect(stripModifiedDuration(0, 30)).toBe(30);
    expect(stripModifiedDuration(0, 0)).toBe(0);
  });
});
