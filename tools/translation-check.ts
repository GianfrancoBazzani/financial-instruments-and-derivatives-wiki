import type { PageDef } from "../site/pages";

export interface DocShape {
  displayFormulas: string[]; // normalised, in order
  inlineFormulas: string[]; // normalised, sorted
  tables: number[]; // body-row count of each table, in order
  headings: number[]; // count of headings at levels 1..4
  callouts: number; // "> [!NOTE]" in source; ":::note" in MDX
  images: number; // "![…](…)" in source; "<Diagrama" in MDX
  mermaid: number; // mermaid fences (source only)
  graphics: string[]; // names in "<Name client:" and "GRAFICO: <Name>" (MDX only)
}

const TEXT_BLOCK = /\\text\{(?:[^{}]|\{[^{}]*\})*\}/g;

/** Drop the content of \text{…} and all whitespace. */
export function normaliseFormula(tex: string): string {
  return tex.replace(TEXT_BLOCK, "\\text{}").replace(/\s+/g, "");
}

const FENCE = /^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm;
const DISPLAY = /\$\$([\s\S]*?)\$\$/g;
const INLINE = /(?<!\\)\$((?:\\.|[^$\\\n])+)\$/g;

interface Parsed {
  prose: string; // text without fences, display math, and inline math
  display: string[];
  inline: string[];
  fences: string[];
}

function parse(text: string): Parsed {
  const fences: string[] = [];
  let rest = text.replace(FENCE, (m) => {
    fences.push(m);
    return "\n";
  });
  const display: string[] = [];
  rest = rest.replace(DISPLAY, (_, f: string) => {
    display.push(normaliseFormula(f));
    return "\n@@DISPLAY@@\n";
  });
  const inline: string[] = [];
  rest = rest.replace(INLINE, (_, f: string) => {
    inline.push(normaliseFormula(f));
    return "@@INLINE@@";
  });
  return { prose: rest, display, inline: inline.sort(), fences };
}

function countHeadings(prose: string): number[] {
  const counts = [0, 0, 0, 0];
  for (const line of prose.split("\n")) {
    const m = /^(#{1,4})\s+\S/.exec(line);
    if (m) counts[m[1].length - 1]++;
  }
  return counts;
}

/** Body-row count of each table: consecutive lines starting with "|", minus header and separator. */
function countTables(prose: string): number[] {
  const tables: number[] = [];
  let rows = 0;
  const flush = () => {
    if (rows > 0) tables.push(Math.max(rows - 2, 0));
    rows = 0;
  };
  for (const line of prose.split("\n")) {
    if (/^\s*\|/.test(line)) rows++;
    else flush();
  }
  flush();
  return tables;
}

export function shapeOfSource(md: string): DocShape {
  // Remove blockquote markers so that callout content is parsed like body text.
  const text = md.replace(/\r\n/g, "\n").replace(/^(?:>[ \t]?)+/gm, "");
  const { prose, display, inline, fences } = parse(text);
  const lines = prose.split("\n");
  return {
    displayFormulas: display,
    inlineFormulas: inline,
    tables: countTables(prose),
    headings: countHeadings(prose),
    callouts: lines.filter((l) => /^\[!\w+\]/.test(l)).length,
    images: (prose.match(/!\[[^\]]*\]\([^)]*\)/g) ?? []).length,
    mermaid: fences.filter((f) => /^(```|~~~)\s*mermaid/.test(f)).length,
    graphics: [],
  };
}

export function shapeOfPage(mdx: string): DocShape {
  let text = mdx.replace(/\r\n/g, "\n");
  let title = false;
  const fm = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (fm) {
    title = /^title:\s*\S/m.test(fm[1]);
    text = text.slice(fm[0].length);
  }
  const { prose, display, inline } = parse(text);
  const headings = countHeadings(prose);
  if (title) headings[0]++;
  const graphics: string[] = [];
  for (const m of prose.matchAll(/<(\w+)\s+client:|GRAFICO:\s*(\w+)/g)) graphics.push(m[1] ?? m[2]);
  return {
    displayFormulas: display,
    inlineFormulas: inline,
    tables: countTables(prose),
    headings,
    callouts: (prose.match(/^:::(?:note|tip|caution|danger)\b/gm) ?? []).length,
    images: (prose.match(/<Diagrama\b/g) ?? []).length,
    mermaid: 0,
    graphics,
  };
}

const ONE_LINE_DISPLAY = /(?<!\\)\$\$[^$\n]+\$\$/;

/** 1-based line numbers of one-line `$$…$$` formulas, outside code fences. */
function oneLineDisplayLines(mdx: string): number[] {
  const text = mdx
    .replace(/\r\n/g, "\n")
    .replace(FENCE, (m) => "\n".repeat(m.split("\n").length - 1));
  const lines: number[] = [];
  text.split("\n").forEach((line, i) => {
    if (ONE_LINE_DISPLAY.test(line)) lines.push(i + 1);
  });
  return lines;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function comparePage(
  def: PageDef,
  source: string,
  page: string,
  exceptions: string[],
): string[] {
  const s = shapeOfSource(source);
  const p = shapeOfPage(page);
  const errors: string[] = [];
  const err = (msg: string) => errors.push(`${def.slug}: ${msg}`);

  if (s.displayFormulas.length !== p.displayFormulas.length) {
    err(`display formulas: source ${s.displayFormulas.length}, page ${p.displayFormulas.length}`);
  } else {
    s.displayFormulas.forEach((f, i) => {
      if (f !== p.displayFormulas[i]) err(`display formula ${i + 1} differs: ${f} != ${p.displayFormulas[i]}`);
    });
  }

  for (const n of oneLineDisplayLines(page)) {
    err(`line ${n}: one-line display formula; write $$ alone on a line, the formula, then $$ alone`);
  }

  const si = new Set(s.inlineFormulas);
  const pi = new Set(p.inlineFormulas);
  for (const f of si) if (!pi.has(f)) err(`inline formula missing from page: ${f}`);
  for (const f of pi) if (!si.has(f)) err(`inline formula not in source: ${f}`);

  if (!same(s.tables, p.tables)) err(`table rows: source [${s.tables}], page [${p.tables}]`);
  if (!same(s.headings, p.headings)) err(`headings per level: source [${s.headings}], page [${p.headings}]`);
  if (s.callouts !== p.callouts) err(`callouts: source ${s.callouts}, page ${p.callouts}`);
  if (p.images !== def.diagrams.length) err(`page diagrams: expected ${def.diagrams.length}, found ${p.images}`);
  const srcImages = s.images + s.mermaid;
  const expected = def.diagrams.length + def.removedDiagrams.length;
  if (srcImages !== expected) err(`source images + mermaid: expected ${expected}, found ${srcImages}`);
  if (!same(p.graphics, def.graphics)) err(`graphics: expected [${def.graphics}], found [${p.graphics}]`);

  return errors.filter((e) => !exceptions.some((x) => x !== "" && e.includes(x)));
}
