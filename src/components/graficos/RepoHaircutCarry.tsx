import { cashLent, repoCarry, REPO_CURVE } from "../../lib/finance/repo";
import { ChartFrame } from "./kit/ChartFrame";
import { money, num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { widen } from "./shared";

// The example of the page: collateral of 100M with a haircut of 2% (cash lent 98M), financing a bond
// that yields 3.4% with the repo at 1D (carry +0.6%; at 6M it is -0.4%).
const DEFAULTS = { collateral: 100_000_000, haircut: 0.02, bondYield: 0.034, term: 0 };
const LAST = REPO_CURVE.length - 1;
const curve = REPO_CURVE.map(({ rate }, i): [number, number] => [i, rate]);

/** Cash lent against a collateral, and the carry of financing a bond at each term of the repo curve. */
export default function RepoHaircutCarry() {
  const { p, set, reset } = useParams(DEFAULTS);
  const chosen = REPO_CURVE[p.term];
  const carry = repoCarry(p.bondYield, chosen.rate);

  return (
    <ChartFrame
      name="RepoHaircutCarry"
      title="Haircut y carry de un repo"
      caption="El efectivo prestado es el valor de mercado del colateral por (1 − haircut), y el carry es la rentabilidad del bono menos el tipo del repo del plazo elegido: es positivo donde la curva queda por debajo de la rentabilidad."
      onReset={reset}
      controls={
        <>
          <Slider symbol={null} label="Valor de mercado del colateral" value={p.collateral} min={10_000_000} max={500_000_000} step={5_000_000} format={(v) => `${num(v / 1e6, 0)} M`} onChange={(v) => set("collateral", v)} />
          <Slider symbol={null} label="Haircut" value={p.haircut} min={0} max={0.25} step={0.005} format={(v) => pct(v, 1)} onChange={(v) => set("haircut", v)} />
          <Slider symbol={null} label="Rentabilidad del bono" value={p.bondYield} min={0} max={0.08} step={0.001} format={(v) => pct(v, 2)} onChange={(v) => set("bondYield", v)} />
          <Slider symbol={null} label="Plazo del repo" value={p.term} min={0} max={LAST} step={1} format={(i) => REPO_CURVE[i].term} onChange={(v) => set("term", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={null} label="Efectivo prestado" value={money(cashLent(p.collateral, p.haircut))} />
          <Readout symbol={null} label="Tipo repo" value={pct(chosen.rate, 2)} />
          <Readout symbol={null} label="Carry" value={pct(carry, 2)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Tipo del repo por plazo" },
          { series: "b", label: "Rentabilidad del bono", dashed: true },
        ]}
      />
      <Plot
        xDomain={[-0.5, LAST + 0.5]}
        yDomain={widen([0.02, 0.045], [p.bondYield], 0.005)}
        xLabel="Plazo del repo"
        yLabel="Tipo"
        xFormat={(v) => (Number.isInteger(v) && v >= 0 && v <= LAST ? REPO_CURVE[v].term : "")}
        yFormat={(v) => pct(v, 1)}
        ariaLabel="Curva de repo por plazo y rentabilidad del bono"
      >
        {({ x, y }) => (
          <>
            <Line points={[[-0.5, p.bondYield], [LAST + 0.5, p.bondYield]]} x={x} y={y} series="b" dashed />
            <Line points={curve} x={x} y={y} series="main" />
            <Marker at={[p.term, chosen.rate]} x={x} y={y} series="main" label={`${chosen.term}: carry ${pct(carry, 2)}`} />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
