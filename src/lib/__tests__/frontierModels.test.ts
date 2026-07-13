import type { FrontierProvider } from "@/types/frontierModels";
import {
  blendedPricePerMTokens,
  buildFrontierModelsSnapshot,
  derivePriceTier,
  filterFrontierModels,
  formatPriceUsd,
  formatTokenCount,
  medianContextWindow,
  sortFrontierModels,
  type FrontierSourceModel,
} from "../frontierModels";

const providerLabels: Record<FrontierProvider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  meta: "Meta",
  xai: "xAI",
  deepseek: "DeepSeek",
  mistral: "Mistral",
};

function sourceModel(overrides: Partial<FrontierSourceModel>): FrontierSourceModel {
  return {
    id: "base",
    provider: "openai",
    name: "Base Model",
    releaseDate: "2026-01-01",
    knowledgeCutoff: null,
    contextWindow: 128000,
    maxOutputTokens: 16000,
    inputPricePerMTokens: 2,
    outputPricePerMTokens: 8,
    modalities: ["text"],
    reasoning: false,
    editorialNote: "Fixture model.",
    docsUrl: null,
    ...overrides,
  };
}

    const snapshot = buildFrontierModelsSnapshot(
  [
    sourceModel({
      id: "premium",
      provider: "openai",
      name: "Premium Model",
      releaseDate: "2026-02-01",
      contextWindow: 128000,
      inputPricePerMTokens: 12,
      outputPricePerMTokens: 40,
      modalities: ["text", "vision"],
    }),
    sourceModel({
      id: "budget",
      provider: "anthropic",
      name: "Budget Model",
      releaseDate: "2026-03-01",
      contextWindow: 200000,
      inputPricePerMTokens: 0.25,
      outputPricePerMTokens: 0.75,
      modalities: ["text"],
    }),
    sourceModel({
      id: "standard",
      provider: "google",
      name: "Standard Model",
      releaseDate: "2026-03-01",
      contextWindow: 1000000,
      inputPricePerMTokens: 2,
      outputPricePerMTokens: 6,
      modalities: ["audio", "text"],
    }),
  ],
  providerLabels,
  "2026-05-04T00:00:00.000Z",
  "Fixture source"
);

describe("frontierModels", () => {
  it("derives price tiers from the peak available token price", () => {
    expect(derivePriceTier(null, null)).toBe("standard");
    expect(derivePriceTier(0.25, 0.75)).toBe("budget");
    expect(derivePriceTier(2, 6)).toBe("standard");
    expect(derivePriceTier(12, 6)).toBe("premium");
  });

  it("computes blended token prices with nullable inputs", () => {
    const premiumModel = snapshot.models.find((model) => model.id === "premium")!;

    expect(blendedPricePerMTokens({ ...premiumModel, inputPricePerMTokens: null })).toBe(
      40
    );

    expect(blendedPricePerMTokens({ ...premiumModel, outputPricePerMTokens: null })).toBe(
      12
    );
    expect(
      blendedPricePerMTokens({
        ...premiumModel,
        inputPricePerMTokens: null,
        outputPricePerMTokens: null,
      })
    ).toBeNull();
    expect(blendedPricePerMTokens(premiumModel)).toBe(33);
  });

  it("builds sorted snapshots with provider and tier summaries", () => {
    expect(snapshot.sourceLabel).toBe("Fixture source");
    expect(snapshot.asOf).toBe("2026-05-04");
    expect(snapshot.verified).toBe(false);
    expect(snapshot.models.map((model) => model.id)).toEqual([
      "budget",
      "standard",
      "premium",
    ]);
    expect(snapshot.models.map((model) => model.providerLabel)).toEqual([
      "Anthropic",
      "Google",
      "OpenAI",
    ]);
    expect(snapshot.priceTiers).toEqual([
      { id: "budget", label: "Budget", count: 1 },
      { id: "standard", label: "Standard", count: 1 },
      { id: "premium", label: "Premium", count: 1 },
    ]);
    expect(snapshot.providers.map((entry) => entry.id)).toEqual([
      "anthropic",
      "openai",
      "google",
    ]);
  });

  it("filters by provider, modality, and price tier", () => {
    expect(
      filterFrontierModels(snapshot.models, {
        provider: "all",
        modality: "text",
        priceTier: "budget",
      }).map((model) => model.id)
    ).toEqual(["budget"]);

    expect(
      filterFrontierModels(snapshot.models, {
        provider: "google",
        modality: "audio",
        priceTier: "all",
      }).map((model) => model.id)
    ).toEqual(["standard"]);
  });

  it("sorts models without mutating the input array", () => {
    const originalOrder = snapshot.models.map((model) => model.id);

    expect(sortFrontierModels(snapshot.models, "contextWindow", "asc").map((model) => model.id)).toEqual([
      "premium",
      "budget",
      "standard",
    ]);
    expect(sortFrontierModels(snapshot.models, "name", "desc").map((model) => model.id)).toEqual([
      "standard",
      "premium",
      "budget",
    ]);
    expect(snapshot.models.map((model) => model.id)).toEqual(originalOrder);
  });

  it("formats price, token count, and median context metrics", () => {
    expect(formatTokenCount(999)).toBe("999");
    expect(formatTokenCount(1000)).toBe("1K");
    expect(formatTokenCount(1500000)).toBe("1.5M");

    expect(formatPriceUsd(null)).toBe("\u2014");
    expect(formatPriceUsd(0.25)).toBe("$0.25");
    expect(formatPriceUsd(2)).toBe("$2");
    expect(formatPriceUsd(2.5)).toBe("$2.50");

    expect(medianContextWindow([])).toBe(0);
    expect(medianContextWindow(snapshot.models)).toBe(200000);
    expect(
      medianContextWindow(snapshot.models.filter((model) => model.id !== "standard"))
    ).toBe(164000);
  });
});
