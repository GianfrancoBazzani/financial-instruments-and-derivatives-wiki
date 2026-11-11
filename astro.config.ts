import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";
import starlightLinksValidator from "starlight-links-validator";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  integrations: [
    starlight({
      title: "Derivados Financieros",
      defaultLocale: "root",
      locales: { root: { label: "Español", lang: "es" } },
      plugins: [starlightLinksValidator()],
      customCss: ["katex/dist/katex.min.css"],
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
