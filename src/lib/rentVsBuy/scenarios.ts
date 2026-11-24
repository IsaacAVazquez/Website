import { isRecord } from "@/lib/utils";
import { decodeRentVsBuyInput, RENT_VS_BUY_BOUNDS } from "./persistence";
import { calculateRentVsBuy } from "./engine";
import type { RentVsBuyInput } from "./types";

export const RENT_SCENARIOS_KEY = "rent-vs-buy-scenarios-v1";
export interface RentScenario {
  id: string;
  name: string;
  input: RentVsBuyInput;
}
export function parseRentScenarios(raw: string): RentScenario[] {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    return data
      .flatMap((item): RentScenario[] => {
        if (
          !isRecord(item) ||
          typeof item.id !== "string" ||
          !item.id ||
          item.id.length > 100 ||
          seen.has(item.id) ||
          typeof item.name !== "string" ||
          !item.name.trim() ||
          !isRecord(item.input)
        )
          return [];
        seen.add(item.id);
        return [
          {
            id: item.id,
            name: item.name.trim().slice(0, 80),
            input: decodeRentVsBuyInput(item.input),
          },
        ];
      })
      .slice(0, 20);
  } catch {
    return [];
  }
}
export function rentSensitivity(input: RentVsBuyInput) {
  return (
    [
      ["mortgageRatePercent", "Mortgage rate", 1],
      ["homeAppreciationPercent", "Home appreciation", 1],
      ["yearsStaying", "Years staying", 2],
    ] as const
  ).flatMap(([field, label, step]) => {
    const bounds = RENT_VS_BUY_BOUNDS[field];
    const at = (direction: number) =>
      Math.round(
        Math.min(
          bounds.max,
          Math.max(bounds.min, input[field] + direction * step),
        ) * 100,
      ) / 100;
    return [-1, 0, 1].flatMap((direction) => {
      const value = at(direction);
      // At a bound the step clamps back onto the current value, which would
      // repeat the current row as if it were an alternate assumption.
      if (direction !== 0 && value === at(0)) return [];
      const result = calculateRentVsBuy({ ...input, [field]: value });
      return [
        {
          field,
          label,
          value,
          current: direction === 0,
          delta: result.netWorthDeltaAtHorizon,
          verdict: result.verdict,
        },
      ];
    });
  });
}
