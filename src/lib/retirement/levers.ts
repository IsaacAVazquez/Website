// ============================================================
// Levers / sensitivity analysis (spec §5.5)
//
// The four dials that move the outcome: save more, retire later, spend less,
// change allocation. For each, report the marginal effect on the success rate
// and — where it's a clean single dial — how far you'd have to push it to hit
// the "on track" threshold.
//
// Lever rows run at the same simulation count as the headline gauge so their
// absolute "→ X% success" figures agree with it; only the threshold solving
// ("how far would you have to push") uses a smaller count, since binary search
// multiplies the cost and those rows report a dial position, not a rate.
// ============================================================

import type {
  LeverEffect,
  LeverId,
  RetirementAccountInput,
  RetirementPlanInput,
} from "./types";
import { computePortfolioAssumptions } from "./assumptions";
import { runMonteCarlo } from "./monteCarlo";
import { formatCurrency, formatPercent } from "./format";

const LEVER_SIMS = 1000;
const TO_REACH_SIMS = 250;
const SAVE_MORE_STEP = 5000;
const RETIRE_LATER_STEP = 2;

function successRate(input: RetirementPlanInput, referenceYear?: number, simulations = LEVER_SIMS): number {
  const { expectedReturn, volatility } = computePortfolioAssumptions(input.allocation);
  return runMonteCarlo(input, {
    expectedReturn,
    volatility,
    referenceYear,
    simulations,
  }).successRate;
}

/**
 * Smallest x in [lo, hi] where the (monotonic) predicate holds, or null if it
 * never holds within range. Binary search keeps lever-solving cheap.
 */
function findMinContinuous(
  lo: number,
  hi: number,
  iterations: number,
  predicate: (x: number) => boolean,
): number | null {
  if (!predicate(hi)) return null;
  if (predicate(lo)) return lo;
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    if (predicate(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** Integer variant for ages: smallest integer age achieving the predicate. */
function findMinInt(lo: number, hi: number, predicate: (x: number) => boolean): number | null {
  if (lo > hi || !predicate(hi)) return null;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (predicate(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

function withExtraContribution(input: RetirementPlanInput, extra: number): RetirementPlanInput {
  let accounts: RetirementAccountInput[];
  if (input.accounts.length === 0) {
    accounts = [
      {
        id: "lever-savings",
        type: "traditional",
        balance: 0,
        annualContribution: extra,
        employerMatch: 0,
      },
    ];
  } else {
    // Add the extra to whichever account already receives the most savings.
    let targetIndex = 0;
    for (let i = 1; i < input.accounts.length; i++) {
      if (input.accounts[i].annualContribution > input.accounts[targetIndex].annualContribution) {
        targetIndex = i;
      }
    }
    accounts = input.accounts.map((a, i) =>
      i === targetIndex ? { ...a, annualContribution: a.annualContribution + extra } : a,
    );
  }
  return { ...input, accounts };
}

function withRetirementAge(input: RetirementPlanInput, age: number): RetirementPlanInput {
  return { ...input, retirementAge: Math.min(age, input.horizonAge - 1) };
}

function withSpendMultiplier(input: RetirementPlanInput, mult: number): RetirementPlanInput {
  return { ...input, desiredAnnualSpend: input.desiredAnnualSpend * mult };
}

/** Shift up to `points` percentage points from cash then bonds into stocks. */
function withMoreStocks(input: RetirementPlanInput, points: number): RetirementPlanInput {
  let remaining = points;
  const allocation = { ...input.allocation };
  const fromCash = Math.min(allocation.cash, remaining);
  allocation.cash -= fromCash;
  remaining -= fromCash;
  const fromBonds = Math.min(allocation.bonds, remaining);
  allocation.bonds -= fromBonds;
  allocation.stocks += fromCash + fromBonds;
  return { ...input, allocation };
}

export function computeLevers(input: RetirementPlanInput, referenceYear?: number): LeverEffect[] {
  const threshold = input.assumptions.successThreshold;
  const base = successRate(input, referenceYear);

  const build = (
    id: LeverId,
    label: string,
    description: string,
    changeLabel: string,
    variant: RetirementPlanInput,
    toReachTarget: { label: string; value: string } | null,
  ): LeverEffect => {
    const newSuccessRate = successRate(variant, referenceYear);
    return { id, label, description, changeLabel, newSuccessRate, delta: newSuccessRate - base, toReachTarget };
  };

  const reachLabel = `to reach ${formatPercent(threshold, 0)}`;

  // ── Save more ────────────────────────────────────────────────────────────
  let saveTarget: { label: string; value: string } | null = null;
  if (base < threshold) {
    const extra = findMinContinuous(0, 50000, 7, (x) =>
      successRate(withExtraContribution(input, x), referenceYear, TO_REACH_SIMS) >= threshold,
    );
    if (extra !== null) {
      const rounded = Math.ceil(extra / 500) * 500;
      saveTarget = { label: reachLabel, value: `+${formatCurrency(rounded)}/yr` };
    }
  }

  // ── Retire later ─────────────────────────────────────────────────────────
  let retireTarget: { label: string; value: string } | null = null;
  if (base < threshold) {
    const maxAge = Math.min(input.retirementAge + 12, input.horizonAge - 1);
    const age = findMinInt(input.retirementAge + 1, maxAge, (a) =>
      successRate(withRetirementAge(input, a), referenceYear, TO_REACH_SIMS) >= threshold,
    );
    if (age !== null) retireTarget = { label: reachLabel, value: `retire at ${age}` };
  }

  // ── Spend less ───────────────────────────────────────────────────────────
  let spendTarget: { label: string; value: string } | null = null;
  if (base < threshold) {
    const cut = findMinContinuous(0, 0.5, 7, (x) =>
      successRate(withSpendMultiplier(input, 1 - x), referenceYear, TO_REACH_SIMS) >= threshold,
    );
    if (cut !== null) {
      spendTarget = {
        label: reachLabel,
        value: `${formatCurrency(input.desiredAnnualSpend * (1 - cut))}/yr`,
      };
    }
  }

  return [
    build(
      "save-more",
      "Save more",
      "Increase your annual contributions.",
      `+${formatCurrency(SAVE_MORE_STEP)}/yr`,
      withExtraContribution(input, SAVE_MORE_STEP),
      saveTarget,
    ),
    build(
      "retire-later",
      "Retire later",
      "Push the retirement age back — more saving, fewer years to fund.",
      `retire at ${Math.min(input.retirementAge + RETIRE_LATER_STEP, input.horizonAge - 1)}`,
      withRetirementAge(input, input.retirementAge + RETIRE_LATER_STEP),
      retireTarget,
    ),
    build(
      "spend-less",
      "Spend less",
      "Trim the desired annual spend in retirement.",
      "−10% spending",
      withSpendMultiplier(input, 0.9),
      spendTarget,
    ),
    build(
      "more-stocks",
      "Shift to stocks",
      "Move 15 points from cash and bonds into equities — higher expected return, more volatility.",
      "+15% stocks",
      withMoreStocks(input, 15),
      null,
    ),
  ];
}
