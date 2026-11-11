import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { pages } from "../site/pages";
import { comparePage, shapeOfSource } from "../tools/translation-check";

const pagePath = (slug: string) => `src/content/docs/${slug}.mdx`;

/** Entries of docs/excepciones-traduccion.md: list items whose error text is in backticks. */
const exceptions = readFileSync("docs/excepciones-traduccion.md", "utf8")
  .split("\n")
  .filter((l) => l.startsWith("- "))
  .map((l) => /`([^`]+)`/.exec(l)?.[1])
  .filter((x): x is string => Boolean(x));

describe("source notes", () => {
  test("every source note parses and the counts are printed", () => {
    for (const def of pages) {
      const shape = shapeOfSource(readFileSync(`source/en/${def.source}`, "utf8"));
      console.log(def.source, JSON.stringify(shape));
      expect(shape.headings[0]).toBeGreaterThan(0);
    }
  });
});

describe("translated pages match their source", () => {
  for (const def of pages) {
    const path = pagePath(def.slug);
    test.runIf(existsSync(path))(def.slug, () => {
      const source = readFileSync(`source/en/${def.source}`, "utf8");
      expect(comparePage(def, source, readFileSync(path, "utf8"), exceptions)).toEqual([]);
    });
  }
});

test("all 12 translated pages exist", () => {
  for (const def of pages) expect(existsSync(pagePath(def.slug)), def.slug).toBe(true);
});
