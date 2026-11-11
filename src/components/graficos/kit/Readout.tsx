import type { ReactNode } from "react";

export interface ReadoutProps {
  /** Symbol of the text, e.g. <>D<sub>Mac</sub></>; null when there is none. */
  symbol: ReactNode;
  /** Spanish label; tests find the read-out by it. */
  label: string;
  /** Already formatted with fmt. */
  value: string;
  /** Hide the label when it only repeats the symbol (e.g. label "D_Mac"); the symbol stays. */
  hideLabel?: boolean;
}

/** One result of the graphic: symbol and label above, the number below, in tabular figures. */
export function Readout({ symbol, label, value, hideLabel = false }: ReadoutProps) {
  const hasSymbol = symbol != null;
  const showLabel = !hideLabel || !hasSymbol;
  return (
    <div className="grafico-lectura" data-lectura={label}>
      <dt>
        {hasSymbol && <span className="grafico-simbolo">{symbol}</span>}
        {hasSymbol && showLabel && " "}
        {showLabel && label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}
