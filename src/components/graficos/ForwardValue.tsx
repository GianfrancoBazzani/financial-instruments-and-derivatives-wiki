import { forwardPrice, forwardValue } from "../../lib/finance/forwards";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { widen } from "./shared";

// A forward on an asset with no income, delivery price 100, r 5%, one year left, spot 100:
// F_0 = 105.13 and the long contract is worth 4.88.
const DEFAULTS = { k: 100, r: 0.05, T: 1, s: 100 };
const S_MIN = 60;
const S_MAX = 140;

/** Value today of a long and a short forward against the spot price S (asset with no income), with S marked. */
export default function ForwardValue() {
  const { p, set, reset } = useParams(DEFAULTS);
  const f0 = (s: number) => forwardPrice({ spot: s, r: p.r, T: p.T });
  const value = (s: number, side: "long" | "short"): [number, number] => [
    s,
    forwardValue({ f0: f0(s), k: p.k, r: p.r, T: p.T, side }),
  ];
  const ends = [value(S_MIN, "long"), value(S_MAX, "long"), value(S_MIN, "short"), value(S_MAX, "short")];

  return (
    <ChartFrame
      name="ForwardValue"
      title="Valor de un forward"
      caption="El valor de un forward largo f_long = (F_0 − K) e^(−rT) y el de uno corto f_short = (K − F_0) e^(−rT) son rectas opuestas del precio spot S, con F_0 = S e^(rT); el punto marca el precio S elegido."
      onReset={reset}
      controls={
        <>
          <Slider symbol="K" label="Precio de entrega" value={p.k} min={80} max={120} step={1} format={(v) => num(v, 0)} onChange={(v) => set("k", v)} />
          <Slider symbol="r" label="Tipo libre de riesgo" value={p.r} min={0} max={0.1} step={0.0025} format={(v) => pct(v, 2)} onChange={(v) => set("r", v)} />
          <Slider symbol="T" label="Tiempo hasta el vencimiento" value={p.T} min={0} max={5} step={0.25} format={(v) => `${num(v, 2)} años`} onChange={(v) => set("T", v)} />
          <Slider symbol="S" label="Precio spot" value={p.s} min={S_MIN} max={S_MAX} step={1} format={(v) => num(v, 0)} onChange={(v) => set("s", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={<>F<sub>0</sub></>} label="Precio forward" value={num(f0(p.s), 2)} />
          <Readout symbol={null} label="f largo" value={num(value(p.s, "long")[1], 2)} />
          <Readout symbol={null} label="f corto" value={num(value(p.s, "short")[1], 2)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "f largo" },
          { series: "b", label: "f corto" },
          { series: "muted", label: "Valor cero", dashed: true },
        ]}
      />
      <Plot
        xDomain={[S_MIN, S_MAX]}
        yDomain={widen([-60, 60], ends.map(([, v]) => v), 20)}
        xLabel="Precio spot S"
        yLabel="Valor f"
        xFormat={(v) => num(v, 0)}
        yFormat={(v) => num(v, 0)}
        ariaLabel="Valor de un forward largo y de un forward corto frente al precio spot"
      >
        {({ x, y }) => (
          <>
            <Line points={[[S_MIN, 0], [S_MAX, 0]]} x={x} y={y} series="muted" dashed />
            <Line points={[value(S_MIN, "short"), value(S_MAX, "short")]} x={x} y={y} series="b" />
            <Line points={[value(S_MIN, "long"), value(S_MAX, "long")]} x={x} y={y} series="main" />
            <Marker at={value(p.s, "short")} x={x} y={y} series="b" />
            <Marker at={value(p.s, "long")} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
