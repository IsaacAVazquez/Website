// ============================================================
// Social Security claiming mechanics (spec §4.6)
//
// v1 takes the user's benefit estimate and adjusts it for claim age — the
// benefit figure they enter is assumed to be their Full Retirement Age (FRA)
// benefit. Claiming early permanently reduces it; delaying past FRA earns
// delayed retirement credits up to age 70.
// ============================================================

import type { OtherIncomeInput } from "./types";

/** Full Retirement Age for those born 1960+ (SSA). */
export const FULL_RETIREMENT_AGE = 67;

/**
 * Multiplier applied to the FRA benefit for a given claim age.
 *  - Early (62 → FRA): ~6.67%/yr reduction for the first 3 years, 5%/yr beyond
 *    (≈25–30% cut at 62 for an FRA of 67).
 *  - Delayed (FRA → 70): +8%/yr delayed retirement credits; no gain past 70.
 */
export function socialSecurityClaimFactor(claimAge: number, fra: number = FULL_RETIREMENT_AGE): number {
  const clamped = Math.max(62, Math.min(70, claimAge));
  if (clamped >= fra) {
    return 1 + 0.08 * (clamped - fra);
  }
  const monthsEarly = (fra - clamped) * 12;
  const first36 = Math.min(36, monthsEarly);
  const beyond36 = Math.max(0, monthsEarly - 36);
  const reduction = first36 * (5 / 9 / 100) + beyond36 * (5 / 12 / 100);
  return 1 - reduction;
}

/**
 * Other income (today's dollars) received at a given age, before inflation.
 * COLA-adjusted streams are inflated to nominal terms by the caller.
 */
export function otherIncomeRealAtAge(income: OtherIncomeInput, age: number): {
  socialSecurity: number;
  pension: number;
  partTime: number;
} {
  const socialSecurity =
    age >= income.socialSecurityClaimAge
      ? income.socialSecurityAnnual * socialSecurityClaimFactor(income.socialSecurityClaimAge)
      : 0;

  const pension = age >= income.pensionStartAge ? income.pensionAnnual : 0;

  const partTime =
    age >= income.partTimeStartAge && age <= income.partTimeEndAge ? income.partTimeAnnual : 0;

  return { socialSecurity, pension, partTime };
}
