// ============================================================
// Single-path projection (spec §4.1)
//
// Two phases, computed in NOMINAL dollars with REAL values exposed alongside:
//   balance[t+1] = (balance[t] + contribution[t] − withdrawal[t]) · (1 + r[t])
// Contributions/withdrawals happen at the start of the year, then growth.
// Used by both the deterministic projection and every Monte Carlo path.
// ============================================================

import type {
  DeterministicResult,
  RetirementPlanInput,
  YearProjection,
} from "./types";
import { otherIncomeRealAtAge } from "./socialSecurity";
import {
  rmdStartAgeFromCurrent,
  withdrawForYear,
  type AccountBalances,
} from "./tax";
import { DEFAULT_SAFE_WITHDRAWAL_RATE } from "./defaults";

const MEDICARE_AGE = 65;
const DEFAULT_SWR = DEFAULT_SAFE_WITHDRAWAL_RATE;

function emptyBalances(): AccountBalances {
  return { taxable: 0, traditional: 0, roth: 0, hsa: 0 };
}

function totalBalance(b: AccountBalances): number {
  return b.taxable + b.traditional + b.roth + b.hsa;
}

export function aggregateBalances(input: RetirementPlanInput): AccountBalances {
  const balances = emptyBalances();
  for (const account of input.accounts) {
    balances[account.type] += Math.max(0, account.balance || 0);
  }
  return balances;
}

export interface PathResult {
  years: YearProjection[];
  balanceAtRetirementNominal: number;
  endingBalanceNominal: number;
  depletionAge: number | null;
}

/**
 * Simulate one path given a per-year return series (`returns[t]`).
 * Pure and allocation-agnostic — the caller supplies the returns (a constant
 * E[r] for the deterministic run, sampled draws for Monte Carlo).
 *
 * Pass `realOut` (a reusable scratch array) to run in fast mode: per-year real
 * balances are written into it and the heavyweight `years` records are skipped.
 * Monte Carlo uses this to avoid allocating thousands of objects per run.
 */
