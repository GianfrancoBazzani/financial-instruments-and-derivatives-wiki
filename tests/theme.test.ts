import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { contrastRatio } from "../tools/contrast";

const css = readFileSync("src/styles/tema.css", "utf8");

/** Custom properties declared in the first rule whose selector is exactly `selector`. */
function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`No block for ${selector}`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  const vars: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

const themes = { dark: block(":root"), light: block(":root[data-theme='light']") };

test("contrastRatio", () => expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1));
test("fixed pair: black on yellow", () =>
  expect(contrastRatio("#0B0B0B", "#FFCD00")).toBeGreaterThanOrEqual(4.5));

describe.each(Object.entries(themes))("%s theme", (_name, vars) => {
  const v = (k: string) => {
    expect(vars[k], k).toMatch(/^#[0-9a-f]{6}$/i);
    return vars[k];
  };
  const bg = () => v("--sl-color-black");

  test("text", () => expect(contrastRatio(v("--sl-color-white"), bg())).toBeGreaterThanOrEqual(4.5));
  test("secondary text", () =>
    expect(contrastRatio(v("--sl-color-gray-2"), bg())).toBeGreaterThanOrEqual(4.5));
  test("link text", () =>
    expect(contrastRatio(v("--sl-color-accent-high"), bg())).toBeGreaterThanOrEqual(4.5));
  test.each(["--g-main", "--g-b", "--g-c"])("series %s", (s) =>
    expect(contrastRatio(v(s), bg())).toBeGreaterThanOrEqual(3),
  );
  test("defines the series and grey tokens", () => {
    for (const k of ["--g-muted", "--g-grid", "--sl-color-accent", "--sl-color-gray-1", "--sl-color-gray-3", "--sl-color-gray-4", "--sl-color-gray-5", "--sl-color-gray-6"])
      expect(vars[k], k).toBeTruthy();
  });
});

test("dark theme uses the navy background and the yellow main series", () => {
  expect(themes.dark["--sl-color-black"].toUpperCase()).toBe("#060B19");
  expect(themes.dark["--g-main"].toUpperCase()).toBe("#FFCD00");
});
test("light theme uses a white background", () =>
  expect(themes.light["--sl-color-black"].toUpperCase()).toBe("#FFFFFF"));
