import type {
  FrontierModel,
  FrontierModelsSnapshot,
  FrontierModality,
  FrontierProvider,
} from "@/types/frontierModels";
// Relative import (not "@/lib/…") so the Netlify scheduled function can
// bundle this module without Next's tsconfig path alias.
import {
  buildFrontierModelsSnapshot,
  type FrontierSourceModel,
} from "./frontierModels";

/** Blob key the scheduled refresh writes and the accessor reads. */
export const FRONTIER_MODELS_BLOB_KEY = "frontier-models";

/**
 * Live fact-checking layer for the frontier-models catalog.
 *
 * The curated seed stays the source of truth for WHICH models are listed and
 * for every editorial note. This module refreshes the checkable facts
 * (pricing, context window, output limit, knowledge cutoff, release date)
 * against two keyless public catalogs — models.dev's api.json and
 * OpenRouter's /api/v1/models — and stamps each model with the outcome.
 *
 * Matching is deliberately conservative, mirroring the fantasy ADP rule of
 * "tiered exact matching, never fuzzy": a curated model only picks up live
 * facts when its normalized name matches a catalog entry for the same
 * provider exactly. Anything else stays curated-only rather than risking a
 * wrong-model overwrite.
 */

const MODELS_DEV_URL = "https://models.dev/api.json";
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const FETCH_TIMEOUT_MS = 15_000;

// Refuse to merge against an implausibly small catalog — a degraded upstream
// response must not strip live confirmations from every model.
const MIN_MODELS_DEV_PROVIDERS = 5;
const MIN_OPENROUTER_MODELS = 50;

export interface LiveModelFacts {
  contextWindow?: number;
  maxOutputTokens?: number;
  inputPricePerMTokens?: number;
  outputPricePerMTokens?: number;
  knowledgeCutoff?: string;
  releaseDate?: string;
  reasoning?: boolean;
  modalities?: FrontierModality[];
  source: "models.dev" | "openrouter";
}

export interface LiveFactsCatalog {
  fetchedAt: string;
  /** provider id → normalized model name → facts */
  byProvider: Partial<
    Record<FrontierProvider, Record<string, LiveModelFacts>>
  >;
}

/** "Claude Opus 4.8" / "claude-opus-4.8" / "Claude Opus 4·8" → "claudeopus48" */
export function normalizeModelName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const OPENROUTER_PROVIDER_PREFIXES: Record<string, FrontierProvider> = {
  anthropic: "anthropic",
  openai: "openai",
  google: "google",
  "meta-llama": "meta",
  "x-ai": "xai",
  deepseek: "deepseek",
  mistralai: "mistral",
};

const MODELS_DEV_PROVIDER_IDS: Record<string, FrontierProvider> = {
  anthropic: "anthropic",
  openai: "openai",
  google: "google",
  meta: "meta",
  xai: "xai",
  deepseek: "deepseek",
  mistral: "mistral",
};

function toFiniteNumber(value: unknown): number | undefined {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : undefined;
}

