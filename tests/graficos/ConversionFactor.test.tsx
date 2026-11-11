import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import ConversionFactor from "../../src/components/graficos/ConversionFactor";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("ConversionFactor", () => {
  test("the default is Example 1: coupon 10%, 20 years and 2 months", () => {
    render(<ConversionFactor />);
    expect(readout("Factor de conversión")).toBe("1.4623");
    expect(readout("Vencimiento redondeado")).toBe("20 años y 0 meses");
  });

  test("Example 2 (8%, 18 years, 4 months) gives 1.2199; Restablecer returns to the default", async () => {
    render(<ConversionFactor />);
    setSlider("Tipo del cupón", 0.08);
    setSlider("Años hasta el vencimiento", 18);
    setSlider("Meses hasta el vencimiento", 4);
    expect(readout("Factor de conversión")).toBe("1.2199");
    expect(readout("Vencimiento redondeado")).toBe("18 años y 3 meses");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Factor de conversión")).toBe("1.4623");
  });

  test("the main series draws a path", () => {
    const { container } = render(<ConversionFactor />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<ConversionFactor />);
  });
});
