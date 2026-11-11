// FRA settlement and bond-futures conversion factor. Rates are decimals (0.04 = 4%); times are in years.

type FraArgs = {
  notional: number;
  fixedRate: number;
  realizedRate: number;
  tau: number;
  side: "payFixed" | "receiveFixed";
};

/** FRA payoff at the end of the period = L (R_realised - R_fixed) tau for the fixed payer; the receiver gets the opposite sign. */
export function fraPayoff(a: FraArgs): number {
  const p = a.notional * (a.realizedRate - a.fixedRate) * a.tau;
  return a.side === "payFixed" ? p : -p;
}

/** FRA payoff settled at the start of the period = fraPayoff / (1 + R_realised tau). */
export function fraPayoffAtStart(a: FraArgs): number {
  return fraPayoff(a) / (1 + a.realizedRate * a.tau);
}

/**
 * Conversion factor at a 6% yield with semiannual compounding (3% per period), per 100 of face.
 * The maturity (years + months) is rounded down to a multiple of 3 months; n = whole 6-month periods, c = coupon per period.
 * No 3 months left: CF = (sum c/1.03^i + 100/1.03^n) / 100.
 * 3 months left: CF = ((c + sum c/1.03^i + 100/1.03^n) / sqrt(1.03) - c/2) / 100.
 */
export function conversionFactor(couponRate: number, years: number, months: number): number {
  const total = Math.floor(years * 12 + months + 1e-9);
  const quarters = Math.max(0, Math.floor(total / 3));
  const n = Math.floor(quarters / 2);
  const threeLeft = quarters % 2 === 1;
  const c = (couponRate * 100) / 2;
  let pv = 100 / Math.pow(1.03, n);
  for (let i = 1; i <= n; i++) pv += c / Math.pow(1.03, i);
  return threeLeft ? ((c + pv) / Math.sqrt(1.03) - c / 2) / 100 : pv / 100;
}
