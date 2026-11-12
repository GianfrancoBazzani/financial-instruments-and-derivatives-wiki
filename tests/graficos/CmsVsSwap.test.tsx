import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import CmsVsSwap from "../../src/components/graficos/CmsVsSwap";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("CmsVsSwap", () => {
  test("the default is a 30-year annual swap, s_F 3%, sigma 20%, T 5, with a positive adjustment", () => {
    render(<CmsVsSwap />);
    expect(readout("Tipo swap forward")).toBe("3.00%");
    expect(readout("Tipo swap esperado")).toBe("3.23%");
    expect(readout("Ajuste por convexidad")).toBe("23.3 pb");
  });

  test("the plot marks the adjustment with its value", () => {
    const { container } = render(<CmsVsSwap />);
    const labels = [...container.querySelectorAll("figure svg text")].map((t) => t.textContent);
    expect(labels).toContain("Ajuste: 23.3 pb");
  });

  test("a volatility of zero gives no adjustment; Restablecer returns to the default", async () => {
    render(<CmsVsSwap />);
    setSlider("Volatilidad", 0);
    expect(readout("Ajuste por convexidad")).toBe("0.0 pb");
    expect(readout("Tipo swap esperado")).toBe("3.00%");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Ajuste por convexidad")).toBe("23.3 pb");
  });

  test("the main series draws a path", () => {
    const { container } = render(<CmsVsSwap />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<CmsVsSwap />);
  });
});
