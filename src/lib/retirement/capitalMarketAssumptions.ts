// ============================================================
// Capital Market Assumptions (CMAs)
//
// Per the spec (§4.2), expected return + volatility are DERIVED from the
// allocation using a dated, citable published assumption set — never a single
// hardcoded "stocks do 10%" number.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ [verify @ build] IMPORTANT                                               │
// │ The figures below are ILLUSTRATIVE long-term (10 to 15 year) nominal    │
// │ estimates, shaped to align with 2025 assumption sets from several firms │
// │ (J.P. Morgan, Research Affiliates, Vanguard) and never pinned to one    │
// │ publication. Two returns were set on 2026-09-28 to the figures in the   │
// │ J.P. Morgan release named below. `CMA_VERIFIED` stays false until every │
// │ figure is pinned to a dated primary source. The UI surfaces the source, │
// │ the date, and the unverified state, as the spec (§4.2, §9) requires.    │
// │ The edition is annual, so re-read the release every autumn.             │
// └─────────────────────────────────────────────────────────────────────────┘
//
// Source for the US large-cap and emerging-market returns, read 2026-09-28:
//   https://am.jpmorgan.com/us/en/asset-management/adv/about-us/media/press-releases/jp-morgan-releases-2026-long-term-capital-market-assumptions/
// The release is dated 2025-10-20 and gives 6.7% and 7.8%. The full matrix
// behind it carries a notice that it is not for retail use or distribution,
// so nothing here is taken from the matrix.
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

interface CapitalMarketAssumption {
  id: AssetClassId;
  label: string;
  /** Expected nominal annual return (decimal). */
  expectedReturn: number;
  /** Annual return volatility / standard deviation (decimal). */
  stdDev: number;
}

export const CMA_SOURCE =
  "Illustrative long-term (10 to 15 year) capital market assumptions. The US large-cap and emerging-market equity returns are the figures in J.P. Morgan Asset Management's 2026 Long-Term Capital Market Assumptions release of October 20, 2025. Every other figure is an estimate from June 2026 that is not tied to one publication.";
/**
 * Date of the oldest published source behind the set, which is the J.P. Morgan
 * release. The curated data audit measures age from it, so the set comes up
 * for review once the next annual edition is out.
 */
export const CMA_AS_OF = "2025-10-20";
/** Flip to true only once every figure is pinned to a dated primary source. */
export const CMA_VERIFIED = false;

export const CAPITAL_MARKET_ASSUMPTIONS: Record<AssetClassId, CapitalMarketAssumption> = {
  // Return from the J.P. Morgan release. The volatility is illustrative.
  usLargeCap: { id: "usLargeCap", label: "US large-cap equities", expectedReturn: 0.067, stdDev: 0.16 },
  intlDeveloped: { id: "intlDeveloped", label: "Intl developed equities", expectedReturn: 0.08, stdDev: 0.175 },
  // Return from the J.P. Morgan release. The volatility is illustrative.
  emergingMarkets: { id: "emergingMarkets", label: "Emerging-market equities", expectedReturn: 0.078, stdDev: 0.205 },
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
