import { capletPayoff, collarEffectiveRate, floorletPayoff } from "../../lib/finance/options";
import { ChartFrame } from "./kit/ChartFrame";
import { money, num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { linspace } from "./shared";

// The collar of the worked example: cap 3%, floor 2%, quarterly reset on USD 10 million; the marker is the 3.5% row of the table.
const DEFAULTS = { cap: 0.03, floor: 0.02, r: 0.035 };
const L = 10_000_000;
const DELTA = 0.25;
const R_MIN = 0;
const R_MAX = 0.06;
const PAYOFF_MAX = L * DELTA * R_MAX; // the floorlet at R = 0 with the highest floor
const POINTS = 61;

/** Payoff of a caplet and of a floorlet against the reference rate, and the effective rate of the borrower with a collar. */
export default function CapFloorCollarPayoff() {
  const { p, set, reset } = useParams(DEFAULTS);
  const floor = Math.min(p.floor, p.cap); // R_F ≤ R_C: the floor follows the cap when the cap goes below it
  const rates = linspace(R_MIN, R_MAX, POINTS);
  const caplet = (r: number) => capletPayoff(r, p.cap, L, DELTA);
  const floorlet = (r: number) => floorletPayoff(r, floor, L, DELTA);
  const effective = (r: number) => collarEffectiveRate(r, p.cap, floor);
  const curve = (f: (r: number) => number): [number, number][] => rates.map((r) => [r, f(r)]);

  return (
    <ChartFrame
      name="CapFloorCollarPayoff"
      title="Payoff de cap, floor y collar"
      caption="El payoff del caplet L δ max(R − R_C, 0) y el del floorlet L δ max(R_F − R, 0) dan el tipo efectivo R_ef = R − max(R − R_C, 0) + max(R_F − R, 0), que se mantiene entre R_F y R_C."
      onReset={reset}
      controls={
        <>
          <Slider symbol={<>R<sub>C</sub></>} label="Tipo del cap" value={p.cap} min={0.01} max={R_MAX} step={0.0005} format={(v) => pct(v, 2)} onChange={(v) => set("cap", v)} />
          <Slider symbol={<>R<sub>F</sub></>} label="Tipo del floor" value={floor} min={0} max={R_MAX} step={0.0005} format={(v) => pct(v, 2)} onChange={(v) => set("floor", v)} />
          <Slider symbol="R" label="Tipo de referencia" value={p.r} min={R_MIN} max={R_MAX} step={0.0005} format={(v) => pct(v, 2)} onChange={(v) => set("r", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={null} label="Caplet" value={money(caplet(p.r))} />
          <Readout symbol={null} label="Floorlet" value={money(floorlet(p.r))} />
          <Readout symbol={<>R<sub>ef</sub></>} label="R_ef" hideLabel value={pct(effective(p.r), 2)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Payoff del caplet" },
          { series: "b", label: "Payoff del floorlet" },
        ]}
      />
      <Plot
        xDomain={[R_MIN, R_MAX]}
        yDomain={[0, PAYOFF_MAX]}
        xLabel="Tipo R"
        yLabel="Payoff por trimestre (miles)"
        xFormat={(v) => pct(v, 0)}
        yFormat={(v) => num(v / 1000, 0)}
        ariaLabel="Payoff de un caplet y de un floorlet frente al tipo de referencia"
      >
        {({ x, y }) => (
          <>
            <Line points={curve(floorlet)} x={x} y={y} series="b" />
            <Line points={curve(caplet)} x={x} y={y} series="main" />
            <Marker at={[p.r, floorlet(p.r)]} x={x} y={y} series="b" />
            <Marker at={[p.r, caplet(p.r)]} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
      <Legend
        items={[
          { series: "main", label: "Tipo efectivo con collar" },
          { series: "muted", label: "Tipo sin cobertura", dashed: true },
        ]}
      />
      <Plot
        xDomain={[R_MIN, R_MAX]}
        yDomain={[R_MIN, R_MAX]}
        xLabel="Tipo R"
        yLabel="Tipo efectivo R_ef"
        xFormat={(v) => pct(v, 0)}
        yFormat={(v) => pct(v, 0)}
        ariaLabel="Tipo efectivo del prestatario con collar frente al tipo de referencia"
      >
        {({ x, y }) => (
          <>
            <Line points={[[R_MIN, R_MIN], [R_MAX, R_MAX]]} x={x} y={y} series="muted" dashed />
            <Line points={curve(effective)} x={x} y={y} series="main" />
            <Marker at={[p.r, effective(p.r)]} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
