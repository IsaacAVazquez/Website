import type { FrontierModel } from "@/types/frontierModels";

export function makeModel(overrides: Partial<FrontierModel> & Pick<FrontierModel, "id" | "name">): FrontierModel {
  return {
    provider: "anthropic",
    providerLabel: "Anthropic",
    releaseDate: "2026-01-15",
    knowledgeCutoff: "2025-10",
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    inputPricePerMTokens: 3,
    outputPricePerMTokens: 15,
    priceTier: "standard",
    modalities: ["text", "vision"],
    reasoning: false,
    editorialNote: `${overrides.name} editorial note.`,
    docsUrl: null,
    ...overrides,
  };
}

export const MODELS: FrontierModel[] = [
  makeModel({
    id: "alpha",
    name: "Alpha",
    releaseDate: "2026-03-01",
    contextWindow: 1_000_000,
    inputPricePerMTokens: 1.25,
    outputPricePerMTokens: 10,
    reasoning: true,
    docsUrl: "https://example.com/alpha",
  }),
  makeModel({
    id: "bravo",
    name: "Bravo",
    provider: "openai",
    providerLabel: "OpenAI",
    releaseDate: "2025-11-20",
    contextWindow: 128_000,
    maxOutputTokens: null,
    knowledgeCutoff: null,
    inputPricePerMTokens: null,
    outputPricePerMTokens: 0.4,
    modalities: ["text", "audio"],
  }),
  makeModel({
    id: "charlie",
    name: "Charlie",
    provider: "google",
    providerLabel: "Google",
    releaseDate: "2026-01-10",
    contextWindow: 2_000_000,
    inputPricePerMTokens: 5,
    outputPricePerMTokens: 20,
    modalities: ["text"],
  }),
];
