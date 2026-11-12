import { fireEvent, render, screen } from "@testing-library/react";
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

  test("the largest alpha is a position of the slider (a whole number of steps above the minimum)", () => {
    const { container } = render(<SabrSmile />);
    const alpha = container.querySelector<HTMLInputElement>("input[type='range']")!;
    // Default beta 0.5 and F 3%: 0.3 * sqrt(0.03) = 0.05196, which the slider cannot show; the step below is 0.05.
    // The exact text matters: a browser moves a maximum of 0.04999… down to the position below it.
    expect(alpha.max).toBe("0.05");
    fireEvent.change(alpha, { target: { value: alpha.max } });
    expect(alpha.getAttribute("aria-valuetext")).toBe("0.0500");
  });

  test("at all 64 min/max corners of the six sliders the three read-outs are positive volatilities", () => {
    const { container } = render(<SabrSmile />);
    const sliders = [...container.querySelectorAll<HTMLInputElement>("input[type='range']")];
    expect(sliders).toHaveLength(6);
    // alpha (first) has a maximum that follows beta and F, so it is moved last, after the others have settled.
    const order = [1, 2, 3, 4, 5, 0];
    for (let corner = 0; corner < 64; corner++) {
      order.forEach((index, bit) => {
        const s = sliders[index];
        fireEvent.change(s, { target: { value: (corner >> bit) & 1 ? s.max : s.min } });
      });
      for (const label of ["σ ATM", "σ con K = 0.5 F", "σ con K = 1.5 F"]) {
        const value = parseFloat(readout(label));
        expect(value, `${label} at corner ${corner}`).toBeGreaterThan(0);
      }
    }
  });
});
