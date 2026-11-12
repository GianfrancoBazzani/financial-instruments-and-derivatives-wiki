import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { ChartFrame } from "../../src/components/graficos/kit/ChartFrame";
import { money, num, pct } from "../../src/components/graficos/kit/fmt";
import { Plot } from "../../src/components/graficos/kit/Plot";
import { Readout } from "../../src/components/graficos/kit/Readout";
import { Bars, Legend, Line, Marker } from "../../src/components/graficos/kit/Series";
import { Slider } from "../../src/components/graficos/kit/Slider";
import { useParams } from "../../src/components/graficos/kit/useParams";
import { readout, setSlider, sweepExtremes } from "./helpers";

/** A frame with one slider and one read-out: "doble" = 2·a. */
function Demo({
  curve = (a: number) => 2 * a,
  show = (v: number) => num(v, 1),
}: {
  curve?: (a: number) => number;
  show?: (v: number) => string;
}) {
  const { p, set, reset } = useParams({ a: 2 });
  return (
    <ChartFrame
      name="Demo"
      title="Demostración"
      caption="La recta y = 2a."
      onReset={reset}
      controls={
        <Slider
          symbol={<>a</>}
          label="a"
          value={p.a}
          min={-5}
          max={10}
          step={0.5}
          format={(v) => num(v, 1)}
          onChange={(v) => set("a", v)}
        />
      }
      readouts={<Readout symbol={<>2a</>} label="doble" value={show(curve(p.a))} />}
    >
      <Plot
        xDomain={[-5, 10]}
        yDomain={[-10, 20]}
        xLabel="a"
        yLabel="2a"
        xFormat={(v) => num(v, 0)}
        yFormat={(v) => num(v, 0)}
        ariaLabel="Recta 2a"
      >
        {({ x, y }) => (
          <>
            <Line points={[[-5, curve(-5)], [p.a, curve(p.a)], [10, curve(10)]]} x={x} y={y} series="main" />
            <Marker at={[p.a, curve(p.a)]} x={x} y={y} series="main" label="a" />
          </>
        )}
      </Plot>
    </ChartFrame>
  );
}

const identity = (v: number) => v;

/** The d attribute that Line draws for these points with identity scales. */
function lineD(points: [number, number][]): string {
  const { container } = render(
    <svg>
      <Line points={points} x={identity} y={identity} series="main" />
    </svg>,
  );
  return container.querySelector("path")?.getAttribute("d") ?? "";
}

describe("fmt", () => {
  test("en-US numbers", () => {
    expect(num(1234.5, 2)).toBe("1,234.50");
    expect(num(-0.0001, 2)).toBe("0.00");
    expect(num(NaN, 2)).toBe("—");
    expect(pct(0.045, 2)).toBe("4.50%");
    expect(money(125000)).toBe("125,000");
    expect(num(Infinity, 1)).toBe("—");
  });
  test("never a negative zero, NaN, or Infinity", () => {
    expect(num(-0, 2)).toBe("0.00");
    expect(num(-0.004, 2)).toBe("0.00");
    expect(num(-0.005, 2)).toBe("-0.01");
    expect(pct(-0.00001, 2)).toBe("0.00%");
    expect(pct(-0.0717, 2)).toBe("-7.17%");
    expect(money(-0.4)).toBe("0");
    expect(money(123916.42, 2)).toBe("123,916.42");
    expect(pct(NaN, 2)).toBe("—");
    expect(money(-Infinity)).toBe("—");
  });
});

