import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import ZeroParForwardCurves from "../../src/components/graficos/ZeroParForwardCurves";
import { readout, setSlider, sweepExtremes } from "./helpers";

const value = (label: string) => parseFloat(readout(label));

describe("ZeroParForwardCurves", () => {
  test("the default is the upward panel of the source: level 0.4%, +0.6% per year, T = 5", () => {
    render(<ZeroParForwardCurves />);
    expect(readout("Tipo cero")).toBe("3.40%");
    expect(readout("Tipo par")).toBe("3.32%");
    expect(readout("Tipo forward")).toBe("5.84%");
    expect(value("Tipo par")).toBeLessThan(value("Tipo cero"));
    expect(value("Tipo cero")).toBeLessThan(value("Tipo forward"));
  });

  test("a downward curve (level 7.6%, slope -0.6%) puts the par rate above the zero rate; Restablecer returns to the default", async () => {
    render(<ZeroParForwardCurves />);
    setSlider("Nivel de la curva cupón cero", 0.076);
    setSlider("Pendiente (por año)", -0.006);
    expect(value("Tipo par")).toBeGreaterThan(value("Tipo cero"));
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Tipo cero")).toBe("3.40%");
    expect(readout("Tipo par")).toBe("3.32%");
    expect(readout("Tipo forward")).toBe("5.84%");
  });

  test("the main series draws a path", () => {
    const { container } = render(<ZeroParForwardCurves />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<ZeroParForwardCurves />);
  });
});
