import { convexity, modifiedDuration, priceChange, type Bond } from "../../lib/finance/bonds";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { linspace, widen } from "./shared";

// The annual bond of the text (coupon 5%, 4 years, yield 4%) and its large change, Δy = +2%.
const DEFAULTS = { coupon: 0.05, maturity: 4, y: 0.04, dy: 0.02 };
const FREQUENCY = 1;
const FACE = 100;
const DY_MAX = 0.05;

type Point = [number, number];

/** A yield change with its sign, as in the text: +2.0%. */
const signedPct = (v: number) => (Math.round(v * 1000) > 0 ? `+${pct(v, 1)}` : pct(v, 1));

/** Exact relative price change against Δy, with the duration and the duration + convexity approximations. */
export default function DurationConvexityApprox() {
  const { p, set, reset } = useParams(DEFAULTS);
  const bond: Bond = { face: FACE, couponRate: p.coupon, maturity: p.maturity, frequency: FREQUENCY };
  const curves = linspace(-DY_MAX, DY_MAX, 101).map((dy) => ({ dy, ...priceChange(bond, p.y, dy) }));
  const curve = (k: "linear" | "secondOrder" | "exact") => curves.map((c): Point => [c.dy, c[k]]);
  const at = priceChange(bond, p.y, p.dy);

  return (
    <ChartFrame
      name="DurationConvexityApprox"
      title="Aproximación por duración y convexidad"
      caption="Variación relativa del precio ΔP/P frente al cambio en la rentabilidad Δy: la exacta, la lineal −D_Mod · Δy y la de segundo orden −D_Mod · Δy + ½ C · (Δy)²."
      onReset={reset}
      controls={
        <>
          <Slider symbol={null} label="Tipo del cupón" value={p.coupon} min={0} max={0.1} step={0.0025} format={(v) => pct(v, 2)} onChange={(v) => set("coupon", v)} />
          <Slider symbol="T" label="Vencimiento" value={p.maturity} min={1} max={20} step={1} format={(v) => `${num(v, 0)} años`} onChange={(v) => set("maturity", v)} />
          <Slider symbol="y" label="Rentabilidad" value={p.y} min={0} max={0.1} step={0.001} format={(v) => pct(v, 2)} onChange={(v) => set("y", v)} />
          <Slider symbol="Δy" label="Cambio en la rentabilidad" value={p.dy} min={-DY_MAX} max={DY_MAX} step={0.001} format={signedPct} onChange={(v) => set("dy", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={<>D<sub>Mod</sub></>} label="D_Mod" hideLabel value={num(modifiedDuration(bond, p.y), 2)} />
          <Readout symbol="C" label="C" hideLabel value={num(convexity(bond, p.y), 2)} />
          <Readout symbol={null} label="Lineal" value={pct(at.linear, 2)} />
          <Readout symbol={null} label="Segundo orden" value={pct(at.secondOrder, 2)} />
          <Readout symbol={null} label="Exacto" value={pct(at.exact, 2)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Exacto" },
          { series: "b", label: "Lineal (duración)" },
          { series: "c", label: "Segundo orden (duración y convexidad)", dashed: true },
        ]}
      />
      <Plot
        xDomain={[-DY_MAX, DY_MAX]}
        yDomain={widen([-0.25, 0.25], curves.flatMap((c) => [c.linear, c.secondOrder, c.exact]), 0.05)}
        xLabel="Cambio en la rentabilidad Δy"
        yLabel="Variación del precio ΔP/P"
        xFormat={(v) => pct(v, 0)}
        yFormat={(v) => pct(v, 0)}
        ariaLabel="Variación relativa del precio frente al cambio en la rentabilidad, exacta y aproximada"
      >
        {({ x, y }) => (
          <>
            <Line points={curve("linear")} x={x} y={y} series="b" />
            <Line points={curve("exact")} x={x} y={y} series="main" />
            <Line points={curve("secondOrder")} x={x} y={y} series="c" dashed />
            <Marker at={[p.dy, at.linear]} x={x} y={y} series="b" />
            <Marker at={[p.dy, at.secondOrder]} x={x} y={y} series="c" />
            <Marker at={[p.dy, at.exact]} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
