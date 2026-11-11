import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { pages } from "../site/pages";
import {
  hasViewBox,
  lintSvg,
  noBackgroundRect,
  noFontFamily,
  noRootSize,
  themedColours,
} from "../tools/diagram-lint";

const good =
  '<svg viewBox="0 0 100 50"><rect x="10" y="10" width="20" height="20" fill="none" stroke="var(--g-main)"/>' +
  '<text fill="currentColor">a</text><path stroke="var(--g-muted)" fill="none"/></svg>';

describe("diagram lint rules", () => {
  test("a good diagram has no errors", () => expect(lintSvg(good)).toEqual([]));

  test("viewBox is required", () => {
    expect(hasViewBox('<svg width="1">')).toHaveLength(1);
    expect(hasViewBox('<svg viewBox="0 0 1 1">')).toEqual([]);
  });

  test("root width/height are rejected", () => {
    expect(noRootSize('<svg viewBox="0 0 1 1" width="10">')).toHaveLength(1);
    expect(noRootSize('<svg viewBox="0 0 1 1" height="10">')).toHaveLength(1);
    expect(noRootSize('<svg viewBox="0 0 1 1"><rect width="10" height="10"/></svg>')).toEqual([]);
  });

  test("a full-viewBox filled rect is rejected", () => {
    const wrap = (r: string) => `<svg viewBox="0 0 100 50">${r}</svg>`;
    expect(noBackgroundRect(wrap('<rect width="100" height="50" fill="#fff"/>'))).toHaveLength(1);
    expect(noBackgroundRect(wrap('<rect x="0" y="0" width="100%" height="100%" fill="white"/>'))).toHaveLength(1);
    expect(noBackgroundRect(wrap('<rect width="100" height="50" fill="none"/>'))).toEqual([]);
    expect(noBackgroundRect(wrap('<rect width="40" height="20" fill="var(--g-b)"/>'))).toEqual([]);
  });

  test("only none, currentColor, or var(--g-…) colours are allowed", () => {
    expect(themedColours('<svg><path fill="#fff"/></svg>')).toHaveLength(1);
    expect(themedColours('<svg><path stroke="red"/></svg>')).toHaveLength(1);
    expect(themedColours('<svg><path fill="var(--sl-color-text)"/></svg>')).toHaveLength(1);
    expect(themedColours('<svg><path fill="none" stroke="currentColor"/><path fill="var(--g-c)"/></svg>')).toEqual([]);
  });

  test("colours hidden in style, <style>, single quotes, or other attributes are rejected", () => {
    expect(themedColours('<svg><path style="fill:#fff"/></svg>')).toHaveLength(1);
    expect(themedColours('<svg><path style="stroke:red"/></svg>')).toHaveLength(1);
    expect(themedColours("<svg><style>path{fill:#fff}</style></svg>")).toHaveLength(1);
    expect(themedColours("<svg><path fill='#fff'/></svg>")).toHaveLength(1);
    expect(themedColours('<svg><stop stop-color="#fff"/></svg>')).toHaveLength(1);
    expect(themedColours('<svg><feFlood flood-color="red"/></svg>')).toHaveLength(1);
    expect(themedColours('<svg><g color="red"/></svg>')).toHaveLength(1);
    expect(themedColours("<svg><path fill='var(--g-b)'/><stop stop-color=\"currentColor\"/></svg>")).toEqual([]);
  });

  test("font-family is rejected", () => {
    expect(noFontFamily('<svg><text font-family="Arial">a</text></svg>')).toHaveLength(1);
    expect(noFontFamily("<svg><text>a</text></svg>")).toEqual([]);
  });
});

const dir = "src/assets/diagramas";
const files = readdirSync(dir).filter((f) => f.endsWith(".svg"));

describe("diagram files", () => {
  test.each(files)("%s passes the lint", (f) => {
    expect(lintSvg(readFileSync(`${dir}/${f}`, "utf8"))).toEqual([]);
  });

  test("every diagram named by an existing page has a file", () => {
    const missing = pages
      .filter((p) => existsSync(`src/content/docs/${p.slug}.mdx`))
      .flatMap((p) => p.diagrams.map((d) => `${p.slug}: ${d}`))
      .filter((s) => !existsSync(`${dir}/${s.split(": ")[1]}.svg`));
    expect(missing).toEqual([]);
  });
});
