// Zero, par and forward curves. Rates are decimals; times are in years.
import { price, type Comp } from "./bonds";

/** Zero rate as a function of maturity in years. */
export type ZeroCurve = (t: number) => number;

/** Discount factor of zero rate r at time t: (1 + r/m)^(-m t), or e^(-r t) if continuous. */
export function discountFactor(r: number, t: number, comp: Comp): number {
  return comp === "continuous" ? Math.exp(-r * t) : Math.pow(1 + r / comp, -comp * t);
}

/** Par rate = m (1 - DF(T)) / sum DF(k/m), coupons m per year at k/m up to T; `comp` is the compounding of the zero rates. T <= 0 returns zero(T). */
export function parRate(zero: ZeroCurve, T: number, m: number, comp: Comp): number {
  if (T <= 0) return zero(T);
  const n = Math.max(1, Math.round(T * m));
  let annuity = 0;
  for (let k = 1; k <= n; k++) annuity += discountFactor(zero(k / m), k / m, comp);
  return (m * (1 - discountFactor(zero(n / m), n / m, comp))) / annuity;
}

/** Forward rate between t1 and t2 from the zero rates: DF(t1)/DF(t2) = (1 + f/m)^(m (t2 - t1)); continuous: (r2 t2 - r1 t1)/(t2 - t1). If t2 <= t1 it returns r1 (no period). */
export function forwardRate(r1: number, t1: number, r2: number, t2: number, comp: Comp): number {
  const dt = t2 - t1;
  if (dt <= 0) return r1;
  if (comp === "continuous") return (r2 * t2 - r1 * t1) / dt;
  const growth = discountFactor(r1, t1, comp) / discountFactor(r2, t2, comp);
  return comp * (Math.pow(growth, 1 / (comp * dt)) - 1);
}

/** Zero curve level + slope t + curvature t^2 (decimals). */
export function polyZeroCurve(level: number, slope: number, curvature: number): ZeroCurve {
  return (t) => level + slope * t + curvature * t * t;
}

/**
 * Annual-coupon bond, face 100, held for `horizon` years.
 * priceNow at yieldNow; priceNew at the horizon (dirty) at yieldAtHorizon.
 * amortization = price change at the unchanged yield (price points, coupons excluded);
 * carry = (amortization + coupons received) / priceNow; rollDown = (priceNew - price at unchanged yield) / priceNow;
 * total = carry + rollDown. A bond that matures within the horizon has redemption counted as principal, not coupon.
 */
export function carryRollDown(a: {
  couponRate: number;
  maturity: number;
  yieldNow: number;
  yieldAtHorizon: number;
  horizon: number;
}): { priceNow: number; priceNew: number; amortization: number; carry: number; rollDown: number; total: number } {
  const bond = { face: 100, couponRate: a.couponRate, maturity: a.maturity, frequency: 1 as const };
  const matured = a.horizon >= a.maturity - 1e-9;
  const coupons = (Math.floor(Math.min(a.horizon, a.maturity) + 1e-9) - (matured ? 1 : 0)) * 100 * a.couponRate;
  const redemption = matured ? 100 * (1 + a.couponRate) : 0; // last coupon plus face
  const received = matured ? coupons + redemption : coupons;
  const priceNow = price(bond, a.yieldNow, 1);
  const unchanged = price(bond, a.yieldNow, 1, a.horizon);
  const priceNew = price(bond, a.yieldAtHorizon, 1, a.horizon);
  const principal = matured ? 100 : 0;
  const amortization = unchanged + principal - priceNow;
  return {
    priceNow,
    priceNew,
    amortization,
    carry: (amortization + received - principal) / priceNow,
    rollDown: (priceNew - unchanged) / priceNow,
    total: (priceNew + received - priceNow) / priceNow,
  };
}
