import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import ForwardValue from "../../src/components/graficos/ForwardValue";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("ForwardValue", () => {
  test("the default is K = 100, r = 5%, T = 1 with the marker at S = 100", () => {
    render(<ForwardValue />);
    expect(readout("Precio forward")).toBe("105.13");
    expect(readout("f largo")).toBe("4.88");
    expect(readout("f corto")).toBe("-4.88");
  });

  test("T = 0 gives a long value of 0 at S = K; Restablecer returns to the default", async () => {
    render(<ForwardValue />);
    setSlider("Tiempo hasta el vencimiento", 0);
    expect(readout("f largo")).toBe("0.00");
    expect(readout("f corto")).toBe("0.00");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Precio forward")).toBe("105.13");
    expect(readout("f largo")).toBe("4.88");
    expect(readout("f corto")).toBe("-4.88");
  });

  test("the main series draws a path", () => {
    const { container } = render(<ForwardValue />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<ForwardValue />);
  });
});
