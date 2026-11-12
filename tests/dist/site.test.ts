import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { pageNumber, pages, type PageDef } from "../../site/pages";

const read = (slug: string) => readFileSync(`dist/${slug}/index.html`, "utf8");
const BANNER = "Traducción pendiente de revisión";

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (name === "pagefind" || name === "_astro") return [];
    if (statSync(p).isDirectory()) return htmlFiles(p);
    return name.endsWith(".html") ? [p] : [];
  });
}

/** Each `<figure data-grafico="Name" ...>` up to its closing `</figure>` (graphics never nest figures). */
function graphicFigures(html: string): { name: string; figure: string }[] {
  const out: { name: string; figure: string }[] = [];
  const open = /<figure data-grafico="(\w+)"/g;
  for (let m = open.exec(html); m; m = open.exec(html)) {
    const end = html.indexOf("</figure>", m.index);
    expect(end, `unterminated figure of ${m[1]}`).toBeGreaterThan(m.index);
    out.push({ name: m[1], figure: html.slice(m.index, end + "</figure>".length) });
  }
  return out;
}

function sidebarLabels(html: string): string[] {
  const list = /<ul class="top-level[\s\S]*?<\/ul>/.exec(html)?.[0] ?? "";
  return [...list.matchAll(/<a [^>]*><span[^>]*>([^<]*)<\/span><\/a>/g)].map((m) => m[1]);
}

describe("13 pages exist", () => {
  test("home page", () => expect(existsSync("dist/index.html")).toBe(true));
  test.each(pages.map((p) => p.slug))("%s", (slug) => expect(existsSync(`dist/${slug}/index.html`)).toBe(true));
});

describe.each(pages)("$slug", (p: PageDef) => {
  const html = read(p.slug);

  test("graphics are in page order", () => {
    expect([...html.matchAll(/data-grafico="(\w+)"/g)].map((m) => m[1])).toEqual(p.graphics);
  });
  test.each(p.graphics)("graphic %s is server-rendered with its default plot", (g) => {
    const figure = graphicFigures(html).find((f) => f.name === g)?.figure ?? "";
    const svgs = [...figure.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((m) => m[0]);
    expect(svgs.length).toBeGreaterThan(0);
    expect(svgs.some((s) => /<path[^>]* d="M/.test(s))).toBe(true);
  });
  test("no placeholder left", () => expect(html).not.toContain("GRAFICO:"));
  test("shows exactly its diagrams", () => {
    expect(html.match(/<figure class="diagrama"/g)?.length ?? 0).toBe(p.diagrams.length);
  });
  test("has no formula error", () => expect(html).not.toContain("katex-error"));
  // The banner follows the data: the built page shows it if and only if the front matter of its MDX
  // file has the `banner` line, so approving a page (removing that line) needs no change here.
  test("shows the pending-review banner if and only if its front matter has the banner line", () => {
    const front = /^---\n([\s\S]*?)\n---/.exec(readFileSync(`src/content/docs/${p.slug}.mdx`, "utf8"))?.[1] ?? "";
    expect(html.includes(BANNER)).toBe(/^banner:/m.test(front));
  });
});

describe("whole site", () => {
  const files = htmlFiles("dist");
  const all = files.map((f) => readFileSync(f, "utf8")).join("\n");
  test("sidebar lists the 12 pages in order, numbered", () => {
    expect(sidebarLabels(read(pages[0].slug))).toEqual(pages.map((p, i) => `${pageNumber(i)} · ${p.title}`));
  });
  test("home page lists the 12 pages in order with their numbers", () => {
    const html = readFileSync("dist/index.html", "utf8");
    const items = [...html.matchAll(/<span class="numero">([^<]*)<\/span><a href="([^"]*)">([^<]*)<\/a>/g)];
    expect(items.map((m) => [m[1], m[2], m[3]])).toEqual(
      pages.map((p, i) => [`${pageNumber(i)} · `, `/${p.slug}/`, p.title]),
    );
  });
  test("every href and src that starts with / resolves to a file in dist", () => {
    const missing: string[] = [];
    for (const file of files) {
      const html = readFileSync(file, "utf8");
      for (const m of html.matchAll(/\b(?:href|src)="(\/(?!\/)[^"]*)"/g)) {
        const path = decodeURIComponent(m[1].split(/[?#]/)[0]);
        const target = path.endsWith("/") ? `dist${path}index.html` : `dist${path}`;
        if (!existsSync(target) || statSync(target).isDirectory()) missing.push(`${file}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });
  test("no Mermaid", () => expect(all).not.toMatch(/mermaid/i));
  test("no owner name", (ctx) => {
    const git = (key: string) => {
      try {
        return execSync(`git config ${key}`, { encoding: "utf8" }).trim();
      } catch {
        return "";
      }
    };
    const name = git("user.name");
    const email = git("user.email");
    const split = (s: string) => s.split(/[\s._\-+@]+|(?<=[a-z])(?=[A-Z])/).filter((w) => w.length > 3);
    const needles = [...new Set([...split(name), ...split(email.split("@")[0] ?? ""), name, email.split("@")[0] ?? ""])]
      .filter((n) => n.length > 3)
      .map((n) => n.toLowerCase());
    if (needles.length === 0) return ctx.skip("git user.name and user.email are empty: nothing to search for");
    const lower = all.toLowerCase();
    for (const n of needles) expect(lower, "owner name part found in the built site").not.toContain(n);
  });
});
