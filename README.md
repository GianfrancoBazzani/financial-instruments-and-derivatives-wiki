# Derivados Financieros

A static study website of unofficial notes for a master's subject on financial derivatives. It has a
home page, 12 notes translated into Spanish, 12 static diagrams, and 21 interactive graphics.
Built with Astro and Starlight (MDX, KaTeX formulas, React islands for the graphics). Dark is the
default theme.

The build output in `dist/` is static and host-independent.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server. |
| `pnpm build` | Builds the site into `dist/` (also validates internal links). |
| `pnpm preview` | Serves `dist/` locally. |
| `pnpm test` | Vitest: calculation library, graphics, translation checks, theme, diagrams. |
| `pnpm check:site` | Vitest on the built `dist/`. Run `pnpm build` first. |
| `pnpm test:e2e` | Playwright (Chromium) on `pnpm preview`. Run `pnpm build` first; install the browser once with `pnpm exec playwright install chromium`. |

## Layout

```
site/pages.ts                 Ordered page list: order, numbers, titles, slugs, diagrams, graphics
source/en/                    English snapshot of the notes (not published)
src/content/docs/             index.mdx and one <slug>.mdx per note
src/assets/diagramas/         Static diagrams (SVG)
src/lib/finance/              Pure TypeScript calculations behind the graphics
src/components/graficos/      One React component per graphic, plus kit/ (shared frame, slider, plot)
src/styles/tema.css           Theme tokens
tools/                        Translation checker, diagram lint, contrast ratio
tests/                        Unit, translation, dist (check:site) and e2e tests
docs/                         Translation documents (below)
```

## Add or update a note

1. Add or edit the `PageDef` in `site/pages.ts` (source file, slug, title, diagrams, graphics).
2. Put the English source in `source/en/`.
3. Translate it to `src/content/docs/<slug>.mdx`, following the page procedure of
   `docs/superpowers/plans/2026-11-11-derivados-financieros-wiki.md` and the glossary.
4. Run `pnpm test`, `pnpm build`, `pnpm check:site`, and `pnpm test:e2e`.

Display formulas use block form (`$$` alone on a line, the formula, `$$` alone). Write a dollar
amount in prose as `\$100`.

## Add a graphic

1. Write the calculation as a function in `src/lib/finance/`, with tests (include the slider extremes).
2. Build the component in `src/components/graficos/` from the kit.
3. Test it with the helpers in `tests/graficos/`.
4. Embed it in the page MDX (`<Name client:visible />`) and add its name to `graphics` in `site/pages.ts`.

## Documents in `docs/`

- `glosario-traduccion.md`: English to Spanish term list used by every page.
- `excepciones-traduccion.md`: deliberate differences between a page and its source note, with reasons.
- `discrepancias-redondeo.md`: read-outs of a graphic that differ from the note's text because of rounding.

## KaTeX version

The `katex` dependency must stay on the 0.16.x line that `rehype-katex` renders with. Do not
upgrade it: a mismatch with the stylesheet changes the size of subscripts (an e2e test checks this).

## Approving a page

Each page shows the banner "Traducción pendiente de revisión" until the owner approves it. To
approve a page, remove the `banner` lines from its front matter in `src/content/docs/<slug>.mdx`.
Nothing else changes: the dist test expects the banner exactly on the pages whose front matter has it.
