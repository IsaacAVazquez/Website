import type { ReadonlyURLSearchParams } from "next/navigation";
import {
  DEFAULT_DECISION_PRESET_ID,
  getDecisionPresetMetrics,
  isDecisionPresetId,
  type DecisionPresetId,
} from "./decision-lab-data";

export interface DecisionLabState {
  preset: DecisionPresetId;
  impact: number;
  confidence: number;
  effort: number;
  reversibility: number;
}

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

export const DECISION_LAB_ROUTE = "/decision-lab";

export const DEFAULT_DECISION_LAB_STATE: DecisionLabState = {
  preset: DEFAULT_DECISION_PRESET_ID,
  ...getDecisionPresetMetrics(DEFAULT_DECISION_PRESET_ID),
};

function readParam(input: SearchParamInput, key: keyof DecisionLabState): string | null {
  if ("get" in input && typeof input.get === "function") {
    return input.get(key);
  }

  const rawValue = input[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

function normalizeMetric(rawValue: string | null, fallback: number): number {
  if (rawValue === null) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue.trim(), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, parsed));
}

export function normalizeDecisionLabState(input: SearchParamInput): DecisionLabState {
  const rawPreset = readParam(input, "preset");
  const preset = isDecisionPresetId(rawPreset)
    ? rawPreset
    : DEFAULT_DECISION_PRESET_ID;
  const presetMetrics = getDecisionPresetMetrics(preset);

  return {
    preset,
    impact: normalizeMetric(readParam(input, "impact"), presetMetrics.impact),
    confidence: normalizeMetric(readParam(input, "confidence"), presetMetrics.confidence),
    effort: normalizeMetric(readParam(input, "effort"), presetMetrics.effort),
    reversibility: normalizeMetric(
      readParam(input, "reversibility"),
      presetMetrics.reversibility
    ),
  };
}

export function buildDecisionLabHref(state: DecisionLabState): string {
  const params = new URLSearchParams();
  const presetMetrics = getDecisionPresetMetrics(state.preset);

  if (state.preset !== DEFAULT_DECISION_LAB_STATE.preset) {
    params.set("preset", state.preset);
  }
  if (state.impact !== presetMetrics.impact) {
    params.set("impact", String(state.impact));
  }
  if (state.confidence !== presetMetrics.confidence) {
    params.set("confidence", String(state.confidence));
  }
  if (state.effort !== presetMetrics.effort) {
    params.set("effort", String(state.effort));
  }
  if (state.reversibility !== presetMetrics.reversibility) {
    params.set("reversibility", String(state.reversibility));
  }

  const query = params.toString();
  return query ? `${DECISION_LAB_ROUTE}?${query}` : DECISION_LAB_ROUTE;
}
