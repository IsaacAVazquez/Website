/**
 * @jest-environment node
 */
import { buildFrontierModelsSnapshot } from "@/lib/frontierModels";
import {
  applyLiveModelFacts,
  fetchLiveModelFacts,
  normalizeModelName,
  type LiveFactsCatalog,
} from "@/lib/frontierModelsLive";

describe("normalizeModelName", () => {
  it("collapses names to a conservative comparison key", () => {
    expect(normalizeModelName("Claude Opus 4.8")).toBe("claudeopus48");
    expect(normalizeModelName("claude-opus-4.8")).toBe("claudeopus48");
    expect(normalizeModelName("GPT-5.6")).toBe("gpt56");
    // Distinct versions stay distinct — no substring matching anywhere.
    expect(normalizeModelName("GPT-5")).not.toBe(normalizeModelName("GPT-5.6"));
  });
});

function makeModelsDevPayload() {
  return {
    anthropic: {
      models: {
        "claude-opus-4.8": {
          name: "Claude Opus 4.8",
          reasoning: true,
          knowledge: "2026-02",
          release_date: "2026-06-01",
          modalities: { input: ["text", "image"] },
          cost: { input: 18, output: 90 },
          limit: { context: 300000, output: 64000 },
        },
      },
    },
    openai: { models: {} },
    google: { models: {} },
    mistral: { models: {} },
    deepseek: { models: {} },
    xai: { models: {} },
  };
}

function makeOpenRouterPayload() {
  const filler = Array.from({ length: 60 }, (_, index) => ({
    id: `other/model-${index}`,
    name: `Other: Model ${index}`,
    context_length: 8192,
    pricing: { prompt: "0.000001", completion: "0.000002" },
  }));
  return {
    data: [
      ...filler,
      {
        id: "anthropic/claude-opus-4.8",
        name: "Anthropic: Claude Opus 4.8",
        context_length: 200000,
        pricing: { prompt: "0.000015", completion: "0.000075" },
        top_provider: { max_completion_tokens: 32000 },
        architecture: { input_modalities: ["text", "image"] },
        supported_parameters: ["reasoning"],
      },
      {
        id: "x-ai/grok-4.5",
        name: "xAI: Grok 4.5",
        context_length: 500000,
        pricing: { prompt: "0.000002", completion: "0.000006" },
        top_provider: { max_completion_tokens: 32000 },
        architecture: { input_modalities: ["text", "image"] },
        supported_parameters: [],
      },
    ],
  };
}

describe("fetchLiveModelFacts", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockCatalogFetch(
    modelsDev: unknown = makeModelsDevPayload(),
    openRouter: unknown = makeOpenRouterPayload()
  ) {
    return jest
      .spyOn(global, "fetch")
      .mockImplementation((input: unknown) => {
        const url = String(input);
        const payload = url.includes("models.dev") ? modelsDev : openRouter;
        return Promise.resolve(
          new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        );
      });
  }

  it("merges both catalogs with models.dev taking precedence", async () => {
    mockCatalogFetch();

    const catalog = await fetchLiveModelFacts(new Date("2026-07-20T07:30:00Z"));

    // models.dev entry wins for Opus even though OpenRouter also lists it.
    const opus = catalog.byProvider.anthropic?.claudeopus48;
    expect(opus?.source).toBe("models.dev");
    expect(opus?.contextWindow).toBe(300000);
    expect(opus?.inputPricePerMTokens).toBe(18);
    expect(opus?.knowledgeCutoff).toBe("2026-02");

    // OpenRouter fills providers models.dev did not cover, with per-token
    // string pricing converted to per-million.
    const grok = catalog.byProvider.xai?.grok45;
    expect(grok?.source).toBe("openrouter");
    expect(grok?.contextWindow).toBe(500000);
    expect(grok?.inputPricePerMTokens).toBeCloseTo(2);
    expect(grok?.outputPricePerMTokens).toBeCloseTo(6);
  });

  it("throws on an implausibly small models.dev payload", async () => {
    mockCatalogFetch({ anthropic: { models: {} } });

    await expect(fetchLiveModelFacts()).rejects.toThrow(/few providers/);
  });

  it("throws on an implausibly small OpenRouter payload", async () => {
    mockCatalogFetch(makeModelsDevPayload(), { data: [{ id: "a/b" }] });

    await expect(fetchLiveModelFacts()).rejects.toThrow(/few models/);
  });
});

