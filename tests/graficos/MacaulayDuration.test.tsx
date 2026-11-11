import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import MacaulayDuration from "../../src/components/graficos/MacaulayDuration";
import { readout, setSlider, sweepExtremes } from "./helpers";

describe("MacaulayDuration", () => {
  test("the default is the worked example: coupon 5%, 4 years, annual, y 4%", () => {
    const { container } = render(<MacaulayDuration />);
    expect(readout("Precio")).toBe("103.63");
    expect(readout("D_Mac")).toBe("3.73");
    expect(container.querySelectorAll("figure svg [data-serie='main'] path")).toHaveLength(4); // one bar per cash flow
  });

  test("two coupons a year shorten the duration; Restablecer returns to the default", async () => {
    render(<MacaulayDuration />);
    setSlider("Cupones al año", 1); // position 1 of 1, 2, 4: m = 2
    expect(readout("D_Mac")).toBe("3.68");
    expect(readout("Precio")).toBe("103.66");
    await userEvent.setup().click(screen.getByRole("button", { name: "Restablecer" }));
    expect(readout("Precio")).toBe("103.63");
    expect(readout("D_Mac")).toBe("3.73");
  });

  test("the main series draws a path", () => {
    const { container } = render(<MacaulayDuration />);
    expect(container.querySelector("figure svg [data-serie='main'] path")?.getAttribute("d")).toMatch(/^M/);
  });

  test("no slider position shows NaN, Infinity, -0, or an empty plot", () => {
    sweepExtremes(<MacaulayDuration />);
  });
});
