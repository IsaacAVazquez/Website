import { writeBrowserStorageJson } from "@/lib/browserStorage";
import { createDefaultInput } from "./defaults";
import type { FilingStatus, RentVsBuyInput } from "./types";
import { isRecord, boundedNumber, enumValue } from "@/lib/utils";

export const RENT_VS_BUY_STORAGE_KEY = "rent_vs_buy_input_v1";

const FILING_STATUSES = ["single", "married"] as const satisfies readonly FilingStatus[];

type NumericField = {
  [K in keyof RentVsBuyInput]: RentVsBuyInput[K] extends number ? K : never;
}[keyof RentVsBuyInput];

/**
 * The range each numeric field is clamped to. The form reads the same table
 * for its min and max, so its out-of-range warning matches the clamp.
 */
export const RENT_VS_BUY_BOUNDS: Record<NumericField, { min: number; max: number }> = {
  homePrice: { min: 10_000, max: 100_000_000 },
  downPaymentPercent: { min: 0, max: 100 },
  mortgageRatePercent: { min: 0, max: 25 },
  loanTermYears: { min: 1, max: 40 },
  propertyTaxPercent: { min: 0, max: 10 },
  homeInsuranceAnnual: { min: 0, max: 1_000_000 },
  maintenancePercent: { min: 0, max: 10 },
  hoaMonthly: { min: 0, max: 100_000 },
  closingCostPercent: { min: 0, max: 15 },
  sellingCostPercent: { min: 0, max: 15 },
  homeAppreciationPercent: { min: -10, max: 20 },
  monthlyRent: { min: 0, max: 1_000_000 },
  rentGrowthPercent: { min: -10, max: 20 },
  rentersInsuranceMonthly: { min: 0, max: 10_000 },
  investmentReturnPercent: { min: -10, max: 20 },
  generalInflationPercent: { min: 0, max: 20 },
  marginalTaxRatePercent: { min: 0, max: 60 },
  yearsStaying: { min: 1, max: 40 },
};

/** Repair a persisted input, accepting only known runtime-safe fields. */
export function decodeRentVsBuyInput(value: unknown): RentVsBuyInput {
  const fallback = createDefaultInput();
  if (!isRecord(value)) return fallback;
  const num = (key: NumericField, integer = false) =>
    boundedNumber(value[key], fallback[key], RENT_VS_BUY_BOUNDS[key].min, RENT_VS_BUY_BOUNDS[key].max, integer);

  return {
    homePrice: num("homePrice"),
    downPaymentPercent: num("downPaymentPercent"),
    mortgageRatePercent: num("mortgageRatePercent"),
    loanTermYears: num("loanTermYears", true),
    propertyTaxPercent: num("propertyTaxPercent"),
    homeInsuranceAnnual: num("homeInsuranceAnnual"),
    maintenancePercent: num("maintenancePercent"),
    hoaMonthly: num("hoaMonthly"),
    closingCostPercent: num("closingCostPercent"),
    sellingCostPercent: num("sellingCostPercent"),
    homeAppreciationPercent: num("homeAppreciationPercent"),

    monthlyRent: num("monthlyRent"),
    rentGrowthPercent: num("rentGrowthPercent"),
    rentersInsuranceMonthly: num("rentersInsuranceMonthly"),

    investmentReturnPercent: num("investmentReturnPercent"),
    generalInflationPercent: num("generalInflationPercent"),
    marginalTaxRatePercent: num("marginalTaxRatePercent"),
    filingStatus: enumValue(value.filingStatus, FILING_STATUSES, fallback.filingStatus),
    itemizes: typeof value.itemizes === "boolean" ? value.itemizes : fallback.itemizes,
    yearsStaying: num("yearsStaying", true),
  };
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
