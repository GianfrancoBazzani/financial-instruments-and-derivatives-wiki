# Derivados Financieros — study website: design

Date: 2026-11-11
Status: draft, waits for the approval of the owner

Labels used in this document:

- **[Owner]** — the owner said this or approved it.
- **[Call]** — a decision made by the author of this document. The owner can reject it.

## 1. Intent

The owner studies the subject *Derivados Financieros* in the *Máster en Finanzas
Cuantitativas y Métodos Computacionales* of the *Universidad de las Hespérides*.
The owner wrote 12 study notes in English. The classmates study in Spanish.

The website gives the classmates the same notes in Spanish, one page per note,
with interactive graphics next to the important formulas. A classmate opens a
page, reads the theory, moves a slider, and sees how the formula behaves. **[Owner]**

Success: a classmate can study the full subject from the website alone, trusts
the numbers, and finds any topic in a few seconds.

## 2. Source material

- Repository: `GianfrancoBazzani/my-public-obsidian-vault`, folder
  `Finance/financial-instruments-and-derivatives`.
- Snapshot for the translation: commit `627bb65c932601a19f45d2d83c7b9f99169740dd`
  (2026-11-11).
- 12 Markdown notes in English (approximately 260 KB in total) and 17 SVG
  diagrams in `Attachments/`.
- Syntax in the notes: standard Markdown, display formulas (`$$…$$`), inline
  formulas (`$…$`), tables, 8 callouts (`> [!NOTE]`), a few `<br>`, `<sub>`,
  `<sup>` tags, one fenced Mermaid flowchart (in note 05), links between notes
  as `](NN-name.md)`, and links with anchors (to other notes and inside the
  same note). All 17 diagrams are embedded with standard Markdown image syntax
  and have alt text.
- The SVG diagrams have a white background rectangle, Helvetica text, and
  English labels.

| # | Source file | Spanish title **[Call]** | Slug **[Call]** |
| --- | --- | --- | --- |
| 00 | `00-fixed-income-securities.md` | Instrumentos de renta fija | `renta-fija` |
| 01 | `01-interest-rates.md` | Tipos de interés | `tipos-de-interes` |
| 02 | `02-interest-rates-curves.md` | Curvas de tipos de interés | `curvas-de-tipos` |
| 03 | `03-markets-assets-and-type-of-traders.md` | Mercados, activos y tipos de operadores | `mercados-activos-y-operadores` |
| 04 | `04-futures-and-forwards.md` | Futuros y forwards | `futuros-y-forwards` |
| 05 | `05-futures-and-forwards-pricing.md` | Valoración de futuros y forwards | `valoracion-de-futuros-y-forwards` |
| 06 | `06-hedging-strategies-using-futures.md` | Estrategias de cobertura con futuros | `cobertura-con-futuros` |
| 07 | `07-fras-and-interest-rate-futures.md` | FRAs y futuros sobre tipos de interés | `fras-y-futuros-de-tipos` |
| 08 | `08-swaps.md` | Swaps | `swaps` |
| 09 | `09-non-standard-swaps.md` | Swaps no estándar | `swaps-no-estandar` |
| 10 | `10-repos.md` | Repos | `repos` |
| 11 | `11-strips.md` | STRIPS | `strips` |

## 3. Goals

1. One page per note, 12 pages, in the order of the table above. **[Owner]**
2. All content in Spanish. **[Owner]**
3. Interactive graphics for the important formulas, with sliders for the
   inputs. Not each formula gets a graphic. **[Owner]**
4. A serious, technical, simple, and sober look that uses the colours of the
   Hespérides website. **[Owner]**
5. The title of the site is "Derivados Financieros", with the name of the
   master and of the university below it. **[Owner]**
6. Formulas render correctly and are identical to the source.
7. The site is a static site: fast, with no server and no accounts. **[Call]**

## 4. Non-goals

