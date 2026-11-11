import { scaleLinear, type ScaleLinear } from "d3-scale";
import { createContext, useContext, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import "./kit.css";

/** What a plot passes to its children: the scales and the size of the inner (drawing) area. */
export interface PlotScales {
  x: (v: number) => number;
  y: (v: number) => number;
  width: number;
  height: number;
}

export interface PlotProps {
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel: string;
  yLabel: string;
  xFormat(v: number): string;
  yFormat(v: number): string;
  /** Short description of the plot for screen readers. */
  ariaLabel: string;
  children(s: PlotScales): ReactNode;
}

/** Width on the server and at the first client render, so that hydration matches the HTML. */
export const SERVER_WIDTH = 640;
const MIN_WIDTH = 240;

/** About 0.6 × width, kept between 220 and 380 px. */
export function plotHeight(width: number): number {
  return Math.round(Math.min(380, Math.max(220, 0.6 * width)));
}

// Labels are 12 px; a character of Source Sans 3 (tabular figures) is narrower than 6.6 px.
const FONT = 12;
const CHAR = 6.6;
const TOP = 30; // room for the y-axis label
const BOTTOM = 46; // x tick labels and the x-axis label
const GAP = 8; // between a tick label and the plot area

const textWidth = (s: string) => s.length * CHAR;

/** Inner size and clip-path id of the enclosing plot; null outside a plot. */
interface PlotArea {
  width: number;
  height: number;
  clipId: string;
}
const PlotContext = createContext<PlotArea | null>(null);
export const usePlotArea = () => useContext(PlotContext);

/** A usable domain whatever the graphic computed: finite and not empty. */
function safeDomain([a, b]: [number, number]): [number, number] {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return [0, 1];
  if (a === b) return [a - 1, a + 1];
  return [a, b];
}

/** The most ticks (up to one per `spacing` px) whose labels keep `room(a, b)` px apart. */
function pickTicks(
  scale: ScaleLinear<number, number>,
  length: number,
  spacing: number,
  room: (a: number, b: number) => number,
): number[] {
  for (let n = Math.max(2, Math.floor(length / spacing)); n >= 1; n--) {
    const ticks = scale.ticks(n);
    if (ticks.length < 2) continue;
    if (ticks.every((t, i) => i === 0 || Math.abs(scale(t) - scale(ticks[i - 1])) >= room(ticks[i - 1], t)))
      return ticks;
  }
  return scale.domain();
}

/** Margins, scales, and ticks for a plot of this outer size. */
function layout(width: number, p: PlotProps) {
  const height = plotHeight(width);
  const ih = height - TOP - BOTTOM;
  const y = scaleLinear().domain(safeDomain(p.yDomain)).range([ih, 0]);
  const yTicks = pickTicks(y, ih, 45, () => FONT + 8);
  const yLabels = yTicks.map(p.yFormat);
  const yWidth = Math.max(...yLabels.map(textWidth));

  const x = scaleLinear().domain(safeDomain(p.xDomain));
  const xRoom = (a: number, b: number) => (textWidth(p.xFormat(a)) + textWidth(p.xFormat(b))) / 2 + 14;
  // The first and last tick labels are centred on their ticks and may reach into the margins.
  let left = Math.max(28, yWidth + GAP);
  let right = 12;
  const ticksFor = () => {
    x.range([0, width - left - right]);
    return pickTicks(x, width - left - right, 80, xRoom);
  };
  let xTicks = ticksFor();
  for (let pass = 0; pass < 3; pass++) {
    const iw = width - left - right;
    const half = xTicks.map((t) => textWidth(p.xFormat(t)) / 2);
    const newLeft = Math.max(left, ...xTicks.map((t, i) => Math.ceil(half[i] - x(t)) + 2));
    const newRight = Math.max(right, ...xTicks.map((t, i) => Math.ceil(half[i] - (iw - x(t))) + 2));
    if (newLeft === left && newRight === right) break;
    left = newLeft;
    right = newRight;
    xTicks = ticksFor();
  }
  return { height, left, iw: width - left - right, ih, x, y, xTicks, yTicks, yLabels };
}

/** An SVG plot with grid, axes, tick labels, and axis labels; it fills the width of its container. */
export function Plot(props: PlotProps) {
  const { xLabel, yLabel, xFormat, ariaLabel, children } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(SERVER_WIDTH);
  const clipId = `grafico-recorte${useId()}`;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = (w: number) => {
      if (w > 0) setWidth(Math.max(MIN_WIDTH, Math.floor(w)));
    };
    apply(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => apply(entries[0].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { height, left, iw, ih, x, y, xTicks, yTicks, yLabels } = layout(width, props);
  const [y0, y1] = y.domain();
  const zeroInside = Math.min(y0, y1) < 0 && Math.max(y0, y1) > 0;

  return (
    <div className="grafico-plot" ref={ref}>
      <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
        <defs>
          <clipPath id={clipId}>
            <rect x={-2} y={-2} width={iw + 4} height={ih + 4} />
          </clipPath>
        </defs>
        <text className="grafico-titulo-eje" x={0} y={14}>
          {yLabel}
        </text>
        <text className="grafico-titulo-eje" x={width} y={height - 6} textAnchor="end">
          {xLabel}
        </text>
        <g transform={`translate(${left},${TOP})`}>
          <g className="grafico-rejilla">
            {xTicks.map((t) => (
              <line key={`x${t}`} x1={x(t)} x2={x(t)} y1={0} y2={ih} />
            ))}
            {yTicks.map((t) => (
              <line key={`y${t}`} x1={0} x2={iw} y1={y(t)} y2={y(t)} />
            ))}
          </g>
          {zeroInside && <line className="grafico-cero" x1={0} x2={iw} y1={y(0)} y2={y(0)} />}
          <g className="grafico-eje grafico-eje-y">
            <line x1={0} x2={0} y1={0} y2={ih} />
            {yTicks.map((t, i) => (
              <text key={t} x={-GAP} y={y(t)} dy="0.32em" textAnchor="end">
                {yLabels[i]}
              </text>
            ))}
          </g>
          <g className="grafico-eje grafico-eje-x">
            <line x1={0} x2={iw} y1={ih} y2={ih} />
            {xTicks.map((t) => (
              <text key={t} x={x(t)} y={ih + GAP + FONT} textAnchor="middle">
                {xFormat(t)}
              </text>
            ))}
          </g>
          <PlotContext.Provider value={{ width: iw, height: ih, clipId }}>
            {children({ x, y, width: iw, height: ih })}
          </PlotContext.Provider>
        </g>
      </svg>
    </div>
  );
}
