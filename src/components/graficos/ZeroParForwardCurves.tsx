import { forwardRate, parRate, polyZeroCurve } from "../../lib/finance/curves";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { widen } from "./shared";

// The upward panel of the source chart: zero rates 1.0% at 1 year and 6.4% at 10 years,
// that is 3.4% at 5 years plus 0.6% per year. Annual coupons and annual compounding.
const DEFAULTS = { r5: 0.034, slope: 0.006, curvature: 0, T: 5 };

/**
 * Zero curve r(T) = r5 + slope (T - 5) + curvature (T - 5)^2, which pivots at 5 years, as the
 * coefficients level + slope' T + curvature T^2 that polyZeroCurve takes:
 * level = r5 - 5 slope + 25 curvature, slope' = slope - 10 curvature.
 */
function pivotedZeroCurve(r5: number, slope: number, curvature: number) {
  return polyZeroCurve(r5 - 5 * slope + 25 * curvature, slope - 10 * curvature, curvature);
}
const MATURITIES = Array.from({ length: 10 }, (_, i) => i + 1);

/** Zero, par, and 1-year forward rates at the maturities 1 to 10, from one zero curve. */
export function curvesFor(r5: number, slope: number, curvature: number) {
  const zero = pivotedZeroCurve(r5, slope, curvature);
  const at = (T: number) => ({
    zero: zero(T),
    par: parRate(zero, T, 1, 1),
    forward: forwardRate(zero(T - 1), T - 1, zero(T), T, 1),
  });
  return { zero, at, points: MATURITIES.map((T) => ({ T, ...at(T) })) };
}

/** Zero curve, par curve, and 1-year forward curve against the maturity, with a marked maturity. */
export default function ZeroParForwardCurves() {
  const { p, set, reset } = useParams(DEFAULTS);
  const { at, points } = curvesFor(p.r5, p.slope, p.curvature);
  const now = at(p.T);
  const series = (k: "zero" | "par" | "forward") => points.map((q): [number, number] => [q.T, q[k]]);
  const all = points.flatMap((q) => [q.zero, q.par, q.forward]);

  return (
    <ChartFrame
      name="ZeroParForwardCurves"
      title="Curvas cupón cero, par y forward"
      caption="Con cupones anuales, el tipo par c(T) y el tipo forward f(T−1, T) se deducen de la misma curva de tipos cupón cero r(T); el punto marca el vencimiento T elegido."
      onReset={reset}
      controls={
        <>
          <Slider symbol="r(5)" label="Tipo cupón cero a 5 años" value={p.r5} min={0} max={0.1} step={0.001} format={(v) => pct(v, 1)} onChange={(v) => set("r5", v)} />
          <Slider symbol={null} label="Pendiente (por año)" value={p.slope} min={-0.01} max={0.01} step={0.001} format={(v) => pct(v, 1)} onChange={(v) => set("slope", v)} />
          <Slider symbol={null} label="Curvatura (por año²)" value={p.curvature} min={-0.001} max={0.001} step={0.0001} format={(v) => pct(v, 2)} onChange={(v) => set("curvature", v)} />
          <Slider symbol="T" label="Vencimiento marcado" value={p.T} min={1} max={10} step={1} format={(v) => `${num(v, 0)} años`} onChange={(v) => set("T", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol="r(T)" label="Tipo cupón cero" value={pct(now.zero, 2)} />
          <Readout symbol="c(T)" label="Tipo par" value={pct(now.par, 2)} />
          <Readout symbol="f(T−1, T)" label="Tipo forward" value={pct(now.forward, 2)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Tipo cupón cero" },
          { series: "b", label: "Tipo par", dashed: true },
          { series: "c", label: "Tipo forward a 1 año" },
        ]}
      />
      <Plot
        xDomain={[1, 10]}
        yDomain={widen([0, 0.08], all, 0.01)}
        xLabel="Vencimiento T (años)"
        yLabel="Tipo"
        xFormat={(v) => num(v, 0)}
        yFormat={(v) => pct(v, 0)}
        ariaLabel="Curvas de tipos cupón cero, par y forward frente al vencimiento"
      >
        {({ x, y }) => (
          <>
            <Line points={series("forward")} x={x} y={y} series="c" />
            <Line points={series("par")} x={x} y={y} series="b" dashed />
            <Line points={series("zero")} x={x} y={y} series="main" />
            <Marker at={[p.T, now.forward]} x={x} y={y} series="c" />
            <Marker at={[p.T, now.par]} x={x} y={y} series="b" />
            <Marker at={[p.T, now.zero]} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
