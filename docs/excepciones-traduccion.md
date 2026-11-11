# Excepciones de la traducción

Diferencias deliberadas entre una página y su nota original que `tools/translation-check.ts` señala como error. Cada entrada es una línea de lista con el texto exacto del error entre comillas invertidas y el motivo.

Formato: ``- `texto del error`: motivo``

- `inline formula missing from page: 125{,}000/(1+0.035\times0.25)=\$123{,}916`: en MDX, `remark-math` cierra la fórmula en línea en el `$` de `\$`, y el resto rompe el análisis. La página escribe `\text{\textdollar}` (el mismo símbolo en KaTeX) en los tres sitios donde la nota usa `\$` dentro de una fórmula en línea (página 07).
- `inline formula missing from page: 5{,}000{,}000\times0.0001/12=\$41.67`: igual que la anterior (Fed Funds).
- `inline formula not in source: 5{,}000{,}000\times0.0001/12=\text{}41.67`: la otra mitad de la anterior.
- `inline formula missing from page: 125.8323/1.014889=\$123.99`: igual que la anterior (factor de conversión, ejemplo 2).
- `inline formula not in source: 125.8323/1.014889=\text{}123.99`: la otra mitad de la anterior.
- `inline formula not in source: 125{,}000/(1+0.035\times0.25)=\text{}123{,}916`: la otra mitad de la entrada anterior.
