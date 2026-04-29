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

export const FRONTIER_MODELS_SOURCE: FrontierModelSource[] = [
  {
    id: "anthropic-claude-opus-4-7",
    provider: "anthropic",
    name: "Claude Opus 4.7",
    releaseDate: "2026-04-01",
    knowledgeCutoff: "2026-01",
    contextWindow: 200000,
    maxOutputTokens: 32000,
    inputPricePerMTokens: 15,
    outputPricePerMTokens: 75,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "Anthropic's flagship for hard reasoning and agentic work. Premium pricing reflects long-horizon tasks where output quality dominates token spend.",
    docsUrl: "https://docs.anthropic.com",
  },
  {
    id: "anthropic-claude-sonnet-4-6",
    provider: "anthropic",
    name: "Claude Sonnet 4.6",
    releaseDate: "2026-02-15",
    knowledgeCutoff: "2025-10",
    contextWindow: 200000,
    maxOutputTokens: 16000,
    inputPricePerMTokens: 3,
    outputPricePerMTokens: 15,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "The pragmatic default. Strong coding and tool-use performance at a price point that survives production traffic.",
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
    id: "openai-gpt-5",
    provider: "openai",
    name: "GPT-5",
    releaseDate: "2026-03-10",
    knowledgeCutoff: "2025-12",
    contextWindow: 400000,
    maxOutputTokens: 32000,
    inputPricePerMTokens: 10,
    outputPricePerMTokens: 30,
    modalities: ["text", "vision", "audio"],
    reasoning: true,
    editorialNote:
      "OpenAI's tier-collapsed flagship that folds reasoning, vision, and voice into one model card. Strong multimodal coverage; benchmark range is wide.",
    docsUrl: "https://platform.openai.com/docs",
  },
  {
    id: "google-gemini-2-5-pro",
    provider: "google",
    name: "Gemini 2.5 Pro",
    releaseDate: "2026-01-20",
    knowledgeCutoff: "2025-09",
    contextWindow: 2000000,
    maxOutputTokens: 64000,
    inputPricePerMTokens: 2.5,
    outputPricePerMTokens: 10,
    modalities: ["text", "vision", "audio"],
    reasoning: true,
    editorialNote:
      "The long-context outlier: 2M tokens at standard pricing makes whole-codebase or whole-corpus prompts genuinely tractable.",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
  },
  {
    id: "meta-llama-4",
    provider: "meta",
    name: "Llama 4",
    releaseDate: "2025-09-15",
    knowledgeCutoff: "2025-06",
    contextWindow: 128000,
    maxOutputTokens: 8000,
    inputPricePerMTokens: 0.5,
    outputPricePerMTokens: 1.5,
    modalities: ["text", "vision"],
    reasoning: false,
    editorialNote:
      "Open weights with hosted-inference parity from major providers. The price-floor anchor for self-hostable production workloads.",
    docsUrl: "https://llama.meta.com",
  },
  {
    id: "xai-grok-3",
    provider: "xai",
    name: "Grok 3",
    releaseDate: "2026-02-01",
    knowledgeCutoff: "2025-11",
    contextWindow: 128000,
    maxOutputTokens: 8000,
    inputPricePerMTokens: 5,
    outputPricePerMTokens: 15,
    modalities: ["text", "vision"],
    reasoning: true,
    editorialNote:
      "Real-time-leaning frontier model with first-party access to X data. Useful niche when freshness beats benchmark margin.",
    docsUrl: "https://docs.x.ai",
  },
  {
    id: "deepseek-v3",
    provider: "deepseek",
    name: "DeepSeek V3",
    releaseDate: "2025-12-10",
    knowledgeCutoff: "2025-08",
    contextWindow: 128000,
    maxOutputTokens: 8000,
    inputPricePerMTokens: 0.27,
    outputPricePerMTokens: 1.1,
    modalities: ["text"],
    reasoning: true,
    editorialNote:
      "Aggressive price-per-quality. A serious option for cost-driven reasoning workloads when data residency rules permit.",
    docsUrl: "https://api-docs.deepseek.com",
  },
  {
    id: "mistral-large-2",
    provider: "mistral",
    name: "Mistral Large 2",
    releaseDate: "2025-08-01",
    knowledgeCutoff: "2025-04",
    contextWindow: 128000,
    maxOutputTokens: 8000,
    inputPricePerMTokens: 2,
    outputPricePerMTokens: 6,
    modalities: ["text"],
    reasoning: false,
    editorialNote:
      "Europe-headquartered alternative with a clean API and competitive mid-tier pricing. Strong for regulated EU deployments.",
    docsUrl: "https://docs.mistral.ai",
  },
];
