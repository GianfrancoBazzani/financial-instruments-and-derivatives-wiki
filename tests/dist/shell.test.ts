import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const NOTICE =
  "Apuntes no oficiales elaborados por un alumno. No es material oficial de la Universidad de las Hespérides.";

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (name === "pagefind" || name === "_astro") return [];
    if (statSync(p).isDirectory()) return htmlFiles(p);
    return name === "index.html" ? [p] : [];
  });
}

const files = htmlFiles("dist");

describe.each(files)("%s", (file) => {
  const html = readFileSync(file, "utf8");
  test("shows the unofficial-notes sentence", () => expect(html).toContain(NOTICE));
  test("loads nothing from another host", () => {
    const outsideMain = html.replace(/<main[\s\S]*?<\/main>/g, "");
    expect(outsideMain.match(/(src|href)="https?:\/\/[^"]*"/g) ?? []).toEqual([]);
  });
  test("has no logo or image in the header", () => {
    const header = /<header[\s\S]*?<\/header>/.exec(html)?.[0] ?? "";
    expect(header).not.toMatch(/<img/);
  });
});

describe("home page", () => {
  const html = readFileSync("dist/index.html", "utf8");
  test.each([
    "Derivados Financieros",
    "Máster en Finanzas Cuantitativas y Métodos Computacionales",
    "Universidad de las Hespérides",
  ])("contains %s", (s) => expect(html).toContain(s));
});

describe("default theme", () => {
  const html = readFileSync("dist/index.html", "utf8");
  test("falls back to dark when the reader stored no choice", () => {
    const script = /window\.StarlightThemeProvider[\s\S]*?<\/script>/.exec(html)?.[0] ?? "";
    expect(script).toContain("starlight-theme");
    expect(script).not.toContain("prefers-color-scheme");
    expect(script).toMatch(/storedTheme \|\| 'dark'|storedTheme \|\| "dark"/);
  });
  test("the theme switch does not follow the operating system either", () => {
    const js = html
      .split("</script>")
      .find((chunk) => chunk.includes("customElements.define(`starlight-theme-select`"));
    expect(js).toBeDefined();
    expect(js).not.toContain("prefers-color-scheme");
  });
});
