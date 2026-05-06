import type { FrontierModelsSnapshot } from "@/types/frontierModels";
import {
  buildFrontierModelsHref,
  DEFAULT_FRONTIER_MODELS_STATE,
  normalizeFrontierModelsState,
  resolveFrontierModelsState,
} from "../frontier-models-state";

const snapshot: FrontierModelsSnapshot = {
  generatedAt: "2026-05-04T00:00:00.000Z",
  sourceLabel: "Fixture",
  providers: [{ id: "openai", label: "OpenAI", count: 1 }],
  priceTiers: [{ id: "premium", label: "Premium", count: 1 }],
  models: [
    {
      id: "gpt-fixture",
      provider: "openai",
      providerLabel: "OpenAI",
      name: "GPT Fixture",
      releaseDate: "2026-05-01",
      knowledgeCutoff: null,
      contextWindow: 128000,
      maxOutputTokens: 32000,
      inputPricePerMTokens: 10,
      outputPricePerMTokens: 30,
      priceTier: "premium",
      modalities: ["text"],
      reasoning: true,
      editorialNote: "Fixture model.",
      docsUrl: null,
    },
  ],
};

describe("frontier-models-state", () => {
  it("normalizes invalid params to defaults and trims selected models", () => {
    expect(
      normalizeFrontierModelsState({
        view: "grid",
        provider: "unknown",
        modality: "video",
        tier: "enterprise",
        model: "  gpt-fixture  ",
      })
    ).toEqual({
      ...DEFAULT_FRONTIER_MODELS_STATE,
      selectedModelId: "gpt-fixture",
    });
  });

  it("keeps valid params from URLSearchParams", () => {
    expect(
      normalizeFrontierModelsState(
        new URLSearchParams("view=chart&provider=openai&modality=text&tier=premium")
      )
    ).toEqual({
      view: "chart",
      provider: "openai",
      modality: "text",
      priceTier: "premium",
      selectedModelId: null,
    });
  });

  it("resolves provider and model ids against the loaded snapshot", () => {
    expect(
      resolveFrontierModelsState(
        {
          view: "chart",
          provider: "anthropic",
          modality: "vision",
          priceTier: "budget",
          selectedModelId: "missing-model",
        },
        snapshot
      )
    ).toEqual({
      view: "chart",
      provider: "all",
      modality: "vision",
      priceTier: "budget",
      selectedModelId: null,
    });

    expect(
      resolveFrontierModelsState(
        {
          view: "list",
          provider: "openai",
          modality: "text",
          priceTier: "premium",
          selectedModelId: "gpt-fixture",
        },
        snapshot
      )
    ).toEqual({
      view: "list",
      provider: "openai",
      modality: "text",
      priceTier: "premium",
      selectedModelId: "gpt-fixture",
    });
  });

  it("builds clean hrefs while preserving unrelated params", () => {
    expect(
      buildFrontierModelsHref(
        {
          view: "chart",
          provider: "openai",
          modality: "text",
          priceTier: "premium",
          selectedModelId: "gpt-fixture",
        },
        new URLSearchParams("ref=nav")
      )
    ).toBe(
      "/frontier-models?ref=nav&view=chart&provider=openai&modality=text&tier=premium&model=gpt-fixture"
    );

    expect(
      buildFrontierModelsHref(
        DEFAULT_FRONTIER_MODELS_STATE,
        new URLSearchParams("ref=nav&view=chart&provider=openai&modality=text&tier=premium&model=gpt-fixture")
      )
    ).toBe("/frontier-models?ref=nav");
  });
});
