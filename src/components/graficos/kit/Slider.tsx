import { useId, type ReactNode } from "react";

export interface SliderProps {
  /** Symbol of the formula, e.g. <>σ<sub>S</sub></>; set in the math italic of the formulas. */
  symbol: ReactNode;
  /** Plain name; also the accessible name of the slider. */
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Shows the current value with its unit, e.g. v => pct(v, 2). */
  format(v: number): string;
  onChange(v: number): void;
}

/** A labelled native range input: "symbol name" on the left, the current value on the right. */
export function Slider({ symbol, label, value, min, max, step, format, onChange }: SliderProps) {
  const id = useId();
  const shown = format(value);
  return (
    <div className="grafico-control">
      <div className="grafico-control-cabecera">
        <label htmlFor={id}>
          <span className="grafico-simbolo">{symbol}</span> {label}
        </label>
        <span className="grafico-valor">{shown}</span>
      </div>
      <input
        id={id}
        type="range"
        aria-label={label}
        aria-valuetext={shown}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
      />
    </div>
  );
}
