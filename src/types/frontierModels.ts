export type FrontierProvider =
  | "anthropic"
  | "openai"
  | "google"
  | "meta"
  | "xai"
  | "deepseek"
  | "mistral";

export type FrontierModality = "text" | "vision" | "audio";

export type FrontierPriceTier = "budget" | "standard" | "premium";

export type FrontierView = "list" | "chart";

/**
 * Outcome of the daily automated fact check against models.dev and
 * OpenRouter. "confirmed" means the checkable numbers matched the curated
 * entry, "updated" means the live catalogs corrected them, and
 * "curated-only" means no catalog entry matched, so the curated facts stand
 * unchecked.
 */
export interface FrontierModelLiveCheck {
  status: "confirmed" | "updated" | "curated-only";
  checkedAt: string;
  source: "models.dev" | "openrouter" | null;
}

export interface FrontierModel {
  id: string;
  provider: FrontierProvider;
  providerLabel: string;
  name: string;
  releaseDate: string;
  knowledgeCutoff: string | null;
  contextWindow: number;
  maxOutputTokens: number;
  inputPricePerMTokens: number | null;
  outputPricePerMTokens: number | null;
  priceTier: FrontierPriceTier;
  modalities: FrontierModality[];
  reasoning: boolean;
  editorialNote: string;
  docsUrl: string | null;
  liveCheck?: FrontierModelLiveCheck;
}

export interface FrontierModelProviderSummary {
  id: FrontierProvider;
  label: string;
  count: number;
}

export interface FrontierModelPriceTierSummary {
  id: FrontierPriceTier;
  label: string;
  count: number;
}

export interface FrontierModelsSnapshot {
  generatedAt: string;
  /** Date the manually curated facts were last reviewed. */
  asOf?: string;
  /** Whether every listed record completed an independent source review. */
  verified?: boolean;
  sourceLabel: string;
  models: FrontierModel[];
  providers: FrontierModelProviderSummary[];
  priceTiers: FrontierModelPriceTierSummary[];
  /** Present when the daily automated fact check has run (blob-served data). */
  liveFacts?: {
    checkedAt: string;
    sources: string[];
    updated: number;
    confirmed: number;
    curatedOnly: number;
  };
}

export type FrontierProviderFilter = FrontierProvider | "all";
export type FrontierModalityFilter = FrontierModality | "all";
export type FrontierTierFilter = FrontierPriceTier | "all";

export interface FrontierModelsRouteState {
  view: FrontierView;
  provider: FrontierProviderFilter;
  modality: FrontierModalityFilter;
  priceTier: FrontierTierFilter;
  selectedModelId: string | null;
}
