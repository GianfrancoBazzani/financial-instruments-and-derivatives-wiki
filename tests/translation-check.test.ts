import { describe, expect, test } from "vitest";
import type { PageDef } from "../site/pages";
import { comparePage, normaliseFormula, shapeOfPage, shapeOfSource } from "../tools/translation-check";

const def: PageDef = {
  source: "x.md",
  slug: "x",
  title: "T",
  diagrams: ["x"],
  removedDiagrams: [],
  graphics: ["PriceYield"],
};

const src =
  "# T\n\nPays \\$100 and $x$.\n\n$$\na = b\n$$\n\n$$c=d$$\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n> [!NOTE]\n> n\n\n![alt](Attachments/x.svg)\n";
const page =
  '---\ntitle: T\n---\n\nPaga \\$100 y $x$.\n\n$$\na = b\n$$\n\n$$c=d$$\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n:::note\nn\n:::\n\n<Diagrama nombre="x" alt="alt" />\n\n{/* GRAFICO: PriceYield */}\n';

describe("translation-check", () => {
  test("normaliseFormula drops \\text content and whitespace", () => {
    expect(normaliseFormula("\\text{Interest} = 60M \\times 2\\%")).toBe("\\text{}=60M\\times2\\%");
    expect(normaliseFormula("\\text{Interés} = 60M \\times 2\\%")).toBe("\\text{}=60M\\times2\\%");
  });

  test("shapeOfSource", () => {
    expect(shapeOfSource(src)).toMatchObject({
      displayFormulas: ["a=b", "c=d"],
      inlineFormulas: ["x"],
      tables: [1],
      headings: [1, 0, 0, 0],
      callouts: 1,
      images: 1,
    });
  });

  test("shapeOfPage", () => {
    expect(shapeOfPage(page)).toMatchObject({
      displayFormulas: ["a=b", "c=d"],
      inlineFormulas: ["x"],
      tables: [1],
      headings: [1, 0, 0, 0],
      callouts: 1,
      images: 1,
      graphics: ["PriceYield"],
    });
  });

  test("a faithful page has no errors", () => {
    expect(comparePage(def, src, page, [])).toEqual([]);
  });

  test("a changed formula is reported", () => {
    expect(comparePage(def, src, page.replace("c=d", "c=e"), [])).toHaveLength(1);
  });

  test("an unescaped dollar that turns prose into math is reported", () => {
    expect(comparePage(def, src, page.replace("\\$100 y $x$", "$100 y $x$"), []).length).toBeGreaterThan(0);
  });

  test("blockquote display math, mermaid, and removed diagrams are counted", () => {
    const s = "# T\n\n> [!NOTE]\n> $$\n> a=b\n> $$\n\n```mermaid\ngraph TD\n```\n\n![a](Attachments/y.svg)\n";
    const d: PageDef = { ...def, diagrams: ["m"], removedDiagrams: ["y"], graphics: [] };
    const p = '---\ntitle: T\n---\n\n:::note\n$$\na=b\n$$\n:::\n\n<Diagrama nombre="m" alt="m" />\n';
    expect(shapeOfSource(s)).toMatchObject({ displayFormulas: ["a=b"], images: 1, mermaid: 1, callouts: 1 });
    expect(comparePage(d, s, p, [])).toEqual([]);
  });

  test("an error listed in the exceptions is dropped", () => {
    const errors = comparePage(def, src, page.replace("c=d", "c=e"), []);
    expect(comparePage(def, src, page.replace("c=d", "c=e"), [errors[0]])).toEqual([]);
  });
});
