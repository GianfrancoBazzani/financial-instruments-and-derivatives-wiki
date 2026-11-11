# Derivados Financieros Wiki Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static Spanish study website with one page per note (12 pages), 12 static diagrams, and 21 interactive graphics, in the colours of the Hespérides website.

**Architecture:** Astro + Starlight renders MDX pages to static HTML. One ordered page list (`site/pages.ts`) is the single source for order, numbers, titles, slugs, and the expected diagrams and graphics of each page. Financial calculations are pure TypeScript functions in `src/lib/finance/`; React components in `src/components/graficos/` draw them as SVG and hydrate as Astro islands. The English snapshot of the notes is committed in `source/en/`, and permanent tests compare each Spanish page with it.

**Tech Stack:** Node 24, pnpm, Astro, Starlight, MDX, `remark-math` + `rehype-katex`, React, `d3-scale`, `d3-shape`, TypeScript, Vitest (+ Testing Library, jsdom), Playwright, `starlight-links-validator`, `@fontsource-variable/source-sans-3`. Use the latest stable versions at execution time and read the current Starlight documentation before Task 1; this plan names Starlight features, not version-specific syntax.

**Spec:** `docs/superpowers/specs/2026-11-11-derivados-financieros-wiki-design.md` — executors read it first. Section numbers below (§) refer to it.

## Global Constraints

- Work on a branch `sitio-inicial`, never directly on `main`. Do not push and do not deploy; both need the explicit approval of the owner.
- Source snapshot: repository `GianfrancoBazzani/my-public-obsidian-vault`, folder `Finance/financial-instruments-and-derivatives`, commit `627bb65c932601a19f45d2d83c7b9f99169740dd`.
- All reader-facing text is Spanish of Spain; `lang="es"`. Code identifiers are English.
- Numbers keep the source format: decimal point, comma as thousands separator, `€60M`, `ACT/360` (§8.1).
- Formulas are not changed; only words in `\text{…}` are translated (§8.1).
- Colours: yellow `#FFCD00`, black `#0B0B0B`, navy `#060B19`, white `#FFFFFF`. Dark theme is the default. Text contrast ≥ 4.5:1; series colours ≥ 3:1 (§6.2, §9.1).
- No logo of the university. Each page shows exactly: `Apuntes no oficiales elaborados por un alumno. No es material oficial de la Universidad de las Hespérides.` The name of the owner appears nowhere on the site (§6.1).
- No request to a third-party host at run time (§11). Do not download anything from the Hespérides website.
- No Mermaid runtime, no chart framework, no animation except the direct response of a graphic (§6.4, §8.3, §10).
- A graphic never shows `NaN`, `Infinity`, `-0`, or an empty plot (§9.1).
- The pages contain no theory that the notes do not contain (§4).
- Commands: `pnpm test` (Vitest), `pnpm build`, `pnpm check:site` (tests on `dist/`), `pnpm test:e2e` (Playwright on `pnpm preview`).

## Review Focus

1. **Slider extremes.** Yield 0%, minimum maturity, ρ = ±1, σ_F at its minimum, a strike far from the forward: the reader expects a finite number and a drawn curve. → Tasks 17–24 (library edge tests) and Task 25 (`fmt` test, extremes sweep helper used by Tasks 26–35).
2. **Text that MDX reads as code.** `{`, `<`, and `\$` amounts in translated prose can break the build or silently turn text into a formula. → Task 3 (inline-formula set check catches a `\$` that became math) and Task 1 (smoke page contains `\$100`, `<`, `{`).
3. **Long formulas and wide tables on a 360 px screen.** The reader expects the formula or table to scroll inside its own box, not the whole page. → Task 2 (CSS) and Task 36 (Playwright overflow test on all pages).
4. **Light theme.** A yellow line on white is invisible. → Task 2 (contrast test for series tokens in both themes).
5. **No JavaScript, or before hydration.** The reader expects the default plot, not an empty box. → Task 36 (`check:site` asserts an `<svg>` inside each graphic in the built HTML).

---

## File Structure

```
astro.config.ts                 Starlight config; sidebar generated from site/pages.ts
site/pages.ts                   Ordered page list (single source of truth)
source/en/*.md, Attachments/    English snapshot (not published)
docs/glosario-traduccion.md     English → Spanish term list
docs/excepciones-traduccion.md  Deliberate differences from the snapshot, with reasons
docs/discrepancias-redondeo.md  Read-outs that differ from the text because of rounding
src/content/docs/index.mdx      Home page
src/content/docs/<slug>.mdx     One file per page
src/assets/diagramas/*.svg      Static diagrams (Spanish, theme colours)
src/components/Diagrama.astro   Inlines one static diagram
src/components/Footer.astro     Starlight footer + unofficial-notes text
src/components/IndiceApuntes.astro  Numbered index for the home page
src/styles/tema.css             Theme tokens (Starlight variables + --g-* series tokens)
src/lib/finance/{bonds,curves,forwards,hedging,rates,swaps,options,repo}.ts
src/components/graficos/kit/    ChartFrame, Slider, Readout, Plot, Series, useParams, fmt
src/components/graficos/<Name>.tsx   One file per graphic (21)
tools/translation-check.ts      Compares a page with its source note
tools/contrast.ts               WCAG contrast ratio
tests/                          Vitest tests (unit, translation, theme, dist) and e2e/
```

## Shared interfaces

`site/pages.ts` (created in Task 3, read by every later task):

```ts
export interface PageDef {
  source: string;        // file name in source/en, e.g. "00-fixed-income-securities.md"
  slug: string;          // e.g. "renta-fija"
  title: string;         // Spanish title
  diagrams: string[];    // names (no extension) of static diagrams kept on the page
  graphics: string[];    // component names of the interactive graphics, in page order
}
export const SOURCE_COMMIT = "627bb65c932601a19f45d2d83c7b9f99169740dd";
export const pages: PageDef[];                 // in site order
export const pageNumber = (i: number) => String(i).padStart(2, "0");
```

Contents of `pages` (titles and slugs from the spec §2):

| # | slug | diagrams | graphics |
| --- | --- | --- | --- |
| 00 | `renta-fija` | — | `PriceYield`, `CleanDirtyPrice`, `MacaulayDuration`, `DurationConvexityApprox` |
| 01 | `tipos-de-interes` | — | — |
| 02 | `curvas-de-tipos` | `example-zero-rates-discount-factors`, `forward-rate-timeline` | `ZeroParForwardCurves`, `CarryRollDown` |
| 03 | `mercados-activos-y-operadores` | — | — |
| 04 | `futuros-y-forwards` | `futures-daily-settlement-timeline` | `ForwardPayoff`, `DailySettlement` |
| 05 | `valoracion-de-futuros-y-forwards` | `interest-rate-parity` (new, from the Mermaid flowchart) | `ForwardValue`, `ForwardPrice` |
| 06 | `cobertura-con-futuros` | — | `BasisRisk`, `MinVarianceHedge` |
| 07 | `fras-y-futuros-de-tipos` | `fra-libor-vs-sofr-timeline`, `conversion-factor-whole-periods`, `conversion-factor-3-month-offset`, `cheapest-to-deliver-yields`, `sofr-futures-bootstrap-timeline` | `FraPayoff`, `ConversionFactor` |
| 08 | `swaps` | `swap-transform-liability`, `swap-transform-asset`, `ccs-cash-flows` | `ParSwapRate`, `SwapValue` |
| 09 | `swaps-no-estandar` | — | `CapFloorCollarPayoff`, `SabrSmile`, `CmsVsSwap` |
| 10 | `repos` | — | `RepoHaircutCarry` |
| 11 | `strips` | — | `StripPrice` |

