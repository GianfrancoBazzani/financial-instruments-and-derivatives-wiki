import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import CarryRollDown from "../../src/components/graficos/CarryRollDown";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("CarryRollDown", () => {
  test("the default is the worked example: coupon 5%, 5 years, y 4.5%, slope 0.2%, horizon 1", () => {
    render(<CarryRollDown />);
    expect(readout("Carry")).toBe("4.50%");
    expect(readout("Roll-down")).toBe("0.71%");
    expect(readout("Total")).toBe("5.21%");
  });

  test("a flat curve has no roll-down; Restablecer returns to the default", async () => {
    render(<CarryRollDown />);
    setSlider("Pendiente de la curva (por año)", 0);
    expect(readout("Roll-down")).toBe("0.00%");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Carry")).toBe("4.50%");
    expect(readout("Roll-down")).toBe("0.71%");
    expect(readout("Total")).toBe("5.21%");
  });

  test("the main series draws a path", () => {
    const { container } = render(<CarryRollDown />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<CarryRollDown />);
  });
});
