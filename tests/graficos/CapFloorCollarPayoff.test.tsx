import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import CapFloorCollarPayoff from "../../src/components/graficos/CapFloorCollarPayoff";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("CapFloorCollarPayoff", () => {
  test("the default is the collar of the worked example: R_C 3%, R_F 2%, R 3.5%", () => {
    render(<CapFloorCollarPayoff />);
    expect(readout("Caplet")).toBe("12,500");
    expect(readout("Floorlet")).toBe("0");
    expect(readout("R_ef")).toBe("3.00%");
  });

  test("a reference rate of 1.5% gives the floorlet row; Restablecer returns to the default", async () => {
    render(<CapFloorCollarPayoff />);
    setSlider("Tipo de referencia", 0.015);
    expect(readout("Caplet")).toBe("0");
    expect(readout("Floorlet")).toBe("12,500");
    expect(readout("R_ef")).toBe("2.00%");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Caplet")).toBe("12,500");
    expect(readout("Floorlet")).toBe("0");
    expect(readout("R_ef")).toBe("3.00%");
  });

  test("the main series draws a path", () => {
    const { container } = render(<CapFloorCollarPayoff />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<CapFloorCollarPayoff />);
  });
});
