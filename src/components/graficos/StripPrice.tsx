import { stripModifiedDuration, stripPrice } from "../../lib/finance/repo";
import { ChartFrame } from "./kit/ChartFrame";
import { num, pct } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { linspace } from "./shared";

// The principal STRIP of the worked example: 100 at 3% for 3 years costs 91.51.
const DEFAULTS = { face: 100, r: 0.03, t: 3 };
const T_MAX = 30;
const RISE = 0.01;

/** Price of a zero-coupon STRIP against its maturity, for the chosen rate and one point higher. */
export default function StripPrice() {
  const { p, set, reset } = useParams(DEFAULTS);
  const curve = (r: number) => linspace(0, T_MAX, 61).map((t): [number, number] => [t, stripPrice(p.face, r, t)]);
  const current = stripPrice(p.face, p.r, p.t);
  const fall = 1 - stripPrice(p.face, p.r + RISE, p.t) / current;

  return (
    <ChartFrame
      name="StripPrice"
      title="Precio de un STRIP"
      caption="El precio de un STRIP es el flujo de caja final dividido por (1 + r)^t; la curva tenue es el mismo STRIP con el tipo un punto porcentual más alto, y cae mucho más cuanto mayor es t."
      onReset={reset}
      controls={
        <>
          <Slider symbol="r" label="Tipo cupón cero" value={p.r} min={0} max={0.1} step={0.001} format={(v) => pct(v, 2)} onChange={(v) => set("r", v)} />
          <Slider symbol="t" label="Vencimiento" value={p.t} min={1} max={T_MAX} step={1} format={(v) => `${num(v, 0)} años`} onChange={(v) => set("t", v)} />
          <Slider symbol={null} label="Flujo de caja final" value={p.face} min={10} max={200} step={10} format={(v) => num(v, 0)} onChange={(v) => set("face", v)} />
        </>
      }
      readouts={
        <>
          <Readout symbol={null} label="Precio" value={num(current, 2)} />
          <Readout symbol={<>D<sub>Mod</sub></>} label="D_Mod" hideLabel value={num(stripModifiedDuration(p.r, p.t), 2)} />
          <Readout symbol={null} label="Caída con +1 pp" value={pct(fall, 1)} />
        </>
      }
    >
      <Legend
        items={[
          { series: "main", label: "Precio con el tipo elegido" },
          { series: "muted", label: "Con el tipo +1 pp", dashed: true },
        ]}
      />
      <Plot
        xDomain={[0, T_MAX]}
        yDomain={[0, p.face]}
        xLabel="Vencimiento t (años)"
        yLabel="Precio"
        xFormat={(v) => num(v, 0)}
        yFormat={(v) => num(v, 0)}
        ariaLabel="Precio de un STRIP frente a su vencimiento, con el tipo elegido y con el tipo un punto más alto"
      >
        {({ x, y }) => (
          <>
            <Line points={curve(p.r + RISE)} x={x} y={y} series="muted" dashed />
            <Line points={curve(p.r)} x={x} y={y} series="main" />
            <Marker at={[p.t, current]} x={x} y={y} series="main" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
