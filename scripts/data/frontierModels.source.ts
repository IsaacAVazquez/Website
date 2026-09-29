import type {
  FrontierModel,
  FrontierProvider,
} from "../../src/types/frontierModels";

// Curated source-of-truth list for the frontier-models dashboard.
// Prices are USD per 1M tokens, on-demand and non-cached.
// Keep entries fact-checked against each provider's public pricing page.
//
// The 2026-09-28 review read every fact below from the page in `docsUrl`, the
// provider's own changelog, or the provider's own model page. A null
// `knowledgeCutoff` or `maxOutputTokens` means the provider publishes none.
// The editorial notes on the entries added that day only restate what the
// provider says about the model, so they still need an editorial pass.
export type FrontierModelSource = Omit<
  FrontierModel,
  "priceTier" | "providerLabel"
>;

export const PROVIDER_LABELS: Record<FrontierProvider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  meta: "Meta",
  xai: "xAI",
  deepseek: "DeepSeek",
  mistral: "Mistral",
};

export const FRONTIER_MODELS_AS_OF = "2026-09-28";
export const FRONTIER_MODELS_VERIFIED = false;

const ANTHROPIC_DOCS = "https://platform.claude.com/docs/en/about-claude/models/overview";
const OPENAI_DOCS = "https://developers.openai.com/api/docs/models";
const GOOGLE_DOCS = "https://ai.google.dev/gemini-api/docs/models";
const DEEPSEEK_DOCS = "https://api-docs.deepseek.com/quick_start/pricing";
const MISTRAL_DOCS = "https://docs.mistral.ai/models";

