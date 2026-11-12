import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import ZeroParForwardCurves from "../../src/components/graficos/ZeroParForwardCurves";
import { readout, setSlider, sweepExtremes } from "./helpers";

const value = (label: string) => parseFloat(readout(label));

describe("ZeroParForwardCurves", () => {
  test("the default is the upward panel of the source: r(5) 3.4%, +0.6% per year, T = 5", () => {
    render(<ZeroParForwardCurves />);
    expect(readout("Tipo cupón cero")).toBe("3.40%");
    expect(readout("Tipo par")).toBe("3.32%");
    expect(readout("Tipo forward")).toBe("5.84%");
    expect(value("Tipo par")).toBeLessThan(value("Tipo cupón cero"));
    expect(value("Tipo cupón cero")).toBeLessThan(value("Tipo forward"));
  });

  test("one move, slope -0.6%, makes a downward curve and puts the par rate above the zero rate; Restablecer returns to the default", async () => {
    render(<ZeroParForwardCurves />);
    setSlider("Pendiente (por año)", -0.006);
    expect(readout("Tipo cupón cero")).toBe("3.40%");
    expect(readout("Tipo par")).toBe("3.48%");
    expect(readout("Tipo forward")).toBe("1.03%");
    expect(value("Tipo par")).toBeGreaterThan(value("Tipo cupón cero"));
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Tipo cupón cero")).toBe("3.40%");
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
