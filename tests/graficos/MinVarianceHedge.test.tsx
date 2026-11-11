import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import MinVarianceHedge from "../../src/components/graficos/MinVarianceHedge";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("MinVarianceHedge", () => {
  test("the default is rho 0.9, sigma_S 3%, sigma_F 4%: h* 0.675 and 19.0% residual variance", () => {
    render(<MinVarianceHedge />);
    expect(readout("h*")).toBe("0.675");
    expect(readout("Varianza residual")).toBe("19.0%");
  });

  test("a correlation of 1 leaves no residual variance; Restablecer returns to the default", async () => {
    render(<MinVarianceHedge />);
    setSlider("Correlación", 1);
    expect(readout("Varianza residual")).toBe("0.0%");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("h*")).toBe("0.675");
    expect(readout("Varianza residual")).toBe("19.0%");
  });

  test("the main series draws a path", () => {
    const { container } = render(<MinVarianceHedge />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<MinVarianceHedge />);
  });
});
