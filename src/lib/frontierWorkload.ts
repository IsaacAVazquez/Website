import { isRecord } from "@/lib/utils";
import type { FrontierModel } from "@/types/frontierModels";

export const FRONTIER_COMPARISONS_KEY = "frontier-workload-comparisons-v1";
export const FRONTIER_COMPARISON_LIMIT = 20;
export const FRONTIER_MODEL_LIMIT = 4;
export const FRONTIER_WORKLOAD_BOUNDS = {
  monthlyRequests: 1_000_000_000,
  inputTokens: 10_000_000,
  outputTokens: 10_000_000,
};

export interface FrontierWorkloadInput {
  monthlyRequests: number;
  inputTokens: number;
  outputTokens: number;
  vision: boolean;
  audio: boolean;
  reasoning: boolean;
}

export const DEFAULT_FRONTIER_WORKLOAD: FrontierWorkloadInput = {
  monthlyRequests: 10_000,
  inputTokens: 2_000,
  outputTokens: 500,
  vision: false,
  audio: false,
  reasoning: false,
};

export interface FrontierSavedComparison {
  id: string;
  name: string;
  input: FrontierWorkloadInput;
  modelIds: string[];
  savedAt: string;
  snapshotGeneratedAt: string;
}

export function decodeFrontierWorkload(
  value: unknown,
): FrontierWorkloadInput | null {
  if (!isRecord(value)) return null;
  const {
    monthlyRequests,
    inputTokens,
    outputTokens,
    vision,
    audio,
    reasoning,
  } = value;
  for (const [field, limit] of Object.entries(FRONTIER_WORKLOAD_BOUNDS)) {
    const count = value[field];
    if (
      typeof count !== "number" ||
      !Number.isSafeInteger(count) ||
      count < 0 ||
      count > limit
    )
      return null;
  }
  if (
    typeof vision !== "boolean" ||
    typeof audio !== "boolean" ||
    typeof reasoning !== "boolean"
  )
    return null;
  return {
    monthlyRequests: monthlyRequests as number,
    inputTokens: inputTokens as number,
    outputTokens: outputTokens as number,
    vision,
    audio,
    reasoning,
  };
}

function componentCost(
  requests: number,
  tokens: number,
  price: number | null,
): number | null {
  if (requests === 0 || tokens === 0) return 0;
  if (price === null || !Number.isFinite(price) || price < 0) return null;
  const cost = ((requests * tokens) / 1_000_000) * price;
  return Number.isFinite(cost) ? cost : null;
}

export function compareFrontierWorkload(
  model: FrontierModel,
  input: FrontierWorkloadInput,
) {
  const inputCost = componentCost(
    input.monthlyRequests,
    input.inputTokens,
    model.inputPricePerMTokens,
  );
  const outputCost = componentCost(
    input.monthlyRequests,
    input.outputTokens,
    model.outputPricePerMTokens,
  );
  const unmet: string[] = [];
  const unconfirmed: string[] = [];
  for (const modality of ["text", "vision", "audio"] as const) {
    if (
      (modality === "text" || input[modality]) &&
      !model.modalities.includes(modality)
    ) {
      unmet.push(
        `${modality[0].toUpperCase()}${modality.slice(1)} support is not listed.`,
      );
    }
  }
  if (input.reasoning && !model.reasoning)
    unmet.push("Reasoning support is not listed.");
  if (!Number.isFinite(model.contextWindow) || model.contextWindow <= 0) {
    unconfirmed.push("The context window is not published.");
  } else if (input.inputTokens + input.outputTokens > model.contextWindow) {
    unmet.push("Input plus output exceeds the context window.");
  }
  if (input.outputTokens > 0) {
    if (
      model.maxOutputTokens === null ||
      !Number.isFinite(model.maxOutputTokens) ||
      model.maxOutputTokens <= 0
    ) {
      unconfirmed.push("The output limit is not published.");
    } else if (input.outputTokens > model.maxOutputTokens) {
      unmet.push("Requested output exceeds the output limit.");
    }
  }
  return {
    inputCost,
    outputCost,
    totalCost:
      inputCost === null || outputCost === null ? null : inputCost + outputCost,
    unmet,
    unconfirmed,
  };
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    return false;
  return new Date(value).toISOString() === value;
}

const IDENTIFIER = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/;

export function parseFrontierComparisons(
  raw: string,
): FrontierSavedComparison[] {
  try {
    const records: unknown = JSON.parse(raw);
    if (!Array.isArray(records)) return [];
    const result: FrontierSavedComparison[] = [];
    const seen = new Set<string>();
    for (const record of records) {
      if (result.length >= FRONTIER_COMPARISON_LIMIT) break;
      if (
        !isRecord(record) ||
        typeof record.id !== "string" ||
        !IDENTIFIER.test(record.id) ||
        seen.has(record.id) ||
        typeof record.name !== "string" ||
        !record.name.trim() ||
        record.name.length > 80 ||
        !isTimestamp(record.savedAt) ||
        !isTimestamp(record.snapshotGeneratedAt) ||
        !Array.isArray(record.modelIds)
      )
        continue;
      const input = decodeFrontierWorkload(record.input);
      if (
        !input ||
        record.modelIds.some(
          (id: unknown) => typeof id !== "string" || !IDENTIFIER.test(id),
        )
      )
        continue;
      const modelIds = [...new Set<string>(record.modelIds)];
      if (modelIds.length === 0 || modelIds.length > FRONTIER_MODEL_LIMIT)
        continue;
      result.push({
        id: record.id,
        name: record.name.trim(),
        input,
        modelIds,
        savedAt: record.savedAt,
        snapshotGeneratedAt: record.snapshotGeneratedAt,
      });
      seen.add(record.id);
    }
    return result;
  } catch {
    return [];
  }
}
