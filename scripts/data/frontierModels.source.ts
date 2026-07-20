import type {
  FrontierModel,
  FrontierProvider,
} from "../../src/types/frontierModels";

// Curated source-of-truth list for the frontier-models dashboard.
// Prices are USD per 1M tokens, on-demand and non-cached.
// Keep entries fact-checked against each provider's public pricing page.
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

export const FRONTIER_MODELS_AS_OF = "2026-07-20";
export const FRONTIER_MODELS_VERIFIED = false;

export const FRONTIER_MODELS_SOURCE: FrontierModelSource[] = [
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
    editorialNote:
      "Anthropic's flagship for hard reasoning and long-horizon agentic work. The premium price reflects tasks where output quality dominates token spend rather than raw volume.",
    docsUrl: "https://docs.anthropic.com",
  },
  {
    id: "anthropic-claude-sonnet-5",
    provider: "anthropic",
    name: "Claude Sonnet 5",
    releaseDate: "2026-05-01",
    knowledgeCutoff: "2025-12",
    contextWindow: 200000,
    maxOutputTokens: 32000,
    inputPricePerMTokens: 3,
    outputPricePerMTokens: 15,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "The pragmatic default. Strong coding and tool-use performance at a price that survives production traffic, which is why it ends up carrying most real workloads.",
    docsUrl: "https://docs.anthropic.com",
  },
  {
    id: "anthropic-claude-haiku-4-5",
    provider: "anthropic",
    name: "Claude Haiku 4.5",
    releaseDate: "2025-10-01",
    knowledgeCutoff: "2025-07",
    contextWindow: 200000,
    maxOutputTokens: 8000,
    inputPricePerMTokens: 1,
    outputPricePerMTokens: 5,
    modalities: ["text", "vision"],
    reasoning: false,
    editorialNote:
      "Fast and cheap with a workable context window. Best for batch classification, routing, and the high-volume edges of an agent graph.",
    docsUrl: "https://docs.anthropic.com",
  },
  {
    id: "openai-gpt-5-6",
    provider: "openai",
    name: "GPT-5.6",
    releaseDate: "2026-07-09",
    knowledgeCutoff: "2026-02",
    contextWindow: 1050000,
    maxOutputTokens: 128000,
    inputPricePerMTokens: 5,
    outputPricePerMTokens: 30,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "OpenAI's unified flagship folds reasoning, vision, and a million-token window into one model card with a tunable effort control. The context jump closed most of the gap to Gemini on long inputs.",
    docsUrl: "https://platform.openai.com/docs",
  },
  {
    id: "google-gemini-3-1-pro",
    provider: "google",
    name: "Gemini 3.1 Pro",
    releaseDate: "2026-06-01",
    knowledgeCutoff: "2025-01",
    contextWindow: 1048576,
    maxOutputTokens: 64000,
    inputPricePerMTokens: 2,
    outputPricePerMTokens: 12,
    modalities: ["text", "vision", "audio"],
    reasoning: true,
    editorialNote:
      "The long-context option, with tiered pricing that steps up past 200K tokens and native multimodal input including audio. The thinking budget is adjustable per request.",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
  },
  {
    id: "meta-llama-4-maverick",
    provider: "meta",
    name: "Llama 4 Maverick",
    releaseDate: "2025-04-05",
    knowledgeCutoff: "2024-08",
    contextWindow: 1000000,
    maxOutputTokens: 8000,
    inputPricePerMTokens: 0.5,
    outputPricePerMTokens: 1.5,
    modalities: ["text", "vision"],
    reasoning: false,
    editorialNote:
      "Open weights with hosted-inference parity across the major providers and a 1M-token window. It remains the price-floor anchor for teams that want to self-host or shop inference around. Listed pricing reflects typical hosted rates rather than a first-party rate card.",
    docsUrl: "https://llama.meta.com",
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
    editorialNote:
      "xAI's coding-focused flagship pairs a 500K window with unusually low output pricing. First-party access to X data stays its clearest niche when freshness matters more than benchmark margin.",
    docsUrl: "https://docs.x.ai",
  },
  {
    id: "deepseek-v4",
    provider: "deepseek",
    name: "DeepSeek V4",
    releaseDate: "2026-04-24",
    knowledgeCutoff: null,
    contextWindow: 1000000,
    maxOutputTokens: 64000,
    inputPricePerMTokens: 0.27,
    outputPricePerMTokens: 1.1,
    modalities: ["text"],
    reasoning: true,
    editorialNote:
      "Aggressive price per unit of quality with a context window that grew to a million tokens. R1's reasoning now lives inside V4's thinking modes, so it stays the cost floor for reasoning work where data-residency rules allow it.",
    docsUrl: "https://api-docs.deepseek.com",
  },
  {
    id: "mistral-large-3",
    provider: "mistral",
    name: "Mistral Large 3",
    releaseDate: "2025-12-02",
    knowledgeCutoff: null,
    contextWindow: 256000,
    maxOutputTokens: 32000,
    inputPricePerMTokens: 0.5,
    outputPricePerMTokens: 1.5,
    modalities: ["text", "vision"],
    reasoning: false,
    editorialNote:
      "A Europe-headquartered, open-weight option that is multimodal now and priced low per token. Good for regulated EU deployments, though a dedicated reasoning variant is still on the way.",
    docsUrl: "https://docs.mistral.ai",
  },
];
