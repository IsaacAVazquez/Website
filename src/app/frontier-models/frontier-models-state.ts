import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  FrontierModalityFilter,
  FrontierModelsRouteState,
  FrontierModelsSnapshot,
  FrontierProviderFilter,
  FrontierTierFilter,
  FrontierView,
} from "@/types/frontierModels";

export const FRONTIER_MODELS_ROUTE = "/frontier-models";

export const FRONTIER_MODELS_VIEW_OPTIONS = ["list", "chart"] as const;

const VALID_VIEWS = new Set<FrontierView>(FRONTIER_MODELS_VIEW_OPTIONS);
const VALID_PROVIDERS = new Set([
  "anthropic",
  "openai",
  "google",
  "meta",
  "xai",
  "deepseek",
  "mistral",
]);
const VALID_MODALITIES = new Set(["text", "vision", "audio"]);
const VALID_TIERS = new Set(["budget", "standard", "premium"]);

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_FRONTIER_MODELS_STATE: FrontierModelsRouteState = {
  view: "list",
  provider: "all",
  modality: "all",
  priceTier: "all",
  selectedModelId: null,
};

export const FRONTIER_MODELS_VIEW_LABELS: Record<FrontierView, string> = {
  list: "List",
  chart: "Chart",
};

export const FRONTIER_MODELS_VIEW_DESCRIPTIONS: Record<FrontierView, string> = {
  list: "Sortable, filterable table of every tracked model.",
  chart: "Cost-versus-context scatter view across providers.",
};

export const FRONTIER_MODALITY_LABELS: Record<
  Exclude<FrontierModalityFilter, "all">,
  string
> = {
  text: "Text",
  vision: "Vision",
  audio: "Audio",
};

function readParam(input: SearchParamInput, key: string): string | null {
  if ("get" in input && typeof input.get === "function") {
    return (input as URLSearchParams).get(key);
  }
  const rawValue = (input as SearchParamRecord)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }
  return rawValue ?? null;
}

export function normalizeFrontierModelsState(
  input: SearchParamInput
): FrontierModelsRouteState {
  const view = readParam(input, "view");
  const provider = readParam(input, "provider");
  const modality = readParam(input, "modality");
  const tier = readParam(input, "tier");
  const model = readParam(input, "model");

  return {
    view: VALID_VIEWS.has((view ?? "") as FrontierView)
      ? (view as FrontierView)
      : DEFAULT_FRONTIER_MODELS_STATE.view,
    provider: VALID_PROVIDERS.has(provider ?? "")
      ? (provider as FrontierProviderFilter)
      : DEFAULT_FRONTIER_MODELS_STATE.provider,
    modality: VALID_MODALITIES.has(modality ?? "")
      ? (modality as FrontierModalityFilter)
      : DEFAULT_FRONTIER_MODELS_STATE.modality,
    priceTier: VALID_TIERS.has(tier ?? "")
      ? (tier as FrontierTierFilter)
      : DEFAULT_FRONTIER_MODELS_STATE.priceTier,
    selectedModelId: model && model.trim().length > 0 ? model.trim() : null,
  };
}

export function resolveFrontierModelsState(
  state: FrontierModelsRouteState,
  snapshot: FrontierModelsSnapshot
): FrontierModelsRouteState {
  const validProviders = new Set(snapshot.providers.map((entry) => entry.id));
  const validModelIds = new Set(snapshot.models.map((entry) => entry.id));

  return {
    view: VALID_VIEWS.has(state.view)
      ? state.view
      : DEFAULT_FRONTIER_MODELS_STATE.view,
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
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );

  if (state.view === DEFAULT_FRONTIER_MODELS_STATE.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (state.provider === DEFAULT_FRONTIER_MODELS_STATE.provider) {
    params.delete("provider");
  } else {
    params.set("provider", state.provider);
  }

  if (state.modality === DEFAULT_FRONTIER_MODELS_STATE.modality) {
    params.delete("modality");
  } else {
    params.set("modality", state.modality);
  }

  if (state.priceTier === DEFAULT_FRONTIER_MODELS_STATE.priceTier) {
    params.delete("tier");
  } else {
    params.set("tier", state.priceTier);
  }

  if (!state.selectedModelId) {
    params.delete("model");
  } else {
    params.set("model", state.selectedModelId);
  }

  const query = params.toString();
  return `${FRONTIER_MODELS_ROUTE}${query ? `?${query}` : ""}`;
}