- No English version of the site. The English notes stay in the vault. **[Call]**
- No automatic synchronisation with the vault. After the translation, the
  Spanish files in this repository are the source of truth. **[Call]**
  The vault is still active (three draft notes exist there, and the 12 notes
  got corrections up to the snapshot day). The site is therefore prepared for
  manual growth, without automation **[Call]**:
  - The English snapshot of each note is committed to this repository, and
    each page records the vault commit that it was translated from.
  - One ordered list of pages is the single source for the order, the
    numbers, the titles, and the slugs. The number of a page comes from its
    position, and the slug contains no number, so a new note can go in the
    middle with no change to the addresses.
  - A new note, or a new version of a note, goes through the same procedure
    and the same checks as the first 12.
  - The checks of section 8.4 stay as permanent tests. A deliberate
    difference from the snapshot (for example a formula that the owner
    corrects in Spanish) is recorded in an exceptions file with its reason.
- No exercises, quizzes, comments, accounts, or analytics.
- No PDF export.
- No new theory. The pages contain what the notes contain. The only additions
  are the graphics and their short captions.

## 5. Anti-goals

The site fails, even if it works, when:

- A reader thinks that the university published it. **[Call]**
- A graphic shows a number that is different from the formula in the text.
- The translation changes a formula, a number, or the meaning of a sentence.
- The look is that of a marketing page: large animations, decoration, noise.
- A page is slow or hard to read on a telephone.

## 6. Identity and visual design

### 6.1 Relation to the university **[Call]**

- The site uses the colours of the Hespérides website. It does not use the
  logo of the university or copy its page layout.
- The footer of each page and the home page show this text:
  "Apuntes no oficiales elaborados por un alumno. No es material oficial de la
  Universidad de las Hespérides."
- The site does not show the name of the owner unless the owner asks for it.

### 6.2 Colours

Measured on the screenshot of the landing page supplied by the owner. The
values are approximate.

| Token | Value | Use |
| --- | --- | --- |
| Yellow | `#FFCD00` | Accent only |
| Black | `#0B0B0B` | Text on yellow and on light backgrounds; dark surfaces |
| Navy | `#060B19` | Page background in the dark theme |
| White | `#FFFFFF` | Text in the dark theme; page background in the light theme |

Rules **[Call]**:

- The dark theme (navy background, white text, yellow accent) is the default.
  A light theme is available with the standard switch of the documentation
  theme.
- Yellow is an accent: the active item of the navigation, links in the dark
  theme, the main curve of a graphic, a thin band or rule in the header. Yellow
  is never the colour of text on a white background. In the light theme, links
  and accents on white use black text with a yellow underline or yellow
  background.
- All text has a contrast ratio of 4.5:1 or more against its background.
- Neutral greys derive from the navy, not from pure grey.

### 6.3 Typography **[Call]**

- Text and headings: Source Sans 3 (the font of the landing page looks like
  Source Sans; this is a guess). The font files are hosted with the site.
- Numbers in tables and in the read-outs of the graphics: tabular figures.
- Code and inline numeric identifiers: a monospace companion (Source Code Pro
  or the default of the theme).
- Formulas: KaTeX default fonts.

### 6.4 Tone **[Owner: "serio y técnico pero simple y sobrio"]**

- Generous line height, a text column of a comfortable width, clear heading
  hierarchy.
- No hero images, no gradients, no decorative icons, no motion except the
  direct response of a graphic to its controls.
- Tables and formulas are the visual content. They get careful spacing.

## 7. Site structure

- **Home page** (`/`): the title "Derivados Financieros"; below it "Máster en
  Finanzas Cuantitativas y Métodos Computacionales · Universidad de las
  Hespérides"; a numbered index of the 12 pages with one line of description
  for each; the "unofficial notes" text.
- **12 content pages**, one per note, at `/<slug>/`.
- **Sidebar**: the 12 pages in order, with their numbers. **[Call]**
- **Table of contents** of the page on the right, from the `##` and `###`
  headings.
- **Previous / next** links at the bottom of each page.
- **Search** over all pages, in Spanish, with the built-in search of the
  documentation theme.
- All interface text is in Spanish ("Buscar", "En esta página", "Anterior",
  "Siguiente", and so on). The `lang` attribute is `es`.