function toModalities(input: unknown): FrontierModality[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const mapped = new Set<FrontierModality>();
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const value = raw.toLowerCase();
    if (value === "text") mapped.add("text");
    if (value === "image" || value === "vision") mapped.add("vision");
    if (value === "audio") mapped.add("audio");
  }
  return mapped.size > 0 ? Array.from(mapped) : undefined;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${url}`);
  }
  return response.json();
}

interface ModelsDevModel {
  name?: string;
  reasoning?: boolean;
  knowledge?: string;
  release_date?: string;
  modalities?: { input?: string[] };
  cost?: { input?: number; output?: number };
  limit?: { context?: number; output?: number };
}

function parseModelsDev(payload: unknown): LiveFactsCatalog["byProvider"] {
  const byProvider: LiveFactsCatalog["byProvider"] = {};
  if (!payload || typeof payload !== "object") {
    throw new Error("models.dev payload is not an object.");
  }
  const providers = Object.entries(payload as Record<string, unknown>).filter(
    ([id]) => id in MODELS_DEV_PROVIDER_IDS
  );
  if (
    Object.keys(payload as Record<string, unknown>).length <
    MIN_MODELS_DEV_PROVIDERS
  ) {
    throw new Error("models.dev payload has implausibly few providers.");
  }

  for (const [providerId, entry] of providers) {
    const provider = MODELS_DEV_PROVIDER_IDS[providerId];
    const models =
      entry && typeof entry === "object"
        ? ((entry as { models?: Record<string, ModelsDevModel> }).models ?? {})
        : {};
    for (const model of Object.values(models)) {
      if (!model?.name) continue;
      const key = normalizeModelName(model.name);
      if (!key) continue;
      const facts: LiveModelFacts = { source: "models.dev" };
      const context = toFiniteNumber(model.limit?.context);
      const output = toFiniteNumber(model.limit?.output);
      const inputCost = toFiniteNumber(model.cost?.input);
      const outputCost = toFiniteNumber(model.cost?.output);
      if (context) facts.contextWindow = context;
      if (output) facts.maxOutputTokens = output;
      if (inputCost !== undefined) facts.inputPricePerMTokens = inputCost;
      if (outputCost !== undefined) facts.outputPricePerMTokens = outputCost;
      if (typeof model.knowledge === "string" && model.knowledge) {
        facts.knowledgeCutoff = model.knowledge;
      }
      if (typeof model.release_date === "string" && model.release_date) {
        facts.releaseDate = model.release_date;
      }
      if (typeof model.reasoning === "boolean") {
        facts.reasoning = model.reasoning;
      }
      const modalities = toModalities(model.modalities?.input);
      if (modalities) facts.modalities = modalities;

      byProvider[provider] = byProvider[provider] ?? {};
      byProvider[provider]![key] = facts;
    }
  }
  return byProvider;
}

interface OpenRouterModel {
  id?: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  top_provider?: { max_completion_tokens?: number | null };
  architecture?: { input_modalities?: string[] };
  supported_parameters?: string[];
}

function parseOpenRouter(payload: unknown): LiveFactsCatalog["byProvider"] {
  const byProvider: LiveFactsCatalog["byProvider"] = {};
  const models = (payload as { data?: OpenRouterModel[] })?.data;
  if (!Array.isArray(models)) {
    throw new Error("OpenRouter payload has no data array.");
  }
  if (models.length < MIN_OPENROUTER_MODELS) {
    throw new Error("OpenRouter payload has implausibly few models.");
  }

  for (const model of models) {
    const idPrefix = model.id?.split("/")[0] ?? "";
    const provider = OPENROUTER_PROVIDER_PREFIXES[idPrefix];
    if (!provider || !model.name) continue;
    // OpenRouter names read "Anthropic: Claude Opus 4.8" — drop the vendor
    // prefix before normalizing so it matches the curated display name.
    const bareName = model.name.includes(":")
      ? model.name.slice(model.name.indexOf(":") + 1)
      : model.name;
    const key = normalizeModelName(bareName);
    if (!key) continue;

    const facts: LiveModelFacts = { source: "openrouter" };
    const context = toFiniteNumber(model.context_length);
    const output = toFiniteNumber(model.top_provider?.max_completion_tokens);
    // OpenRouter pricing is USD per single token, as strings.
    const prompt = toFiniteNumber(model.pricing?.prompt);
    const completion = toFiniteNumber(model.pricing?.completion);
    if (context) facts.contextWindow = context;
    if (output) facts.maxOutputTokens = output;
    // Per-token strings times 1e6 accumulate float noise (0.0000002 becomes
    // 0.19999999999999998 per million) — round to six decimals.
    if (prompt !== undefined) {
      facts.inputPricePerMTokens = Number((prompt * 1_000_000).toFixed(6));
    }
    if (completion !== undefined) {
      facts.outputPricePerMTokens = Number(
        (completion * 1_000_000).toFixed(6)
      );
    }
    if (Array.isArray(model.supported_parameters)) {
      facts.reasoning = model.supported_parameters.includes("reasoning");
    }
    const modalities = toModalities(model.architecture?.input_modalities);
    if (modalities) facts.modalities = modalities;

    byProvider[provider] = byProvider[provider] ?? {};
    // models.dev wins when both catalogs know a model (richer metadata);
    // OpenRouter only fills gaps, so don't overwrite an existing entry here.
    if (!byProvider[provider]![key]) {
      byProvider[provider]![key] = facts;
    }
  }
  return byProvider;
}

export async function fetchLiveModelFacts(
  now = new Date()
): Promise<LiveFactsCatalog> {
  const [modelsDevPayload, openRouterPayload] = await Promise.all([
    fetchJson(MODELS_DEV_URL),
    fetchJson(OPENROUTER_MODELS_URL),
  ]);

  const fromModelsDev = parseModelsDev(modelsDevPayload);
  const fromOpenRouter = parseOpenRouter(openRouterPayload);

  const byProvider: LiveFactsCatalog["byProvider"] = { ...fromModelsDev };
  for (const [provider, models] of Object.entries(fromOpenRouter)) {
    const key = provider as FrontierProvider;
    byProvider[key] = { ...models, ...byProvider[key] };
  }

  return { fetchedAt: now.toISOString(), byProvider };
}

const CHECKED_FACT_KEYS = [
  "contextWindow",
  "maxOutputTokens",
  "inputPricePerMTokens",
  "outputPricePerMTokens",
] as const;

/**
 * Applies live facts onto the curated snapshot, returning a rebuilt snapshot
 * (price tiers and provider/tier summaries recomputed) where every model
 * carries a liveCheck outcome. Editorial fields are never touched.
 */
export function applyLiveModelFacts(
  snapshot: FrontierModelsSnapshot,
  catalog: LiveFactsCatalog
): FrontierModelsSnapshot {
  const providerLabels = {} as Record<FrontierProvider, string>;
  for (const model of snapshot.models) {
    providerLabels[model.provider] = model.providerLabel;
  }

  let updated = 0;
  let confirmed = 0;
  let curatedOnly = 0;

  const source: FrontierSourceModel[] = snapshot.models.map((model) => {
    const facts =
      catalog.byProvider[model.provider]?.[normalizeModelName(model.name)];
    const {
      priceTier: _priceTier,
      providerLabel: _providerLabel,
      ...curated
    } = model;

    if (!facts) {
      curatedOnly += 1;
      return {
        ...curated,
        liveCheck: {
          status: "curated-only" as const,
          checkedAt: catalog.fetchedAt,
          source: null,
        },
      };
    }

    const next = { ...curated };
    if (facts.contextWindow) next.contextWindow = facts.contextWindow;
    if (facts.maxOutputTokens) next.maxOutputTokens = facts.maxOutputTokens;
    if (facts.inputPricePerMTokens !== undefined) {
      next.inputPricePerMTokens = facts.inputPricePerMTokens;
    }
    if (facts.outputPricePerMTokens !== undefined) {
      next.outputPricePerMTokens = facts.outputPricePerMTokens;
    }
    if (facts.knowledgeCutoff) next.knowledgeCutoff = facts.knowledgeCutoff;
    if (facts.releaseDate) next.releaseDate = facts.releaseDate;
    if (facts.reasoning !== undefined) next.reasoning = facts.reasoning;
    if (facts.modalities) next.modalities = facts.modalities;

    const changed = CHECKED_FACT_KEYS.some(
      (key) => (next[key] ?? null) !== (model[key] ?? null)
    );
    if (changed) {
      updated += 1;
    } else {
      confirmed += 1;
    }

    return {
      ...next,
      liveCheck: {
        status: changed ? ("updated" as const) : ("confirmed" as const),
        checkedAt: catalog.fetchedAt,
        source: facts.source,
      },
    };
  });

  const rebuilt = buildFrontierModelsSnapshot(
    source,
    providerLabels,
    catalog.fetchedAt,
    snapshot.sourceLabel,
    snapshot.asOf,
    snapshot.verified
  );

  return {
    ...rebuilt,
    liveFacts: {
      checkedAt: catalog.fetchedAt,
      sources: ["models.dev", "openrouter"],
      updated,
      confirmed,
      curatedOnly,
    },
  };
}
