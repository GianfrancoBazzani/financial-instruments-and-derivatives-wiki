import { forwardPayoff } from "../../lib/finance/forwards";
import { ChartFrame } from "./kit/ChartFrame";
import { num } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";

// Delivery price 100 and a price at maturity of 102: a long forward gains 2, a short forward loses 2.
const DEFAULTS = { k: 100, sT: 102 };
const S_MIN = 60;
const S_MAX = 140;
const Y_LIMIT = 60; // the largest payoff on the plot: S_MAX − K with K = 80

/** Payoff at maturity of a long and a short forward against the price S_T, with S_T marked. */
export default function ForwardPayoff() {
  const { p, set, reset } = useParams(DEFAULTS);
  const at = (s: number, side: "long" | "short"): [number, number] => [s, forwardPayoff(s, p.k, side)];
  const long = forwardPayoff(p.sT, p.k, "long");
  const short = forwardPayoff(p.sT, p.k, "short");

  return (
    <ChartFrame
      name="ForwardPayoff"
      title="Payoff de un forward"
      caption="El payoff largo S_T − K y el payoff corto K − S_T son rectas opuestas que se anulan en el precio de entrega K; el punto marca el precio S_T elegido."
      onReset={reset}
      controls={
        <>
          <Slider symbol="K" label="Precio de entrega" value={p.k} min={80} max={120} step={1} format={(v) => num(v, 0)} onChange={(v) => set("k", v)} />
          <Slider symbol={<>S<sub>T</sub></>} label="Precio al vencimiento" value={p.sT} min={S_MIN} max={S_MAX} step={1} format={(v) => num(v, 0)} onChange={(v) => set("sT", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={null} label="Payoff largo" value={num(long, 2)} />
          <Readout symbol={null} label="Payoff corto" value={num(short, 2)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Payoff largo" },
          { series: "b", label: "Payoff corto" },
          { series: "muted", label: "Payoff cero", dashed: true },
        ]}
      />
      <Plot
        xDomain={[S_MIN, S_MAX]}
        yDomain={[-Y_LIMIT, Y_LIMIT]}
        xLabel="Precio S_T"
        yLabel="Payoff"
        xFormat={(v) => num(v, 0)}
        yFormat={(v) => num(v, 0)}
        ariaLabel="Payoff de un forward largo y de un forward corto frente al precio al vencimiento"
      >
        {({ x, y }) => (
          <>
            <Line points={[[S_MIN, 0], [S_MAX, 0]]} x={x} y={y} series="muted" dashed />
            <Line points={[at(S_MIN, "short"), at(S_MAX, "short")]} x={x} y={y} series="b" />
            <Line points={[at(S_MIN, "long"), at(S_MAX, "long")]} x={x} y={y} series="main" />
            <Marker at={at(p.sT, "short")} x={x} y={y} series="b" />
            <Marker at={at(p.sT, "long")} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
