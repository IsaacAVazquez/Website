import type {
  FrontierModalityFilter,
  FrontierModel,
  FrontierModelPriceTierSummary,
  FrontierModelProviderSummary,
  FrontierModelsSnapshot,
  FrontierPriceTier,
  FrontierProvider,
  FrontierProviderFilter,
  FrontierTierFilter,
} from "@/types/frontierModels";

const PROVIDER_ORDER: FrontierProvider[] = [
  "anthropic",
  "openai",
  "google",
  "meta",
  "xai",
  "deepseek",
  "mistral",
];

const PRICE_TIER_ORDER: FrontierPriceTier[] = ["budget", "standard", "premium"];

export const PRICE_TIER_LABELS: Record<FrontierPriceTier, string> = {
  budget: "Budget",
  standard: "Standard",
  premium: "Premium",
};

export function derivePriceTier(
  inputPrice: number | null,
  outputPrice: number | null
): FrontierPriceTier {
  const candidates = [inputPrice, outputPrice].filter(
    (value): value is number => typeof value === "number"
  );
  if (candidates.length === 0) {
    return "standard";
  }
  const peak = Math.max(...candidates);
  if (peak < 1) {
    return "budget";
  }
  if (peak < 10) {
    return "standard";
  }
  return "premium";
}

export function blendedPricePerMTokens(model: FrontierModel): number | null {
  const { inputPricePerMTokens: input, outputPricePerMTokens: output } = model;
  if (input === null && output === null) {
    return null;
  }
  if (input === null) {
    return output;
  }
  if (output === null) {
    return input;
  }
  return (input + output * 3) / 4;
}

export type FrontierSourceModel = Omit<
  FrontierModel,
  "priceTier" | "providerLabel"
>;

export function buildFrontierModelsSnapshot(
  source: FrontierSourceModel[],
  providerLabels: Record<FrontierProvider, string>,
  generatedAt: string,
  sourceLabel = "Curated by Isaac Vazquez"
): FrontierModelsSnapshot {
  const models: FrontierModel[] = source
    .map((entry) => ({
      ...entry,
      providerLabel: providerLabels[entry.provider],
      priceTier: derivePriceTier(
        entry.inputPricePerMTokens,
        entry.outputPricePerMTokens
      ),
    }))
    .sort((a, b) => {
      if (a.releaseDate !== b.releaseDate) {
        return a.releaseDate < b.releaseDate ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });

  const providers: FrontierModelProviderSummary[] = PROVIDER_ORDER.map(
    (id) => ({
      id,
      label: providerLabels[id],
      count: models.filter((model) => model.provider === id).length,
    })
  ).filter((entry) => entry.count > 0);

  const priceTiers: FrontierModelPriceTierSummary[] = PRICE_TIER_ORDER.map(
    (id) => ({
      id,
      label: PRICE_TIER_LABELS[id],
      count: models.filter((model) => model.priceTier === id).length,
    })
  ).filter((entry) => entry.count > 0);

  return {
    generatedAt,
    sourceLabel,
    models,
    providers,
    priceTiers,
  };
}

export interface FrontierFilterInput {
  provider: FrontierProviderFilter;
  modality: FrontierModalityFilter;
  priceTier: FrontierTierFilter;
}

export function filterFrontierModels(
  models: FrontierModel[],
  filters: FrontierFilterInput
): FrontierModel[] {
  return models.filter((model) => {
    if (filters.provider !== "all" && model.provider !== filters.provider) {
      return false;
    }
    if (
      filters.modality !== "all" &&
      !model.modalities.includes(filters.modality)
    ) {
      return false;
    }
    if (filters.priceTier !== "all" && model.priceTier !== filters.priceTier) {
      return false;
    }
    return true;
  });
}

export type FrontierSortKey =
  | "releaseDate"
  | "contextWindow"
  | "inputPrice"
  | "outputPrice"
  | "name";

export type FrontierSortDirection = "asc" | "desc";

export function sortFrontierModels(
  models: FrontierModel[],
  key: FrontierSortKey,
  direction: FrontierSortDirection
): FrontierModel[] {
  const factor = direction === "asc" ? 1 : -1;
  const copy = [...models];
  copy.sort((a, b) => {
    switch (key) {
      case "releaseDate":
        return factor * a.releaseDate.localeCompare(b.releaseDate);
      case "contextWindow":
        return factor * (a.contextWindow - b.contextWindow);
      case "inputPrice":
        return (
          factor *
          ((a.inputPricePerMTokens ?? Number.POSITIVE_INFINITY) -
            (b.inputPricePerMTokens ?? Number.POSITIVE_INFINITY))
        );
      case "outputPrice":
        return (
          factor *
          ((a.outputPricePerMTokens ?? Number.POSITIVE_INFINITY) -
            (b.outputPricePerMTokens ?? Number.POSITIVE_INFINITY))
        );
      case "name":
        return factor * a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
  return copy;
}

export function formatTokenCount(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `${Number.isInteger(thousands) ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
  }
  return value.toString();
}

export function formatPriceUsd(value: number | null): string {
  if (value === null) {
    return "—";
  }
  if (value < 1) {
    return `$${value.toFixed(2)}`;
  }
  if (Number.isInteger(value)) {
    return `$${value.toFixed(0)}`;
  }
  return `$${value.toFixed(2)}`;
}

export function medianContextWindow(models: FrontierModel[]): number {
  if (models.length === 0) {
    return 0;
  }
  const sorted = [...models]
    .map((model) => model.contextWindow)
    .sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}
