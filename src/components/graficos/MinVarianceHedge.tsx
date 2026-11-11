import { hedgedVariance, minVarianceHedgeRatio } from "../../lib/finance/hedging";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { linspace } from "./shared";

// A cross hedge with correlation 0.9, σ_S 3% and σ_F 4%: h* = 0.675 and 19.0% of σ_S² remains.
const DEFAULTS = { rho: 0.9, sigmaS: 0.03, sigmaF: 0.04 };
const H_MAX = 2;
const Y_MAX = 2; // 200% of the unhedged variance; the curve may leave the plot above it

/** Variance of the hedged position, as a share of σ_S², against the hedge ratio h, with its minimum h* marked. */
export default function MinVarianceHedge() {
  const { p, set, reset } = useParams(DEFAULTS);
  const share = (h: number) => hedgedVariance(h, p.sigmaS, p.sigmaF, p.rho) / hedgedVariance(0, p.sigmaS, p.sigmaF, p.rho);
  const hStar = minVarianceHedgeRatio(p.rho, p.sigmaS, p.sigmaF);
  const residual = share(hStar);

  return (
    <ChartFrame
      name="MinVarianceHedge"
      title="Ratio de cobertura de mínima varianza"
      caption="La varianza σ_V² = σ_S² + h²σ_F² − 2hρσ_Sσ_F es una parábola en el ratio de cobertura h, y su mínimo está en h* = ρσ_S/σ_F, donde queda σ_S²(1 − ρ²)."
      onReset={reset}
      controls={
        <>
          <Slider symbol="ρ" label="Correlación" value={p.rho} min={-1} max={1} step={0.05} format={(v) => num(v, 2)} onChange={(v) => set("rho", v)} />
          <Slider symbol={<>σ<sub>S</sub></>} label="Volatilidad del spot" value={p.sigmaS} min={0.01} max={0.1} step={0.005} format={(v) => pct(v, 1)} onChange={(v) => set("sigmaS", v)} />
          <Slider symbol={<>σ<sub>F</sub></>} label="Volatilidad de los futuros" value={p.sigmaF} min={0.01} max={0.1} step={0.005} format={(v) => pct(v, 1)} onChange={(v) => set("sigmaF", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol="h*" label="h*" hideLabel value={num(hStar, 3)} />
          <Readout symbol={null} label="Varianza residual" value={pct(residual, 1)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Varianza σ_V²" },
          { series: "muted", label: "Sin cobertura σ_S²", dashed: true },
        ]}
      />
      <Plot
        xDomain={[0, H_MAX]}
        yDomain={[0, Y_MAX]}
        xLabel="Ratio de cobertura h"
        yLabel="σ_V² como porcentaje de σ_S²"
        xFormat={(v) => num(v, 1)}
        yFormat={(v) => pct(v, 0)}
        ariaLabel="Varianza de la posición cubierta como porcentaje de la varianza sin cobertura frente al ratio de cobertura, con el mínimo marcado"
      >
        {({ x, y }) => (
          <>
            <Line points={[[0, 1], [H_MAX, 1]]} x={x} y={y} series="muted" dashed />
            <Line points={linspace(0, H_MAX, 81).map((h): [number, number] => [h, share(h)])} x={x} y={y} series="main" />
            <Marker at={[hStar, residual]} x={x} y={y} series="main" label="h*" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
