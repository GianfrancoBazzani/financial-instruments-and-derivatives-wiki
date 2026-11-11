import { line } from "d3-shape";
import { usePlotArea } from "./Plot";
import "./kit.css";

/** Series colours, from the --g-* tokens of the theme (see kit.css). */
export type SeriesName = "main" | "b" | "c" | "muted";
type Scale = (v: number) => number;
type Point = [number, number];

// Far outside any plot, still harmless in an SVG path; the plot clips what lies outside.
const LIMIT = 1e5;
const clamp = (v: number) => Math.max(-LIMIT, Math.min(LIMIT, v));
const finite = (p: Point) => Number.isFinite(p[0]) && Number.isFinite(p[1]);
const round = (v: number) => Math.round(clamp(v) * 100) / 100;

export interface LineProps {
  points: Point[];
  x: Scale;
  y: Scale;
  series: SeriesName;
  dashed?: boolean;
  /** Direct label, written at the last visible point. */
  label?: string;
}

/** A polyline through the points; it breaks at a non-finite point and never draws "NaN". */
export function Line({ points, x, y, series, dashed = false, label }: LineProps) {
  const area = usePlotArea();
  const px = points.map(([a, b]): Point => [x(a), y(b)]);
  const d = line<Point>()
    .defined(finite)
    .x((p) => clamp(p[0]))
    .y((p) => clamp(p[1]))
    .digits(2)(px);
  if (!d) return null;
  const inside = (p: Point) =>
    finite(p) && (!area || (p[0] >= -1 && p[0] <= area.width + 1 && p[1] >= -1 && p[1] <= area.height + 1));
  const end = label ? px.findLast(inside) : undefined;
  return (
    <g data-serie={series}>
      <path
        className="grafico-linea"
        d={d}
        strokeDasharray={dashed ? "6 4" : undefined}
        clipPath={area ? `url(#${area.clipId})` : undefined}
      />
      {label && end && (
        <text
          className="grafico-etiqueta"
          x={round(end[0] - 4)}
          y={round(area ? Math.min(Math.max(end[1] - 8, 12), area.height - 4) : end[1] - 8)}
          textAnchor="end"
        >
          {label}
        </text>
      )}
    </g>
  );
}

export interface MarkerProps {
  at: Point;
  x: Scale;
  y: Scale;
  series: SeriesName;
  label?: string;
}

/** A point with an optional label; not drawn when it is not finite or lies outside the plot. */
export function Marker({ at, x, y, series, label }: MarkerProps) {
  const area = usePlotArea();
  const [cx, cy] = [x(at[0]), y(at[1])];
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
  if (area && (cx < -2 || cx > area.width + 2 || cy < -2 || cy > area.height + 2)) return null;
  // The label goes up and to the right, unless that leaves the plot.
  const toLeft = area !== null && cx > area.width * 0.7;
  const below = cy < 20;
  return (
    <g data-serie={series}>
      <circle className="grafico-punto" cx={round(cx)} cy={round(cy)} r={4.5} />
      {label && (
        <text
          className="grafico-etiqueta"
          x={round(toLeft ? cx - 8 : cx + 8)}
          y={round(below ? cy + 18 : cy - 9)}
          textAnchor={toLeft ? "end" : "start"}
        >
          {label}
        </text>
      )}
    </g>
  );
}

export interface BarsProps {
  bars: { x: number; value: number }[];
  x: Scale;
  y: Scale;
  series: SeriesName;
  /** Width of each bar in x units (e.g. 0.2 years). */
  width: number;
}

/** Bars from 0 to each value, centred on x; a bar with a non-finite value is skipped. */
export function Bars({ bars, x, y, series, width }: BarsProps) {
  const area = usePlotArea();
  const y0 = y(0);
  return (
    <g data-serie={series} clipPath={area ? `url(#${area.clipId})` : undefined}>
      {bars.map((b, i) => {
        const l = x(b.x - width / 2);
        const r = x(b.x + width / 2);
        const top = y(b.value);
        if (![l, r, top, y0].every(Number.isFinite)) return null;
        const [x0, x1] = [round(Math.min(l, r)), round(Math.max(l, r))];
        const [y1, y2] = [round(Math.min(top, y0)), round(Math.max(top, y0))];
        return <path key={i} className="grafico-barra" d={`M${x0},${y1}H${x1}V${y2}H${x0}Z`} />;
      })}
    </g>
  );
}

export interface LegendItem {
  series: SeriesName;
  label: string;
  dashed?: boolean;
  /** Swatch shape: a line (default), a bar, or a point. */
  mark?: "line" | "bar" | "point";
}

/** Names each series next to a swatch, so that colour alone never identifies a series. */
export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="grafico-leyenda">
      {items.map(({ series, label, dashed = false, mark = "line" }) => (
        <li key={label} data-serie={series}>
          <svg className="grafico-muestra" width="24" height="12" viewBox="0 0 24 12" aria-hidden="true">
            {mark === "bar" && <rect className="grafico-barra" x={7} y={1} width={10} height={10} />}
            {mark === "point" && <circle className="grafico-punto" cx={12} cy={6} r={4.5} />}
            {mark === "line" && (
              <line className="grafico-linea" x1={1} x2={23} y1={6} y2={6} strokeDasharray={dashed ? "6 4" : undefined} />
            )}
          </svg>
          {label}
        </li>
      ))}
    </ul>
  );
}
