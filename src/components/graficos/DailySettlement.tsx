import { useState } from "react";
import { marginAccount } from "../../lib/finance/forwards";
import { ChartFrame } from "./kit/ChartFrame";
import { num } from "./kit/fmt";
import { Plot } from "./kit/Plot";
import { Readout } from "./kit/Readout";
import { Legend, Line, Marker } from "./kit/Series";
import { Slider } from "./kit/Slider";
import { useParams } from "./kit/useParams";
import { tickNum, widen } from "./shared";

// The worked example of the page: a long futures position at 100, initial margin 3, maintenance margin 2.5.
const DEFAULTS = { initial: 3, maintenance: 2.5 };
const EXAMPLE_PATH = [100, 101, 99, 102];
const DAYS = 10;
const STEP = 3; // largest daily move of a new path, in price units

/** A random walk from 100 with daily moves of up to ±3 in half units; only called from a click. */
function randomPath(): number[] {
  const prices = [100];
  for (let i = 0; i < DAYS; i++) prices.push(prices[i] + Math.round((Math.random() - 0.5) * 2 * STEP * 2) / 2);
  return prices;
}

/** Margin account of a long futures position along a price path, with its margin calls. */
export default function DailySettlement() {
  const { p, set, reset } = useParams(DEFAULTS);
  const [path, setPath] = useState(EXAMPLE_PATH);
  const maintenance = Math.min(p.maintenance, p.initial);
  const rows = marginAccount(path, p.initial, maintenance, "long");
  const last = rows[rows.length - 1];
  const calls = rows.filter((r) => r.variationMargin > 0);
  const lastDay = rows.length - 1;
  const pt = (day: number, v: number): [number, number] => [day, v];

  return (
    <ChartFrame
      name="DailySettlement"
      title="Liquidación diaria"
      caption="Cada día el saldo de margen recibe la ganancia o pérdida diaria, y si cae por debajo del margen de mantenimiento el operador aporta el margen de variación hasta el margen inicial."
      onReset={() => {
        reset();
        setPath(EXAMPLE_PATH);
      }}
      controls={
        <>
          <Slider symbol={null} label="Margen inicial" value={p.initial} min={1} max={6} step={0.5} format={(v) => num(v, 2)} onChange={(v) => set("initial", v)} />
          <Slider symbol={null} label="Margen de mantenimiento" value={maintenance} min={0.5} max={p.initial} step={0.5} format={(v) => num(v, 2)} onChange={(v) => set("maintenance", v)} />
          <button type="button" className="grafico-restablecer" onClick={() => setPath(randomPath())}>
            Nueva trayectoria
          </button>
        </>
      }
      readouts={
        <>
          <Readout symbol={null} label="Saldo final" value={num(last.balance, 2)} />
          <Readout symbol={null} label="Resultado acumulado" value={num(last.cumPnl, 2)} />
          <Readout symbol={null} label="Llamadas de margen" value={num(calls.length, 0)} />
        </>
      }
    >
      <Legend items={[{ series: "main", label: "Precio del futuro" }]} />
      <Plot
        xDomain={[0, lastDay]}
        yDomain={widen([94, 106], path, 2)}
        xLabel="Día"
        yLabel="Precio del futuro"
        xFormat={tickNum}
        yFormat={(v) => num(v, 0)}
        ariaLabel="Precio del futuro en cada día"
      >
        {({ x, y }) => (
          <>
            <Line points={rows.map((r) => pt(r.day, r.price))} x={x} y={y} series="main" />
            {rows.map((r) => (
              <Marker key={r.day} at={pt(r.day, r.price)} x={x} y={y} series="main" />
            ))}
          </>
        )}
      </Plot>
      <Legend
        items={[
          { series: "main", label: "Saldo de margen" },
          { series: "muted", label: "Margen de mantenimiento", dashed: true },
          { series: "b", label: "Llamada de margen", mark: "point" },
        ]}
      />
      <Plot
        xDomain={[0, lastDay]}
        yDomain={widen([0, 8], [...rows.map((r) => r.balance), p.initial], 2)}
        xLabel="Día"
        yLabel="Saldo de margen"
        xFormat={tickNum}
        yFormat={(v) => num(v, 0)}
        ariaLabel="Saldo de margen en cada día y llamadas de margen"
      >
        {({ x, y }) => (
          <>
            <Line points={[pt(0, maintenance), pt(lastDay, maintenance)]} x={x} y={y} series="muted" dashed />
            <Line points={rows.map((r) => pt(r.day, r.balance))} x={x} y={y} series="main" />
            {calls.map((r) => (
              <Marker key={r.day} at={pt(r.day, r.balance)} x={x} y={y} series="b" />
            ))}
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}
