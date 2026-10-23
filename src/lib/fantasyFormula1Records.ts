import { isRecord } from "./utils";
import { isLocalDateKey } from "./date-formatters";
import type { FantasyFormula1Asset } from "@/types/fantasyFormula1";

export const f1PricesKey = (season: number | string, round: number | string) =>
  `fantasy-formula-1-prices-v1-${season}-${round}`;
export const f1ResultsKey = (season: number | string) =>
  `fantasy-formula-1-results-v1-${season}`;
const assetId = (id: string) =>
  /^(driver|constructor)-[a-zA-Z0-9-]{1,80}$/.test(id);
const finite = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;
export function parseF1Prices(raw: string): Record<string, number> {
  try {
    const data: unknown = JSON.parse(raw);
    return isRecord(data)
      ? Object.fromEntries(
          Object.entries(data)
            .flatMap(([id, price]) =>
              assetId(id) && finite(price, 0.1, 100)
                ? [[id, price] as const]
                : [],
            )
            .slice(0, 60),
        )
      : {};
  } catch {
    return {};
  }
}
export function applyF1Prices(
  assets: FantasyFormula1Asset[],
  prices: Record<string, number>,
): FantasyFormula1Asset[] {
  return assets.map((asset) =>
    Object.hasOwn(prices, asset.id)
      ? {
          ...asset,
          price: prices[asset.id],
          valueRating:
            Math.round((asset.projectedPoints / prices[asset.id]) * 100) / 10,
        }
      : asset,
  );
}
export interface F1RaceRecord {
  id: string;
  race: string;
  date: string;
  savedAt: string;
  sourceAt: string;
  assets: {
    id: string;
    name: string;
    price: number;
    estimate: number;
    entered: boolean;
  }[];
  actual: number | null;
}
export function parseF1Results(raw: string): F1RaceRecord[] {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    return data
      .flatMap((row): F1RaceRecord[] => {
        if (
          !isRecord(row) ||
          typeof row.id !== "string" ||
          !row.id ||
          row.id.length > 100 ||
          seen.has(row.id) ||
          typeof row.race !== "string" ||
          !row.race.trim() ||
          typeof row.date !== "string" ||
          !isLocalDateKey(row.date) ||
          typeof row.savedAt !== "string" ||
          !Number.isFinite(Date.parse(row.savedAt)) ||
          typeof row.sourceAt !== "string" ||
          !Number.isFinite(Date.parse(row.sourceAt)) ||
          !Array.isArray(row.assets) ||
          row.assets.length !== 7 ||
          (row.actual !== null && !finite(row.actual, -10000, 10000))
        )
          return [];
        const assets = row.assets.flatMap((asset): F1RaceRecord["assets"] =>
          isRecord(asset) &&
          typeof asset.id === "string" &&
          assetId(asset.id) &&
          typeof asset.name === "string" &&
          Boolean(asset.name.trim()) &&
          finite(asset.price, 0.1, 100) &&
          finite(asset.estimate, -10000, 10000)
            ? [
                {
                  id: asset.id,
                  name: asset.name.slice(0, 100),
                  price: asset.price,
                  estimate: asset.estimate,
                  entered: asset.entered === true,
                },
              ]
            : [],
        );
        if (
          assets.length !== 7 ||
          new Set(assets.map((asset) => asset.id)).size !== 7 ||
          assets.filter((asset) => asset.id.startsWith("driver-")).length !== 5
        )
          return [];
        seen.add(row.id);
        return [
          {
            id: row.id,
            race: row.race.trim().slice(0, 100),
            date: row.date,
            savedAt: row.savedAt,
            sourceAt: row.sourceAt,
            assets,
            actual: row.actual as number | null,
          },
        ];
      })
      .slice(0, 30);
  } catch {
    return [];
  }
}
