// Small building blocks that several graphics share and the kit does not hold.
// No financial formula here: the numbers come from src/lib/finance.
import type { SliderProps } from "./kit/Slider";

/** n evenly spaced numbers from a to b, both included (n ≥ 2). */
export function linspace(a: number, b: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
}

/** The base domain, widened in whole steps only where a finite value would leave it. */
export function widen(base: [number, number], values: number[], step: number): [number, number] {
  let [lo, hi] = base;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < lo) lo = Math.floor(v / step) * step;
    if (v > hi) hi = Math.ceil(v / step) * step;
  }
  return [lo, hi];
}

/** Coupon frequencies a reader can choose, as in the notes: 1, 2, or 4 coupons a year. */
export const FREQUENCIES = [1, 2, 4] as const;
export type Frequency = (typeof FREQUENCIES)[number];

/** Props of the slider of the coupon frequency m: three positions, 1, 2, and 4 coupons a year. */
export function frequencySlider(m: Frequency, onChange: (m: Frequency) => void): SliderProps {
  return {
    symbol: "m",
    label: "Cupones al año",
    value: FREQUENCIES.indexOf(m),
    min: 0,
    max: FREQUENCIES.length - 1,
    step: 1,
    format: (i) => String(FREQUENCIES[i]),
    onChange: (i) => onChange(FREQUENCIES[i]),
  };
}
