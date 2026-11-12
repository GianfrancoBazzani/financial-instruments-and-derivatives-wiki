import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import SabrSmile from "../../src/components/graficos/SabrSmile";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("SabrSmile", () => {
  test("the default is F 3%, T 5, alpha 0.035, beta 0.5, rho -0.3, nu 0.4, with a downward skew", () => {
    render(<SabrSmile />);
    expect(readout("σ ATM")).toBe("21.11%");
    expect(readout("σ con K = 0.5 F")).toBe("32.01%");
    expect(readout("σ con K = 1.5 F")).toBe("18.97%");
  });

  test("beta 1, nu 0, alpha 0.2 give a flat smile of 20%; Restablecer returns to the default", async () => {
    render(<SabrSmile />);
    setSlider("Beta", 1);
    setSlider("Volatilidad de la volatilidad", 0);
    setSlider("Alfa", 0.2);
    expect(readout("σ ATM")).toBe("20.00%");
    expect(readout("σ con K = 0.5 F")).toBe("20.00%");
    expect(readout("σ con K = 1.5 F")).toBe("20.00%");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("σ ATM")).toBe("21.11%");
  });

  test("the main series draws a path", () => {
    const { container } = render(<SabrSmile />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<SabrSmile />);
  });
});
