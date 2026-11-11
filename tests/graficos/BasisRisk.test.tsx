import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import BasisRisk from "../../src/components/graficos/BasisRisk";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("BasisRisk", () => {
  test("the default is the example of the page: F_1 2.20, b_2 0.10, effective price 2.30", () => {
    render(<BasisRisk />);
    expect(readout("Precio efectivo")).toBe("2.30");
    expect(readout("Basis")).toBe("0.10");
  });

  test("a final basis of zero gives F_1; Restablecer returns to the default", async () => {
    render(<BasisRisk />);
    setSlider("Basis final", 0);
    expect(readout("Precio efectivo")).toBe("2.20");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Precio efectivo")).toBe("2.30");
    expect(readout("Basis")).toBe("0.10");
  });

  test("the main series draws a path", () => {
    const { container } = render(<BasisRisk />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<BasisRisk />);
  });
});
