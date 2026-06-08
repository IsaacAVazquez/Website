// ============================================================
// Coarse, account-aware taxes + Required Minimum Distributions (spec §4.7)
//
// v1 uses a flat effective rate per account type (acceptable per the spec).
// Withdrawals follow the conventional sequence taxable → traditional → roth →
// hsa, with RMDs force-drawing tax-deferred balances on the IRS schedule.
// ============================================================

import type { AccountType, RetirementTaxRates } from "./types";

/** Reference "now" year — fixed so RMD-age logic stays deterministic in tests. */
export const DEFAULT_REFERENCE_YEAR = 2026;

/**
 * RMD start age under SECURE 2.0, by birth year:
 *  - born ≤ 1950: 72
 *  - born 1951–1959: 73 (in effect 2023–2032)
 *  - born ≥ 1960: 75 (effective 2033)
 */
export function rmdStartAge(birthYear: number): number {
  if (birthYear <= 1950) return 72;
  if (birthYear <= 1959) return 73;
  return 75;
}

export function rmdStartAgeFromCurrent(currentAge: number, referenceYear = DEFAULT_REFERENCE_YEAR): number {
  return rmdStartAge(referenceYear - currentAge);
}

/**
 * IRS Uniform Lifetime Table (effective 2022) — distribution period by age.
 * RMD = tax-deferred balance / divisor. Ages beyond the table clamp to the last.
 */
const UNIFORM_LIFETIME_TABLE: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
  80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4,
  88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9,
  96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2,
  104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5,
};

export function rmdDivisor(age: number): number {
  if (age <= 72) return UNIFORM_LIFETIME_TABLE[72];
  if (age >= 110) return UNIFORM_LIFETIME_TABLE[110];
  return UNIFORM_LIFETIME_TABLE[age] ?? UNIFORM_LIFETIME_TABLE[110];
}

/** Mutable per-account balance map carried through a single simulated path. */
export interface AccountBalances {
  taxable: number;
  traditional: number;
  roth: number;
  hsa: number;
}

export interface WithdrawalResult {
  /** Gross amount pulled from the portfolio (reduces balances). */
  gross: number;
  /** Taxes paid on the withdrawals. */
  taxes: number;
  /** True if accounts couldn't cover the net need this year. */
  depleted: boolean;
}

const SEQUENCE: AccountType[] = ["taxable", "traditional", "roth", "hsa"];

/**
 * Withdraw enough (after tax) to cover `netNeed`, mutating `balances`.
 * Honors RMDs first (force-draw tax-deferred; reinvest any after-tax surplus
 * into the taxable account), then the conventional withdrawal sequence.
 */
export function withdrawForYear(
  balances: AccountBalances,
  netNeed: number,
  age: number,
  rates: RetirementTaxRates,
  rmdAge: number,
): WithdrawalResult {
  let gross = 0;
  let taxes = 0;
  let remaining = Math.max(0, netNeed);

  // 1. Required Minimum Distribution from tax-deferred balances.
  if (age >= rmdAge && balances.traditional > 0) {
    const rmd = balances.traditional / rmdDivisor(age);
    balances.traditional -= rmd;
    gross += rmd;
    const tax = rmd * rates.traditional;
    taxes += tax;
    const net = rmd - tax;
    if (net >= remaining) {
      // Forced distribution exceeds the spending need — reinvest the surplus.
      balances.taxable += net - remaining;
      remaining = 0;
    } else {
      remaining -= net;
    }
  }

  // 2. Conventional sequence for any remaining need.
  for (const type of SEQUENCE) {
    if (remaining <= 1e-9) break;
    const balance = balances[type];
    if (balance <= 0) continue;
    const rate = rates[type];
    const grossNeeded = remaining / (1 - rate);
    const take = Math.min(grossNeeded, balance);
    balances[type] = balance - take;
    gross += take;
    const tax = take * rate;
    taxes += tax;
    remaining -= take - tax;
  }

  return { gross, taxes, depleted: remaining > 1e-6 };
}
