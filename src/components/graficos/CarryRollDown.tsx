import { carryRollDown, polyZeroCurve } from "../../lib/finance/curves";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { widen } from "./shared";

// The worked example of the text: coupon 5%, 5 years, yield at 5 years 4.5%, curve slope 0.2% per
// year (4.3% at 4 years), horizon 1 year.
const DEFAULTS = { slope: 0.002, maturity: 5, yM: 0.045, horizon: 1 };
const COUPON = 0.05;

/** A bond that rolls down an unchanged linear yield curve: carry, roll-down, and total return. */
export default function CarryRollDown() {
  const { p, set, reset } = useParams(DEFAULTS);
  const horizon = Math.min(p.horizon, p.maturity - 1); // the horizon stays below the maturity
  const curve = polyZeroCurve(p.yM - p.slope * p.maturity, p.slope, 0);
  const later = p.maturity - horizon;
  const r = carryRollDown({
    couponRate: COUPON,
    maturity: p.maturity,
    yieldNow: curve(p.maturity),
    yieldAtHorizon: curve(later),
    horizon,
  });
  const xMax = widen([0, 10], [p.maturity], 5)[1];
  const ends: [number, number][] = [[0, curve(0)], [xMax, curve(xMax)]];

  return (
    <ChartFrame
      name="CarryRollDown"
      title="Carry y roll-down"
      caption="Si la curva estática no cambia, el bono pasa de rentabilidad y(T) a y(T−h) y rinde Total = Carry + Roll-Down."
      onReset={reset}
      controls={
        <>
          <Slider symbol={null} label="Pendiente de la curva (por año)" value={p.slope} min={-0.005} max={0.005} step={0.0005} format={(v) => pct(v, 2)} onChange={(v) => set("slope", v)} />
          <Slider symbol="T" label="Vencimiento" value={p.maturity} min={2} max={30} step={1} format={(v) => `${num(v, 0)} años`} onChange={(v) => set("maturity", v)} />
          <Slider symbol="y" label="Rentabilidad a vencimiento T" value={p.yM} min={0} max={0.1} step={0.001} format={(v) => pct(v, 2)} onChange={(v) => set("yM", v)} />
          <Slider symbol="h" label="Horizonte" value={horizon} min={1} max={p.maturity - 1} step={1} format={(v) => `${num(v, 0)} años`} onChange={(v) => set("horizon", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={null} label="Carry" value={pct(r.carry, 2)} />
          <Readout symbol={null} label="Roll-down" value={pct(r.rollDown, 2)} />
          <Readout symbol={null} label="Total" value={pct(r.total, 2)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Curva de rentabilidades" },
          { series: "b", label: "Bono hoy", mark: "point" },
          { series: "c", label: "Bono tras el horizonte", mark: "point" },
        ]}
      />
      <Plot
        xDomain={[0, xMax]}
        yDomain={widen([0, 0.08], [curve(0), curve(xMax)], 0.01)}
        xLabel="Vencimiento (años)"
        yLabel="Rentabilidad y"
        xFormat={(v) => num(v, 0)}
        yFormat={(v) => pct(v, 0)}
        ariaLabel="Curva de rentabilidades con el bono hoy y tras el horizonte"
      >
        {({ x, y }) => (
          <>
            <Line points={ends} x={x} y={y} series="main" />
            <Marker at={[later, curve(later)]} x={x} y={y} series="c" />
            <Marker at={[p.maturity, curve(p.maturity)]} x={x} y={y} series="b" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
