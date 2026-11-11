// Number formats of the graphics: en-US (decimal point, comma thousands), as in the notes.
// A non-finite value prints "—"; a value that rounds to zero prints without a minus sign.

const formats = new Map<number, Intl.NumberFormat>();

function format(decimals: number): Intl.NumberFormat {
  let f = formats.get(decimals);
  if (f === undefined) {
    // signDisplay "negative" drops the sign of a value that rounds to zero ("-0.00" → "0.00").
    f = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      signDisplay: "negative",
    });
    formats.set(decimals, f);
  }
  return f;
}

/** 1234.5 with 2 decimals → "1,234.50". */
export function num(v: number, decimals: number): string {
  return Number.isFinite(v) ? format(decimals).format(v) : "—";
}

/** A decimal rate as a percentage: 0.045 with 2 decimals → "4.50%". */
export function pct(v: number, decimals: number): string {
  return Number.isFinite(v) ? `${num(v * 100, decimals)}%` : "—";
}

/** An amount of money, no currency sign: 125000 → "125,000". */
export function money(v: number, decimals = 0): string {
  return num(v, decimals);
}