The executor of Task 3 confirms with `grep` which note embeds each diagram and corrects the table if a diagram is on a different page. The six removed SVGs are `dirty-vs-clean-price`, `duration-convexity-approximation`, `zero-vs-par-rates`, `basis-risk-early-close-out`, `swap-payer-vs-receiver-convexity`, `cms-vs-vanilla-swap-payoff`.

**Graphic placeholder.** Until a graphic is built, its place in the MDX holds the comment `{/* GRAFICO: <Name> */}`. It renders nothing. The graphics task replaces it with `<Name client:visible />`.

---

### Task 1: Project scaffold and content pipeline

**Files:**
- Create: `package.json`, `astro.config.ts`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `src/content.config.ts`, `src/content/docs/index.mdx`, `src/content/docs/prueba.mdx` (temporary), `src/components/graficos/Smoke.tsx` (temporary)
- Test: `tests/dist/smoke.test.ts`

**Interfaces:**
- Produces: scripts `test`, `build`, `preview`, `check:site`, `test:e2e`; a Starlight site with Spanish as the root locale, `remark-math`/`rehype-katex`, the React integration, and `starlight-links-validator`. `check:site` runs the Vitest files under `tests/dist/` (they read `dist/`).

- [ ] **Step 1:** Create branch `sitio-inicial`. Scaffold Astro + Starlight with pnpm in the repository root (keep `.agents/`, `.claude/`, `skills-lock.json`, `docs/`). Add the integrations and packages of the Tech Stack line.
- [ ] **Step 2:** Configure Starlight: `title: "Derivados Financieros"`, root locale `es` (label `Español`), no social links, links validator plugin, KaTeX stylesheet imported from the installed package (not a CDN).
- [ ] **Step 3:** Write `src/content/docs/prueba.mdx` with: one display formula `$$P=\sum_{t=1}^{n} \frac{CF_t}{(1+y)^t}$$`, one inline formula `$e^{-y t}$`, the prose `Un principal de \$100 millones, con x < y y el conjunto {a, b}.` (escaped as MDX requires), one table, one `:::note` aside, and `<Smoke client:visible />` (a React component that renders `<figure data-grafico="Smoke"><svg/></figure>`).
- [ ] **Step 4: Write the failing test** `tests/dist/smoke.test.ts`:

```ts
const html = readFileSync("dist/prueba/index.html", "utf8");
test("lang is es", () => expect(html).toMatch(/<html[^>]*lang="es"/));
test("display and inline math rendered by KaTeX", () =>
  expect(html.match(/class="katex"/g)!.length).toBeGreaterThanOrEqual(2));
test("escaped dollar is text, not math", () => expect(html).toContain("$100 millones"));
test("braces and < survive", () => { expect(html).toContain("{a, b}"); expect(html).toContain("x &lt; y"); });
test("island is server-rendered", () => expect(html).toMatch(/data-grafico="Smoke"[\s\S]*?<svg/));
```

- [ ] **Step 5:** Run `pnpm build && pnpm check:site`. Expected: PASS, and the build prints no link warning.
- [ ] **Step 6:** Commit: `chore: scaffold Astro Starlight site with math and React`.

### Task 2: Theme, typography, footer, and home page

**Files:**
- Create: `src/styles/tema.css`, `src/components/Footer.astro`, `src/components/IndiceApuntes.astro`, `tools/contrast.ts`
- Modify: `astro.config.ts` (`customCss`, `components.Footer`), `src/content/docs/index.mdx`
- Test: `tests/theme.test.ts`, `tests/dist/shell.test.ts`

**Interfaces:**
- Produces: `contrastRatio(hexA: string, hexB: string): number` in `tools/contrast.ts`.
- Produces CSS custom properties in `tema.css`, each defined for the dark theme (`:root`) and the light theme (`:root[data-theme='light']`): the Starlight variables (`--sl-color-accent*`, `--sl-color-black`, `--sl-color-white`, `--sl-color-gray-1…6`, `--sl-font`) and the series tokens `--g-main`, `--g-b`, `--g-c`, `--g-muted`, `--g-grid`. Diagrams and graphics use only these tokens and `currentColor`.

- [ ] **Step 1: Write the failing tests.** `tests/theme.test.ts` parses the two blocks of `tema.css` and asserts:

```ts
// both themes
expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(4.5);       // --sl-color-white on --sl-color-black
expect(contrastRatio(secondaryText, bg)).toBeGreaterThanOrEqual(4.5); // --sl-color-gray-2
expect(contrastRatio(linkText, bg)).toBeGreaterThanOrEqual(4.5);   // --sl-color-accent-high
for (const s of ["--g-main", "--g-b", "--g-c"]) expect(contrastRatio(v(s), bg)).toBeGreaterThanOrEqual(3);
// dark theme only
expect(v("--sl-color-black").toUpperCase()).toBe("#060B19");
expect(v("--g-main").toUpperCase()).toBe("#FFCD00");
// fixed pair
expect(contrastRatio("#0B0B0B", "#FFCD00")).toBeGreaterThanOrEqual(4.5);
test("contrastRatio", () => expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1));
```

`tests/dist/shell.test.ts` asserts for every `dist/**/index.html`: contains the unofficial-notes sentence of Global Constraints verbatim; contains no `src`/`href` to another host (`/(src|href)="https?:\/\//` matches nothing except links inside `<main>`); and for `dist/index.html`: contains `Derivados Financieros`, `Máster en Finanzas Cuantitativas y Métodos Computacionales`, `Universidad de las Hespérides`.

- [ ] **Step 2:** Run `pnpm test`. Expected: FAIL (`tema.css` missing).
- [ ] **Step 3:** Write `tema.css`: dark default with navy background and yellow accent; light theme with white background, black text, and dark link text with a yellow underline; greys derived from the navy; a thin yellow rule on the header; Source Sans 3 variable font from `@fontsource-variable/source-sans-3`; `font-variant-numeric: tabular-nums` on tables; `overflow-x: auto` on `.katex-display` and on tables so that they scroll inside their own box.
- [ ] **Step 4:** Write `Footer.astro` (default Starlight footer plus the unofficial-notes sentence). Write `index.mdx` (splash template, hidden from the sidebar): title, the master and university line, the sentence, and `<IndiceApuntes />`, which lists every page of `site/pages.ts` that exists, as `NN · Título` with its `description`.
- [ ] **Step 5:** Run `pnpm test && pnpm build && pnpm check:site`. Expected: PASS.
- [ ] **Step 6:** Look at the home page and `prueba` in both themes with `pnpm preview`; correct what breaks §6.4. Commit: `feat: Hespérides theme, footer notice, and home page`.

### Task 3: Source snapshot, page list, translation checker, glossary

**Files:**
- Create: `source/en/*.md` (12), `source/en/Attachments/*.svg` (17), `site/pages.ts`, `tools/translation-check.ts`, `docs/glosario-traduccion.md`, `docs/excepciones-traduccion.md`
- Modify: `astro.config.ts` (sidebar from `pages`)
- Test: `tests/translation-check.test.ts`, `tests/translation.test.ts`

**Interfaces:**
- Produces `site/pages.ts` as in "Shared interfaces".
- Produces in `tools/translation-check.ts`:

