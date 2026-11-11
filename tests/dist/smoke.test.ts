import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const html = readFileSync("dist/prueba/index.html", "utf8");
test("lang is es", () => expect(html).toMatch(/<html[^>]*lang="es"/));
test("display and inline math rendered by KaTeX", () =>
  expect(html.match(/class="katex"/g)!.length).toBeGreaterThanOrEqual(2));
test("escaped dollar is text, not math", () => expect(html).toContain("$100 millones"));
test("braces and < survive", () => {
  expect(html).toContain("{a, b}");
  expect(html).toMatch(/x (&lt;|&#x3C;) y/);
});
test("island is server-rendered", () => expect(html).toMatch(/data-grafico="Smoke"[\s\S]*?<svg/));
