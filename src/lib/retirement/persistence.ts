import { createDefaultPlan } from "./defaults";
import type {
  AccountType,
  AllocationInput,
  FilingStatus,
  LumpyExpense,
  OtherIncomeInput,
  RetirementAccountInput,
  RetirementAssumptions,
  RetirementPlanInput,
  RetirementTaxRates,
  WithdrawalStrategy,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function boundedNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  integer = false,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const bounded = Math.min(max, Math.max(min, value));
  return integer ? Math.round(bounded) : bounded;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

const FILING_STATUSES = ["single", "married"] as const satisfies readonly FilingStatus[];
const ACCOUNT_TYPES = ["taxable", "traditional", "roth", "hsa"] as const satisfies readonly AccountType[];
const WITHDRAWAL_STRATEGIES = [
  "fixed-real",
  "fixed-percent",
  "guardrails",
] as const satisfies readonly WithdrawalStrategy[];

function decodeAccounts(
  value: unknown,
  fallback: RetirementAccountInput[],
): RetirementAccountInput[] {
  if (!Array.isArray(value)) return fallback.map((account) => ({ ...account }));
  const ids = new Set<string>();
  const accounts: RetirementAccountInput[] = [];

  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.id !== "string" || !entry.id.trim()) continue;
    const id = entry.id.trim();
    if (ids.has(id)) continue;
    ids.add(id);

    const account: RetirementAccountInput = {
      id,
      type: enumValue(entry.type, ACCOUNT_TYPES, "taxable"),
      balance: boundedNumber(entry.balance, 0, 0, 1_000_000_000),
      annualContribution: boundedNumber(entry.annualContribution, 0, 0, 100_000_000),
      employerMatch: boundedNumber(entry.employerMatch, 0, 0, 100_000_000),
    };
    if (typeof entry.contributionGrowth === "number" && Number.isFinite(entry.contributionGrowth)) {
      account.contributionGrowth = boundedNumber(entry.contributionGrowth, 0, 0, 0.2);
    }
    accounts.push(account);
  }
  return accounts;
}

function decodeAllocation(value: unknown, fallback: AllocationInput): AllocationInput {
  const stored = isRecord(value) ? value : {};
  return {
    stocks: boundedNumber(stored.stocks, fallback.stocks, 0, 100),
    bonds: boundedNumber(stored.bonds, fallback.bonds, 0, 100),
    cash: boundedNumber(stored.cash, fallback.cash, 0, 100),
    other: boundedNumber(stored.other, fallback.other, 0, 100),
  };
}

function decodeOtherIncome(
  value: unknown,
  fallback: OtherIncomeInput,
  retirementAge: number,
): OtherIncomeInput {
  const stored = isRecord(value) ? value : {};
  const partTimeStartAge = boundedNumber(
    stored.partTimeStartAge,
    Math.max(fallback.partTimeStartAge, retirementAge),
    retirementAge,
    90,
    true,
  );
  return {
    socialSecurityAnnual: boundedNumber(
      stored.socialSecurityAnnual,
      fallback.socialSecurityAnnual,
      0,
      10_000_000,
    ),
    socialSecurityClaimAge: boundedNumber(
      stored.socialSecurityClaimAge,
      fallback.socialSecurityClaimAge,
      62,
      70,
      true,
    ),
    socialSecurityCola:
      typeof stored.socialSecurityCola === "boolean"
        ? stored.socialSecurityCola
        : fallback.socialSecurityCola,
    pensionAnnual: boundedNumber(stored.pensionAnnual, fallback.pensionAnnual, 0, 10_000_000),
    pensionStartAge: boundedNumber(
      stored.pensionStartAge,
      fallback.pensionStartAge,
      50,
      90,
      true,
    ),
    pensionCola:
      typeof stored.pensionCola === "boolean" ? stored.pensionCola : fallback.pensionCola,
    partTimeAnnual: boundedNumber(stored.partTimeAnnual, fallback.partTimeAnnual, 0, 10_000_000),
    partTimeStartAge,
    partTimeEndAge: boundedNumber(
      stored.partTimeEndAge,
      Math.max(fallback.partTimeEndAge, partTimeStartAge),
      partTimeStartAge,
      90,
      true,
    ),
  };
}

