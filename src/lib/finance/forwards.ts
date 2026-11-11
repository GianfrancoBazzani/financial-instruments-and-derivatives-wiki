// Forward and futures contracts. Rates are decimals (continuous compounding); T in years.

export type Side = "long" | "short";

/** Payoff at maturity: long S_T - K, short K - S_T. */
export function forwardPayoff(sT: number, k: number, side: Side): number {
  return side === "long" ? sT - k : k - sT;
}

/** Forward price F0 = (S0 - I) e^((r - q + u - y) T); `income` is a present value I, q a yield, u storage cost, y convenience yield (all continuous, default 0). */
export function forwardPrice(a: {
  spot: number;
  r: number;
  T: number;
  income?: number;
  q?: number;
  u?: number;
  y?: number;
}): number {
  const { spot, r, T, income = 0, q = 0, u = 0, y = 0 } = a;
  return (spot - income) * Math.exp((r - q + u - y) * T);
}

/** Value of an existing contract: long (F0 - K) e^(-rT), short (K - F0) e^(-rT). */
export function forwardValue(a: { f0: number; k: number; r: number; T: number; side: Side }): number {
  return forwardPayoff(a.f0, a.k, a.side) * Math.exp(-a.r * a.T);
}

export interface MarginRow {
  day: number;
  price: number;
  dailyPnl: number;
  cumPnl: number;
  balance: number;
  variationMargin: number;
}

/**
 * Futures margin account, one row per price. Day 0 balance = initial margin.
 * balance = previous balance + variation margin + daily P&L (value before the top-up);
 * if balance < maintenance, variationMargin = initial - balance (top-up to the initial margin), else 0.
 */
export function marginAccount(prices: number[], initial: number, maintenance: number, side: Side): MarginRow[] {
  const rows: MarginRow[] = [];
  prices.forEach((p, i) => {
    const prev = i > 0 ? rows[i - 1] : undefined;
    const dailyPnl = prev ? forwardPayoff(p, prev.price, side) : 0;
    const balance = prev ? prev.balance + prev.variationMargin + dailyPnl : initial;
    rows.push({
      day: i,
      price: p,
      dailyPnl,
      cumPnl: forwardPayoff(p, prices[0], side),
      balance,
      variationMargin: balance < maintenance ? initial - balance : 0,
    });
  });
  return rows;
}
