import { discountFactor, polyZeroCurve } from "../../lib/finance/curves";
import { annuity, parSwapRate } from "../../lib/finance/swaps";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { widen } from "./shared";
import "./ParSwapRate.css";

// A zero curve of level 3% and slope 0.5% per year, that is 5.5% at 5 years (the pivot of ZeroParForwardCurves),
// and a swap of 5 years with annual payments and annual compounding.
const DEFAULTS = { r5: 0.055, slope: 0.005, n: 5 };
const M = 1; // annual payments
const COMP = 1; // annual compounding of the zero rates
const MAX_MATURITY = 10;

/** Par swap rate against the maturity of the swap, read from a linear zero curve, with the discount factors of the payment dates. */
export default function ParSwapRate() {
  const { p, set, reset } = useParams(DEFAULTS);
  const zero = polyZeroCurve(p.r5 - 5 * p.slope, p.slope, 0); // r(t) = r5 + slope (t - 5)
  const par = parSwapRate(zero, p.n, M, COMP);
  const a = annuity(zero, p.n, M, COMP);
  const dates = Array.from({ length: p.n }, (_, i) => i + 1);
  const curve = Array.from({ length: MAX_MATURITY }, (_, i): [number, number] => [i + 1, zero(i + 1)]);

  return (
    <ChartFrame
      name="ParSwapRate"
      title="Tipo swap par"
      caption="El tipo swap par R_par = (1 − DF(t_n)) / A, con A = Σ τ_i DF(t_i), es una media de los tipos cupón cero hasta el vencimiento t_n del swap."
      onReset={reset}
      controls={
        <>
          <Slider symbol="r(5)" label="Tipo cupón cero a 5 años" value={p.r5} min={0} max={0.1} step={0.001} format={(v) => pct(v, 1)} onChange={(v) => set("r5", v)} />
          <Slider symbol={null} label="Pendiente" value={p.slope} min={-0.01} max={0.01} step={0.001} format={(v) => pct(v, 1)} onChange={(v) => set("slope", v)} />
          <Slider symbol={<>t<sub>n</sub></>} label="Vencimiento del swap" value={p.n} min={1} max={MAX_MATURITY} step={1} format={(v) => `${num(v, 0)} años`} onChange={(v) => set("n", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={<>R<sub>par</sub></>} label="Tipo swap par" value={pct(par, 2)} hideLabel />
          <Readout symbol={<>r(t<sub>n</sub>)</>} label="Tipo cupón cero al vencimiento" value={pct(zero(p.n), 2)} />
          <Readout symbol="A" label="Anualidad" value={num(a, 4)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Tipo cupón cero r(t)" },
          { series: "b", label: "Tipo swap par R_par", dashed: true },
        ]}
      />
      <Plot
        xDomain={[1, MAX_MATURITY]}
        yDomain={widen([0, 0.08], curve.map(([, r]) => r), 0.01)}
        xLabel="Vencimiento t (años)"
        yLabel="Tipo"
        xFormat={(v) => num(v, 0)}
        yFormat={(v) => pct(v, 0)}
        ariaLabel="Curva de tipos cupón cero frente al vencimiento, con el tipo swap par del vencimiento del swap"
      >
        {({ x, y }) => (
          <>
            <Line points={[[1, par], [p.n, par]]} x={x} y={y} series="b" dashed />
            <Line points={curve} x={x} y={y} series="main" />
            <Marker at={[p.n, par]} x={x} y={y} series="b" />
            <Marker at={[p.n, zero(p.n)]} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
      <table className="grafico-df">
        <caption>Factores de descuento de las fechas de pago (tipos cupón cero con capitalización anual)</caption>
        <thead>
          <tr>
            <th scope="col">t_i (años)</th>
            <th scope="col">r(t_i)</th>
            <th scope="col">DF(t_i)</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((t) => (
            <tr key={t}>
              <td>{num(t, 0)}</td>
              <td>{pct(zero(t), 2)}</td>
              <td>{num(discountFactor(zero(t), t, COMP), 4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartFrame>
  );
}