describe("kit", () => {
  test("a frame with one slider and one read-out", async () => {
    const user = userEvent.setup();
    const { container } = render(<Demo />);
    expect(readout("doble")).toBe("4.0");
    setSlider("a", 5);
    expect(readout("doble")).toBe("10.0");
    await user.click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("doble")).toBe("4.0");
    expect(screen.getByRole("slider", { name: /a/ })).toBeInTheDocument();
    expect(container.querySelector("figure[data-grafico='Demo'] svg")).not.toBeNull();
  });

  test("Line drops non-finite points instead of drawing NaN", () => {
    expect(lineD([[0, 1], [1, NaN], [2, 3]])).not.toContain("NaN");
    expect(lineD([[0, 1], [1, Infinity], [2, 3], [3, 4]])).toMatch(/^M[^M]+M/); // broken in two
  });

  test("frame markup: figure, figcaption, no heading, labelled plot", () => {
    const { container } = render(<Demo />);
    const figure = container.querySelector("figure.grafico[data-grafico='Demo']");
    expect(figure).not.toBeNull();
    expect(figure?.querySelector("figcaption")?.textContent).toBe("La recta y = 2a.");
    expect(container.querySelector("h1, h2, h3, h4, h5, h6")).toBeNull();
    expect(screen.getByRole("img", { name: "Recta 2a" }).tagName.toLowerCase()).toBe("svg");
    expect(screen.getByRole("slider", { name: "a" })).toHaveAttribute("aria-valuetext", "2.0");
  });

  test("the server renders the complete default plot at width 640", () => {
    const html = renderToString(<Demo />);
    expect(html).toContain('data-grafico="Demo"');
    expect(html).toMatch(/<svg[^>]*viewBox="0 0 640 380"/);
    expect(html).toMatch(/<path[^>]* d="M[^"]+"/);
    expect(html).toContain("4.0");
  });

  test("the plot adapts to its container and thins the ticks when narrow", () => {
    let report: (w: number) => void = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: ResizeObserverCallback) {
          report = (w) => cb([{ contentRect: { width: w } } as ResizeObserverEntry], this as never);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const big = (v: number) => money(v * 1e7);
    const { container } = render(
      <Plot xDomain={[0, 10]} yDomain={[0, 1]} xLabel="x" yLabel="y" xFormat={big} yFormat={(v) => num(v, 1)} ariaLabel="p">
        {() => null}
      </Plot>,
    );
    const wide = container.querySelectorAll(".grafico-eje-x text").length;
    act(() => report(328));
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("viewBox", "0 0 328 220");
    const labels = [...container.querySelectorAll<SVGTextElement>(".grafico-eje-x text")];
    expect(labels.length).toBeGreaterThanOrEqual(2);
    expect(labels.length).toBeLessThan(wide);
    // Neighbouring labels ("100,000,000" is about 73 px at 12 px) leave a gap.
    const xs = labels.map((t) => Number(t.getAttribute("x")));
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThan(80);
  });

  test("explicit xTicks draw every given label at a narrow width; without them the ticks thin", () => {
    let report: (w: number) => void = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: ResizeObserverCallback) {
          report = (w) => cb([{ contentRect: { width: w } } as ResizeObserverEntry], this as never);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const terms = ["1D", "1W", "1M", "3M", "6M"];
    const props = {
      xDomain: [-0.5, 4.5] as [number, number],
      yDomain: [0, 1] as [number, number],
      xLabel: "x",
      yLabel: "y",
      xFormat: (v: number) => terms[v] ?? "",
      yFormat: (v: number) => num(v, 1),
      ariaLabel: "p",
      children: () => null,
    };
    const { container } = render(<Plot {...props} xTicks={[0, 1, 2, 3, 4]} />);
    act(() => report(328));
    const labels = [...container.querySelectorAll(".grafico-eje-x text")].map((t) => t.textContent);
    expect(labels).toEqual(terms);
    expect(container.querySelectorAll(".grafico-rejilla line").length).toBeGreaterThanOrEqual(5);
  });

  test("the left margin fits a y label with a percent sign: \"100%\" is about 27.8 px wide", () => {
    const { container } = render(
      <Plot xDomain={[0, 1]} yDomain={[0, 1]} xLabel="x" yLabel="y" xFormat={(v) => num(v, 1)} yFormat={() => "100%"} ariaLabel="p">
        {() => null}
      </Plot>,
    );
    const left = Number(/translate\(([\d.]+),/.exec(container.querySelector("svg > g")?.getAttribute("transform") ?? "")?.[1]);
    expect(left).toBeGreaterThanOrEqual(27.8 + 8); // the label, then the gap to the axis
  });

  test("a slider without a symbol renders no symbol span and no leading space", () => {
    const { container } = render(<Slider symbol={null} label="Haircut" value={1} min={0} max={2} step={1} format={String} onChange={() => {}} />);
    expect(container.querySelector(".grafico-simbolo")).toBeNull();
    expect(container.querySelector("label")?.textContent).toBe("Haircut");
  });

  test("Marker, Bars, Legend, and direct labels", () => {
    render(
      <ChartFrame name="Todo" title="T" caption="C" controls={null} readouts={null} onReset={() => {}}>
        <Legend items={[{ series: "main", label: "Principal" }, { series: "b", label: "Otra", dashed: true }, { series: "c", label: "Barras", mark: "bar" }]} />
        <Plot xDomain={[0, 4]} yDomain={[-1, 3]} xLabel="t" yLabel="v" xFormat={(v) => num(v, 0)} yFormat={(v) => num(v, 0)} ariaLabel="todo">
          {({ x, y }) => (
            <>
              <Bars bars={[{ x: 1, value: 2 }, { x: 2, value: NaN }, { x: 3, value: -1 }]} x={x} y={y} series="c" width={0.5} />
              <Line points={[[0, 0], [4, 2]]} x={x} y={y} series="b" dashed label="Recta" />
              <Marker at={[2, 1]} x={x} y={y} series="main" label="(2, 1)" />
              <Marker at={[NaN, 1]} x={x} y={y} series="main" label="nunca" />
            </>
          )}
        </Plot>
      </ChartFrame>,
    );
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Principal", "Otra", "Barras"]);
    const fig = document.querySelector("figure")!;
    expect(fig.querySelectorAll("path.grafico-barra")).toHaveLength(2);
    expect(fig.querySelector("path.grafico-linea")).toHaveAttribute("stroke-dasharray");
    expect(fig.textContent).toContain("Recta");
    expect(fig.textContent).toContain("(2, 1)");
    expect(fig.textContent).not.toContain("nunca");
    expect(fig.innerHTML).not.toMatch(/NaN|Infinity/);
  });
});

