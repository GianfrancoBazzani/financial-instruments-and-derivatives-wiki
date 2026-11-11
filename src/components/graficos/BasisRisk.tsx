import { effectivePrice } from "../../lib/finance/hedging";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { tickNum } from "./shared";

// The example of the page: S_1 2.50, F_1 2.20 (basis 0.30 at t_1), F_2 1.90, and a final basis b_2 of 0.10 (S_2 2.00).
const DEFAULTS = { b2: 0.1, t2: 0.7 };
const S1 = 2.5;
const F1 = 2.2;
const F2 = 1.9;

/** Spot and futures prices from the start of the hedge (t_1, time 0) to its close-out t_2, with the basis b_2 and the convergence at T (time 1). */
export default function BasisRisk() {
  const { p, set, reset } = useParams(DEFAULTS);
  const s2 = F2 + p.b2;
  const effective = effectivePrice(F1, p.b2);

  return (
    <ChartFrame
      name="BasisRisk"
      title="Riesgo de base"
      caption="El precio efectivo F_1 + b_2 depende del basis b_2 en el momento 2 en que se cierra la cobertura, antes de que los precios converjan en T."
      onReset={reset}
      controls={
        <>
          <Slider symbol={<>b<sub>2</sub></>} label="Basis final" value={p.b2} min={-0.3} max={0.4} step={0.05} format={(v) => num(v, 2)} onChange={(v) => set("b2", v)} />
          <Slider symbol={<>t<sub>2</sub></>} label="Fecha de cierre" value={p.t2} min={0.1} max={0.9} step={0.05} format={(v) => pct(v, 0)} onChange={(v) => set("t2", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={null} label="Precio efectivo" value={num(effective, 2)} />
          <Readout symbol={<>b<sub>2</sub></>} label="Basis" value={num(p.b2, 2)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Precio spot S" },
          { series: "b", label: "Precio de futuros F" },
          { series: "c", label: "Basis b_2" },
          { series: "muted", label: "Convergencia en T", dashed: true },
        ]}
      />
      <Plot
        xDomain={[0, 1]}
        yDomain={[1.5, 2.6]}
        xLabel="Tiempo (t_1 = 0, T = 1)"
        yLabel="Precio"
        xFormat={tickNum}
        yFormat={(v) => num(v, 1)}
        ariaLabel="Precio spot y precio de futuros desde el inicio de la cobertura hasta su cierre, con el basis b_2 en el momento de cierre"
      >
        {({ x, y }) => (
          <>
            <Line points={[[p.t2, s2], [1, F2]]} x={x} y={y} series="muted" dashed />
            <Line points={[[p.t2, F2], [1, F2]]} x={x} y={y} series="muted" dashed />
            <Line points={[[0, S1], [p.t2, s2]]} x={x} y={y} series="main" />
            <Line points={[[0, F1], [p.t2, F2]]} x={x} y={y} series="b" />
            <Line points={[[p.t2, F2], [p.t2, s2]]} x={x} y={y} series="c" />
            <Marker at={[0, S1]} x={x} y={y} series="main" label="S_1" />
            <Marker at={[0, F1]} x={x} y={y} series="b" label="F_1" />
            <Marker at={[p.t2, s2]} x={x} y={y} series="main" />
            <Marker at={[p.t2, F2]} x={x} y={y} series="b" />
            <text className="grafico-etiqueta" x={x(p.t2) - 8} y={y(F2) + 18} textAnchor="end">
              {`b_2 = S_2 − F_2 = ${num(p.b2, 2)}`}
            </text>
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
