import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";
import starlightLinksValidator from "starlight-links-validator";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { existsSync } from "node:fs";
import { pageNumber, pages } from "./site/pages";

// Sidebar generated from the page list, only for pages whose MDX file exists.
// With no translated page yet, Starlight's default sidebar keeps the other pages reachable.
const sidebar = pages
  .map((p, i) => ({ ...p, i }))
  .filter((p) => existsSync(new URL(`./src/content/docs/${p.slug}.mdx`, import.meta.url)))
  .map((p) => ({ label: `${pageNumber(p.i)} · ${p.title}`, slug: p.slug }));

export default defineConfig({
  integrations: [
    starlight({
      title: "Derivados Financieros",
      defaultLocale: "root",
      locales: { root: { label: "Español", lang: "es" } },
      ...(sidebar.length > 0 ? { sidebar } : {}),
      plugins: [
        starlightLinksValidator({
          // Enlaces hacia páginas que aún no existen; cada tarea de página elimina su entrada.
          exclude: [
            "/curvas-de-tipos/", // la tarea de la página 02 (curvas-de-tipos) elimina esta entrada
            "/futuros-y-forwards/**", // la tarea de la página 04 (futuros-y-forwards) elimina esta entrada
          ],
        }),
      ],
      customCss: ["katex/dist/katex.min.css", "./src/styles/tema.css"],
      components: {
        Footer: "./src/components/Footer.astro",
        ThemeProvider: "./src/components/ThemeProvider.astro",
        ThemeSelect: "./src/components/ThemeSelect.astro",
      },
    }),
    react(),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },
});
