// ============================================================
// Monte Carlo simulation (spec §4.3)
//
// Draw N return paths from the allocation's expected return + volatility,
// report probability of success (% of paths funded through the horizon) and
// per-year confidence bands. Deterministic for a fixed seed.
// ============================================================

import type {
  MonteCarloResult,
  PercentileBand,
  PercentileTriple,
  RetirementPlanInput,
} from "./types";
import { makeNormalSampler, mulberry32 } from "./random";
import { simulatePath } from "./projection";

/** Returns below −95% would imply an implausible near-total wipeout; floor there. */
const MIN_ANNUAL_RETURN = -0.95;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const rank = p * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
}

export interface MonteCarloOptions {
  expectedReturn: number;
  volatility: number;
  referenceYear?: number;
  /** Override the simulation count (e.g. fewer for lever sensitivity). */
  simulations?: number;
  /** Override the RNG seed. */
  seed?: number;
}

export function runMonteCarlo(
  input: RetirementPlanInput,
  options: MonteCarloOptions,
): MonteCarloResult {
  const { expectedReturn, volatility, referenceYear } = options;
  const simulations = Math.max(1, options.simulations ?? input.assumptions.simulations);
  const seed = options.seed ?? input.assumptions.seed;
  const infl = input.assumptions.inflation;

  const uniform = mulberry32(seed);
  const normal = makeNormalSampler(uniform);

  const totalYears = Math.max(0, input.horizonAge - input.currentAge);
  const tRetire = Math.max(0, input.retirementAge - input.currentAge);

  // Per-year real balances across paths, for percentile bands.
  const perYear: number[][] = Array.from({ length: totalYears + 1 }, () => []);
  const retirementBalances: number[] = [];
  const endingBalances: number[] = [];
  const depletionAges: number[] = [];
  let funded = 0;

  // Reused scratch arrays so a run doesn't allocate per path.
  const returns = new Array(totalYears + 1);
  const realOut = new Array(totalYears + 1);

  for (let s = 0; s < simulations; s++) {
    for (let t = 0; t <= totalYears; t++) {
      returns[t] = Math.max(MIN_ANNUAL_RETURN, expectedReturn + volatility * normal());
    }

    const path = simulatePath(input, returns, referenceYear, realOut);

    for (let t = 0; t <= totalYears; t++) {
      perYear[t].push(realOut[t]);
    }
    retirementBalances.push(
      path.balanceAtRetirementNominal / Math.pow(1 + infl, tRetire),
    );
    endingBalances.push(path.endingBalanceNominal / Math.pow(1 + infl, totalYears));

    if (path.depletionAge === null) funded += 1;
    else depletionAges.push(path.depletionAge);
  }

  const bands: PercentileBand[] = perYear.map((values, t) => {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      age: input.currentAge + t,
      yearIndex: t,
      p10: percentile(sorted, 0.1),
      p25: percentile(sorted, 0.25),
      p50: percentile(sorted, 0.5),
      p75: percentile(sorted, 0.75),
      p90: percentile(sorted, 0.9),
    };
  });

  const triple = (values: number[]): PercentileTriple => {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      p10: percentile(sorted, 0.1),
      p50: percentile(sorted, 0.5),
      p90: percentile(sorted, 0.9),
    };
  };

  const sortedDepletion = [...depletionAges].sort((a, b) => a - b);
  const medianDepletionAge =
    sortedDepletion.length > 0 ? percentile(sortedDepletion, 0.5) : null;

  return {
    simulations,
    successRate: funded / simulations,
    bands,
    balanceAtRetirement: triple(retirementBalances),
    endingBalance: triple(endingBalances),
    medianDepletionAge: medianDepletionAge === null ? null : Math.round(medianDepletionAge),
  };
}