## 8. Translation

### 8.1 Rules **[Call]**

- Spanish of Spain, in a neutral academic register. Where the notes say "we",
  the Spanish text uses the first person plural.
- Complete translation: no summary, no omitted paragraph, no added theory.
- Market terms that Spanish practitioners use in English stay in English:
  swap, forward, repo, FRA, cap, floor, collar, swaption, STRIPS, carry,
  roll-down, haircut, DV01, bootstrapping, spread, basis, par (as in "par
  rate" only where no settled Spanish term exists). At the first mention on
  each page, the Spanish meaning follows in parentheses where one exists, for
  example "swap (permuta financiera)".
- Terms with a settled Spanish form use it: bond → bono, yield → rentabilidad
  (TIR for yield to maturity), coupon → cupón, hedge → cobertura, short
  selling → venta en corto, zero rate → tipo cupón cero, forward rate → tipo
  forward, discount factor → factor de descuento, convexity → convexidad,
  duration → duración.
- One English term maps to one Spanish term on all pages. The builder keeps a
  term list in the repository (`docs/glosario-traduccion.md`) and applies it
  to all 12 pages.
- Numbers keep the format of the source: decimal point, the same currency
  notation (`€60M`), the same day-count names (`ACT/360`). This keeps the text,
  the formulas, and the graphics consistent and prevents copy errors.
- Formulas are not changed. The only permitted change in a formula is the
  translation of words in `\text{…}` (for example `\text{Interest}` →
  `\text{Interés}`). Symbols and subscripts stay as they are.
- Worked examples keep their numbers.
- One exception to "complete translation": where an interactive graphic
  replaces a static chart, the sentences that describe that chart (for example
  "the orange line is the linear approximation") are rewritten to describe the
  default state of the graphic. The theory in those sentences stays.

### 8.2 Conversion of syntax

- Each note becomes one MDX file. The `# Title` of the note becomes the title
  of the page.
- Links between notes point to the new slugs. The link with an anchor points
  to the translated heading anchor.
- `> [!NOTE]` callouts become the note/aside component of the theme.
- Alt texts of the images are translated.

### 8.3 Static diagrams

- A diagram that an interactive graphic replaces (see section 9.3) is removed.
- Each other diagram (11 of the 17) stays as a static SVG with these changes:
  Spanish labels, no white background rectangle, the font of the site, and
  colours that are legible in the dark theme and in the light theme. The SVG
  is inlined in the page so that it takes its colours from the theme. **[Call]**
- The Mermaid flowchart of note 05 (interest rate parity) becomes a static SVG
  diagram with the same content. The site does not load Mermaid. **[Call]**

### 8.4 Checks

For each page, an automatic check compares the page with its source note:

- the number of display formulas is the same;
- each display formula is identical after the removal of `\text{…}` content
  and whitespace;
- the inline formulas are the same set, after the same normalisation;
- the number of tables and the number of rows of each table are the same;
- the number of headings of each level and the number of callouts are the same;
- each internal link and each anchor resolves.

The owner reads the translation of each page before publication. The owner is
the subject expert; the check above only finds mechanical errors.

## 9. Interactive graphics

### 9.1 Behaviour of each graphic **[Call]**

Each graphic uses one common frame:

- a short title and a one-sentence caption that names the formula it shows;
- the plot;
- controls: sliders (native range inputs) with the symbol used in the formula,
  the name, the current value, and the unit;
- a read-out of the key results as numbers (for example price, duration,
  DV01), with the same symbols as the text;
- a "Restablecer" button that returns the default values.

Rules:

- The graphic is placed directly after the formula or the section that it
  illustrates.
- Where the note has a worked example, the default values of the graphic are
  the values of that example, so the read-out reproduces the numbers in the
  text.
- The graphic uses the same symbols, units, and conventions (compounding,
  day count) as the text around it.
- The graphic responds immediately to a control. No other animation.
- The default state renders in the static HTML, so a reader without JavaScript
  sees the default plot.
- The controls work with the keyboard and have labels for screen readers.
- The graphic fits a telephone screen 360 px wide without horizontal scroll.
- Colours come from the theme: yellow for the main series in the dark theme,
  the text colour for axes and labels, and a maximum of two more series
  colours that are distinct in both themes and for colour-blind readers. In
  the light theme a yellow line on white is not legible, so the main series
  uses a dark colour there. Each series colour has a contrast ratio of 3:1 or
  more against the background. A legend or direct labels identify each
  series; colour alone never does.
- The read-outs use exact calculations. Some numbers in the notes come from
  rounded intermediate values (for example −7.180% from a duration rounded to
  3.59, where the exact value is −7.171%). Where a default read-out differs
  from the number printed in the text for this reason, the read-out stays
  exact and the builder lists the case for the owner.
- No control position produces `NaN`, `Infinity`, or an empty plot.

### 9.2 Correctness

- All financial calculations live in one library of pure functions, separate
  from the drawing code.
- Each function has unit tests. Where the notes contain a worked example for
  the formula, a test reproduces the numbers of that example. Other tests use
  known identities (for example: a bond priced at a yield equal to its coupon
  rate has a price of par; the par rate of a flat zero curve equals the zero
  rate; a put-call parity relation holds).

### 9.3 First set of graphics **[Call]**

This list is the first release: 21 graphics. The builder can adjust the
controls of a graphic to match the exact formula in the note. The builder
does not add or remove a graphic without the approval of the owner.

Pages 01 (Tipos de interés) and 03 (Mercados, activos y operadores) are
descriptive and get no graphic.

| Page | Graphic | Shows | Controls | Replaces static SVG |
| --- | --- | --- | --- | --- |
| 00 | Precio–rentabilidad | Price of a bond against its yield, with the current point marked | coupon, maturity, coupon frequency, yield | — |
| 00 | Precio limpio y precio sucio | Dirty and clean price over the life of a bond | coupon, yield, maturity | `dirty-vs-clean-price` |
| 00 | Duración de Macaulay | Present value of each cash flow as a bar, with the duration as the balance point | coupon, maturity, yield | — |
| 00 | Aproximación por duración y convexidad | Exact relative price change against the first-order and second-order approximations | coupon, maturity, yield, Δy | `duration-convexity-approximation` |
| 02 | Curvas cupón cero, par y forward | The three curves derived from one zero curve | level, slope, curvature of the zero curve | `zero-vs-par-rates` |
| 02 | Carry y roll-down | A bond that moves down an unchanged curve over a horizon, with carry and roll-down as numbers | curve slope, maturity, horizon | — |
| 04 | Payoff de un forward | Payoff at maturity of a long and a short forward | delivery price K | — |
| 04 | Liquidación diaria | Margin account of a futures position along a price path, with margin calls | initial margin, maintenance margin, price path (new random path button) | — |
| 05 | Precio forward | Forward price against time to maturity | spot, rate, income or yield, storage cost, convenience yield | — |
| 05 | Valor de un forward | Value of an existing forward contract against the spot price | delivery price, rate, time to maturity | — |
| 06 | Ratio de cobertura de mínima varianza | Variance of the hedged position against h, with the minimum h* marked | ρ, σ_S, σ_F | — |
| 06 | Riesgo de base | Spot and futures prices that converge, and the basis at the close-out date | close-out date, basis volatility | `basis-risk-early-close-out` |
| 07 | Payoff de un FRA | Settlement amount of an FRA against the realised rate | FRA rate, notional, period length | — |
| 07 | Factor de conversión | Conversion factor of a deliverable bond against its coupon, with the current bond marked | coupon, years and months to maturity | — |
| 08 | Valor de un swap | P&L of a payer and a receiver swap against the swap rate, with the DV01 line | fixed rate, maturity, notional | `swap-payer-vs-receiver-convexity` |
| 08 | Tipo swap par | Par swap rate computed from a zero curve, with the discount factors as a table | level and slope of the zero curve, maturity | — |
| 09 | Payoff de cap, floor y collar | Payoff of a caplet, a floorlet, and a collar against the reference rate | cap strike, floor strike | — |
| 09 | Sonrisa de volatilidad SABR | Implied volatility against strike from the SABR approximation | α, β, ρ, ν, forward, expiry | — |
| 09 | CMS frente a swap vanilla | Payoff of a CMS and of a payer swap against the swap rate, with the convexity adjustment | maturity of the swap, volatility | `cms-vs-vanilla-swap-payoff` |
| 10 | Haircut y carry de un repo | Cash lent for a collateral value and a haircut; carry of a bond financed at each repo term | collateral value, haircut, bond yield, repo term | — |
| 11 | Precio de un STRIP | Price of a zero-coupon strip against maturity, and its sensitivity to the yield | yield, maturity | — |

The SABR graphic uses the standard approximation of Hagan et al. (2002) for
the implied Black volatility. The note says only that "the model gives an
approximate formula"; the caption of the graphic names the approximation.

Change after the first draft: the draft listed "Ajuste de convexidad" for
page 07. Note 07 gives no formula for the convexity adjustment `c`, so that
graphic needed theory that the notes do not contain (section 4). "Factor de
conversión" replaces it; it reproduces the two worked examples of the note
(1.4623 and 1.2199).

## 10. Technology **[Call]**

The owner gave no preference. These are the choices of the author.

- **Framework:** Astro with the Starlight documentation theme. It gives the
  sidebar, the table of contents, previous/next links, the search, the theme
  switch, and Spanish interface text without custom code, and it produces a
  static site.
- **Content:** MDX files, one per page, in the content collection of
  Starlight.
- **Formulas:** `remark-math` and `rehype-katex`, rendered at build time.
- **Graphics:** React components that Astro loads as islands and renders on
  the server for the default state. The plots are SVG drawn by the components
  with `d3-scale` and `d3-shape` for scales and paths. No chart framework.
- **Language:** TypeScript.
- **Tests:** Vitest for the calculation library and for the translation
  checks.
- **Package manager:** pnpm (installed on the machine of the owner, with
  Node 24).
- **Hosting:** the build output is static files and does not depend on a
  host. The proposal is Vercel. The first deployment is an outward action and
  needs the explicit approval of the owner. GitHub Pages is an alternative,
  but its project address contains the user name of the owner, which is
  against section 6.1.

### 10.1 Order of the work and partial release **[Call]**

The owner gave no date. The slow step is the owner reading 12 translated
pages, not the build. The work order therefore produces readable pages first:

1. the site shell and the theme;
2. the 12 translated pages with their static diagrams;
3. the calculation library and the graphics, page by page.

The site can go live after step 2, or at any later point. A page that the
owner did not approve yet shows a banner at the top: "Traducción pendiente de
revisión". The banner is removed when the owner approves the page. A place
where a graphic is planned but not built shows nothing.

## 11. Constraints

- The working repository is `financial-instruments-and-derivatives-wiki`
  (empty at the time of this document, except for agent configuration).
- The site makes no request to a third-party server at run time: fonts, KaTeX
  styles, and scripts are served from the site.
- The Hespérides website blocks automatic clients. The builder does not try to
  download assets from it.

## 12. Left to the builder

- The layout of the project folders and the names of the components.
- The exact greys, spacing, and font sizes within the rules of section 6.
- The axes ranges, slider ranges, and step sizes of each graphic.
- The one-line descriptions of the pages on the home page.
- The method of translation (order of pages, batching), within the rules of
  section 8.
- The form of the automatic checks of section 8.4.

## 13. Acceptance

The work is complete when:

1. The site builds with no error and no warning about broken links.
2. The 12 pages and the home page exist, in Spanish, in the specified order.
3. The checks of section 8.4 pass for all 12 pages.
4. The 21 graphics of section 9.3 exist, obey section 9.1, and the tests of
   section 9.2 pass.
5. Each page is legible in the dark theme and in the light theme, on a desktop
   screen and on a 360 px telephone screen.
6. The "unofficial notes" text shows on each page, and no logo of the
   university appears.
7. The owner read each translated page and approved it, and no page shows the
   "Traducción pendiente de revisión" banner.
