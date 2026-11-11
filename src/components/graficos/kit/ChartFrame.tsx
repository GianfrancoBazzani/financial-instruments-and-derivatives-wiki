import type { ReactNode } from "react";
import "./kit.css";

export interface ChartFrameProps {
  /** Component name of the graphic, written to data-grafico. */
  name: string;
  /** Short title. Not a heading: graphics stay out of the page outline. */
  title: string;
  /** One sentence that names the formula. */
  caption: string;
  /** Sliders. */
  controls: ReactNode;
  /** Read-outs. */
  readouts: ReactNode;
  onReset(): void;
  /** The plot, and its legend if any. */
  children: ReactNode;
}

/** Common frame of every graphic: title, plot, controls, read-outs, "Restablecer", and caption. */
export function ChartFrame({ name, title, caption, controls, readouts, onReset, children }: ChartFrameProps) {
  return (
    <figure data-grafico={name} className="grafico not-content">
      <p className="grafico-titulo">{title}</p>
      <div className="grafico-lienzo">{children}</div>
      <div className="grafico-mandos">
        <div className="grafico-controles">{controls}</div>
        <dl className="grafico-lecturas">{readouts}</dl>
      </div>
      <div className="grafico-acciones">
        <button type="button" className="grafico-restablecer" onClick={onReset}>
          Restablecer
        </button>
      </div>
      <figcaption className="grafico-pie">{caption}</figcaption>
    </figure>
  );
}
