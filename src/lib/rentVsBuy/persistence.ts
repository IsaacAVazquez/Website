import { readBrowserStorageString, writeBrowserStorageJson } from "@/lib/browserStorage";
import { createDefaultInput } from "./defaults";
import type { FilingStatus, RentVsBuyInput } from "./types";

export const RENT_VS_BUY_STORAGE_KEY = "rent_vs_buy_input_v1";

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

const FILING_STATUSES = ["single", "married"] as const satisfies readonly FilingStatus[];

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

/** Repair a persisted input, accepting only known runtime-safe fields. */
export function decodeRentVsBuyInput(value: unknown): RentVsBuyInput {
  const fallback = createDefaultInput();
  if (!isRecord(value)) return fallback;

  return {
    homePrice: boundedNumber(value.homePrice, fallback.homePrice, 10_000, 100_000_000),
    downPaymentPercent: boundedNumber(value.downPaymentPercent, fallback.downPaymentPercent, 0, 100),
    mortgageRatePercent: boundedNumber(
      value.mortgageRatePercent,
      fallback.mortgageRatePercent,
      0,
      25,
    ),
    loanTermYears: boundedNumber(value.loanTermYears, fallback.loanTermYears, 1, 40, true),
    propertyTaxPercent: boundedNumber(value.propertyTaxPercent, fallback.propertyTaxPercent, 0, 10),
    homeInsuranceAnnual: boundedNumber(
      value.homeInsuranceAnnual,
      fallback.homeInsuranceAnnual,
      0,
      1_000_000,
    ),
    maintenancePercent: boundedNumber(value.maintenancePercent, fallback.maintenancePercent, 0, 10),
    hoaMonthly: boundedNumber(value.hoaMonthly, fallback.hoaMonthly, 0, 100_000),
    closingCostPercent: boundedNumber(value.closingCostPercent, fallback.closingCostPercent, 0, 15),
    sellingCostPercent: boundedNumber(value.sellingCostPercent, fallback.sellingCostPercent, 0, 15),
    homeAppreciationPercent: boundedNumber(
      value.homeAppreciationPercent,
      fallback.homeAppreciationPercent,
      -10,
      20,
    ),

    monthlyRent: boundedNumber(value.monthlyRent, fallback.monthlyRent, 0, 1_000_000),
    rentGrowthPercent: boundedNumber(value.rentGrowthPercent, fallback.rentGrowthPercent, -10, 20),
    rentersInsuranceMonthly: boundedNumber(
      value.rentersInsuranceMonthly,
      fallback.rentersInsuranceMonthly,
      0,
      10_000,
    ),

    investmentReturnPercent: boundedNumber(
      value.investmentReturnPercent,
      fallback.investmentReturnPercent,
      -10,
      20,
    ),
    generalInflationPercent: boundedNumber(
      value.generalInflationPercent,
      fallback.generalInflationPercent,
      0,
      20,
    ),
    marginalTaxRatePercent: boundedNumber(
      value.marginalTaxRatePercent,
      fallback.marginalTaxRatePercent,
      0,
      60,
    ),
    filingStatus: enumValue(value.filingStatus, FILING_STATUSES, fallback.filingStatus),
    itemizes: typeof value.itemizes === "boolean" ? value.itemizes : fallback.itemizes,
    yearsStaying: boundedNumber(value.yearsStaying, fallback.yearsStaying, 1, 40, true),
  };
}

export function loadRentVsBuyInput(storage?: Pick<Storage, "getItem">): RentVsBuyInput {
  try {
    const raw = storage
      ? storage.getItem(RENT_VS_BUY_STORAGE_KEY)
      : readBrowserStorageString(RENT_VS_BUY_STORAGE_KEY).value;
    if (!raw) return createDefaultInput();
    return decodeRentVsBuyInput(JSON.parse(raw) as unknown);
  } catch {
    return createDefaultInput();
  }
}

export function saveRentVsBuyInput(
  input: RentVsBuyInput,
  storage?: Pick<Storage, "setItem">,
): void {
  if (storage) {
    storage.setItem(RENT_VS_BUY_STORAGE_KEY, JSON.stringify(input));
    return;
  }
  writeBrowserStorageJson(RENT_VS_BUY_STORAGE_KEY, input);
}
