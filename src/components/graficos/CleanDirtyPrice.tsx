import { accruedInterest, cleanPrice, price, type Bond } from "../../lib/finance/bonds";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { linspace, tickNum, widen } from "./shared";

// The bond of the text: 10 years, coupon 3% paid twice a year, constant yield 5%, seen at issue.
const DEFAULTS = { coupon: 0.03, maturity: 10, y: 0.05, t: 0 };
const FREQUENCY = 2;
const FACE = 100;
const T_STEP = 0.05;
// Just before a coupon date: the coupon is still in the dirty price.
const BEFORE = 1e-6;

type Point = [number, number];

/**
 * Dirty and clean price over the life of the bond, at a constant yield. Each coupon period is
 * sampled from just after its first coupon date to just before the next one, so the dirty price
 * falls vertically on each coupon date.
 */
export function lifeCurves(b: Bond, y: number): { dirty: Point[]; clean: Point[] } {
  const period = 1 / b.frequency;
  const periods = Math.round(b.maturity * b.frequency);
  const times = Array.from({ length: periods }, (_, k) => linspace(k * period, (k + 1) * period - BEFORE, 9)).flat();
  return {
    dirty: times.map((t) => [t, price(b, y, b.frequency, t)]),
    clean: times.map((t) => [t, cleanPrice(b, y, b.frequency, t)]),
  };
}

/** Dirty price (a saw-tooth) and clean price over the life of a bond, with a marker at time t. */
export default function CleanDirtyPrice() {
  const { p, set, reset } = useParams(DEFAULTS);
  const bond: Bond = { face: FACE, couponRate: p.coupon, maturity: p.maturity, frequency: FREQUENCY };
  const { dirty, clean } = lifeCurves(bond, p.y);
  // The marker stays before maturity, where the bond still has cash flows to come.
  const tMax = p.maturity - T_STEP;
  const t = Math.min(p.t, tMax);
  const dirtyAt = price(bond, p.y, FREQUENCY, t);
  const cleanAt = cleanPrice(bond, p.y, FREQUENCY, t);

  return (
    <ChartFrame
      name="CleanDirtyPrice"
      title="Precio limpio y precio sucio"
      caption="El precio limpio P_clean = P_dirty − AI es el precio sucio menos el cupón corrido AI, que crece entre dos fechas de cupón y vuelve a cero en cada una."
      onReset={reset}
      controls={
        <>
          <Slider symbol={null} label="Tipo del cupón" value={p.coupon} min={0} max={0.1} step={0.0025} format={(v) => pct(v, 2)} onChange={(v) => set("coupon", v)} />
          <Slider symbol="y" label="Rentabilidad" value={p.y} min={0} max={0.1} step={0.001} format={(v) => pct(v, 2)} onChange={(v) => set("y", v)} />
          <Slider symbol="T" label="Vencimiento" value={p.maturity} min={1} max={20} step={0.5} format={(v) => `${num(v, 1)} años`} onChange={(v) => set("maturity", v)} />
          <Slider symbol="t" label="Tiempo desde la emisión" value={t} min={0} max={tMax} step={T_STEP} format={(v) => `${num(v, 2)} años`} onChange={(v) => set("t", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={<>P<sub>dirty</sub></>} label="Precio sucio" value={num(dirtyAt, 2)} />
          <Readout symbol="AI" label="Cupón corrido" value={num(accruedInterest(bond, t), 2)} />
          <Readout symbol={<>P<sub>clean</sub></>} label="Precio limpio" value={num(cleanAt, 2)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Precio sucio" },
          { series: "b", label: "Precio limpio" },
          { series: "muted", label: "Valor nominal (100)", dashed: true },
        ]}
      />
      <Plot
        xDomain={[0, p.maturity]}
        yDomain={widen([80, 105], [...dirty, ...clean].map(([, v]) => v), 5)}
        xLabel="Años desde la emisión t"
        yLabel="Precio"
        xFormat={tickNum}
        yFormat={(v) => num(v, 0)}
        ariaLabel="Precio sucio y precio limpio del bono a lo largo de su vida"
      >
        {({ x, y }) => (
          <>
            <Line points={[[0, FACE], [p.maturity, FACE]]} x={x} y={y} series="muted" dashed />
            <Line points={clean} x={x} y={y} series="b" />
            <Line points={dirty} x={x} y={y} series="main" />
            <Marker at={[t, cleanAt]} x={x} y={y} series="b" />
            <Marker at={[t, dirtyAt]} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