export function simulatePath(
  input: RetirementPlanInput,
  returns: number[],
  referenceYear?: number,
  realOut?: number[],
): PathResult {
  const { currentAge, retirementAge, horizonAge, assumptions } = input;
  const infl = assumptions.inflation;
  const hcInfl = assumptions.healthcareInflation;
  const strategy = assumptions.withdrawalStrategy;
  const swr = assumptions.withdrawalRateOverride ?? DEFAULT_SWR;
  const rmdAge = rmdStartAgeFromCurrent(currentAge, referenceYear);

  const balances = aggregateBalances(input);
  const totalYears = Math.max(0, horizonAge - currentAge);

  const years: YearProjection[] = [];
  let depletionAge: number | null = null;
  let balanceAtRetirementNominal = totalBalance(balances);

  // Guardrails carries spend forward year to year; initialized at retirement.
  let guardrailSpend = 0;
  let guardrailInitialRate = 0;

  for (let t = 0; t <= totalYears; t++) {
    const age = currentAge + t;
    const r = returns[t] ?? returns[returns.length - 1] ?? 0;
    const startBalance = totalBalance(balances);
    const inflationFactor = Math.pow(1 + infl, t);

    if (age === retirementAge) {
      balanceAtRetirementNominal = startBalance;
    }

    let contribution = 0;
    let spending = 0;
    let taxes = 0;
    let withdrawal = 0;
    let otherIncome = 0;

    if (age < retirementAge) {
      // ── Accumulation ──────────────────────────────────────────────────────
      for (const account of input.accounts) {
        const growth = account.contributionGrowth ?? infl;
        const annual =
          (account.annualContribution + account.employerMatch) * Math.pow(1 + growth, t);
        balances[account.type] += annual;
        contribution += annual;
      }
    } else {
      // ── Decumulation ──────────────────────────────────────────────────────
      const real = otherIncomeRealAtAge(input.otherIncome, age);
      const ss = input.otherIncome.socialSecurityCola
        ? real.socialSecurity * inflationFactor
        : real.socialSecurity;
      const pension = input.otherIncome.pensionCola
        ? real.pension * inflationFactor
        : real.pension;
      const partTime = real.partTime * inflationFactor;
      otherIncome = ss + pension + partTime;

      // Base spending by strategy (nominal).
      let baseSpend: number;
      if (strategy === "fixed-percent") {
        baseSpend = swr * startBalance;
      } else if (strategy === "guardrails") {
        if (age === retirementAge) {
          guardrailSpend = input.desiredAnnualSpend * inflationFactor;
          guardrailInitialRate = startBalance > 0 ? guardrailSpend / startBalance : 0;
        } else {
          // Inflation rule: skip the raise after a down year if we're overspending.
          const currentRate = startBalance > 0 ? guardrailSpend / startBalance : Infinity;
          const overspending = currentRate > guardrailInitialRate;
          if (!(r < 0 && overspending)) {
            guardrailSpend *= 1 + infl;
          }
          // Capital-preservation and prosperity guardrails (±20% band, ±10% step).
          if (startBalance > 0) {
            const rate = guardrailSpend / startBalance;
            if (rate > guardrailInitialRate * 1.2) guardrailSpend *= 0.9;
            else if (rate < guardrailInitialRate * 0.8) guardrailSpend *= 1.1;
          }
        }
        baseSpend = guardrailSpend;
      } else {
        // fixed-real (default)
        baseSpend = input.desiredAnnualSpend * inflationFactor;
      }

      // Pre-Medicare healthcare gap (inflates faster than CPI).
      if (age < MEDICARE_AGE && input.preMedicareHealthcare > 0) {
        baseSpend += input.preMedicareHealthcare * Math.pow(1 + hcInfl, t);
      }

      // One-time lumpy expenses landing this year.
      let lumpy = 0;
      for (const expense of input.lumpyExpenses) {
        if (expense.age === age) lumpy += expense.amount * inflationFactor;
      }

      spending = baseSpend + lumpy;
      const netNeed = Math.max(0, spending - otherIncome);
      const result = withdrawForYear(balances, netNeed, age, assumptions.taxRates, rmdAge);
      withdrawal = result.gross;
      taxes = result.taxes;
      if (result.depleted && depletionAge === null) {
        depletionAge = age;
      }
    }

    // Apply this year's return after start-of-year cash flows.
    for (const key of ["taxable", "traditional", "roth", "hsa"] as const) {
      balances[key] = Math.max(0, balances[key] * (1 + r));
    }

    const endBalance = totalBalance(balances);
    if (realOut) {
      realOut[t] = endBalance / inflationFactor;
    } else {
      years.push({
        age,
        yearIndex: t,
        phase: age < retirementAge ? "accumulation" : "decumulation",
        nominalBalance: endBalance,
        realBalance: endBalance / inflationFactor,
        contribution,
        withdrawal,
        spending,
        taxes,
        otherIncome,
      });
    }
  }

  return {
    years,
    balanceAtRetirementNominal,
    endingBalanceNominal: totalBalance(balances),
    depletionAge,
  };
}

/** Deterministic projection using a constant expected return each year. */
export function runDeterministic(
  input: RetirementPlanInput,
  expectedReturn: number,
  referenceYear?: number,
): DeterministicResult {
  const totalYears = Math.max(0, input.horizonAge - input.currentAge);
  const returns = new Array(totalYears + 1).fill(expectedReturn);
  const path = simulatePath(input, returns, referenceYear);

  const infl = input.assumptions.inflation;
  const tRetire = input.retirementAge - input.currentAge;
  const retireFactor = Math.pow(1 + infl, Math.max(0, tRetire));
  const endFactor = Math.pow(1 + infl, totalYears);

  return {
    path: path.years,
    balanceAtRetirement: {
      nominal: path.balanceAtRetirementNominal,
      real: path.balanceAtRetirementNominal / retireFactor,
    },
    endingBalance: {
      nominal: path.endingBalanceNominal,
      real: path.endingBalanceNominal / endFactor,
    },
    depletionAge: path.depletionAge,
  };
}
