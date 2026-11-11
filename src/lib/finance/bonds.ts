// Bond pricing and risk measures. Rates are decimals (0.04 = 4%); times are in years.

/** Compounding: a number is the frequency per year; "continuous" is e^{y t}. */
export type Comp = number | "continuous";

export interface Bond {
  face: number;
  couponRate: number;
  maturity: number;
  frequency: 1 | 2 | 4;
}

const EPS = 1e-9;

// Discount factor for time t at yield y: (1 + y/m)^(-m t), or e^(-y t).
function df(y: number, t: number, comp: Comp): number {
  return comp === "continuous" ? Math.exp(-y * t) : Math.pow(1 + y / comp, -comp * t);
}

/** Cash flows still to come after `elapsed` years since issue; t = years from today (a coupon on the elapsed date is already paid). */
export function cashFlows(b: Bond, elapsed = 0): { t: number; cf: number }[] {
  const n = Math.max(1, Math.round(b.maturity * b.frequency));
  const coupon = (b.face * b.couponRate) / b.frequency;
  const out: { t: number; cf: number }[] = [];
  for (let k = 1; k <= n; k++) {
    const tk = k / b.frequency;
    if (tk - elapsed > EPS) out.push({ t: tk - elapsed, cf: k === n ? coupon + b.face : coupon });
  }
  return out;
}

/** Dirty price = sum CF_k (1 + y/m)^(-m t_k) (e^(-y t_k) if continuous); comp defaults to the coupon frequency. */
export function price(b: Bond, y: number, comp: Comp = b.frequency, elapsed = 0): number {
  return cashFlows(b, elapsed).reduce((s, c) => s + c.cf * df(y, c.t, comp), 0);
}

/** Accrued interest = annual coupon amount x years since the last coupon date (0 on a coupon date). */
export function accruedInterest(b: Bond, elapsed: number): number {
  const dt = 1 / b.frequency;
  const k = Math.floor(elapsed / dt + EPS);
  const since = elapsed - k * dt;
  return since < EPS ? 0 : b.face * b.couponRate * since;
}

/** Clean price = dirty price - accrued interest. */
export function cleanPrice(b: Bond, y: number, comp: Comp, elapsed: number): number {
  return price(b, y, comp, elapsed) - accruedInterest(b, elapsed);
}

/** Macaulay duration = (1/P) sum t_k CF_k DF_k, in years. */
export function macaulayDuration(b: Bond, y: number, comp: Comp = b.frequency): number {
  const p = price(b, y, comp);
  return cashFlows(b).reduce((s, c) => s + c.t * c.cf * df(y, c.t, comp), 0) / p;
}

/** Modified duration = D_Mac / (1 + y/m); equals D_Mac for continuous compounding. */
export function modifiedDuration(b: Bond, y: number, comp: Comp = b.frequency): number {
  const d = macaulayDuration(b, y, comp);
  return comp === "continuous" ? d : d / (1 + y / comp);
}

/** Convexity = (1/P) sum t_k (t_k + 1/m) CF_k DF_k / (1 + y/m)^2; continuous: (1/P) sum t_k^2 CF_k e^(-y t_k). */
export function convexity(b: Bond, y: number, comp: Comp = b.frequency): number {
  const p = price(b, y, comp);
  const flows = cashFlows(b);
  if (comp === "continuous") return flows.reduce((s, c) => s + c.t * c.t * c.cf * df(y, c.t, comp), 0) / p;
  const g = (1 + y / comp) ** 2;
  return flows.reduce((s, c) => s + c.t * (c.t + 1 / comp) * c.cf * df(y, c.t, comp), 0) / (p * g);
}

/** Money duration = D_mod x (P/100) x face: currency change of the position per unit of yield. */
export function moneyDuration(b: Bond, y: number, comp: Comp = b.frequency): number {
  return modifiedDuration(b, y, comp) * (price(b, y, comp) / 100) * b.face;
}

/** DV01 = -money duration x 0.0001: currency change for +1 bp (negative). */
export function dv01(b: Bond, y: number, comp: Comp = b.frequency): number {
  return -moneyDuration(b, y, comp) * 0.0001;
}

/** Relative price change for a yield shift dy: linear = -D_mod dy; secondOrder = linear + C dy^2/2; exact = P(y+dy)/P(y) - 1. */
export function priceChange(
  b: Bond,
  y: number,
  dy: number,
  comp: Comp = b.frequency,
): { linear: number; secondOrder: number; exact: number } {
  const linear = -modifiedDuration(b, y, comp) * dy;
  return {
    linear,
    secondOrder: linear + 0.5 * convexity(b, y, comp) * dy * dy,
    exact: price(b, y + dy, comp) / price(b, y, comp) - 1,
  };
}
