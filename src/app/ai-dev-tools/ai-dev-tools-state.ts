import {
  aiDevTools,
  type AiDevToolCategory,
  type AiDevToolModelSupport,
  type AiDevToolPricingModel,
  type AiDevToolSourceStatus,
} from "./ai-dev-tools-data";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

export const AI_DEV_TOOLS_ROUTE = "/ai-dev-tools";

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

const CATEGORIES = aiDevTools.map((tool) => tool.category);
const PRICING = aiDevTools.map((tool) => tool.pricingModel);
const MODELS = aiDevTools.map((tool) => tool.modelSupport);
const SOURCES = aiDevTools.map((tool) => tool.sourceStatus);
const TOOL_IDS = aiDevTools.map((tool) => tool.id);

export function normalizeAiDevToolsState(
  input: SearchParamInput
): AiDevToolsRouteState {
  return {
    category: readEnum(input, "category", CATEGORIES, DEFAULT_AI_DEV_TOOLS_STATE.category),
    pricing: readEnum(input, "pricing", PRICING, DEFAULT_AI_DEV_TOOLS_STATE.pricing),
    model: readEnum(input, "model", MODELS, DEFAULT_AI_DEV_TOOLS_STATE.model),
    source: readEnum(input, "source", SOURCES, DEFAULT_AI_DEV_TOOLS_STATE.source),
    query: (readParam(input, "q") ?? "").trim().slice(0, 80),
    selectedToolId: readEnum(input, "tool", TOOL_IDS, DEFAULT_AI_DEV_TOOLS_STATE.selectedToolId),
  };
}

export function buildAiDevToolsHref(state: AiDevToolsRouteState): string {
  return buildHref(
    AI_DEV_TOOLS_ROUTE,
    {
      category: state.category,
      pricing: state.pricing,
      model: state.model,
      source: state.source,
      q: state.query.trim(),
      tool: state.selectedToolId || null,
    },
    { ...DEFAULT_AI_DEV_TOOLS_STATE, q: "" }
  );
}
