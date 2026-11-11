// Hedging with futures. Rates and volatilities are decimals.

/** Variance of the hedged position per unit of spot: sigma_S^2 + h^2 sigma_F^2 - 2 h rho sigma_S sigma_F (never below 0). */
export function hedgedVariance(h: number, sigmaS: number, sigmaF: number, rho: number): number {
  return Math.max(0, sigmaS * sigmaS + h * h * sigmaF * sigmaF - 2 * h * rho * sigmaS * sigmaF);
}

/** Minimum variance hedge ratio h* = rho sigma_S / sigma_F; returns 0 if sigma_F is 0. */
export function minVarianceHedgeRatio(rho: number, sigmaS: number, sigmaF: number): number {
  return sigmaF === 0 ? 0 : (rho * sigmaS) / sigmaF + 0;
}

/** Effective price obtained with a hedge = F1 + b2 (initial futures price plus final basis). */
export function effectivePrice(f1: number, b2: number): number {
  return f1 + b2;
}
