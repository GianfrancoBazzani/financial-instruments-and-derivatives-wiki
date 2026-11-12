import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import StripPrice from "../../src/components/graficos/StripPrice";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("StripPrice", () => {
  test("the default is the principal STRIP of the worked example: 100 at 3% for 3 years", () => {
    render(<StripPrice />);
    expect(readout("Precio")).toBe("91.51");
    expect(readout("D_Mod")).toBe("2.91");
    expect(readout("Caída con +1 pp")).toBe("2.9%");
  });

  test("a 5-year maturity gives 86.26 and a larger fall; Restablecer returns to the default", async () => {
    render(<StripPrice />);
    setSlider("Vencimiento", 5);
    expect(readout("Precio")).toBe("86.26");
    expect(readout("Caída con +1 pp")).toBe("4.7%");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Precio")).toBe("91.51");
  });

  test("the main series draws a path", () => {
    const { container } = render(<StripPrice />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<StripPrice />);
  });
});
