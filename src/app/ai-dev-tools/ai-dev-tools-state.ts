import type { ReadonlyURLSearchParams } from "next/navigation";
import {
  aiDevTools,
  type AiDevToolCategory,
  type AiDevToolModelSupport,
  type AiDevToolPricingModel,
  type AiDevToolSourceStatus,
} from "./ai-dev-tools-data";

export const AI_DEV_TOOLS_ROUTE = "/ai-dev-tools";

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export interface AiDevToolsRouteState {
  category: AiDevToolCategory | "all";
  pricing: AiDevToolPricingModel | "all";
  model: AiDevToolModelSupport | "all";
  source: AiDevToolSourceStatus | "all";
  query: string;
  selectedToolId: string | null;
}

export const DEFAULT_AI_DEV_TOOLS_STATE: AiDevToolsRouteState = {
  category: "all",
  pricing: "all",
  model: "all",
  source: "all",
  query: "",
  selectedToolId: null,
};

const VALID_CATEGORIES = new Set<AiDevToolCategory>(
  aiDevTools.map((tool) => tool.category)
);
const VALID_PRICING = new Set<AiDevToolPricingModel>(
  aiDevTools.map((tool) => tool.pricingModel)
);
const VALID_MODELS = new Set<AiDevToolModelSupport>(
  aiDevTools.map((tool) => tool.modelSupport)
);
const VALID_SOURCES = new Set<AiDevToolSourceStatus>(
  aiDevTools.map((tool) => tool.sourceStatus)
);
const VALID_TOOL_IDS = new Set(aiDevTools.map((tool) => tool.id));

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

function cleanQuery(value: string | null): string {
  if (!value) {
    return "";
  }
  return value.trim().slice(0, 80);
}

export function normalizeAiDevToolsState(
  input: SearchParamInput
): AiDevToolsRouteState {
  const category = readParam(input, "category");
  const pricing = readParam(input, "pricing");
  const model = readParam(input, "model");
  const source = readParam(input, "source");
  const tool = readParam(input, "tool");

  return {
    category: VALID_CATEGORIES.has((category ?? "") as AiDevToolCategory)
      ? (category as AiDevToolCategory)
      : DEFAULT_AI_DEV_TOOLS_STATE.category,
    pricing: VALID_PRICING.has((pricing ?? "") as AiDevToolPricingModel)
      ? (pricing as AiDevToolPricingModel)
      : DEFAULT_AI_DEV_TOOLS_STATE.pricing,
    model: VALID_MODELS.has((model ?? "") as AiDevToolModelSupport)
      ? (model as AiDevToolModelSupport)
      : DEFAULT_AI_DEV_TOOLS_STATE.model,
    source: VALID_SOURCES.has((source ?? "") as AiDevToolSourceStatus)
      ? (source as AiDevToolSourceStatus)
      : DEFAULT_AI_DEV_TOOLS_STATE.source,
    query: cleanQuery(readParam(input, "q")),
    selectedToolId:
      tool && VALID_TOOL_IDS.has(tool) ? tool : DEFAULT_AI_DEV_TOOLS_STATE.selectedToolId,
  };
}

export function buildAiDevToolsHref(state: AiDevToolsRouteState): string {
  const params = new URLSearchParams();

  if (state.category !== DEFAULT_AI_DEV_TOOLS_STATE.category) {
    params.set("category", state.category);
  }
  if (state.pricing !== DEFAULT_AI_DEV_TOOLS_STATE.pricing) {
    params.set("pricing", state.pricing);
  }
  if (state.model !== DEFAULT_AI_DEV_TOOLS_STATE.model) {
    params.set("model", state.model);
  }
  if (state.source !== DEFAULT_AI_DEV_TOOLS_STATE.source) {
    params.set("source", state.source);
  }
  if (state.query.trim().length > 0) {
    params.set("q", state.query.trim());
  }
  if (state.selectedToolId) {
    params.set("tool", state.selectedToolId);
  }

  const query = params.toString();
  return `${AI_DEV_TOOLS_ROUTE}${query ? `?${query}` : ""}`;
}
