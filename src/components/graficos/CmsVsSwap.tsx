import { cmsConvexityAdjustment, payerSwapPayoffAtFixing } from "../../lib/finance/options";
import { annuity } from "../../lib/finance/swaps";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { linspace, tickNum, widen } from "./shared";

// The case of the text: a 30-year swap with annual payments on a flat curve at s_F = 3%, volatility 20%, fixing in 5 years.
const DEFAULTS = { tenor: 30, sigma: 0.2, sF: 0.03, t: 5 };
const M = 1; // annual payments
const HALF_WIDTH = 0.02; // the axis shows s_F ± 2 percentage points (never below 0)

/** Payoff at the fixing date of a payer swap (concave) and of a CMS (straight line), with the forward and the expected swap rate. */
export default function CmsVsSwap() {
  const { p, set, reset } = useParams(DEFAULTS);
  const adjustment = cmsConvexityAdjustment({ sF: p.sF, sigma: p.sigma, t: p.t, tenor: p.tenor, m: M });
  const expected = p.sF + adjustment;
  // The CMS line has the slope of the swap curve at s_F, the annuity on a flat curve at s_F, and is zero at the expected rate.
  const slope = annuity(() => p.sF, p.tenor, M, M);
  const cms = (sT: number) => slope * (sT - expected);
  const swap = (sT: number) => payerSwapPayoffAtFixing({ sT, sF: p.sF, tenor: p.tenor, m: M });
  const lo = Math.max(0, p.sF - HALF_WIDTH);
  const hi = lo + 2 * HALF_WIDTH;
  const rates = linspace(lo, hi, 41);
  const swapCurve: [number, number][] = rates.map((r) => [r, swap(r)]);
  const cmsLine: [number, number][] = [[lo, cms(lo)], [hi, cms(hi)]];
  const yDomain = widen([-0.5, 0.5], [...swapCurve.map((q) => q[1]), ...cmsLine.map((q) => q[1])], 0.5);

  return (
    <ChartFrame
      name="CmsVsSwap"
      title="CMS frente a swap vanilla"
      caption="El payoff del swap pagador A(s_T)(s_T − s_F) es cóncavo y se anula en s_F; el del CMS es una recta con la misma pendiente que se anula en el tipo swap esperado s_F + ajuste por convexidad."
      onReset={reset}
      controls={
        <>
          <Slider symbol="n" label="Plazo del swap" value={p.tenor} min={5} max={30} step={1} format={(v) => `${num(v, 0)} años`} onChange={(v) => set("tenor", v)} />
          <Slider symbol="σ" label="Volatilidad" value={p.sigma} min={0} max={0.5} step={0.01} format={(v) => pct(v, 0)} onChange={(v) => set("sigma", v)} />
          <Slider symbol={<>s<sub>F</sub></>} label="Tipo swap forward" value={p.sF} min={0.01} max={0.06} step={0.0025} format={(v) => pct(v, 2)} onChange={(v) => set("sF", v)} />
          <Slider symbol="T" label="Tiempo hasta la fijación" value={p.t} min={0.5} max={10} step={0.5} format={(v) => `${tickNum(v)} años`} onChange={(v) => set("t", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={<>s<sub>F</sub></>} label="Tipo swap forward" value={pct(p.sF, 2)} />
          <Readout symbol={<>E[s<sub>T</sub>]</>} label="Tipo swap esperado" value={pct(expected, 2)} />
          <Readout symbol={null} label="Ajuste de convexidad" value={`${num(adjustment * 1e4, 1)} pb`} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Payoff del swap pagador" },
          { series: "b", label: "Payoff del CMS" },
          { series: "main", label: "Tipo swap forward", mark: "point" },
          { series: "b", label: "Tipo swap esperado", mark: "point" },
        ]}
      />
      <Plot
        xDomain={[lo, hi]}
        yDomain={yDomain}
        xLabel="Tipo swap s_T"
        yLabel="Payoff por unidad de nocional"
        xFormat={(v) => pct(v, 1)}
        yFormat={(v) => num(v, 1)}
        ariaLabel="Payoff en la fecha de fijación de un swap pagador vanilla y de un CMS frente al tipo swap, con el tipo forward y el esperado marcados"
      >
        {({ x, y }) => (
          <>
            <Line points={cmsLine} x={x} y={y} series="b" />
            <Line points={swapCurve} x={x} y={y} series="main" />
            <Marker at={[expected, 0]} x={x} y={y} series="b" />
            <Marker at={[p.sF, 0]} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
