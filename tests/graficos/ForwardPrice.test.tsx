import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import ForwardPrice from "../../src/components/graficos/ForwardPrice";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("ForwardPrice", () => {
  test("the default is S_0 = 100, r = 5% and one year: c = 5% and F_0 = 105.13", () => {
    render(<ForwardPrice />);
    expect(readout("Coste de carry")).toBe("5.00%");
    expect(readout("Precio forward")).toBe("105.13");
  });

  test("an income yield equal to the rate gives F_0 = 100; Restablecer returns to the default", async () => {
    render(<ForwardPrice />);
    setSlider("Rentabilidad por ingresos", 0.05);
    expect(readout("Coste de carry")).toBe("0.00%");
    expect(readout("Precio forward")).toBe("100.00");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Coste de carry")).toBe("5.00%");
    expect(readout("Precio forward")).toBe("105.13");
  });

  test("the main series draws a path", () => {
    const { container } = render(<ForwardPrice />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<ForwardPrice />);
  });
});
