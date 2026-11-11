import { price, type Bond } from "../../lib/finance/bonds";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { frequencySlider, linspace, widen, type Frequency } from "./shared";

// The bond of the worked examples of the page: coupon 5%, 4 years, annual coupons, yield 4%.
const DEFAULTS = { coupon: 0.05, maturity: 4, m: 1 as Frequency, y: 0.04 };
const Y_MAX = 0.1;
const FACE = 100;

/** Price of a bond against its yield, with the chosen yield marked. */
export default function PriceYield() {
  const { p, set, reset } = useParams(DEFAULTS);
  const bond: Bond = { face: FACE, couponRate: p.coupon, maturity: p.maturity, frequency: p.m };
  const curve = linspace(0, Y_MAX, 101).map((y): [number, number] => [y, price(bond, y)]);
  const current = price(bond, p.y);

  return (
    <ChartFrame
      name="PriceYield"
      title="Precio–rentabilidad"
      caption="El precio P es la suma de los flujos de caja descontados a la rentabilidad y, así que baja cuando y sube; el punto marca la rentabilidad elegida."
      onReset={reset}
      controls={
        <>
          <Slider symbol={null} label="Tipo del cupón" value={p.coupon} min={0} max={0.1} step={0.0025} format={(v) => pct(v, 2)} onChange={(v) => set("coupon", v)} />
          <Slider symbol="T" label="Vencimiento" value={p.maturity} min={1} max={30} step={1} format={(v) => `${num(v, 0)} años`} onChange={(v) => set("maturity", v)} />
          <Slider {...frequencySlider(p.m, (m) => set("m", m))} />
          <Slider symbol="y" label="Rentabilidad" value={p.y} min={0} max={Y_MAX} step={0.001} format={(v) => pct(v, 2)} onChange={(v) => set("y", v)} />
        </>
      }
      readouts={<Readout symbol="P" label="Precio" value={num(current, 2)} />}
    >
      <Legend
        items={[
          { series: "main", label: "Precio del bono" },
          { series: "muted", label: "Valor nominal (100)", dashed: true },
        ]}
      />
      <Plot
        xDomain={[0, Y_MAX]}
        yDomain={widen([70, 130], curve.map(([, v]) => v), 10)}
        xLabel="Rentabilidad y"
        yLabel="Precio P"
        xFormat={(v) => pct(v, 0)}
        yFormat={(v) => num(v, 0)}
        ariaLabel="Precio del bono frente a su rentabilidad"
      >
        {({ x, y }) => (
          <>
            <Line points={[[0, FACE], [Y_MAX, FACE]]} x={x} y={y} series="muted" dashed />
            <Line points={curve} x={x} y={y} series="main" />
            <Marker at={[p.y, current]} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
