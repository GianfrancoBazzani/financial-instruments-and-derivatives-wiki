import { cashFlows, macaulayDuration, price, type Bond } from "../../lib/finance/bonds";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Bars, Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { frequencySlider, tickNum, type Frequency } from "./shared";

// The bond of the worked example: coupon 5%, 4 years, annual coupons, yield 4%.
const DEFAULTS = { coupon: 0.05, maturity: 4, m: 1 as Frequency, y: 0.04 };
const FACE = 100;
// A cash flow is at most the principal plus a coupon of 10%; at a yield ≥ 0 its present value is not larger.
const PV_MAX = 120;

/** Present value of each cash flow: the price of a zero-coupon bond that pays it. */
function presentValues(b: Bond, y: number): { x: number; value: number }[] {
  return cashFlows(b).map(({ t, cf }) => ({
    x: t,
    value: price({ face: cf, couponRate: 0, maturity: t, frequency: b.frequency }, y),
  }));
}

/** Present value of each cash flow as a bar, with the Macaulay duration as the balance point. */
export default function MacaulayDuration() {
  const { p, set, reset } = useParams(DEFAULTS);
  const bond: Bond = { face: FACE, couponRate: p.coupon, maturity: p.maturity, frequency: p.m };
  const duration = macaulayDuration(bond, p.y);

  return (
    <ChartFrame
      name="MacaulayDuration"
      title="Duración de Macaulay"
      caption="Cada barra es el valor actual de un flujo de caja en su momento t_k, y la duración de Macaulay D_Mac, la media de los t_k ponderada por esos valores actuales, es el punto de equilibrio de las barras."
      onReset={reset}
      controls={
        <>
          <Slider symbol={null} label="Tipo del cupón" value={p.coupon} min={0} max={0.1} step={0.0025} format={(v) => pct(v, 2)} onChange={(v) => set("coupon", v)} />
          <Slider symbol="T" label="Vencimiento" value={p.maturity} min={1} max={10} step={1} format={(v) => `${num(v, 0)} años`} onChange={(v) => set("maturity", v)} />
          <Slider {...frequencySlider(p.m, (m) => set("m", m))} />
          <Slider symbol="y" label="Rentabilidad" value={p.y} min={0} max={0.1} step={0.001} format={(v) => pct(v, 2)} onChange={(v) => set("y", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol="P" label="Precio" value={num(price(bond, p.y), 2)} />
          <Readout symbol={<>D<sub>Mac</sub></>} label="D_Mac" hideLabel value={num(duration, 2)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Valor actual de cada flujo de caja", mark: "bar" },
          { series: "b", label: "Duración de Macaulay", dashed: true },
        ]}
      />
      <Plot
        xDomain={[0, p.maturity + 0.5]}
        yDomain={[0, PV_MAX]}
        xLabel="Momento t (años)"
        yLabel="Valor actual"
        xFormat={tickNum}
        yFormat={(v) => num(v, 0)}
        ariaLabel="Valor actual de cada flujo de caja del bono y su duración de Macaulay"
      >
        {({ x, y }) => (
          <>
            <Bars bars={presentValues(bond, p.y)} x={x} y={y} series="main" width={0.4 / p.m} />
            <Line points={[[duration, 0], [duration, PV_MAX]]} x={x} y={y} series="b" dashed />
            <Marker at={[duration, 0]} x={x} y={y} series="b" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
