import { useCallback, useRef, useState } from "react";

/** The slider values of a graphic, with a setter per key and a reset to the first defaults. */
export function useParams<T extends Record<string, number>>(
  defaults: T,
): { p: T; set(k: keyof T, v: number): void; reset(): void } {
  const initial = useRef(defaults).current;
  const [p, setP] = useState<T>(initial);
  const set = useCallback((k: keyof T, v: number) => setP((prev) => ({ ...prev, [k]: v })), []);
  const reset = useCallback(() => setP(initial), [initial]);
  return { p, set, reset };
}