describe("applyLiveModelFacts", () => {
  const providerLabels = {
    anthropic: "Anthropic",
    openai: "OpenAI",
    google: "Google",
    meta: "Meta",
    xai: "xAI",
    deepseek: "DeepSeek",
    mistral: "Mistral",
  } as const;

  const snapshot = buildFrontierModelsSnapshot(
    [
      {
        id: "anthropic-claude-opus-4-8",
        provider: "anthropic",
        name: "Claude Opus 4.8",
        releaseDate: "2026-06-01",
        knowledgeCutoff: "2026-01",
        contextWindow: 200000,
        maxOutputTokens: 64000,
        inputPricePerMTokens: 15,
        outputPricePerMTokens: 75,
        modalities: ["text", "vision"],
        reasoning: true,
        editorialNote: "Kept verbatim.",
        docsUrl: "https://docs.anthropic.com",
      },
      {
        id: "xai-grok-4-5",
        provider: "xai",
        name: "Grok 4.5",
        releaseDate: "2026-07-01",
        knowledgeCutoff: "2026-02",
        contextWindow: 500000,
        maxOutputTokens: 32000,
        inputPricePerMTokens: 2,
        outputPricePerMTokens: 6,
        modalities: ["text", "vision"],
        reasoning: true,
        editorialNote: "Also kept verbatim.",
        docsUrl: "https://docs.x.ai",
      },
      {
        id: "mistral-nowhere",
        provider: "mistral",
        name: "Nowhere Large",
        releaseDate: "2026-05-01",
        knowledgeCutoff: null,
        contextWindow: 128000,
        maxOutputTokens: 16000,
        inputPricePerMTokens: 1,
        outputPricePerMTokens: 3,
        modalities: ["text"],
        reasoning: false,
        editorialNote: "No catalog knows this one.",
        docsUrl: null,
      },
    ],
    providerLabels,
    "2026-07-20T00:00:00.000Z",
    "Curated by Isaac Vazquez",
    "2026-07-20",
    false
  );

  const catalog: LiveFactsCatalog = {
    fetchedAt: "2026-07-20T07:30:00.000Z",
    byProvider: {
      anthropic: {
        claudeopus48: {
          source: "models.dev",
          contextWindow: 300000,
          inputPricePerMTokens: 18,
          outputPricePerMTokens: 90,
          knowledgeCutoff: "2026-02",
        },
      },
      xai: {
        grok45: {
          source: "openrouter",
          contextWindow: 500000,
          maxOutputTokens: 32000,
          inputPricePerMTokens: 2,
          outputPricePerMTokens: 6,
        },
      },
    },
  };

  it("updates facts, preserves curation, and stamps per-model outcomes", () => {
    const next = applyLiveModelFacts(snapshot, catalog);

    const opus = next.models.find((model) => model.id.includes("opus"));
    expect(opus?.contextWindow).toBe(300000);
    expect(opus?.inputPricePerMTokens).toBe(18);
    expect(opus?.editorialNote).toBe("Kept verbatim.");
    expect(opus?.liveCheck?.status).toBe("updated");
    // Price tier recomputed from the corrected pricing.
    expect(opus?.priceTier).toBe("premium");

    const grok = next.models.find((model) => model.id.includes("grok"));
    expect(grok?.liveCheck?.status).toBe("confirmed");

    const unmatched = next.models.find((model) => model.id.includes("nowhere"));
    expect(unmatched?.liveCheck?.status).toBe("curated-only");
    expect(unmatched?.contextWindow).toBe(128000);

    expect(next.liveFacts).toEqual({
      checkedAt: "2026-07-20T07:30:00.000Z",
      sources: ["models.dev", "openrouter"],
      updated: 1,
      confirmed: 1,
      curatedOnly: 1,
    });

    // Curated review provenance is untouched by the automated check.
    expect(next.asOf).toBe("2026-07-20");
    expect(next.verified).toBe(false);
    expect(next.sourceLabel).toBe("Curated by Isaac Vazquez");
  });
});