function decodeExpenses(
  value: unknown,
  currentAge: number,
  horizonAge: number,
): LumpyExpense[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  const expenses: LumpyExpense[] = [];
  for (const entry of value) {
    if (
      !isRecord(entry) ||
      typeof entry.id !== "string" ||
      !entry.id.trim() ||
      typeof entry.label !== "string"
    ) {
      continue;
    }
    const id = entry.id.trim();
    if (ids.has(id)) continue;
    ids.add(id);
    expenses.push({
      id,
      label: entry.label.slice(0, 200),
      amount: boundedNumber(entry.amount, 0, 0, 1_000_000_000),
      age: boundedNumber(entry.age, currentAge, currentAge, horizonAge, true),
    });
  }
  return expenses;
}

function decodeTaxRates(value: unknown, fallback: RetirementTaxRates): RetirementTaxRates {
  const stored = isRecord(value) ? value : {};
  return {
    taxable: boundedNumber(stored.taxable, fallback.taxable, 0, 1),
    traditional: boundedNumber(stored.traditional, fallback.traditional, 0, 1),
    roth: boundedNumber(stored.roth, fallback.roth, 0, 1),
    hsa: boundedNumber(stored.hsa, fallback.hsa, 0, 1),
  };
}

function decodeAssumptions(
  value: unknown,
  fallback: RetirementAssumptions,
): RetirementAssumptions {
  const stored = isRecord(value) ? value : {};
  let withdrawalRateOverride = fallback.withdrawalRateOverride;
  if (stored.withdrawalRateOverride === null) {
    withdrawalRateOverride = null;
  } else if (
    typeof stored.withdrawalRateOverride === "number" &&
    Number.isFinite(stored.withdrawalRateOverride)
  ) {
    withdrawalRateOverride = boundedNumber(stored.withdrawalRateOverride, 0.04, 0.01, 0.1);
  }

  return {
    inflation: boundedNumber(stored.inflation, fallback.inflation, 0, 0.1),
    healthcareInflation: boundedNumber(
      stored.healthcareInflation,
      fallback.healthcareInflation,
      0,
      0.15,
    ),
    withdrawalStrategy: enumValue(
      stored.withdrawalStrategy,
      WITHDRAWAL_STRATEGIES,
      fallback.withdrawalStrategy,
    ),
    withdrawalRateOverride,
    taxRates: decodeTaxRates(stored.taxRates, fallback.taxRates),
    simulations: boundedNumber(stored.simulations, fallback.simulations, 100, 10_000, true),
    seed: boundedNumber(stored.seed, fallback.seed, 0, 0xffffffff, true),
    successThreshold: boundedNumber(
      stored.successThreshold,
      fallback.successThreshold,
      0.5,
      0.99,
    ),
  };
}

/** Repair a persisted plan while accepting only known runtime-safe fields. */
export function decodeRetirementPlan(value: unknown): RetirementPlanInput | undefined {
  if (!isRecord(value)) return undefined;
  const fallback = createDefaultPlan();
  const currentAge = boundedNumber(value.currentAge, fallback.currentAge, 18, 89, true);
  // Invalid-type fields fall back to the raw default, which can sit below the
  // cross-field floor (e.g. a valid currentAge of 70 with a corrupted
  // retirementAge) — lift each fallback to its floor so the decoded plan always
  // keeps retirementAge > currentAge and horizonAge > retirementAge.
  const retirementAge = boundedNumber(
    value.retirementAge,
    Math.max(fallback.retirementAge, currentAge + 1),
    currentAge + 1,
    90,
    true,
  );
  const horizonAge = boundedNumber(
    value.horizonAge,
    Math.max(fallback.horizonAge, retirementAge + 1),
    retirementAge + 1,
    110,
    true,
  );

  return {
    currentAge,
    retirementAge,
    horizonAge,
    filingStatus: enumValue(value.filingStatus, FILING_STATUSES, fallback.filingStatus),
    region: typeof value.region === "string" ? value.region.slice(0, 100) : fallback.region,
    desiredAnnualSpend: boundedNumber(
      value.desiredAnnualSpend,
      fallback.desiredAnnualSpend,
      0,
      1_000_000_000,
    ),
    preMedicareHealthcare: boundedNumber(
      value.preMedicareHealthcare,
      fallback.preMedicareHealthcare,
      0,
      1_000_000_000,
    ),
    accounts: decodeAccounts(value.accounts, fallback.accounts),
    allocation: decodeAllocation(value.allocation, fallback.allocation),
    otherIncome: decodeOtherIncome(value.otherIncome, fallback.otherIncome, retirementAge),
    lumpyExpenses: decodeExpenses(value.lumpyExpenses, currentAge, horizonAge),
    assumptions: decodeAssumptions(value.assumptions, fallback.assumptions),
  };
}
