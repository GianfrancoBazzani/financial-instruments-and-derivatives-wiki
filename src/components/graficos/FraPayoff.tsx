import { fraPayoff, fraPayoffAtStart } from "../../lib/finance/rates";
import { ChartFrame } from "./kit/ChartFrame";
import { money, num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";

// The FRA of the worked example: principal 100 million, R_K 3%, tau 0.25, realised rate 3.5%, seen from the party that pays fixed.
const DEFAULTS = { l: 100, rK: 0.03, tau: 0.25, rM: 0.035 };
const R_MIN = 0;
const R_MAX = 0.06;
const R_SPREAD = 0.05; // the largest |R_M − R_K| on the plot: R_K in [1%, 5%] and R_M in [0%, 6%]

/** Amount that an FRA pays at the end of the period against the realised rate R_M, for both parties, with R_M marked. */
export default function FraPayoff() {
  const { p, set, reset } = useParams(DEFAULTS);
  const args = (rM: number, side: "payFixed" | "receiveFixed") => ({
    notional: p.l * 1e6,
    fixedRate: p.rK,
    realizedRate: rM,
    tau: p.tau,
    side,
  });
  const at = (rM: number, side: "payFixed" | "receiveFixed"): [number, number] => [rM, fraPayoff(args(rM, side))];
  const atEnd = fraPayoff(args(p.rM, "payFixed"));
  const atStart = fraPayoffAtStart(args(p.rM, "payFixed"));
  const limit = p.l * 1e6 * p.tau * R_SPREAD;

  return (
    <ChartFrame
      name="FraPayoff"
      title="Payoff de un FRA"
      caption="El FRA paga L τ (R_M − R_K) a quien paga el tipo fijo R_K y el importe opuesto a quien lo recibe, una recta que se anula cuando el tipo realizado R_M es igual a R_K."
      onReset={reset}
      controls={
        <>
          <Slider symbol="L" label="Principal" value={p.l} min={10} max={500} step={10} format={(v) => `${num(v, 0)} millones`} onChange={(v) => set("l", v)} />
          <Slider symbol={<>R<sub>K</sub></>} label="Tipo fijo" value={p.rK} min={0.01} max={0.05} step={0.0025} format={(v) => pct(v, 2)} onChange={(v) => set("rK", v)} />
          <Slider symbol="τ" label="Duración del periodo" value={p.tau} min={0.25} max={1} step={0.25} format={(v) => `${num(v, 2)} años`} onChange={(v) => set("tau", v)} />
          <Slider symbol={<>R<sub>M</sub></>} label="Tipo de referencia realizado" value={p.rM} min={R_MIN} max={R_MAX} step={0.001} format={(v) => pct(v, 2)} onChange={(v) => set("rM", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={null} label="Pago al final" value={money(atEnd)} />
          <Readout symbol={null} label="Pago al inicio" value={money(atStart)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Paga fijo" },
          { series: "b", label: "Recibe fijo" },
          { series: "muted", label: "Pago cero", dashed: true },
        ]}
      />
      <Plot
        xDomain={[R_MIN, R_MAX]}
        yDomain={[-limit, limit]}
        xLabel="Tipo realizado R_M"
        yLabel="Pago (miles)"
        xFormat={(v) => pct(v, 0)}
        yFormat={(v) => num(v / 1000, 0)}
        ariaLabel="Importe que paga un FRA a quien paga el tipo fijo y a quien lo recibe frente al tipo de referencia realizado"
      >
        {({ x, y }) => (
          <>
            <Line points={[[R_MIN, 0], [R_MAX, 0]]} x={x} y={y} series="muted" dashed />
            <Line points={[at(R_MIN, "receiveFixed"), at(R_MAX, "receiveFixed")]} x={x} y={y} series="b" />
            <Line points={[at(R_MIN, "payFixed"), at(R_MAX, "payFixed")]} x={x} y={y} series="main" />
            <Marker at={at(p.rM, "receiveFixed")} x={x} y={y} series="b" />
            <Marker at={at(p.rM, "payFixed")} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
