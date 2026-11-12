import { flatSwapPnl } from "../../lib/finance/swaps";
import { ChartFrame } from "./kit/ChartFrame";
import { money, num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { linspace, widen } from "./shared";

// The swap of the note: 30 years, annual payments, fixed rate 4.30%, notional 100 million, par at the start
// (the marker rate equals the fixed rate, so the value is zero).
const DEFAULTS = { fixed: 0.043, n: 30, millions: 100, marker: 0.043 };
const M = 1; // annual payments
const RATE_MIN = 0.01;
const RATE_MAX = 0.08;

/** Value of a payer and of a receiver swap against a flat swap rate, with the straight line of the DV01 at the fixed rate. */
export default function SwapValue() {
  const { p, set, reset } = useParams(DEFAULTS);
  const notional = p.millions * 1e6;
  const pnl = (rate: number, side: "payer" | "receiver") =>
    flatSwapPnl({ notional, fixedRate: p.fixed, maturity: p.n, m: M, rate, side });
  const rates = linspace(RATE_MIN, RATE_MAX, 36);
  const payer = rates.map((r) => pnl(r, "payer"));
  const receiver = rates.map((r) => pnl(r, "receiver"));
  const series = (v: { value: number }[]): [number, number][] => rates.map((r, i) => [r, v[i].value]);
  const line: [number, number][] = rates.map((r, i) => [r, payer[i].dv01Line]);
  const at = { payer: pnl(p.marker, "payer"), receiver: pnl(p.marker, "receiver") };
  const yDomain = widen(
    [-1e8, 1e8],
    [...payer, ...receiver].flatMap((v) => [v.value, v.dv01Line]),
    5e7,
  );

  return (
    <ChartFrame
      name="SwapValue"
      title="Valor de un swap"
      caption="El valor del swap pagador L A (R_par − R_K) se aparta de la recta del DV01 cuando el tipo swap se aleja de R_K, porque la anualidad A cambia con los tipos."
      onReset={reset}
      controls={
        <>
          <Slider symbol={<>R<sub>K</sub></>} label="Tipo fijo" value={p.fixed} min={RATE_MIN} max={RATE_MAX} step={0.0005} format={(v) => pct(v, 2)} onChange={(v) => set("fixed", v)} />
          <Slider symbol={<>t<sub>n</sub></>} label="Vencimiento" value={p.n} min={1} max={30} step={1} format={(v) => `${num(v, 0)} años`} onChange={(v) => set("n", v)} />
          <Slider symbol="L" label="Nocional" value={p.millions} min={10} max={500} step={10} format={(v) => `${num(v, 0)} millones`} onChange={(v) => set("millions", v)} />
          <Slider symbol={<>R<sub>par</sub></>} label="Tipo swap marcado" value={p.marker} min={RATE_MIN} max={RATE_MAX} step={0.0005} format={(v) => pct(v, 2)} onChange={(v) => set("marker", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={null} label="V pagador" value={money(at.payer.value)} />
          <Readout symbol={null} label="V receptor" value={money(at.receiver.value)} />
          <Readout symbol={null} label="Aproximación DV01" value={money(at.payer.dv01Line)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Swap pagador" },
          { series: "b", label: "Swap receptor" },
          { series: "muted", label: "Aproximación DV01 del pagador", dashed: true },
        ]}
      />
      <Plot
        xDomain={[RATE_MIN, RATE_MAX]}
        yDomain={yDomain}
        xLabel="Tipo swap"
        yLabel="Valor (millones)"
        xFormat={(v) => pct(v, 0)}
        yFormat={(v) => num(v / 1e6, 0)}
        ariaLabel="Valor de un swap pagador y de un swap receptor frente al tipo swap, con la recta de la aproximación por DV01"
      >
        {({ x, y }) => (
          <>
            <Line points={line} x={x} y={y} series="muted" dashed />
            <Line points={series(receiver)} x={x} y={y} series="b" />
            <Line points={series(payer)} x={x} y={y} series="main" />
            <Marker at={[p.marker, at.payer.dv01Line]} x={x} y={y} series="muted" />
            <Marker at={[p.marker, at.receiver.value]} x={x} y={y} series="b" />
            <Marker at={[p.marker, at.payer.value]} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
