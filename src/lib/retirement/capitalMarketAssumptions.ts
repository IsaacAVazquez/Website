// ============================================================
// Capital Market Assumptions (CMAs)
//
// Per the spec (§4.2), expected return + volatility are DERIVED from the
// allocation using a dated, citable published assumption set — never a single
// hardcoded "stocks do 10%" number.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ [verify @ build] — IMPORTANT                                              │
// │ The figures below are ILLUSTRATIVE long-term (10–15yr) nominal estimates  │
// │ shaped to align with publicly available 2025 assumption sets from major  │
// │ firms (e.g. J.P. Morgan Long-Term Capital Market Assumptions, Research    │
// │ Affiliates, Vanguard VCMM). CMAs drift year-to-year, so before relying on │
// │ these in production they MUST be re-pinned to a current primary source —  │
// │ update the numbers AND flip `CMA_VERIFIED` to true with the real source   │
// │ string + as-of date. The UI surfaces the source + date and the           │
// │ unverified state, as the spec (§4.2, §9) requires.                        │
// └─────────────────────────────────────────────────────────────────────────┘
//
// Note the modern shape: US large-cap expected returns are historically *low*
// (rich valuations) and international *higher* — do not bake in stale optimism.

export type AssetClassId =
  | "usLargeCap"
  | "intlDeveloped"
  | "emergingMarkets"
  | "usBonds"
  | "cash"
  | "realAssets";

export interface CapitalMarketAssumption {
  id: AssetClassId;
  label: string;
  /** Expected nominal annual return (decimal). */
  expectedReturn: number;
  /** Annual return volatility / standard deviation (decimal). */
  stdDev: number;
}

export const CMA_SOURCE =
  "Illustrative long-term (10–15yr) capital market assumptions, aligned with published 2025 estimates from major firms (e.g. J.P. Morgan LTCMA).";
export const CMA_AS_OF = "2026-06";
/** Flip to true only once the figures are re-pinned to a dated primary source. */
export const CMA_VERIFIED = false;

export const CAPITAL_MARKET_ASSUMPTIONS: Record<AssetClassId, CapitalMarketAssumption> = {
  usLargeCap: { id: "usLargeCap", label: "US large-cap equities", expectedReturn: 0.066, stdDev: 0.16 },
  intlDeveloped: { id: "intlDeveloped", label: "Intl developed equities", expectedReturn: 0.08, stdDev: 0.175 },
  emergingMarkets: { id: "emergingMarkets", label: "Emerging-market equities", expectedReturn: 0.085, stdDev: 0.205 },
  usBonds: { id: "usBonds", label: "US aggregate bonds", expectedReturn: 0.047, stdDev: 0.06 },
  cash: { id: "cash", label: "Cash / T-bills", expectedReturn: 0.037, stdDev: 0.01 },
  realAssets: { id: "realAssets", label: "Real assets (REITs / commodities)", expectedReturn: 0.06, stdDev: 0.155 },
};

const ASSET_ORDER: AssetClassId[] = [
  "usLargeCap",
  "intlDeveloped",
  "emergingMarkets",
  "usBonds",
  "cash",
  "realAssets",
];

/**
 * Pairwise correlation matrix between asset classes. Illustrative, long-run
 * values consistent with the published CMA sets above — equities highly
 * correlated with each other, bonds/cash near-uncorrelated to negatively
 * correlated with equities. [verify @ build]
 */
const CORRELATIONS: Record<AssetClassId, Record<AssetClassId, number>> = {
  usLargeCap: { usLargeCap: 1, intlDeveloped: 0.85, emergingMarkets: 0.75, usBonds: 0.1, cash: 0.0, realAssets: 0.6 },
  intlDeveloped: { usLargeCap: 0.85, intlDeveloped: 1, emergingMarkets: 0.8, usBonds: 0.12, cash: 0.0, realAssets: 0.6 },
  emergingMarkets: { usLargeCap: 0.75, intlDeveloped: 0.8, emergingMarkets: 1, usBonds: 0.1, cash: 0.0, realAssets: 0.6 },
  usBonds: { usLargeCap: 0.1, intlDeveloped: 0.12, emergingMarkets: 0.1, usBonds: 1, cash: 0.3, realAssets: 0.2 },
  cash: { usLargeCap: 0.0, intlDeveloped: 0.0, emergingMarkets: 0.0, usBonds: 0.3, cash: 1, realAssets: 0.0 },
  realAssets: { usLargeCap: 0.6, intlDeveloped: 0.6, emergingMarkets: 0.6, usBonds: 0.2, cash: 0.0, realAssets: 1 },
};

export function correlation(a: AssetClassId, b: AssetClassId): number {
  return CORRELATIONS[a]?.[b] ?? 0;
}

export { ASSET_ORDER };
