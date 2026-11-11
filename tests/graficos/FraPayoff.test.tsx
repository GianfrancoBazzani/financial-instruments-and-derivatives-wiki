import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import FraPayoff from "../../src/components/graficos/FraPayoff";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("FraPayoff", () => {
  test("the default is the worked example: 100 million, R_K 3%, tau 0.25, R_M 3.5%, pays fixed", () => {
    render(<FraPayoff />);
    expect(readout("Pago al final")).toBe("125,000");
    expect(readout("Pago al inicio")).toBe("123,916");
  });

  test("a realised rate equal to R_K pays nothing; Restablecer returns to the default", async () => {
    render(<FraPayoff />);
    setSlider("Tipo de referencia realizado", 0.03);
    expect(readout("Pago al final")).toBe("0");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Pago al final")).toBe("125,000");
    expect(readout("Pago al inicio")).toBe("123,916");
  });

  test("the main series draws a path", () => {
    const { container } = render(<FraPayoff />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<FraPayoff />);
  });
});
