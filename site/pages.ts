export interface PageDef {
  /** File name in source/en, e.g. "00-fixed-income-securities.md". */
  source: string;
  /** Slug of the page, e.g. "renta-fija". The page lives at src/content/docs/<slug>.mdx. */
  slug: string;
  /** Spanish title. */
  title: string;
  /** Names (no extension) of static diagrams kept on the page. */
  diagrams: string[];
  /** Names (no extension) of source SVGs on the page that an interactive graphic replaces. */
  removedDiagrams: string[];
  /** Component names of the interactive graphics, in page order. */
  graphics: string[];
}

export const SOURCE_COMMIT = "627bb65c932601a19f45d2d83c7b9f99169740dd";

export const pages: PageDef[] = [
  {
    source: "00-fixed-income-securities.md",
    slug: "renta-fija",
    title: "Instrumentos de renta fija",
    diagrams: [],
    removedDiagrams: ["dirty-vs-clean-price", "duration-convexity-approximation"],
    graphics: ["PriceYield", "CleanDirtyPrice", "MacaulayDuration", "DurationConvexityApprox"],
  },
  {
    source: "01-interest-rates.md",
    slug: "tipos-de-interes",
    title: "Tipos de interés",
    diagrams: [],
    removedDiagrams: [],
    graphics: [],
  },
  {
    source: "02-interest-rates-curves.md",
    slug: "curvas-de-tipos",
    title: "Curvas de tipos de interés",
    diagrams: ["example-zero-rates-discount-factors", "forward-rate-timeline"],
    removedDiagrams: ["zero-vs-par-rates"],
    graphics: ["ZeroParForwardCurves", "CarryRollDown"],
  },
  {
    source: "03-markets-assets-and-type-of-traders.md",
    slug: "mercados-activos-y-operadores",
    title: "Mercados, activos y tipos de operadores",
    diagrams: [],
    removedDiagrams: [],
    graphics: [],
  },
  {
    source: "04-futures-and-forwards.md",
    slug: "futuros-y-forwards",
    title: "Futuros y forwards",
    diagrams: [],
    removedDiagrams: [],
    graphics: ["ForwardPayoff", "DailySettlement"],
  },
  {
    source: "05-futures-and-forwards-pricing.md",
    slug: "valoracion-de-futuros-y-forwards",
    title: "Valoración de futuros y forwards",
    diagrams: ["interest-rate-parity"],
    removedDiagrams: [],
    graphics: ["ForwardValue", "ForwardPrice"],
  },
  {
    source: "06-hedging-strategies-using-futures.md",
    slug: "cobertura-con-futuros",
    title: "Estrategias de cobertura con futuros",
    diagrams: [],
    removedDiagrams: ["basis-risk-early-close-out"],
    graphics: ["BasisRisk", "MinVarianceHedge"],
  },
  {
    source: "07-fras-and-interest-rate-futures.md",
    slug: "fras-y-futuros-de-tipos",
    title: "FRAs y futuros sobre tipos de interés",
    diagrams: [
      "fra-libor-vs-sofr-timeline",
      "futures-daily-settlement-timeline",
      "conversion-factor-whole-periods",
      "conversion-factor-3-month-offset",
      "cheapest-to-deliver-yields",
      "sofr-futures-bootstrap-timeline",
    ],
    removedDiagrams: [],
    graphics: ["FraPayoff", "ConversionFactor"],
  },
  {
    source: "08-swaps.md",
    slug: "swaps",
    title: "Swaps",
    diagrams: ["swap-transform-liability", "swap-transform-asset", "ccs-cash-flows"],
    removedDiagrams: ["swap-payer-vs-receiver-convexity"],
    graphics: ["ParSwapRate", "SwapValue"],
  },
  {
    source: "09-non-standard-swaps.md",
    slug: "swaps-no-estandar",
    title: "Swaps no estándar",
    diagrams: [],
    removedDiagrams: ["cms-vs-vanilla-swap-payoff"],
    graphics: ["CapFloorCollarPayoff", "SabrSmile", "CmsVsSwap"],
  },
  {
    source: "10-repos.md",
    slug: "repos",
    title: "Repos",
    diagrams: [],
    removedDiagrams: [],
    graphics: ["RepoHaircutCarry"],
  },
  {
    source: "11-strips.md",
    slug: "strips",
    title: "STRIPS",
    diagrams: [],
    removedDiagrams: [],
    graphics: ["StripPrice"],
  },
];

export const pageNumber = (i: number) => String(i).padStart(2, "0");