```ts
export interface DocShape {
  displayFormulas: string[];   // normalised, in order
  inlineFormulas: string[];    // normalised, sorted
  tables: number[];            // body-row count of each table, in order
  headings: number[];          // count of headings at levels 1..4
  callouts: number;            // "> [!NOTE]" in source; ":::note" in MDX
  images: number;              // "![…](…)" in source; "<Diagrama" in MDX
  mermaid: number;             // mermaid fences (source only)
  graphics: string[];          // names in "<Name client:" and "GRAFICO: <Name>" (MDX only)
}
export function normaliseFormula(tex: string): string; // drop \text{…} content and all whitespace
export function shapeOfSource(md: string): DocShape;
export function shapeOfPage(mdx: string): DocShape;    // the frontmatter title counts as the level-1 heading
export function comparePage(def: PageDef, source: string, page: string, exceptions: string[]): string[]; // error messages
```

`comparePage` rules: display formulas equal in order; inline formulas equal as sets; `tables` equal; `headings` equal; `callouts` equal; page `images` = `def.diagrams.length`; source `images` + source `mermaid` = `def.diagrams.length` + number of removed SVGs on that page; page `graphics` = `def.graphics` in order. An error whose text appears in `docs/excepciones-traduccion.md` is dropped.

- [ ] **Step 1:** Download the 12 notes and 17 SVGs at `SOURCE_COMMIT` with `gh api "repos/…/contents/<path>?ref=<SOURCE_COMMIT>" -H "Accept: application/vnd.github.raw"`. Write `site/pages.ts`. Generate the Starlight `sidebar` in `astro.config.ts` from `pages`, label `` `${pageNumber(i)} · ${title}` ``, only for pages whose MDX file exists.
- [ ] **Step 2: Write the failing unit tests** `tests/translation-check.test.ts`:

```ts
expect(normaliseFormula("\\text{Interest} = 60M \\times 2\\%")).toBe("\\text{}=60M\\times2\\%");
expect(normaliseFormula("\\text{Interés} = 60M \\times 2\\%")).toBe("\\text{}=60M\\times2\\%");
const src = "# T\n\nPays \\$100 and $x$.\n\n$$\na = b\n$$\n\n$$c=d$$\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n> [!NOTE]\n> n\n\n![alt](Attachments/x.svg)\n";
expect(shapeOfSource(src)).toMatchObject({ displayFormulas: ["a=b", "c=d"], inlineFormulas: ["x"], tables: [1], headings: [1, 0, 0, 0], callouts: 1, images: 1 });
const page = "---\ntitle: T\n---\n\nPaga \\$100 y $x$.\n\n$$\na = b\n$$\n\n$$c=d$$\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n:::note\nn\n:::\n\n<Diagrama nombre=\"x\" alt=\"alt\" />\n\n{/* GRAFICO: PriceYield */}\n";
expect(shapeOfPage(page)).toMatchObject({ displayFormulas: ["a=b", "c=d"], inlineFormulas: ["x"], tables: [1], headings: [1, 0, 0, 0], callouts: 1, images: 1, graphics: ["PriceYield"] });
// a changed formula is reported
expect(comparePage(def, src, page.replace("c=d", "c=e"), [])).toHaveLength(1);
// an unescaped dollar that turns prose into math is reported
expect(comparePage(def, src, page.replace("\\$100 y $x$", "$100 y $x$"), []).length).toBeGreaterThan(0);
```

- [ ] **Step 3:** Run `pnpm test`; expected FAIL. Implement `tools/translation-check.ts`; run; expected PASS.
- [ ] **Step 4:** Write `tests/translation.test.ts`: for each `PageDef` whose MDX exists, `expect(comparePage(...)).toEqual([])`; one more test, skipped until Task 36, asserts that all 12 exist. Run `shapeOfSource` one time on the 12 real notes and print the counts. Read the output for a parser error: an odd number of `$$`, a note with no display formula where the note has some (notes 06 and 08 use multi-line `$$` blocks), or a `\$` amount counted as a formula.
- [ ] **Step 5:** Write `docs/glosario-traduccion.md` with the terms of §8.1 as a two-column table (English, Spanish), and `docs/excepciones-traduccion.md` with a header and no entry.
- [ ] **Step 6:** `pnpm test && pnpm build`. Commit: `feat: source snapshot, page list, and translation checker`.

### Task 4: Static diagram component

**Files:**
- Create: `src/components/Diagrama.astro`, `src/assets/diagramas/.gitkeep`
- Test: `tests/diagrams.test.ts`

**Interfaces:**
- Produces: `<Diagrama nombre="forward-rate-timeline" alt="…" />` — inlines `src/assets/diagramas/<nombre>.svg` inside `<figure class="diagrama">` with `role="img"` and `aria-label={alt}`; fails the build if the file does not exist.

- [ ] **Step 1: Write the failing test** `tests/diagrams.test.ts`, for each `*.svg` in `src/assets/diagramas/`: has a `viewBox`; has no `width`/`height` attribute on the root; contains no `<rect` that covers the full viewBox with a fill; every `fill`/`stroke` value is `none`, `currentColor`, or `var(--g-…)`; contains no `font-family` attribute. A second test: every name in `pages[*].diagrams` whose page exists has a file.
- [ ] **Step 2:** Implement `Diagrama.astro` (`import.meta.glob` with `?raw`, `set:html`). CSS: `max-width: 100%`, text uses the site font and `fill: currentColor`.
- [ ] **Step 3:** `pnpm test && pnpm build`. Commit: `feat: Diagrama component and diagram lint`.

---

### Tasks 5–16: Translate the pages

One task per page, in site order. Each task follows this procedure.

**Files (per task):**
- Create: `src/content/docs/<slug>.mdx`, `src/assets/diagramas/<name>.svg` for each name in `diagrams`
- Modify: `docs/glosario-traduccion.md` (new terms)
- Test: `tests/translation.test.ts`, `tests/diagrams.test.ts` (already written)

**Procedure:**

