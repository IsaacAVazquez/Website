import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  FrontierModalityFilter,
  FrontierModelsRouteState,
  FrontierModelsSnapshot,
} from "@/types/frontierModels";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

export const FRONTIER_MODELS_ROUTE = "/frontier-models";

const PROVIDERS = [
  "anthropic",
  "openai",
  "google",
  "meta",
  "xai",
  "deepseek",
  "mistral",
] as const;
const MODALITIES = ["text", "vision", "audio"] as const;
const TIERS = ["budget", "standard", "premium"] as const;

export const DEFAULT_FRONTIER_MODELS_STATE: FrontierModelsRouteState = {
  provider: "all",
  modality: "all",
  priceTier: "all",
  selectedModelId: null,
};

export const FRONTIER_MODALITY_LABELS: Record<
  Exclude<FrontierModalityFilter, "all">,
  string
> = {
  text: "Text",
  vision: "Vision",
  audio: "Audio",
};

export function normalizeFrontierModelsState(
  input: SearchParamInput
): FrontierModelsRouteState {
  return {
    provider: readEnum(input, "provider", PROVIDERS, DEFAULT_FRONTIER_MODELS_STATE.provider),
    modality: readEnum(input, "modality", MODALITIES, DEFAULT_FRONTIER_MODELS_STATE.modality),
    priceTier: readEnum(input, "tier", TIERS, DEFAULT_FRONTIER_MODELS_STATE.priceTier),
    selectedModelId: readParam(input, "model")?.trim() || null,
  };
}

export function resolveFrontierModelsState(
  state: FrontierModelsRouteState,
  snapshot: FrontierModelsSnapshot
): FrontierModelsRouteState {
  const validProviders = new Set(snapshot.providers.map((entry) => entry.id));
  const validModelIds = new Set(snapshot.models.map((entry) => entry.id));

  return {
    provider:
      state.provider === "all" || validProviders.has(state.provider)
        ? state.provider
        : DEFAULT_FRONTIER_MODELS_STATE.provider,
    modality: state.modality,
    priceTier: state.priceTier,
    selectedModelId:
      state.selectedModelId && validModelIds.has(state.selectedModelId)
        ? state.selectedModelId
        : null,
  };
}

export function buildFrontierModelsHref(
  state: FrontierModelsRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return buildHref(
    FRONTIER_MODELS_ROUTE,
    {
      // The page once had a list/chart switch, and the chart now prints above
      // the sheet, so a stale ?view= drops out of the URL.
      view: null,
      provider: state.provider,
      modality: state.modality,
      tier: state.priceTier,
      model: state.selectedModelId || null,
    },
    { ...DEFAULT_FRONTIER_MODELS_STATE, tier: DEFAULT_FRONTIER_MODELS_STATE.priceTier },
    baseSearchParams
  );
}
