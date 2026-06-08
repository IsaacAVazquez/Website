// ============================================================
// Allocation → expected return + volatility (spec §4.2)
//
//   E[return] = Σ wᵢ · E[rᵢ]
//   variance  = Σᵢ Σⱼ wᵢ wⱼ σᵢ σⱼ ρᵢⱼ
//   σ_port    = √variance
//
// The UI collects four high-level buckets (stocks / bonds / cash / other);
// here we expand them into the finer CMA asset classes so the per-class
// figures stay defensible and citable.
// ============================================================

import type { AllocationInput } from "./types";
import {
  ASSET_ORDER,
  CAPITAL_MARKET_ASSUMPTIONS,
  correlation,
  type AssetClassId,
} from "./capitalMarketAssumptions";

/**
 * How each high-level bucket decomposes into CMA asset classes. Documented and
 * intentionally simple; advanced per-class control is a future enhancement.
 */
const BUCKET_DECOMPOSITION: Record<keyof AllocationInput, Partial<Record<AssetClassId, number>>> = {
  stocks: { usLargeCap: 0.55, intlDeveloped: 0.3, emergingMarkets: 0.15 },
  bonds: { usBonds: 1 },
  cash: { cash: 1 },
  other: { realAssets: 1 },
};

export interface PortfolioAssumptions {
  expectedReturn: number;
  volatility: number;
  /** Normalized weight per CMA asset class (sums to 1, or all-zero if empty). */
  weights: Record<AssetClassId, number>;
}

/** Expand the four buckets into normalized per-asset-class weights. */
export function expandAllocation(allocation: AllocationInput): Record<AssetClassId, number> {
  const weights: Record<AssetClassId, number> = {
    usLargeCap: 0,
    intlDeveloped: 0,
    emergingMarkets: 0,
    usBonds: 0,
    cash: 0,
    realAssets: 0,
  };

  (Object.keys(BUCKET_DECOMPOSITION) as (keyof AllocationInput)[]).forEach((bucket) => {
    const bucketWeight = Math.max(0, allocation[bucket] || 0);
    const decomp = BUCKET_DECOMPOSITION[bucket];
    (Object.keys(decomp) as AssetClassId[]).forEach((cls) => {
      weights[cls] += bucketWeight * (decomp[cls] ?? 0);
    });
  });

  const total = ASSET_ORDER.reduce((sum, cls) => sum + weights[cls], 0);
  if (total > 0) {
    ASSET_ORDER.forEach((cls) => {
      weights[cls] = weights[cls] / total;
    });
  }
  return weights;
}

/** Derive portfolio expected return and volatility from an allocation. */
export function computePortfolioAssumptions(allocation: AllocationInput): PortfolioAssumptions {
  const weights = expandAllocation(allocation);

  const expectedReturn = ASSET_ORDER.reduce(
    (sum, cls) => sum + weights[cls] * CAPITAL_MARKET_ASSUMPTIONS[cls].expectedReturn,
    0,
  );

  let variance = 0;
  for (const a of ASSET_ORDER) {
    for (const b of ASSET_ORDER) {
      variance +=
        weights[a] *
        weights[b] *
        CAPITAL_MARKET_ASSUMPTIONS[a].stdDev *
        CAPITAL_MARKET_ASSUMPTIONS[b].stdDev *
        correlation(a, b);
    }
  }
  const volatility = Math.sqrt(Math.max(0, variance));

  return { expectedReturn, volatility, weights };
}
