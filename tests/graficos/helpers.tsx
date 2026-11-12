// Helpers for the tests of the graphics (jsdom). A graphic is built with the kit, so its read-outs
// carry data-lectura={label} and its sliders are native range inputs named by their label.
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

/** Text of the read-out with this label. */
export function readout(label: string): string {
  const all = [...document.querySelectorAll<HTMLElement>("[data-lectura]")];
  const found = all.filter((el) => el.dataset.lectura === label);
  if (found.length !== 1) {
    const known = all.map((el) => `"${el.dataset.lectura}"`).join(", ") || "none";
    throw new Error(`readout("${label}"): found ${found.length} read-outs with this label; labels present: ${known}`);
  }
  return found[0].querySelector("dd")?.textContent ?? "";
}

/** Moves the slider with this label to value; the value must be one the slider can take. */
export function setSlider(label: string, value: number): void {
  const input = screen.getByRole<HTMLInputElement>("slider", { name: label });
  const [min, max, step] = [Number(input.min), Number(input.max), Number(input.step)];
  if (value < min || value > max)
    throw new Error(`setSlider("${label}", ${value}): value outside the range [${min}, ${max}]`);
  // A browser snaps the value to the step; jsdom does not, so a test could pass with a value no reader can set.
  const steps = (value - min) / step;
  if (Math.abs(steps - Math.round(steps)) > 1e-6)
    throw new Error(`setSlider("${label}", ${value}): not on the step ${step} from ${min}`);
  fireEvent.change(input, { target: { value: String(value) } });
}

// A negative zero as printed: "-0", "-0.00" (also with the minus sign U+2212), not "-0.05".
const NEGATIVE_ZERO = /(?<![\w.])[-−]0(?:\.0+)?(?!\.?\d)/;

/** Each text node on its own: textContent would glue a label to the number after it. */
function texts(container: HTMLElement): string[] {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const out: string[] = [];
  while (walker.nextNode()) out.push(walker.currentNode.nodeValue ?? "");
  return out;
}

function check(container: HTMLElement, where: string): void {
  for (const text of texts(container)) {
    const shown = /NaN|Infinity/.exec(text)?.[0] ?? NEGATIVE_ZERO.exec(text)?.[0];
    if (shown !== undefined) throw new Error(`sweepExtremes: ${where}: the graphic shows "${shown}" (in "${text}")`);
  }
  // fmt prints "—" for a value that is not finite, so a read-out that shows it has a NaN behind it.
  for (const dd of container.querySelectorAll("[data-lectura] dd"))
    if ((dd.textContent ?? "").includes("—"))
      throw new Error(`sweepExtremes: ${where}: the read-out "${(dd.closest("[data-lectura]") as HTMLElement).dataset.lectura}" shows "—" (not finite)`);
  const markup = /NaN|Infinity/.exec(container.innerHTML)?.[0];
  if (markup !== undefined) throw new Error(`sweepExtremes: ${where}: the SVG markup contains "${markup}"`);
  const drawn = [...container.querySelectorAll("svg path")].some((p) => (p.getAttribute("d") ?? "").trim() !== "");
  if (!drawn) throw new Error(`sweepExtremes: ${where}: no <path> with a non-empty d (empty plot)`);
}

const sliders = (container: HTMLElement) => [...container.querySelectorAll<HTMLInputElement>("input[type='range']")];
const nameOf = (s: HTMLInputElement) => s.getAttribute("aria-label") ?? s.id;

function move(s: HTMLInputElement, to: "minimum" | "maximum"): string {
  const value = to === "minimum" ? s.min : s.max;
  fireEvent.change(s, { target: { value } });
  return `"${nameOf(s)}" at its ${to} (${value})`;
}

const MAX_CORNER_SLIDERS = 8;

/** Every slider to its minimum or its maximum, in all 2^n combinations (bit i of the corner = slider i). */
function walkCorners(ui: ReactElement, count: number): void {
  const view = render(ui);
  try {
    for (let corner = 0; corner < 2 ** count; corner++) {
      const parts = sliders(view.container).map((s, i) => move(s, (corner >> i) & 1 ? "maximum" : "minimum"));
      check(view.container, `corner ${corner} of ${2 ** count}: ${parts.join(", ")}`);
    }
  } finally {
    view.unmount();
  }
}

/**
 * Renders ui and moves every slider to its minimum, then every slider to its maximum, then each
 * slider alone (from a fresh render) to its minimum and its maximum; with 8 sliders or fewer it also
 * walks all min/max combinations. After each change it asserts that the text shows no "NaN",
 * "Infinity", or negative zero, that no read-out shows "—", and that a <path> has a non-empty d.
 */
export function sweepExtremes(ui: ReactElement): void {
  let view = render(ui);
  let count = 0;
  try {
    check(view.container, "default state");
    for (const s of sliders(view.container))
      check(view.container, `${move(s, "minimum")}, after the sliders before it went to their minimum`);
    for (const s of sliders(view.container))
      check(view.container, `${move(s, "maximum")}, after the sliders before it went to their maximum`);
    count = sliders(view.container).length;
    for (let i = 0; i < count; i++) {
      for (const to of ["minimum", "maximum"] as const) {
        view.unmount();
        view = render(ui);
        check(view.container, `${move(sliders(view.container)[i], to)}, the others at their defaults`);
      }
    }
  } finally {
    view.unmount();
  }
  if (count <= MAX_CORNER_SLIDERS) walkCorners(ui, count);
}
