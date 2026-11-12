import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import ParSwapRate from "../../src/components/graficos/ParSwapRate";
import { readout, setSlider, sweepExtremes } from "./helpers";

const rate = (s: string) => Number.parseFloat(s) / 100;

describe("ParSwapRate", () => {
  test("the default is the upward curve 3% + 0.5% per year, 5 years, annual: R_par is below the zero rate", () => {
    render(<ParSwapRate />);
    expect(readout("Tipo swap par")).toBe("5.39%");
    expect(readout("Tipo cupón cero al vencimiento")).toBe("5.50%");
    expect(readout("Anualidad")).toBe("4.3549");
    expect(rate(readout("Tipo swap par"))).toBeLessThan(rate(readout("Tipo cupón cero al vencimiento")));
    expect(document.querySelectorAll("table tbody tr")).toHaveLength(5);
  });

  test("a flat curve (slope 0) gives R_par equal to the zero rate 5.50%; Restablecer returns to the default", async () => {
    render(<ParSwapRate />);
    setSlider("Pendiente", 0);
    expect(readout("Tipo swap par")).toBe("5.50%");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Tipo swap par")).toBe("5.39%");
    expect(readout("Anualidad")).toBe("4.3549");
  });

  test("the main series draws a path", () => {
    const { container } = render(<ParSwapRate />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<ParSwapRate />);
  });
});
