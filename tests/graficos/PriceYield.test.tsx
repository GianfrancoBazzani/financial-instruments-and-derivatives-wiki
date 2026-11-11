import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import PriceYield from "../../src/components/graficos/PriceYield";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("PriceYield", () => {
  test("the default is the bond of the worked example: coupon 5%, 4 years, annual, y 4%", () => {
    render(<PriceYield />);
    expect(readout("Precio")).toBe("103.63");
  });

  test("a yield equal to the coupon gives par; Restablecer returns to the default", async () => {
    render(<PriceYield />);
    setSlider("Rentabilidad", 0.05);
    expect(readout("Precio")).toBe("100.00");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Precio")).toBe("103.63");
  });

  test("the main series draws a path", () => {
    const { container } = render(<PriceYield />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<PriceYield />);
  });
});
