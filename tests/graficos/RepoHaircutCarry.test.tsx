import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import RepoHaircutCarry from "../../src/components/graficos/RepoHaircutCarry";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("RepoHaircutCarry", () => {
  test("the default is the example of the page: bond of 100M, haircut 2%, yield 3.4%, repo at 1D", () => {
    render(<RepoHaircutCarry />);
    expect(readout("Efectivo prestado")).toBe("98,000,000");
    expect(readout("Tipo repo")).toBe("2.80%");
    expect(readout("Carry")).toBe("0.60%");
  });

  test("financing at 6M gives a negative carry; Restablecer returns to the default", async () => {
    render(<RepoHaircutCarry />);
    setSlider("Plazo del repo", 4);
    expect(readout("Tipo repo")).toBe("3.80%");
    expect(readout("Carry")).toBe("-0.40%");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Efectivo prestado")).toBe("98,000,000");
    expect(readout("Carry")).toBe("0.60%");
  });

  test("the main series draws a path", () => {
    const { container } = render(<RepoHaircutCarry />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<RepoHaircutCarry />);
  });
});
