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
  sourceLabel: string;
  models: FrontierModel[];
  providers: FrontierModelProviderSummary[];
  priceTiers: FrontierModelPriceTierSummary[];
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
