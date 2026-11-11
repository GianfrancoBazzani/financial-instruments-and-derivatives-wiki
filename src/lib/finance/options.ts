// Caps, floors, collars, SABR implied volatility and CMS convexity. Rates are decimals; times are in years.
import { convexity, modifiedDuration } from "./bonds";
import { annuity } from "./swaps";

/** Caplet payoff = L max(R - R_cap, 0) delta, paid at the end of the period (delta = period length, ACT/360 as given). */
export function capletPayoff(r: number, strike: number, notional: number, delta: number): number {
  return notional * Math.max(r - strike, 0) * delta;
}

/** Floorlet payoff = L max(R_floor - R, 0) delta, paid at the end of the period. */
export function floorletPayoff(r: number, strike: number, notional: number, delta: number): number {
  return notional * Math.max(strike - r, 0) * delta;
}

/** Effective rate of a borrower with a collar = R - max(R - R_C, 0) + max(R_F - R, 0). */
export function collarEffectiveRate(r: number, capStrike: number, floorStrike: number): number {
  return r - Math.max(r - capStrike, 0) + Math.max(floorStrike - r, 0);
}

// Largest |rho| used: the formula divides by 1 - rho, so rho = 1 is clamped just inside.
const RHO_MAX = 0.999999;

// x(z) = ln((sqrt(1 - 2 rho z + z^2) + z - rho) / (1 - rho)), computed without cancellation.
function sabrX(z: number, rho: number): number {
  const root = Math.sqrt(1 - 2 * rho * z + z * z);
  if (Math.abs(z) < 1e-3) {
    // numerator - (1 - rho) = (z^2 - 2 rho z)/(root + 1) + z; log1p keeps the digits when z is small
    return Math.log1p(((z * z - 2 * rho * z) / (root + 1) + z) / (1 - rho));
  }
  const u = z - rho;
  // for u < 0 use (root + u)(root - u) = 1 - rho^2 to avoid subtracting nearly equal numbers
  const num = u >= 0 ? root + u : (1 - rho * rho) / (root - u);
  return Math.log(num / (1 - rho));
}

/**
 * SABR implied lognormal (Black) volatility, Hagan et al. (2002): sigma = A (z/x) B with g = (f k)^((1-beta)/2), L = ln(f/k),
 * z = (nu/alpha) g L, z/x = 1 when |z| < 1e-8 (k = f, nu = 0). Returns NaN when f <= 0, k <= 0 or alpha <= 0 (no value);
 * rho is clamped to [-0.999999, 0.999999].
 */
export function sabrImpliedVol(a: {
  f: number;
  k: number;
  t: number;
  alpha: number;
  beta: number;
  rho: number;
  nu: number;
}): number {
  const { f, k, t, alpha, beta, nu } = a;
  if (!(f > 0) || !(k > 0) || !(alpha > 0)) return NaN;
  const rho = Math.min(RHO_MAX, Math.max(-RHO_MAX, a.rho));
  const g = Math.pow(f * k, (1 - beta) / 2);
  const L = Math.log(f / k);
  const z = (nu / alpha) * g * L;
  const ratio = Math.abs(z) < 1e-8 ? 1 : z / sabrX(z, rho);
  const omb = 1 - beta;
  const A = alpha / (g * (1 + (omb * omb * L * L) / 24 + (omb ** 4 * L ** 4) / 1920));
  const B =
    1 +
    (((omb * omb) / 24) * ((alpha * alpha) / (g * g)) +
      (rho * beta * nu * alpha) / (4 * g) +
      ((2 - 3 * rho * rho) / 24) * nu * nu) *
      t;
  return A * ratio * B;
}

/** CMS convexity adjustment = 1/2 sF^2 sigma^2 t C / D_mod, with C and D_mod of a par bond (coupon = yield = sF, maturity = tenor, frequency m). */
export function cmsConvexityAdjustment(a: { sF: number; sigma: number; t: number; tenor: number; m: number }): number {
  const bond = { face: 100, couponRate: a.sF, maturity: a.tenor, frequency: a.m as 1 | 2 | 4 };
  const ratio = convexity(bond, a.sF) / modifiedDuration(bond, a.sF);
  return 0.5 * a.sF * a.sF * a.sigma * a.sigma * a.t * ratio;
}

/** Payoff of a payer swap at the fixing date = A(sT) (sT - sF), notional 1, flat curve at sT compounded m times, annuity over `tenor` years. */
export function payerSwapPayoffAtFixing(a: { sT: number; sF: number; tenor: number; m: number }): number {
  return annuity(() => a.sT, a.tenor, a.m, a.m) * (a.sT - a.sF);
}
