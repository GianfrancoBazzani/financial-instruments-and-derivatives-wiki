import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import DurationConvexityApprox from "../../src/components/graficos/DurationConvexityApprox";
import { readout, setSlider, sweepExtremes } from "./helpers";

const DEFAULTS: [string, string][] = [
  ["D_Mod", "3.59"],
  ["C", "16.82"],
  // The text prints -7.180% and -6.844% from D_Mod rounded to 3.59 (docs/discrepancias-redondeo.md).
  ["Lineal", "-7.17%"],
  ["Segundo orden", "-6.83%"],
  ["Exacto", "-6.85%"],
];

describe("DurationConvexityApprox", () => {
  test("the default is the large change of the text: the annual bond at 4%, Δy = +2%", () => {
    render(<DurationConvexityApprox />);
    for (const [label, value] of DEFAULTS) expect(readout(label)).toBe(value);
  });

  test("the small change of the text, Δy = +0.2%; Restablecer returns to +2%", async () => {
    render(<DurationConvexityApprox />);
    setSlider("Cambio en la rentabilidad", 0.002);
    expect(readout("Exacto")).toBe("-0.71%");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    for (const [label, value] of DEFAULTS) expect(readout(label)).toBe(value);
  });

  test("the main series draws a path", () => {
    const { container } = render(<DurationConvexityApprox />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<DurationConvexityApprox />);
  });
});
