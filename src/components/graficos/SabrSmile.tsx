import { sabrImpliedVol } from "../../lib/finance/options";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { linspace, tickNum, widen } from "./shared";

// A typical rates smile: forward 3%, expiry 5 years, alpha 0.035, beta 0.5, rho -0.3, nu 0.4 (a downward skew).
const DEFAULTS = { alpha: 0.035, beta: 0.5, rho: -0.3, nu: 0.4, f: 0.03, t: 5 };
const K_LOW = 0.5; // strikes of the read-outs, as multiples of F
const K_HIGH = 1.5;
const K_FROM = 0.25; // strikes of the axis, as multiples of F
const K_TO = 2.5;
const ALPHA_MIN = 0.005;
const ALPHA_MAX = 0.3;
const ALPHA_STEP = 0.0025;

/** Implied Black volatility of the SABR approximation against the strike, with the at-the-money point. */
export default function SabrSmile() {
  const { p, set, reset } = useParams(DEFAULTS);
  // Hagan's expansion is only valid for moderate levels: the largest alpha shrinks with F^(1 - beta), the level that alpha means.
  // The limit goes down to a position of the slider, so the value that the slider shows is the value in use.
  const alphaLimit = Math.max(ALPHA_MIN, Math.min(ALPHA_MAX, ALPHA_MAX * p.f ** (1 - p.beta)));
  const alphaSteps = Math.floor((alphaLimit - ALPHA_MIN) / ALPHA_STEP + 1e-9);
  const alphaMax = Number((ALPHA_MIN + alphaSteps * ALPHA_STEP).toFixed(4)); // 4 decimals: free of binary noise
  const alpha = Math.min(p.alpha, alphaMax);
  const vol = (k: number) => sabrImpliedVol({ f: p.f, k, t: p.t, alpha, beta: p.beta, rho: p.rho, nu: p.nu });
  const strikes = linspace(K_FROM * p.f, K_TO * p.f, 61);
  const smile: [number, number][] = strikes.map((k) => [k, vol(k)]);
  const [atm, low, high] = [vol(p.f), vol(K_LOW * p.f), vol(K_HIGH * p.f)];
  const yDomain = widen([0, 0.5], smile.map((q) => q[1]), 0.1);

  return (
    <ChartFrame
      name="SabrSmile"
      title="Sonrisa de volatilidad SABR"
      caption="La volatilidad implícita de Black σ(K) según la aproximación de Hagan et al. (2002): α fija el nivel, β y ρ la pendiente y ν la curvatura de la sonrisa. El nivel depende de α y de β a la vez: si cambia β, ajuste α para mantener el nivel."
      onReset={reset}
      controls={
        <>
          <Slider symbol="α" label="Alfa" value={alpha} min={ALPHA_MIN} max={alphaMax} step={ALPHA_STEP} format={(v) => num(v, 4)} onChange={(v) => set("alpha", v)} />
          <Slider symbol="β" label="Beta" value={p.beta} min={0} max={1} step={0.05} format={(v) => num(v, 2)} onChange={(v) => set("beta", v)} />
          <Slider symbol="ρ" label="Correlación" value={p.rho} min={-0.9} max={0.9} step={0.05} format={(v) => num(v, 2)} onChange={(v) => set("rho", v)} />
          <Slider symbol="ν" label="Volatilidad de la volatilidad" value={p.nu} min={0} max={1} step={0.05} format={(v) => num(v, 2)} onChange={(v) => set("nu", v)} />
          <Slider symbol="F" label="Tipo forward" value={p.f} min={0.01} max={0.06} step={0.0025} format={(v) => pct(v, 2)} onChange={(v) => set("f", v)} />
          <Slider symbol="T" label="Vencimiento" value={p.t} min={0.5} max={10} step={0.5} format={(v) => `${tickNum(v)} años`} onChange={(v) => set("t", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={null} label="σ ATM" value={pct(atm, 2)} />
          <Readout symbol={null} label="σ con K = 0.5 F" value={pct(low, 2)} />
          <Readout symbol={null} label="σ con K = 1.5 F" value={pct(high, 2)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Volatilidad implícita σ(K)" },
          { series: "main", label: "ATM (K = F)", mark: "point" },
          { series: "b", label: "K = 0.5 F", mark: "point" },
          { series: "c", label: "K = 1.5 F", mark: "point" },
        ]}
      />
      <Plot
        xDomain={[K_FROM * p.f, K_TO * p.f]}
        yDomain={yDomain}
        xLabel="Precio de ejercicio K"
        yLabel="Volatilidad implícita σ"
        xFormat={(v) => pct(v, 2)}
        yFormat={(v) => pct(v, 0)}
        ariaLabel="Volatilidad implícita de Black frente al precio de ejercicio según SABR, con el punto at-the-money marcado"
      >
        {({ x, y }) => (
          <>
            <Line points={smile} x={x} y={y} series="main" />
            <Marker at={[K_LOW * p.f, low]} x={x} y={y} series="b" />
            <Marker at={[K_HIGH * p.f, high]} x={x} y={y} series="c" />
            <Marker at={[p.f, atm]} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
