// Repo and STRIPS. Rates are decimals (0.02 = 2%); haircuts are fractions of the collateral value.

/** Repo interest = cash x rate x days / 360 (ACT/360). */
export function repoInterest(cash: number, rate: number, days: number): number {
  return (cash * rate * days) / 360;
}

/** Cash lent against collateral = collateral value x (1 - haircut). */
export function cashLent(collateralValue: number, haircut: number): number {
  return collateralValue * (1 - haircut);
}

/** Collateral value needed to borrow `cash` = cash / (1 - haircut). */
export function collateralNeeded(cash: number, haircut: number): number {
  return cash / (1 - haircut);
}

/** Carry of financing a bond in repo = bond yield - repo rate. */
export function repoCarry(bondYield: number, repoRate: number): number {
  return bondYield - repoRate;
}

/** Repo rates by term (illustrative curve of note 10). */
export const REPO_CURVE: { term: string; rate: number }[] = [
  { term: "1D", rate: 0.028 },
  { term: "1W", rate: 0.03 },
  { term: "1M", rate: 0.032 },
  { term: "3M", rate: 0.035 },
  { term: "6M", rate: 0.038 },
];

/** STRIPS price = face / (1 + y)^t, annual compounding. */
export function stripPrice(face: number, y: number, t: number): number {
  return face / Math.pow(1 + y, t);
}

/** Modified duration of a zero-coupon strip = t / (1 + y): its Macaulay duration is t. */
export function stripModifiedDuration(y: number, t: number): number {
  return t / (1 + y);
}