export const FRONTIER_MODELS_SOURCE: FrontierModelSource[] = [
  {
    id: "anthropic-claude-fable-5-1",
    provider: "anthropic",
    name: "Claude Fable 5.1",
    releaseDate: "2026-09-01",
    knowledgeCutoff: "2026-06",
    contextWindow: 1000000,
    maxOutputTokens: 128000,
    inputPricePerMTokens: 10,
    outputPricePerMTokens: 50,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "Anthropic's most capable model, which the company points at demanding reasoning and long-running agent work. It shares the highest price on this page with GPT-6 Astra, so I would reach for it where the quality of the answer matters more than the bill.",
    docsUrl: ANTHROPIC_DOCS,
  },
  {
    id: "anthropic-claude-opus-5-5",
    provider: "anthropic",
    name: "Claude Opus 5.5",
    releaseDate: "2026-09-22",
    knowledgeCutoff: "2026-06",
    contextWindow: 1000000,
    maxOutputTokens: 128000,
    inputPricePerMTokens: 4,
    outputPricePerMTokens: 20,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "The model Anthropic recommends starting with for most workloads, built for long-running agentic coding and knowledge work. It carries the same context window and output limit as Fable 5.1 at less than half the price.",
    docsUrl: ANTHROPIC_DOCS,
  },
  {
    id: "anthropic-claude-sonnet-5",
    provider: "anthropic",
    name: "Claude Sonnet 5",
    releaseDate: "2026-06-30",
    knowledgeCutoff: "2026-01",
    contextWindow: 1000000,
    maxOutputTokens: 128000,
    inputPricePerMTokens: 2,
    outputPricePerMTokens: 10,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "The pragmatic default. Strong coding and tool-use performance at a price that survives production traffic, which is why it ends up carrying most real workloads.",
    docsUrl: ANTHROPIC_DOCS,
  },
  {
    id: "anthropic-claude-haiku-4-5",
    provider: "anthropic",
    name: "Claude Haiku 4.5",
    releaseDate: "2025-10-15",
    knowledgeCutoff: "2025-02",
    contextWindow: 200000,
    maxOutputTokens: 64000,
    inputPricePerMTokens: 1,
    outputPricePerMTokens: 5,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "Fast and cheap with a workable context window. Best for batch classification, routing, and the high-volume edges of an agent graph.",
    docsUrl: ANTHROPIC_DOCS,
  },
  {
    id: "openai-gpt-6-astra",
    provider: "openai",
    name: "GPT-6 Astra",
    releaseDate: "2026-09-03",
    knowledgeCutoff: "2026-04-30",
    contextWindow: 1050000,
    maxOutputTokens: 128000,
    inputPricePerMTokens: 10,
    outputPricePerMTokens: 50,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "OpenAI's most capable model, aimed at complex reasoning, coding, and computer use. A prompt past 272K input tokens is billed at twice the input rate, which matters for anyone filling the million-token window.",
    docsUrl: OPENAI_DOCS,
  },
  {
    id: "openai-gpt-6-sol",
    provider: "openai",
    name: "GPT-6 Sol",
    releaseDate: "2026-09-22",
    knowledgeCutoff: "2026-04-20",
    contextWindow: 1050000,
    maxOutputTokens: 128000,
    inputPricePerMTokens: 2,
    outputPricePerMTokens: 10,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "The middle of OpenAI's lineup, built for coding and agentic workflows at a fifth of Astra's price. It is the model OpenAI tells paid Codex users to pick.",
    docsUrl: OPENAI_DOCS,
  },
  {
    id: "openai-gpt-6-luna",
    provider: "openai",
    name: "GPT-6 Luna",
    releaseDate: "2026-09-22",
    knowledgeCutoff: "2026-05-18",
    contextWindow: 1050000,
    maxOutputTokens: 128000,
    inputPricePerMTokens: 0.1,
    outputPricePerMTokens: 0.5,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "OpenAI's cheapest current model, meant for focused, high-volume tasks. It keeps the same context window and output limit as the two larger models.",
    docsUrl: OPENAI_DOCS,
  },
  {
    id: "google-gemini-3-8-flash",
    provider: "google",
    name: "Gemini 3.8 Flash",
    releaseDate: "2026-09-02",
    knowledgeCutoff: null,
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    inputPricePerMTokens: 0.75,
    outputPricePerMTokens: 3.75,
    modalities: ["text", "vision", "audio"],
    reasoning: true,
    editorialNote:
      "Google's newest generally available model, which it calls its most intelligent Flash model. The listed price holds through December 31, 2026 and doubles on January 1, 2027.",
    docsUrl: GOOGLE_DOCS,
  },
  {
    // The name carries "Preview" because Google's does, and because the
    // automated check matches a catalog entry on the exact name.
    id: "google-gemini-3-1-pro",
    provider: "google",
    name: "Gemini 3.1 Pro Preview",
    releaseDate: "2026-02-19",
    knowledgeCutoff: null,
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    inputPricePerMTokens: 2,
    outputPricePerMTokens: 12,
    modalities: ["text", "vision", "audio"],
    reasoning: true,
    editorialNote:
      "The long-context option, with tiered pricing that steps up past 200K tokens and native multimodal input including audio. The thinking budget is adjustable per request, and Google still lists the model as a preview.",
    docsUrl: GOOGLE_DOCS,
  },
  {
    id: "meta-muse-spark-1-3",
    provider: "meta",
    name: "Muse Spark 1.3",
    releaseDate: "2026-09-02",
    knowledgeCutoff: null,
    contextWindow: 1000000,
    maxOutputTokens: null,
    inputPricePerMTokens: 1.25,
    outputPricePerMTokens: 4.25,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "Meta's current model on its own API, trained for long-horizon coding and agent work. Meta also sells a contributor tier at a lower price, where prompts are used to improve its products.",
    docsUrl: "https://dev.meta.ai/models/muse-spark",
  },
  {
    id: "xai-grok-4-7",
    provider: "xai",
    name: "Grok 4.7",
    releaseDate: "2026-09-21",
    knowledgeCutoff: "2026-05",
    contextWindow: 500000,
    maxOutputTokens: null,
    inputPricePerMTokens: 2,
    outputPricePerMTokens: 6,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "xAI's coding-focused flagship pairs a 500K window with unusually low output pricing. First-party access to X data stays its clearest niche when freshness matters more than benchmark margin.",
    docsUrl: "https://docs.x.ai/developers/models",
  },
  {
    // DeepSeek bills a peak rate and an off-peak rate at half of it. The
    // catalogs carry other figures, so the peak rate from DeepSeek's own
    // pricing page is pinned.
    id: "deepseek-v4-pro",
    provider: "deepseek",
    name: "DeepSeek V4 Pro",
    releaseDate: "2026-08-13",
    knowledgeCutoff: null,
    contextWindow: 1000000,
    maxOutputTokens: 384000,
    inputPricePerMTokens: 1.32,
    outputPricePerMTokens: 3.96,
    pinnedFacts: ["inputPricePerMTokens", "outputPricePerMTokens"],
    modalities: ["text"],
    reasoning: true,
    editorialNote:
      "DeepSeek's larger model, with a million-token context window and thinking modes built in. The listed price is the peak rate, and off-peak hours are billed at half of it.",
    docsUrl: DEEPSEEK_DOCS,
  },
  {
    id: "deepseek-v4-1-flash",
    provider: "deepseek",
    name: "DeepSeek V4.1 Flash",
    releaseDate: "2026-09-10",
    knowledgeCutoff: null,
    contextWindow: 1000000,
    maxOutputTokens: 384000,
    inputPricePerMTokens: 0.3,
    outputPricePerMTokens: 1.2,
    pinnedFacts: ["inputPricePerMTokens", "outputPricePerMTokens"],
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "DeepSeek's smaller model, which added image input and replaced V4 Flash. The listed price is the peak rate, and off-peak hours are billed at half of it.",
    docsUrl: DEEPSEEK_DOCS,
  },
  {
    id: "mistral-medium-3-5",
    provider: "mistral",
    name: "Mistral Medium 3.5",
    releaseDate: "2026-04-28",
    knowledgeCutoff: null,
    contextWindow: 256000,
    maxOutputTokens: null,
    inputPricePerMTokens: 1.5,
    outputPricePerMTokens: 7.5,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "The model Mistral calls frontier-class, tuned for agentic and coding work and released as open weights under a modified MIT license.",
    docsUrl: MISTRAL_DOCS,
  },
  {
    id: "mistral-large-3",
    provider: "mistral",
    name: "Mistral Large 3",
    releaseDate: "2025-12-02",
    knowledgeCutoff: null,
    contextWindow: 256000,
    maxOutputTokens: null,
    inputPricePerMTokens: 0.5,
    outputPricePerMTokens: 1.5,
    modalities: ["text", "vision"],
    reasoning: false,
    editorialNote:
      "A Europe-headquartered, open-weight option that is multimodal now and priced low per token. Good for regulated EU deployments.",
    docsUrl: MISTRAL_DOCS,
  },
];