- [ ] **Step 1:** Read `source/en/<source>`, the glossary, and §8 of the spec.
- [ ] **Step 2:** Write the MDX file. Frontmatter: `title` (from `pages`), `description` (one Spanish sentence), `banner: { content: "Traducción pendiente de revisión" }`, and a comment line `{/* Fuente: <source> @ <SOURCE_COMMIT> */}` below the frontmatter. Drop the `# Title` line of the note. Translate every paragraph, list, table, and heading. Copy every formula byte for byte, except words in `\text{…}`.
- [ ] **Step 3:** Convert the syntax: `> [!NOTE]` → `:::note`; links `](NN-name.md)` → `](/<slug>/)`; anchors → the anchor of the translated heading (same page and other pages); `\$` stays `\$`; escape `{`, `}`, `<` in prose; keep `<br>`, `<sub>`, `<sup>` as valid JSX.
- [ ] **Step 4:** For each kept diagram: copy the SVG from `source/en/Attachments/`, translate the labels, remove the background rectangle, the root `width`/`height`, and `font-family`, and map each colour to `currentColor` or a `--g-*` token. Embed it with `<Diagrama nombre alt>` where the image was, with the translated alt text.
- [ ] **Step 5:** For each name in `graphics`: put `{/* GRAFICO: <Name> */}` at the place given in the table of Tasks 26–35. Where it replaces a static chart, rewrite the sentences that describe that chart so that they describe the default state of the graphic without colour names (§8.1).
- [ ] **Step 6:** Add new term pairs to the glossary. Use the existing pair when one exists.
- [ ] **Step 7:** Run `pnpm test`. Expected: `translation.test.ts` and `diagrams.test.ts` PASS for this page.
- [ ] **Step 8:** Run `pnpm build`. Expected: no error and no broken link or anchor. (A link to a page that does not exist yet is reported by the validator; translate in site order and, for a forward link, add the target slug to the validator's `exclude` list with a comment, then remove the entry in the task that creates the target.)
- [ ] **Step 9:** Read the built page next to the source, paragraph by paragraph: nothing omitted, nothing added, every number equal. View every diagram in both themes.
- [ ] **Step 10:** Commit: `feat(content): translate <slug>`.

| Task | Page | Notes for this page |
| --- | --- | --- |
| 5 | 00 `renta-fija` | Largest page (647 lines, about 75 display formulas). Two charts are replaced by graphics. |
| 6 | 01 `tipos-de-interes` | — |
| 7 | 02 `curvas-de-tipos` | Two diagrams kept; `zero-vs-par-rates` replaced. |
| 8 | 03 `mercados-activos-y-operadores` | — |
| 9 | 04 `futuros-y-forwards` | One diagram kept. |
| 10 | 05 `valoracion-de-futuros-y-forwards` | Draw `interest-rate-parity.svg` by hand from the Mermaid flowchart (same four boxes and arrows, Spanish labels). Delete the fence. |
| 11 | 06 `cobertura-con-futuros` | `basis-risk-early-close-out` replaced. Display formulas here use multi-line `$$` blocks. |
| 12 | 07 `fras-y-futuros-de-tipos` | Five diagrams kept. Many `\$` amounts. Same-page anchors (`#payoff`, `#eurodollar-and-sofr-futures`). |
| 13 | 08 `swaps` | Three diagrams kept; `swap-payer-vs-receiver-convexity` replaced. Callouts. Anchor to `renta-fija#convexidad`. |
| 14 | 09 `swaps-no-estandar` | `cms-vs-vanilla-swap-payoff` replaced. |
| 15 | 10 `repos` | — |
| 16 | 11 `strips` | Remove the `exclude` entries that remain; un-skip the "all 12 pages exist" test. Delete `prueba.mdx`, `Smoke.tsx`, and `tests/dist/smoke.test.ts`. |

After Task 16 the site is a complete static translation and can be shown to the owner for reading (§10.1).

---

### Tasks 17–24: Calculation library

Each task: write the test file with the assertions below, run it (FAIL), implement the functions, run it (PASS), commit `feat(finance): <module>`. All rates are decimals (0.04 = 4%). `closeTo(a, d)` below means `expect(x).toBeCloseTo(a, d)`.

Shared type (in `bonds.ts`): `export type Comp = number | "continuous";` — a number is the compounding frequency per year.

#### Task 17: `src/lib/finance/bonds.ts` — test `tests/finance/bonds.test.ts`

```ts
export interface Bond { face: number; couponRate: number; maturity: number; frequency: 1 | 2 | 4 }
export function cashFlows(b: Bond, elapsed?: number): { t: number; cf: number }[]; // t = years from today
export function price(b: Bond, y: number, comp?: Comp, elapsed?: number): number;   // dirty price; comp defaults to b.frequency
export function accruedInterest(b: Bond, elapsed: number): number;
export function cleanPrice(b: Bond, y: number, comp: Comp, elapsed: number): number;
export function macaulayDuration(b: Bond, y: number, comp?: Comp): number;
export function modifiedDuration(b: Bond, y: number, comp?: Comp): number;
export function convexity(b: Bond, y: number, comp?: Comp): number;
export function moneyDuration(b: Bond, y: number, comp?: Comp): number;  // D_mod × P/100 × face
export function dv01(b: Bond, y: number, comp?: Comp): number;            // −moneyDuration × 0.0001
export function priceChange(b: Bond, y: number, dy: number, comp?: Comp): { linear: number; secondOrder: number; exact: number };
```

Assertions (bond `A = {face:100, couponRate:0.05, maturity:4, frequency:1}`, `S` = the same with `frequency:2`):

```ts
price(A, 0.04)            closeTo(103.630, 3)     macaulayDuration(A, 0.04) closeTo(3.7287, 3)
modifiedDuration(A, 0.04) closeTo(3.5853, 4)      convexity(A, 0.04)        closeTo(16.824, 2)
moneyDuration(A, 0.04)    closeTo(371.54, 1)      dv01(A, 0.04)             closeTo(-0.03715, 4)
price(S, 0.04)            closeTo(103.663, 3)     macaulayDuration(S, 0.04) closeTo(3.6817, 3)
modifiedDuration(S, 0.04) closeTo(3.61, 2)        convexity(S, 0.04)        closeTo(15.474, 2)
price(A, 0.04, "continuous") closeTo(103.329, 3)  convexity(A, 0.04, "continuous") closeTo(14.466, 2)
price(S, 0.04, "continuous") closeTo(103.512, 3)  convexity(S, 0.04, "continuous") closeTo(14.257, 2)
macaulayDuration(A, 0.04, "continuous") === modifiedDuration(A, 0.04, "continuous")
priceChange(A, 0.04, 0.002).exact closeTo(-0.007137, 5)  priceChange(A, 0.04, 0.02).exact closeTo(-0.068465, 5)
priceChange(A, 0.04, 0.02).linear closeTo(-0.071706, 5)  priceChange(A, 0.04, 0.02).secondOrder closeTo(-0.068341, 5)
// the 2-year 5% semiannual bond of the yield example (the note prints 97.97 and 96.11)
price({face:100, couponRate:0.05, maturity:2, frequency:2}, 0.06, "continuous") closeTo(97.975, 2)
price({face:100, couponRate:0.05, maturity:2, frequency:2}, 0.07, "continuous") closeTo(96.105, 2)
// identities and edges
price({...A, couponRate: 0.04}, 0.04) closeTo(100, 10)          // coupon = yield → par
price(A, 0) === 120                                             // zero yield: sum of cash flows
accruedInterest(A, 0.25) closeTo(1.25, 10)                      // 5 × 3/12
accruedInterest(A, 1) closeTo(0, 10)                            // on a coupon date
cleanPrice(A, 0.04, 1, 0.25) closeTo(price(A, 0.04, 1, 0.25) - 1.25, 10)
price({face:100, couponRate:0.03, maturity:10, frequency:2}, 0.05) closeTo(84.41, 2)
```

#### Task 18: `src/lib/finance/curves.ts` — test `tests/finance/curves.test.ts`

```ts
export type ZeroCurve = (t: number) => number;
export function discountFactor(r: number, t: number, comp: Comp): number;
export function parRate(zero: ZeroCurve, T: number, m: number, comp: Comp): number;      // coupons m per year
export function forwardRate(r1: number, t1: number, r2: number, t2: number, comp: Comp): number;
export function polyZeroCurve(level: number, slope: number, curvature: number): ZeroCurve; // level + slope·t + curvature·t²
export function carryRollDown(a: { couponRate: number; maturity: number; yieldNow: number; yieldAtHorizon: number; horizon: number }):
  { priceNow: number; priceNew: number; amortization: number; carry: number; rollDown: number; total: number }; // annual coupons, face 100
```

```ts
discountFactor(0.045, 2, 1) closeTo(0.9157, 4)   discountFactor(0.052, 5, 1) closeTo(0.7761, 4)
discountFactor(0.045, 2, "continuous") closeTo(0.9139, 4)  discountFactor(0.052, 5, "continuous") closeTo(0.7711, 4)
const z: ZeroCurve = t => ({1: 0.03, 2: 0.04, 3: 0.045} as any)[t];
parRate(z, 3, 1, 1) closeTo(0.04463, 4)          parRate(z, 3, 1, "continuous") closeTo(0.04564, 4)
forwardRate(0.03, 1, 0.04, 2, 1) closeTo(0.0501, 4)   forwardRate(0.04, 2, 0.045, 3, 1) closeTo(0.0551, 4)
forwardRate(0.03, 1, 0.04, 2, "continuous") closeTo(0.05, 10)
parRate(() => 0.04, 7, 1, 1) closeTo(0.04, 10)   // flat curve: par rate = zero rate
const c = carryRollDown({ couponRate: 0.05, maturity: 5, yieldNow: 0.045, yieldAtHorizon: 0.043, horizon: 1 });
c.priceNow closeTo(102.19, 1)  c.priceNew closeTo(102.52, 2)  c.amortization closeTo(-0.40, 2)
c.carry closeTo(0.0450, 4)     c.rollDown closeTo(0.0071, 4)  c.total closeTo(0.0521, 4)
```

#### Task 19: `src/lib/finance/forwards.ts` — test `tests/finance/forwards.test.ts`

```ts
export type Side = "long" | "short";
export function forwardPayoff(sT: number, k: number, side: Side): number;
export function forwardPrice(a: { spot: number; r: number; T: number; income?: number; q?: number; u?: number; y?: number }): number;
  // (spot − income) · e^{(r − q + u − y)·T}; income is a present value
export function forwardValue(a: { f0: number; k: number; r: number; T: number; side: Side }): number; // (f0 − k)·e^{−rT} for long
export interface MarginRow { day: number; price: number; dailyPnl: number; cumPnl: number; balance: number; variationMargin: number }
export function marginAccount(prices: number[], initial: number, maintenance: number, side: Side): MarginRow[];
  // balance is the value before the top-up; a top-up restores the initial margin and counts in the next day's balance
```

```ts
forwardPayoff(102, 100, "long") === 2            forwardPayoff(102, 100, "short") === -2
forwardPrice({ spot: 100, r: 0.05, T: 1 }) closeTo(105.127, 3)
forwardPrice({ spot: 100, r: 0.05, T: 1, q: 0.05 }) closeTo(100, 10)
forwardPrice({ spot: 100, r: 0.05, T: 0 }) === 100
forwardValue({ f0: 105.127, k: 100, r: 0.05, T: 1, side: "long" }) closeTo(4.877, 3)
forwardValue({ f0: 100, k: 100, r: 0.05, T: 1, side: "short" }) closeTo(0, 10)
const rows = marginAccount([100, 101, 99, 102], 3, 2.5, "long");
rows.map(r => r.balance)          toEqual([3, 4, 2, 6])
rows.map(r => r.variationMargin)  toEqual([0, 0, 1, 0])
rows.map(r => r.cumPnl)           toEqual([0, 1, -1, 2])
```

#### Task 20: `src/lib/finance/hedging.ts` — test `tests/finance/hedging.test.ts`

```ts
export function hedgedVariance(h: number, sigmaS: number, sigmaF: number, rho: number): number;
export function minVarianceHedgeRatio(rho: number, sigmaS: number, sigmaF: number): number;
export function effectivePrice(f1: number, b2: number): number;   // F1 + b2
```

```ts
minVarianceHedgeRatio(0.9, 0.03, 0.04) closeTo(0.675, 10)
hedgedVariance(0.675, 0.03, 0.04, 0.9) closeTo(0.03 ** 2 * (1 - 0.9 ** 2), 12)   // σ_S²(1 − ρ²)
hedgedVariance(0.5, 0.03, 0.04, 0.9) > hedgedVariance(0.675, 0.03, 0.04, 0.9)
minVarianceHedgeRatio(1, 0.03, 0.03) === 1       hedgedVariance(1, 0.03, 0.03, 1) closeTo(0, 12)
effectivePrice(2.20, 2.00 - 1.90) closeTo(2.30, 10)
```

#### Task 21: `src/lib/finance/rates.ts` — test `tests/finance/rates.test.ts`

```ts
export function fraPayoff(a: { notional: number; fixedRate: number; realizedRate: number; tau: number; side: "payFixed" | "receiveFixed" }): number; // at the end of the period
export function fraPayoffAtStart(a: /* same */): number;    // payoff / (1 + realizedRate·tau)
export function conversionFactor(couponRate: number, years: number, months: number): number;
```

`conversionFactor` algorithm (the two examples of note 07): the yield is 6% per year with semiannual compounding (3% per period). Round the maturity down to a multiple of 3 months. With `n` whole 6-month periods and coupon `c = couponRate·100/2`: if no 3 months remain, `CF = (Σ_{i=1..n} c/1.03^i + 100/1.03^n)/100`; if 3 months remain, `CF = ((c + Σ_{i=1..n} c/1.03^i + 100/1.03^n)/√1.03 − c/2)/100`.

```ts
fraPayoff({ notional: 100e6, fixedRate: 0.03, realizedRate: 0.035, tau: 0.25, side: "payFixed" }) closeTo(125000, 6)
fraPayoffAtStart({ notional: 100e6, fixedRate: 0.03, realizedRate: 0.035, tau: 0.25, side: "payFixed" }) closeTo(123916, 0)
fraPayoff({ ...same, side: "receiveFixed" }) closeTo(-125000, 6)
conversionFactor(0.10, 20, 2) closeTo(1.4623, 4)   conversionFactor(0.08, 18, 4) closeTo(1.2199, 4)
conversionFactor(0.06, 20, 0) closeTo(1, 10)       // 6% coupon → factor 1
```

#### Task 22: `src/lib/finance/swaps.ts` — test `tests/finance/swaps.test.ts`

```ts
export function annuity(zero: ZeroCurve, maturity: number, m: number, comp: Comp): number;      // Σ τ·DF(t_i), τ = 1/m
export function parSwapRate(zero: ZeroCurve, maturity: number, m: number, comp: Comp): number;   // (1 − DF(t_n))/A
export function swapValue(a: { notional: number; fixedRate: number; parRate: number; annuity: number; side: "payer" | "receiver" }): number; // L·A·(R_par − R_K)
export function flatSwapPnl(a: { notional: number; fixedRate: number; maturity: number; m: number; rate: number; side: "payer" | "receiver" }):
  { value: number; dv01Line: number };  // flat curve at `rate` compounded m times; dv01Line = L·A(fixedRate)·(rate − fixedRate), sign by side
```

```ts
const z: ZeroCurve = t => ({1: 0.03, 2: 0.04, 3: 0.045} as any)[t];
parSwapRate(z, 3, 1, 1) closeTo(0.04463, 4)                 // same as the par rate of note 02
parSwapRate(() => 0.043, 30, 1, 1) closeTo(0.043, 10)
const p = (rate: number) => flatSwapPnl({ notional: 100e6, fixedRate: 0.043, maturity: 30, m: 1, rate, side: "payer" });
p(0.043).value closeTo(0, 6)
p(0.053).value < p(0.053).dv01Line        p(0.033).value < p(0.033).dv01Line   // payer: below the line in both directions
p(0.053).value > 0
flatSwapPnl({ notional: 100e6, fixedRate: 0.043, maturity: 30, m: 1, rate: 0.053, side: "receiver" }).value closeTo(-p(0.053).value, 6)
```

#### Task 23: `src/lib/finance/options.ts` — test `tests/finance/options.test.ts`

```ts
export function capletPayoff(r: number, strike: number, notional: number, delta: number): number;
export function floorletPayoff(r: number, strike: number, notional: number, delta: number): number;
export function collarEffectiveRate(r: number, capStrike: number, floorStrike: number): number; // R − max(R−R_C,0) + max(R_F−R,0)
export function sabrImpliedVol(a: { f: number; k: number; t: number; alpha: number; beta: number; rho: number; nu: number }): number;
export function cmsConvexityAdjustment(a: { sF: number; sigma: number; t: number; tenor: number; m: number }): number; // ½·sF²·σ²·t·C/D_mod
export function payerSwapPayoffAtFixing(a: { sT: number; sF: number; tenor: number; m: number }): number; // A(sT)·(sT − sF), flat curve at sT, notional 1
```

`cmsConvexityAdjustment` takes `C` and `D_mod` from `bonds.ts` for a par bond with coupon `sF`, maturity `tenor`, frequency `m`, yield `sF`.

`sabrImpliedVol` — Hagan et al. (2002), lognormal volatility. With `g = (f·k)^((1−β)/2)` and `L = ln(f/k)`:

```
z = (ν/α)·g·L
x = ln( (√(1 − 2ρz + z²) + z − ρ) / (1 − ρ) )
A = α / ( g·(1 + (1−β)²/24·L² + (1−β)⁴/1920·L⁴) )
B = 1 + ( (1−β)²/24·α²/g² + ρβνα/(4g) + (2 − 3ρ²)/24·ν² )·t
σ = A·(z/x)·B          with z/x = 1 when |z| < 1e-8 (this covers k = f and ν = 0)
```

```ts
capletPayoff(0.035, 0.03, 10e6, 0.25) closeTo(12500, 6)     floorletPayoff(0.015, 0.02, 10e6, 0.25) closeTo(12500, 6)
capletPayoff(0.02, 0.03, 10e6, 0.25) === 0
collarEffectiveRate(0.05, 0.03, 0.02) closeTo(0.03, 10)     collarEffectiveRate(0.01, 0.03, 0.02) closeTo(0.02, 10)
collarEffectiveRate(0.025, 0.03, 0.02) closeTo(0.025, 10)
const base = { f: 0.03, t: 5, alpha: 0.035, beta: 0.5, rho: -0.3, nu: 0.4 };
sabrImpliedVol({ f: 0.03, k: 0.03, t: 5, alpha: 0.2, beta: 1, rho: 0, nu: 0 }) closeTo(0.2, 10)   // lognormal, no vol-of-vol → flat
sabrImpliedVol({ f: 0.03, k: 0.05, t: 5, alpha: 0.2, beta: 1, rho: 0, nu: 0 }) closeTo(0.2, 10)
Math.abs(sabrImpliedVol({ ...base, k: 0.03 }) - sabrImpliedVol({ ...base, k: 0.030001 })) < 1e-5    // continuous at the money
sabrImpliedVol({ ...base, k: 0.02 }) > sabrImpliedVol({ ...base, k: 0.04 })                         // ρ < 0 → downward skew
for (const k of [0.002, 0.01, 0.03, 0.08, 0.15]) Number.isFinite(sabrImpliedVol({ ...base, k })) === true
// the figures quoted in note 09 for a 10-year par bond at 3%
modifiedDuration({face:100, couponRate:0.03, maturity:10, frequency:1}, 0.03) closeTo(8.5, 1)
convexity(b10, 0.03) / modifiedDuration(b10, 0.03) closeTo(10.2, 1)
cmsConvexityAdjustment({ sF: 0.03, sigma: 0.2, t: 5, tenor: 10, m: 1 }) closeTo(0.5 * 0.03**2 * 0.2**2 * 5 * convexity(b10, 0.03) / modifiedDuration(b10, 0.03), 12)
payerSwapPayoffAtFixing({ sT: 0.03, sF: 0.03, tenor: 30, m: 1 }) === 0
// concave: the midpoint lies above the chord
payoff(0.03) > (payoff(0.02) + payoff(0.04)) / 2
```

#### Task 24: `src/lib/finance/repo.ts` — test `tests/finance/repo.test.ts`

```ts
export function repoInterest(cash: number, rate: number, days: number): number;   // ACT/360
export function cashLent(collateralValue: number, haircut: number): number;
export function collateralNeeded(cash: number, haircut: number): number;
export function repoCarry(bondYield: number, repoRate: number): number;
export const REPO_CURVE: { term: string; rate: number }[]; // 1D 2.8%, 1W 3.0%, 1M 3.2%, 3M 3.5%, 6M 3.8%
export function stripPrice(face: number, y: number, t: number): number;           // face/(1+y)^t
export function stripModifiedDuration(y: number, t: number): number;              // t/(1+y)
```

```ts
repoInterest(60e6, 0.02, 21) closeTo(70000, 6)     cashLent(100e6, 0.02) closeTo(98e6, 6)
collateralNeeded(60e6, 0.02) closeTo(61224489.8, 0)
repoCarry(0.034, 0.028) closeTo(0.006, 10)         repoCarry(0.034, 0.038) closeTo(-0.004, 10)
stripPrice(4, 0.03, 1) closeTo(3.88, 2)            stripPrice(100, 0.03, 3) closeTo(91.51, 2)
stripPrice(50000, 0.03, 5) closeTo(43130.44, 2)    stripPrice(100, 0, 30) === 100
4/1.03 + 4/1.03**2 + 4/1.03**3 + 100/1.03**3 closeTo(102.83, 2)   // via stripPrice
```

---

### Task 25: Chart kit

**Files:**
- Create: `src/components/graficos/kit/{ChartFrame,Slider,Readout,Plot,Series}.tsx`, `kit/useParams.ts`, `kit/fmt.ts`, `kit/kit.css`, `tests/graficos/helpers.tsx`
- Test: `tests/graficos/kit.test.tsx` (jsdom)

**Interfaces (Produces):**

```ts
// ChartFrame.tsx — <figure data-grafico={name}> with title, caption, plot, controls, read-outs, and the "Restablecer" button
interface ChartFrameProps { name: string; title: string; caption: string; controls: ReactNode; readouts: ReactNode; onReset(): void; children: ReactNode }
// Slider.tsx — a labelled native <input type="range">; the label text is "symbol name", the value shows next to it
interface SliderProps { symbol: ReactNode; label: string; value: number; min: number; max: number; step: number; format(v: number): string; onChange(v: number): void }
// Readout.tsx
interface ReadoutProps { symbol: ReactNode; label: string; value: string }
// Plot.tsx — SVG with axes, grid, and axis labels; measures its container (ResizeObserver); width 640 on the server
interface PlotProps { xDomain: [number, number]; yDomain: [number, number]; xLabel: string; yLabel: string;
  xFormat(v: number): string; yFormat(v: number): string; ariaLabel: string;
  children(s: { x: (v: number) => number; y: (v: number) => number; width: number; height: number }): ReactNode }
// Series.tsx — all take series: "main" | "b" | "c" | "muted" and use the --g-* tokens
function Line(p: { points: [number, number][]; x; y; series; dashed?: boolean; label?: string }): JSX.Element; // skips non-finite points
function Marker(p: { at: [number, number]; x; y; series; label?: string }): JSX.Element;
function Bars(p: { bars: { x: number; value: number }[]; x; y; series; width: number }): JSX.Element;
// useParams.ts
function useParams<T extends Record<string, number>>(defaults: T): { p: T; set(k: keyof T, v: number): void; reset(): void };
// fmt.ts — en-US format (decimal point, comma thousands); never returns "NaN", "Infinity", or "-0"
function num(v: number, decimals: number): string;   // non-finite → "—"
function pct(v: number, decimals: number): string;   // 0.045 → "4.50%"
function money(v: number, decimals?: number): string; // 125000 → "125,000"
// tests/graficos/helpers.tsx
function sweepExtremes(ui: ReactElement): void; // sets every slider to min, then max, then each in turn; after each change asserts no "NaN"/"Infinity"/"-0" in the text and at least one <path> with a non-empty d
function readout(label: string): string;         // text of the read-out with that label
function setSlider(label: string, value: number): void;
```

- [ ] **Step 1: Write the failing tests** `tests/graficos/kit.test.tsx`:

```ts
expect(num(1234.5, 2)).toBe("1,234.50");  expect(num(-0.0001, 2)).toBe("0.00");  expect(num(NaN, 2)).toBe("—");
expect(pct(0.045, 2)).toBe("4.50%");      expect(money(125000)).toBe("125,000");  expect(num(Infinity, 1)).toBe("—");
// a frame with one slider and one read-out
render(<Demo />);                                   // Demo: useParams({ a: 2 }), read-out "doble" = num(2·a, 1)
expect(readout("doble")).toBe("4.0");
setSlider("a", 5);  expect(readout("doble")).toBe("10.0");
await user.click(screen.getByRole("button", { name: "Restablecer" }));  expect(readout("doble")).toBe("4.0");
expect(screen.getByRole("slider", { name: /a/ })).toBeInTheDocument();  // keyboard and screen-reader access
expect(container.querySelector("figure[data-grafico='Demo'] svg")).not.toBeNull();
// Line drops non-finite points instead of drawing "NaN"
expect(lineD([[0, 1], [1, NaN], [2, 3]])).not.toContain("NaN");
```

- [ ] **Step 2:** Run (FAIL), implement, run (PASS). `kit.css`: controls in a grid that becomes one column below 480 px; read-outs with tabular figures; no transition.
- [ ] **Step 3:** Commit: `feat(graficos): chart kit`.

---

### Tasks 26–35: Graphics, one task per page

**Files (per task):**
- Create: `src/components/graficos/<Name>.tsx` for each graphic of the page
- Modify: `src/content/docs/<slug>.mdx` (import + replace each `{/* GRAFICO: <Name> */}` with `<Name client:visible />`), `docs/discrepancias-redondeo.md`
- Test: `tests/graficos/<Name>.test.tsx`

**Interfaces:**
- Consumes: the kit (Task 25) and the finance module named in the table (Tasks 17–24). A graphic contains no financial formula of its own.

**Procedure (per graphic):**

- [ ] **Step 1: Write the failing test**: render the component; assert each default read-out of the table with `readout(label)`; make one slider change and assert the read-out given in the "After a change" column; click "Restablecer" and assert the defaults again; call `sweepExtremes`.
- [ ] **Step 2:** Run (FAIL). Implement with `ChartFrame`. Title = the Spanish name in the table; caption = one Spanish sentence that names the formula, with the same symbols as the text. Slider symbols and read-out labels use the symbols of the note. Choose slider ranges so that `sweepExtremes` passes and the default sits inside the range.
- [ ] **Step 3:** Run (PASS). Replace the placeholder in the MDX. `pnpm test && pnpm build`.
- [ ] **Step 4:** View the page in both themes at 360 px and at desktop width. If a default read-out differs from a number printed in the text at the printed precision, add a line to `docs/discrepancias-redondeo.md` (page, graphic, text value, read-out value, cause).
- [ ] **Step 5:** Commit: `feat(graficos): <Name>`.

Read-out labels below are the Spanish labels to use. Values are formatted with `fmt`.

| Task / page | Graphic (Spanish title) — place | Library | Defaults | Default read-outs | After a change |
| --- | --- | --- | --- | --- | --- |
| 26 / 00 | `PriceYield` (Precio–rentabilidad) — in "Pricing of a Fixed-Income Security", after the list on the two effects | `bonds.price` | coupon 5%, maturity 4, frequency 1, y 4% | `Precio` 103.63 | y → 5%: `Precio` 100.00 |
| 26 / 00 | `CleanDirtyPrice` (Precio limpio y precio sucio) — replaces `dirty-vs-clean-price` | `price`, `cleanPrice`, `accruedInterest` | coupon 3%, frequency 2, maturity 10, y 5%, marker t = 0 | `Precio sucio` 84.41, `Cupón corrido` 0.00, `Precio limpio` 84.41 | t → 0.25: `Cupón corrido` 0.75 |
| 26 / 00 | `MacaulayDuration` (Duración de Macaulay) — in "Macaulay Duration", after the first worked example | `cashFlows`, `macaulayDuration`, `price` | bond A, y 4% | `Precio` 103.63, `D_Mac` 3.73 | frequency → 2: `D_Mac` 3.68 |
| 26 / 00 | `DurationConvexityApprox` (Aproximación por duración y convexidad) — replaces `duration-convexity-approximation` | `priceChange`, `modifiedDuration`, `convexity` | bond A, y 4%, Δy +2% | `D_Mod` 3.59, `C` 16.82, `Lineal` −7.17%, `Segundo orden` −6.83%, `Exacto` −6.85% | Δy → +0.2%: `Exacto` −0.71% |
| 27 / 02 | `ZeroParForwardCurves` (Curvas cupón cero, par y forward) — replaces `zero-vs-par-rates` | `polyZeroCurve`, `parRate`, `forwardRate` | slope +0.6% per year, curvature 0, level read from the source SVG, annual, marker T = 5 | `Tipo par` < `Tipo cero` < `Tipo forward` at T | slope → −0.6%: `Tipo par` > `Tipo cero` |
| 27 / 02 | `CarryRollDown` (Carry y roll-down) — in "Carry and Roll-Down", after the worked example | `carryRollDown` | coupon 5%, maturity 5, y(5) 4.5%, slope 0.2% per year, horizon 1 | `Carry` 4.50%, `Roll-down` 0.71%, `Total` 5.21% | slope → 0: `Roll-down` 0.00% |
| 28 / 04 | `ForwardPayoff` (Payoff de un forward) — after the two payoff formulas | `forwardPayoff` | K 100, marker S_T 102 | `Payoff largo` 2.00, `Payoff corto` −2.00 | K → 105: `Payoff largo` −3.00 |
| 28 / 04 | `DailySettlement` (Liquidación diaria) — after the margin example table | `marginAccount` | prices 100, 101, 99, 102; initial 3; maintenance 2.5 | `Saldo final` 6.00, `Resultado acumulado` 2.00, `Llamadas de margen` 1 | maintenance → 1.5: `Llamadas de margen` 0 |
| 29 / 05 | `ForwardValue` (Valor de un forward) — in "Forward Contract Valuation", after the two formulas | `forwardPrice`, `forwardValue` | K 100, r 5%, T 1, marker S 100 | `F_0` 105.13, `f largo` 4.88 | T → 0: `f largo` 0.00 |
| 29 / 05 | `ForwardPrice` (Precio forward) — in "Cost of Carry", after `F_0 = S_0 e^{(c−y)T}` | `forwardPrice` | S_0 100, r 5%, q 0, u 0, y 0, marker T 1 | `F_0` 105.13 | q → 5%: `F_0` 100.00 |
| 30 / 06 | `BasisRisk` (Riesgo de base) — replaces `basis-risk-early-close-out` | `effectivePrice` | S_1 2.50, F_1 2.20, b_2 0.10 | `Precio efectivo` 2.30 | b_2 → 0: `Precio efectivo` 2.20 |
| 30 / 06 | `MinVarianceHedge` (Ratio de cobertura de mínima varianza) — after `σ_V² = σ_S²(1 − ρ²)` | `hedgedVariance`, `minVarianceHedgeRatio` | ρ 0.9, σ_S 3%, σ_F 4% | `h*` 0.675, `Varianza residual` 19.0% of σ_S² | ρ → 1: `Varianza residual` 0.0% |
| 31 / 07 | `FraPayoff` (Payoff de un FRA) — in "Payoff", after the worked example | `fraPayoff`, `fraPayoffAtStart` | L 100,000,000, R_K 3%, τ 0.25, marker R_M 3.5%, pay fixed | `Pago al final` 125,000, `Pago al inicio` 123,916 | R_M → 3%: `Pago al final` 0 |
| 31 / 07 | `ConversionFactor` (Factor de conversión) — after Example 2 and its diagram | `conversionFactor` | coupon 10%, 20 years, 2 months | `Factor de conversión` 1.4623 | coupon 8%, 18 years, 4 months: 1.2199 |
| 32 / 08 | `ParSwapRate` (Tipo swap par) — in "Par Swap Rate", after the `R_par` formula | `annuity`, `parSwapRate`, `discountFactor` | linear zero curve level 3%, slope 0.5% per year, maturity 5, annual; table of DF(t_i) | `R_par` < zero rate at maturity | slope → 0: `R_par` 3.00% |
| 32 / 08 | `SwapValue` (Valor de un swap) — replaces `swap-payer-vs-receiver-convexity` | `flatSwapPnl` | R_K 4.30%, maturity 30, annual, L 100,000,000, marker rate 4.30% | `V pagador` 0, `V receptor` 0 | rate → 5.30%: `V pagador` > 0 and below `Aproximación DV01` |
| 33 / 09 | `CapFloorCollarPayoff` (Payoff de cap, floor y collar) — in "Collar", after the `R_eff` formula | `capletPayoff`, `floorletPayoff`, `collarEffectiveRate` | R_C 3%, R_F 2%, L 10,000,000, δ 0.25, marker R 3.5% | `Caplet` 12,500, `Floorlet` 0, `R_eff` 3.00% | R → 1.5%: `Floorlet` 12,500, `R_eff` 2.00% |
| 33 / 09 | `SabrSmile` (Sonrisa de volatilidad SABR) — end of "SABR model" | `sabrImpliedVol` | F 3%, T 5, α 0.035, β 0.5, ρ −0.3, ν 0.4 | `σ ATM` = `pct(sabrImpliedVol(k = f), 2)` | β → 1, ν → 0, α → 0.2: `σ ATM` 20.00% |
| 33 / 09 | `CmsVsSwap` (CMS frente a swap vanilla) — replaces `cms-vs-vanilla-swap-payoff` | `payerSwapPayoffAtFixing`, `cmsConvexityAdjustment` | tenor 30, annual, s_F and σ and T read from the source SVG and its text | `Ajuste de convexidad` > 0 (in bp) | σ → minimum: `Ajuste de convexidad` smaller |
| 34 / 10 | `RepoHaircutCarry` (Haircut y carry de un repo) — end of "Haircuts" | `cashLent`, `repoCarry`, `REPO_CURVE` | collateral 100,000,000, haircut 2%, bond yield 3.4%, term 1D | `Efectivo prestado` 98,000,000, `Carry` 0.60% | term → 6M: `Carry` −0.40% |
| 35 / 11 | `StripPrice` (Precio de un STRIP) — in "Pricing STRIPS", after the worked example | `stripPrice`, `stripModifiedDuration` | face 100, y 3%, T 3 | `Precio` 91.51, `D_Mod` 2.91 | T → 5: `Precio` 86.26 |

The caption of `SabrSmile` names the approximation: Hagan et al. (2002). `DailySettlement` has a button "Nueva trayectoria" that draws a random price path in the browser only; the server-rendered default is the path of the note.

The `DurationConvexityApprox` defaults are a known rounding case: the text prints −7.180% and −6.844%, computed from `D_Mod` rounded to 3.59. Record it in `docs/discrepancias-redondeo.md`.

---

### Task 36: Acceptance

**Files:**
- Create: `tests/dist/site.test.ts`, `tests/e2e/site.spec.ts`, `playwright.config.ts`
- Modify: `tests/translation.test.ts` (confirm the "all 12 exist" test runs), `README.md`

- [ ] **Step 1: Write the failing tests.** `tests/dist/site.test.ts`:

```ts
// 13 pages: "/" and one per PageDef
for (const p of pages) expect(existsSync(`dist/${p.slug}/index.html`)).toBe(true);
// each graphic is server-rendered with its default plot, in page order
for (const p of pages) {
  const html = read(p);
  expect([...html.matchAll(/data-grafico="(\w+)"/g)].map(m => m[1])).toEqual(p.graphics);
  for (const g of p.graphics) expect(html).toMatch(new RegExp(`data-grafico="${g}"[\\s\\S]*?<svg[\\s\\S]*?<path[^>]* d="M`));
  expect(html).not.toContain("GRAFICO:");
  expect(html.match(/class="diagrama"/g)?.length ?? 0).toBe(p.diagrams.length);
}
// sidebar order and numbers
expect(sidebarLabels(read(pages[0]))).toEqual(pages.map((p, i) => `${pageNumber(i)} · ${p.title}`));
// no university logo, no Mermaid, no owner name
expect(allHtml).not.toMatch(/mermaid/i);
expect(allHtml).not.toMatch(/Bazzani/i);
```

`tests/e2e/site.spec.ts`, for each page and for both themes at a 360 × 740 viewport:

```ts
expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
```

and on `/renta-fija/` at desktop width: focus the first slider of `PriceYield`, press `ArrowRight`, and expect the `Precio` read-out to change; with JavaScript disabled, expect the `PriceYield` `<svg>` to be visible.

- [ ] **Step 2:** `pnpm test && pnpm build && pnpm check:site && pnpm test:e2e`. Correct what fails (expected first failures: a wide formula or table that pushes the page at 360 px).
- [ ] **Step 3:** Write `README.md`: what the site is, the commands, how to add a note (add a `PageDef`, add the source file, follow the page procedure), and the three `docs/` files.
- [ ] **Step 4:** Check acceptance items 1–6 of §13 one by one and write the evidence (command and result) in the task report. Report `docs/discrepancias-redondeo.md` and `docs/excepciones-traduccion.md` to the owner.
- [ ] **Step 5:** Commit: `test: site acceptance checks`. Stop. Do not push or deploy.

**Owner actions after Task 36** (not agent tasks): read each page and approve it (the executor then removes the `banner` line of that page; §13 item 7); choose the host and approve the first deployment (§10).
