import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import DailySettlement from "../../src/components/graficos/DailySettlement";
import { readout, setSlider, sweepExtremes } from "./helpers";

const defaults = () => {
  expect(readout("Saldo final")).toBe("6.00");
  expect(readout("Resultado acumulado")).toBe("2.00");
  expect(readout("Llamadas de margen")).toBe("1");
};

describe("DailySettlement", () => {
  afterEach(() => vi.restoreAllMocks());

  test("the default is the worked example: prices 100, 101, 99, 102, margins 3 and 2.5", () => {
    render(<DailySettlement />);
    defaults();
  });

  test("a maintenance margin of 1.5 gives no margin call; Restablecer returns to the default", async () => {
    render(<DailySettlement />);
    setSlider("Margen de mantenimiento", 1.5);
    expect(readout("Llamadas de margen")).toBe("0");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    defaults();
  });

  test("lowering the initial margin clamps the maintenance margin in the render", () => {
    render(<DailySettlement />);
    setSlider("Margen inicial", 2);
    expect(screen.getByRole<HTMLInputElement>("slider", { name: "Margen de mantenimiento" }).value).toBe("2");
  });

  test("the day axes show whole days only", () => {
    const { container } = render(<DailySettlement />);
    const ticks = [...container.querySelectorAll(".grafico-eje-x text")].map((t) => t.textContent ?? "");
    expect(ticks.length).toBeGreaterThan(0);
    for (const t of ticks) expect(t).not.toContain(".");
  });

  test("the main series draws a path", () => {
    const { container } = render(<DailySettlement />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<DailySettlement />);
  });

  test("Nueva trayectoria draws a longer path; Restablecer brings back the worked example", async () => {
    const draws = [0.05, 0.95, 0.3, 0.9];
    let i = 0;
    vi.spyOn(Math, "random").mockImplementation(() => draws[i++ % draws.length]);
    const { container } = render(<DailySettlement />);
    const ticks = () => [...container.querySelectorAll(".grafico-eje-x text")].map((t) => t.textContent);
    expect(ticks()).not.toContain("10");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Nueva trayectoria" }));
    expect(ticks()).toContain("10");
    expect(Number(readout("Llamadas de margen"))).toBeGreaterThan(0);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(container.textContent).not.toMatch(/(?<![\w.])[-−]0(?:\.0+)?(?!\.?\d)/);
    await user.click(screen.getByRole("button", { name: "Restablecer" }));
    defaults();
    expect(ticks()).not.toContain("10");
  });
});
