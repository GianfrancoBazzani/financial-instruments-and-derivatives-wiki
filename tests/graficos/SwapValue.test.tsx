import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import SwapValue from "../../src/components/graficos/SwapValue";
import { readout, setSlider, sweepExtremes } from "./helpers";

const amount = (s: string) => Number(s.replaceAll(",", ""));

describe("SwapValue", () => {
  test("the default is the swap of the note: 30 years, R_K 4.30%, 100 million; at par both values are zero", () => {
    render(<SwapValue />);
    expect(readout("V pagador")).toBe("0");
    expect(readout("V receptor")).toBe("0");
    expect(readout("Aproximación DV01")).toBe("0");
  });

  test("a marker rate of 5.30% gives the payer a gain below the DV01 line; Restablecer returns to the default", async () => {
    render(<SwapValue />);
    setSlider("Tipo swap marcado", 0.053);
    expect(readout("V pagador")).toBe("14,860,429");
    expect(readout("V receptor")).toBe("-14,860,429");
    expect(readout("Aproximación DV01")).toBe("16,679,201");
    expect(amount(readout("V pagador"))).toBeGreaterThan(0);
    expect(amount(readout("V pagador"))).toBeLessThan(amount(readout("Aproximación DV01")));
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("V pagador")).toBe("0");
    expect(readout("Aproximación DV01")).toBe("0");
  });

  test("the main series draws a path", () => {
    const { container } = render(<SwapValue />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<SwapValue />);
  });
});
