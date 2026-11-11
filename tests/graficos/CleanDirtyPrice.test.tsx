import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import CleanDirtyPrice, { lifeCurves } from "../../src/components/graficos/CleanDirtyPrice";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("CleanDirtyPrice", () => {
  test("the default is the bond of the text: 10 years, coupon 3% twice a year, y 5%, at issue", () => {
    render(<CleanDirtyPrice />);
    expect(readout("Precio sucio")).toBe("84.41");
    expect(readout("Cupón corrido")).toBe("0.00");
    expect(readout("Precio limpio")).toBe("84.41");
  });

  test("three months after issue a quarter of the 3% coupon has accrued; Restablecer returns to issue", async () => {
    render(<CleanDirtyPrice />);
    setSlider("Tiempo desde la emisión", 0.25);
    expect(readout("Cupón corrido")).toBe("0.75");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Precio sucio")).toBe("84.41");
    expect(readout("Cupón corrido")).toBe("0.00");
    expect(readout("Precio limpio")).toBe("84.41");
  });

  test("the dirty price falls vertically by the coupon on each coupon date; the clean price does not jump", () => {
    const bond = { face: 100, couponRate: 0.03, maturity: 10, frequency: 2 as const };
    const { dirty, clean } = lifeCurves(bond, 0.05);
    const drops = dirty.flatMap((p, i) => (i > 0 && p[0] - dirty[i - 1][0] < 1e-3 ? [i] : []));
    expect(drops).toHaveLength(19); // coupon dates 0.5, 1, ..., 9.5; the last one ends the curve
    for (const i of drops) {
      expect(dirty[i - 1][1] - dirty[i][1]).toBeCloseTo(1.5, 4);
      expect(Math.abs(clean[i - 1][1] - clean[i][1])).toBeLessThan(1e-4);
    }
    expect(dirty.at(-1)?.[1]).toBeCloseTo(101.5, 4); // just before the last coupon and the principal
    expect(clean.at(-1)?.[1]).toBeCloseTo(100, 4);
  });

  test("the main series draws a path", () => {
    const { container } = render(<CleanDirtyPrice />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<CleanDirtyPrice />);
  });
});
