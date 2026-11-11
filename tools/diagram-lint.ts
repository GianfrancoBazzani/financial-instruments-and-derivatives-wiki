/** Lint rules for the static SVG diagrams in src/assets/diagramas/. Each returns error messages. */

type Rule = (svg: string) => string[];

const rootTag = (svg: string) => /<svg\b[^>]*>/.exec(svg)?.[0] ?? "";

export const hasViewBox: Rule = (svg) => (/\bviewBox\s*=/.test(rootTag(svg)) ? [] : ["root <svg> has no viewBox"]);

export const noRootSize: Rule = (svg) =>
  /\s(width|height)\s*=/.test(rootTag(svg)) ? ["root <svg> has a width or height attribute"] : [];

export const noBackgroundRect: Rule = (svg) => {
  const vb = /\bviewBox\s*=\s*"([^"]*)"/.exec(rootTag(svg))?.[1].trim().split(/[\s,]+/).map(Number);
  if (!vb || vb.length !== 4) return [];
  const [x, y, w, h] = vb;
  const errors: string[] = [];
  for (const m of svg.matchAll(/<rect\b[^>]*>/g)) {
    const tag = m[0];
    const fill = /\bfill\s*=\s*"([^"]*)"/.exec(tag)?.[1];
    if (!fill || fill === "none") continue;
    const num = (name: string, dflt: number) => {
      const v = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`).exec(tag)?.[1];
      return v === undefined ? dflt : v.endsWith("%") ? NaN : Number(v);
    };
    const full = (name: string, dflt: number, vbVal: number) => {
      const v = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`).exec(tag)?.[1];
      return v === "100%" || num(name, dflt) === vbVal;
    };
    const covers =
      full("width", 0, w) && full("height", 0, h) && num("x", 0) <= x && num("y", 0) <= y;
    if (covers) errors.push(`full-size background <rect>: ${tag}`);
  }
  return errors;
};

const COLOUR_ATTRS = "fill|stroke|stop-color|flood-color|lighting-color|color";

export const themedColours: Rule = (svg) => {
  const errors: string[] = [];
  for (const m of svg.matchAll(new RegExp(`(?<![\\w-])(${COLOUR_ATTRS})\\s*=\\s*(["'])(.*?)\\2`, "g"))) {
    const v = m[3].trim();
    if (v !== "none" && v !== "currentColor" && !/^var\(--g-[\w-]+\)$/.test(v)) {
      errors.push(`${m[1]}="${v}" is not none, currentColor, or var(--g-…)`);
    }
  }
  for (const m of svg.matchAll(/\bstyle\s*=\s*(["'])(.*?)\1/gs)) {
    if (/fill|stroke|color/i.test(m[2])) errors.push(`style="${m[2]}" sets a colour; use a fill/stroke attribute`);
  }
  if (/<style\b/i.test(svg)) errors.push("contains a <style> block");
  return errors;
};

export const noFontFamily: Rule = (svg) => (/\bfont-family\b/.test(svg) ? ["contains font-family"] : []);

export const rules: Record<string, Rule> = {
  hasViewBox,
  noRootSize,
  noBackgroundRect,
  themedColours,
  noFontFamily,
};

export function lintSvg(svg: string): string[] {
  return Object.values(rules).flatMap((rule) => rule(svg));
}
