import { forwardPrice } from "../../lib/finance/forwards";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { linspace, tickNum, widen } from "./shared";

// A spot of 100 with r 5% and no income, storage cost, or convenience yield: c = 5% and F_0 = 105.13 after one year.
const DEFAULTS = { s0: 100, r: 0.05, q: 0, u: 0, y: 0, T: 1 };
const T_MAX = 5;

/** Forward price against the time to maturity under the cost of carry c = r − q + u, with T marked. */
export default function ForwardPrice() {
  const { p, set, reset } = useParams(DEFAULTS);
  const at = (T: number): [number, number] => [
    T,
    forwardPrice({ spot: p.s0, r: p.r, T, q: p.q, u: p.u, y: p.y }),
  ];
  const curve = linspace(0, T_MAX, 51).map(at);
  const marker = at(p.T);
  const carry = p.r - p.q + p.u;

  return (
    <ChartFrame
      name="ForwardPrice"
      title="Precio forward"
      caption="El precio forward F_0 = S_0 e^((c − y)T) parte del precio spot S_0 y crece o decrece con el tiempo según el coste de carry c = r − q + u menos la rentabilidad de conveniencia y; el punto marca el vencimiento T elegido."
      onReset={reset}
      controls={
        <>
          <Slider symbol={<>S<sub>0</sub></>} label="Precio spot" value={p.s0} min={80} max={120} step={1} format={(v) => num(v, 0)} onChange={(v) => set("s0", v)} />
          <Slider symbol="r" label="Tipo libre de riesgo" value={p.r} min={0} max={0.1} step={0.0025} format={(v) => pct(v, 2)} onChange={(v) => set("r", v)} />
          <Slider symbol="q" label="Rentabilidad por ingresos" value={p.q} min={0} max={0.1} step={0.0025} format={(v) => pct(v, 2)} onChange={(v) => set("q", v)} />
          <Slider symbol="u" label="Coste de almacenamiento" value={p.u} min={0} max={0.1} step={0.0025} format={(v) => pct(v, 2)} onChange={(v) => set("u", v)} />
          <Slider symbol="y" label="Rentabilidad de conveniencia" value={p.y} min={0} max={0.1} step={0.0025} format={(v) => pct(v, 2)} onChange={(v) => set("y", v)} />
          <Slider symbol="T" label="Tiempo hasta el vencimiento" value={p.T} min={0} max={T_MAX} step={0.25} format={(v) => `${num(v, 2)} años`} onChange={(v) => set("T", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol="c" label="Coste de carry" value={pct(carry, 2)} />
          <Readout symbol={<>F<sub>0</sub></>} label="Precio forward" value={num(marker[1], 2)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Precio forward" },
          { series: "muted", label: "Precio spot", dashed: true },
        ]}
      />
      <Plot
        xDomain={[0, T_MAX]}
        yDomain={widen([80, 140], [...curve.map(([, v]) => v), p.s0], 20)}
        xLabel="Tiempo T (años)"
        yLabel="Precio forward F_0"
        xFormat={tickNum}
        yFormat={(v) => num(v, 0)}
        ariaLabel="Precio forward frente al tiempo hasta el vencimiento, con el precio spot como referencia"
      >
        {({ x, y }) => (
          <>
            <Line points={[[0, p.s0], [T_MAX, p.s0]]} x={x} y={y} series="muted" dashed />
            <Line points={curve} x={x} y={y} series="main" />
            <Marker at={marker} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