describe("helpers", () => {
  test("sweepExtremes passes on a graphic that stays finite", () => {
    expect(() => sweepExtremes(<Demo />)).not.toThrow();
  });
  test("sweepExtremes names the slider and the position when it finds NaN", () => {
    const nanAtMax = (a: number) => (a === 10 ? NaN : 2 * a);
    expect(() => sweepExtremes(<Demo curve={nanAtMax} />)).not.toThrow(); // the kit prints "—" and skips the point
    expect(() => sweepExtremes(<Demo curve={nanAtMax} show={String} />)).toThrow(/"a".*maximum.*NaN/);
  });
  test("sweepExtremes catches a negative zero, but not a small negative number", () => {
    const tiny = (a: number) => (a === -5 ? -1e-9 : 2 * a);
    expect(() => sweepExtremes(<Demo curve={tiny} />)).not.toThrow(); // fmt prints 0.0
    expect(() => sweepExtremes(<Demo curve={tiny} show={(v) => v.toFixed(1)} />)).toThrow(/"a".*minimum.*"-0.0"/);
    expect(() => sweepExtremes(<Demo curve={(a) => a / 100} show={(v) => v.toFixed(2)} />)).not.toThrow(); // -0.05
  });
  test("setSlider refuses a value the slider cannot take", () => {
    render(<Demo />);
    expect(() => setSlider("a", 11)).toThrow(/outside/);
    expect(() => setSlider("a", 2.3)).toThrow(/step/);
  });
  test("readout names the labels it knows when the label is missing", () => {
    render(<Demo />);
    expect(() => readout("triple")).toThrow(/doble/);
  });
});
