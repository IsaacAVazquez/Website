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

describe("applyLiveModelFacts against catalog entries saved on 2026-09-27", () => {
  // Copied from models.dev's api.json as it answered on 2026-09-27.
  const savedModelsDev = {
    ...makeModelsDevPayload(),
    mistral: {
      models: {
        "mistral-large-2512": {
          name: "Mistral Large 3",
          reasoning: false,
          knowledge: "2024-11",
          release_date: "2024-11-01",
          modalities: { input: ["text", "image"] },
          cost: { input: 0.5, output: 1.5 },
          limit: { context: 262144, output: 262144 },
        },
      },
    },
    xai: {
      models: {
        "grok-4.5": {
          name: "Grok 4.5",
          reasoning: true,
          release_date: "2026-07-08",
          modalities: { input: ["text", "image", "pdf"] },
          cost: { input: 2, output: 6 },
          limit: { context: 500000, output: 500000 },
        },
      },
    },
    openai: {
      models: {
        "gpt-5.6": {
          name: "GPT-5.6",
          reasoning: true,
          knowledge: "2026-02-16",
          release_date: "2026-07-09",
          modalities: { input: ["text", "image", "pdf"] },
          cost: { input: 4, output: 20 },
          limit: { context: 1050000, output: 128000 },
        },
      },
    },
    anthropic: {
      models: {
        "claude-haiku-4-5-20251001": {
          name: "Claude Haiku 4.5",
          reasoning: true,
          knowledge: "2025-02-28",
          release_date: "2025-10-15",
          modalities: { input: ["text", "image", "pdf"] },
          cost: { input: 1, output: 5 },
          limit: { context: 200000, output: 64000 },
        },
      },
    },
  };

  const curated = {
    modalities: ["text" as const, "vision" as const],
    editorialNote: "Kept verbatim.",
    docsUrl: null,
  };

  // The first three carry the committed seed's values. GPT-5.6 carries the
  // catalog's prices so its knowledge cutoff is the only fact that differs.
  const snapshot = buildFrontierModelsSnapshot(
    [
      {
        ...curated,
        id: "mistral-large-3",
        provider: "mistral",
        name: "Mistral Large 3",
        releaseDate: "2025-12-02",
        knowledgeCutoff: null,
        contextWindow: 256000,
        maxOutputTokens: 32000,
        inputPricePerMTokens: 0.5,
        outputPricePerMTokens: 1.5,
        reasoning: false,
      },
      {
        ...curated,
        id: "xai-grok-4-5",
        provider: "xai",
        name: "Grok 4.5",
        releaseDate: "2026-07-01",
        knowledgeCutoff: "2026-02",
        contextWindow: 500000,
        maxOutputTokens: 32000,
        inputPricePerMTokens: 2,
        outputPricePerMTokens: 6,
        reasoning: true,
      },
      {
        ...curated,
        id: "anthropic-claude-haiku-4-5",
        provider: "anthropic",
        name: "Claude Haiku 4.5",
        releaseDate: "2025-10-01",
        knowledgeCutoff: "2025-07",
        contextWindow: 200000,
        maxOutputTokens: 8000,
        inputPricePerMTokens: 1,
        outputPricePerMTokens: 5,
        reasoning: false,
      },
      {
        ...curated,
        id: "openai-gpt-5-6",
        provider: "openai",
        name: "GPT-5.6",
        releaseDate: "2026-07-09",
        knowledgeCutoff: "2026-02",
        contextWindow: 1050000,
        maxOutputTokens: 128000,
        inputPricePerMTokens: 4,
        outputPricePerMTokens: 20,
        reasoning: true,
      },
    ],
    {
      anthropic: "Anthropic",
      openai: "OpenAI",
      google: "Google",
      meta: "Meta",
      xai: "xAI",
      deepseek: "DeepSeek",
      mistral: "Mistral",
    },
    "2026-07-20T00:00:00.000Z"
  );

  async function check() {
    jest.spyOn(global, "fetch").mockImplementation((input: unknown) =>
      Promise.resolve(
        Response.json(
          String(input).includes("models.dev")
            ? savedModelsDev
            : makeOpenRouterPayload()
        )
      )
    );
    const catalog = await fetchLiveModelFacts(new Date("2026-09-27T19:03:00Z"));
    const next = applyLiveModelFacts(snapshot, catalog);
    return (id: string) => next.models.find((model) => model.id === id);
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("leaves the curated release date alone", async () => {
    const model = await check();

    expect(model("mistral-large-3")?.releaseDate).toBe("2025-12-02");
    expect(model("xai-grok-4-5")?.releaseDate).toBe("2026-07-01");
  });

  it("counts a changed knowledge cutoff as an update", async () => {
    const model = await check();

    expect(model("openai-gpt-5-6")?.knowledgeCutoff).toBe("2026-02-16");
    expect(model("openai-gpt-5-6")?.liveCheck?.status).toBe("updated");
  });

  it("skips an output limit that repeats the context window", async () => {
    const model = await check();

    expect(model("mistral-large-3")?.contextWindow).toBe(262144);
    expect(model("mistral-large-3")?.maxOutputTokens).toBe(32000);
    expect(model("xai-grok-4-5")?.maxOutputTokens).toBe(32000);
    expect(model("xai-grok-4-5")?.liveCheck?.status).toBe("confirmed");
  });

  it("still applies an output limit the catalog states on its own", async () => {
    const model = await check();

    expect(model("anthropic-claude-haiku-4-5")?.maxOutputTokens).toBe(64000);
    expect(model("anthropic-claude-haiku-4-5")?.liveCheck?.status).toBe("updated");
  });

  it("leaves a pinned fact at its curated value", async () => {
    // DeepSeek's own page and the catalogs disagree on its prices, so a fact
    // read from the provider can be pinned against the catalog.
    jest.spyOn(global, "fetch").mockImplementation((input: unknown) =>
      Promise.resolve(
        Response.json(
          String(input).includes("models.dev")
            ? savedModelsDev
            : makeOpenRouterPayload()
        )
      )
    );
    const catalog = await fetchLiveModelFacts(new Date("2026-09-27T19:03:00Z"));
    const next = applyLiveModelFacts(
      {
        ...snapshot,
        models: snapshot.models.map((entry) =>
          entry.id === "anthropic-claude-haiku-4-5"
            ? { ...entry, pinnedFacts: ["maxOutputTokens" as const] }
            : entry
        ),
      },
      catalog
    );
    const haiku = next.models.find(
      (entry) => entry.id === "anthropic-claude-haiku-4-5"
    );

    expect(haiku?.maxOutputTokens).toBe(8000);
    expect(haiku?.knowledgeCutoff).toBe("2025-02-28");
  });
});
