import { conversionFactor } from "../../lib/finance/rates";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { linspace, widen } from "./shared";

// Example 1 of the page: coupon 10%, 20 years and 2 months to maturity.
const DEFAULTS = { coupon: 0.1, years: 20, months: 2 };
const COUPON_MAX = 0.12;
const PAR_COUPON = 0.06; // the yield of the rule: the factor is 1 at this coupon when the rounded maturity is whole 6-month periods

/** Conversion factor of a deliverable bond against its coupon, with the current bond marked. */
export default function ConversionFactor() {
  const { p, set, reset } = useParams(DEFAULTS);
  const curve = linspace(0, COUPON_MAX, 25).map((c): [number, number] => [c, conversionFactor(c, p.years, p.months)]);
  const factor = conversionFactor(p.coupon, p.years, p.months);
  const yDomain = widen([0.5, 2.5], curve.map(([, v]) => v), 0.5);
  // The maturity that the rule uses: months rounded down to a multiple of 3 (display only).
  const rounded = Math.floor((p.years * 12 + p.months) / 3) * 3;

  return (
    <ChartFrame
      name="ConversionFactor"
      title="Factor de conversión"
      caption="El factor de conversión es el precio por dólar de principal del bono descontado al 6% anual con capitalización semestral, así que sube con el cupón y vale 1 cuando el cupón es el 6%."
      onReset={reset}
      controls={
        <>
          <Slider symbol={null} label="Tipo del cupón" value={p.coupon} min={0} max={COUPON_MAX} step={0.005} format={(v) => pct(v, 2)} onChange={(v) => set("coupon", v)} />
          <Slider symbol="T" label="Años hasta el vencimiento" value={p.years} min={15} max={30} step={1} format={(v) => `${num(v, 0)} años`} onChange={(v) => set("years", v)} />
          <Slider symbol={null} label="Meses hasta el vencimiento" value={p.months} min={0} max={11} step={1} format={(v) => `${num(v, 0)} meses`} onChange={(v) => set("months", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={null} label="Factor de conversión" value={num(factor, 4)} />
          <Readout symbol={null} label="Vencimiento redondeado" value={`${Math.floor(rounded / 12)} años y ${rounded % 12} meses`} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Factor de conversión" },
          { series: "muted", label: "Factor 1 y cupón 6%", dashed: true },
        ]}
      />
      <Plot
        xDomain={[0, COUPON_MAX]}
        yDomain={yDomain}
        xLabel="Cupón"
        yLabel="Factor de conversión"
        xFormat={(v) => pct(v, 0)}
        yFormat={(v) => num(v, 1)}
        ariaLabel="Factor de conversión del bono frente a su cupón"
      >
        {({ x, y }) => (
          <>
            <Line points={[[0, 1], [COUPON_MAX, 1]]} x={x} y={y} series="muted" dashed />
            <Line points={[[PAR_COUPON, yDomain[0]], [PAR_COUPON, yDomain[1]]]} x={x} y={y} series="muted" dashed />
            <Line points={curve} x={x} y={y} series="main" />
            <Marker at={[p.coupon, factor]} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
