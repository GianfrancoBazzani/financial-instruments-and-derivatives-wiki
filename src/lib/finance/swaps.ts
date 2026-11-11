// Swap annuity, par swap rate and swap value. Rates are decimals; times are in years.
import { discountFactor, type ZeroCurve } from "./curves";
import type { Comp } from "./bonds";

// Number of payments: m per year up to `maturity`, at least one.
const periods = (maturity: number, m: number) => Math.max(1, Math.round(maturity * m));

/** Annuity A = sum tau DF(t_i), t_i = i/m for i = 1..maturity m, tau = 1/m; `comp` is the compounding of the zero rates. */
export function annuity(zero: ZeroCurve, maturity: number, m: number, comp: Comp): number {
  let a = 0;
  for (let i = 1; i <= periods(maturity, m); i++) a += discountFactor(zero(i / m), i / m, comp) / m;
  return a;
}

/** Par swap rate = (1 - DF(t_n)) / A, same payment dates as `annuity` (maturity below one period counts as one period). */
export function parSwapRate(zero: ZeroCurve, maturity: number, m: number, comp: Comp): number {
  const tn = periods(maturity, m) / m;
  return (1 - discountFactor(zero(tn), tn, comp)) / annuity(zero, maturity, m, comp);
}

/** Swap value = L A (R_par - R_K) for the payer; the receiver has the opposite sign. */
export function swapValue(a: {
  notional: number;
  fixedRate: number;
  parRate: number;
  annuity: number;
  side: "payer" | "receiver";
}): number {
  const v = a.notional * a.annuity * (a.parRate - a.fixedRate);
  return a.side === "payer" ? v : 0 - v; // 0 - v never returns -0
}

/**
 * Value of a swap when the whole curve is flat at `rate` (compounded m times, so the par rate equals `rate`):
 * value = L A(rate) (rate - R_K); dv01Line = L A(R_K) (rate - R_K), the linear approximation at the fixed rate. Sign by side.
 */
export function flatSwapPnl(a: {
  notional: number;
  fixedRate: number;
  maturity: number;
  m: number;
  rate: number;
  side: "payer" | "receiver";
}): { value: number; dv01Line: number } {
  const sign = a.side === "payer" ? 1 : -1;
  const aRate = annuity(() => a.rate, a.maturity, a.m, a.m);
  const aFixed = annuity(() => a.fixedRate, a.maturity, a.m, a.m);
  const d = a.rate - a.fixedRate;
  const value = sign * a.notional * aRate * d;
  const dv01Line = sign * a.notional * aFixed * d;
  return { value: value + 0, dv01Line: dv01Line + 0 }; // + 0 turns -0 into 0
}
