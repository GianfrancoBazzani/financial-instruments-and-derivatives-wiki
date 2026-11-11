import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import ForwardPayoff from "../../src/components/graficos/ForwardPayoff";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("ForwardPayoff", () => {
  test("the default is K = 100 with the marker at S_T = 102", () => {
    render(<ForwardPayoff />);
    expect(readout("Payoff largo")).toBe("2.00");
    expect(readout("Payoff corto")).toBe("-2.00");
  });

  test("K = 105 gives a long payoff of -3; Restablecer returns to the default", async () => {
    render(<ForwardPayoff />);
    setSlider("Precio de entrega", 105);
    expect(readout("Payoff largo")).toBe("-3.00");
    expect(readout("Payoff corto")).toBe("3.00");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Payoff largo")).toBe("2.00");
    expect(readout("Payoff corto")).toBe("-2.00");
  });

  test("the main series draws a path", () => {
    const { container } = render(<ForwardPayoff />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<ForwardPayoff />);
  });
});
