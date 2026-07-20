export type AiDevToolCategory =
  | "ide"
  | "editor-extension"
  | "terminal-agent"
  | "cloud-agent"
  | "review-ci"
  | "enterprise-platform";

export type AiDevToolPricingModel =
  | "free"
  | "freemium"
  | "subscription"
  | "usage-based"
  | "enterprise";

export type AiDevToolModelSupport =
  | "single-provider"
  | "curated-multi-model"
  | "byok-multi-provider"
  | "local-models"
  | "undisclosed";

export type AiDevToolSourceStatus =
  | "open-source"
  | "public-repo"
  | "proprietary";

export type AiDevToolCadence =
  | "daily"
  | "weekly"
  | "monthly"
  | "managed"
  | "slow";

export interface AiDevToolSource {
  label: string;
  url: string;
}

export interface AiDevTool {
  id: string;
  name: string;
  company: string;
  tagline: string;
  category: AiDevToolCategory;
  surfaces: string[];
  pricingModel: AiDevToolPricingModel;
  pricingSummary: string;
  modelSupport: AiDevToolModelSupport;
  modelSummary: string;
  sourceStatus: AiDevToolSourceStatus;
  githubRepo: string | null;
  githubStars: number | null;
  latestRelease: string | null;
  releaseCadence: AiDevToolCadence;
  releaseSummary: string;
  status: "active" | "transition" | "enterprise-focused";
  bestFor: string;
  watchOut: string;
  website: string;
  sourceUrls: AiDevToolSource[];
}

export const AI_DEV_TOOLS_GENERATED_AT = "2026-04-28T19:00:00.000Z";
export const AI_DEV_TOOLS_VERIFIED = false;

export const AI_DEV_TOOL_CATEGORY_LABELS: Record<AiDevToolCategory, string> = {
  ide: "AI IDE",
  "editor-extension": "Editor extension",
  "terminal-agent": "Terminal agent",
  "cloud-agent": "Cloud agent",
  "review-ci": "Review and CI",
  "enterprise-platform": "Enterprise platform",
};

export const AI_DEV_TOOL_PRICING_LABELS: Record<AiDevToolPricingModel, string> = {
  free: "Free",
  freemium: "Freemium",
  subscription: "Subscription",
  "usage-based": "Usage based",
  enterprise: "Enterprise",
};

export const AI_DEV_TOOL_MODEL_LABELS: Record<AiDevToolModelSupport, string> = {
  "single-provider": "Single provider",
  "curated-multi-model": "Curated models",
  "byok-multi-provider": "BYOK multi-provider",
  "local-models": "Local-capable",
  undisclosed: "Undisclosed",
};

export const AI_DEV_TOOL_SOURCE_LABELS: Record<AiDevToolSourceStatus, string> = {
  "open-source": "Open source",
  "public-repo": "Public repo",
  proprietary: "Proprietary",
};

export const AI_DEV_TOOL_CADENCE_LABELS: Record<AiDevToolCadence, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  managed: "Managed",
  slow: "Slow",
};

export const aiDevTools: AiDevTool[] = [
  {
    id: "cursor",
    name: "Cursor",
    company: "Anysphere",
    tagline: "VS Code-style AI editor with agent mode, tab completion, and cloud agents.",
    category: "ide",
    surfaces: ["Desktop IDE", "Cloud agents", "MCP"],
    pricingModel: "subscription",
    pricingSummary: "Free Hobby, Pro $20/mo, Pro+ $60/mo, Ultra $200/mo, Teams $40/user/mo.",
    modelSupport: "curated-multi-model",
    modelSummary:
      "OpenAI, Anthropic, Google, DeepSeek, xAI, and Cursor models with Auto routing and Max Mode.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: "2026-04-02",
    releaseCadence: "managed",
    releaseSummary: "Closed-source product with frequent model and agent updates. Cursor 3 launched in April 2026.",
    status: "active",
    bestFor: "Developers who want the agent, model picker, and codebase context inside one editor.",
    watchOut: "Usage economics move with the selected model and quota tier.",
    website: "https://cursor.com",
    sourceUrls: [
      { label: "Pricing", url: "https://cursor.com/pricing" },
      { label: "Models", url: "https://docs.cursor.com/models" },
      {
        label: "Cursor 3 launch coverage",
        url: "https://www.wired.com/story/cusor-launches-coding-agent-openai-anthropic",
      },
    ],
  },
  {
    id: "claude-code",
    name: "Claude Code",
    company: "Anthropic",
    tagline: "Terminal-first agent that reads a repo, edits files, runs commands, and works across Claude surfaces.",
    category: "terminal-agent",
    surfaces: ["CLI", "VS Code", "JetBrains", "Desktop", "Web", "GitHub"],
    pricingModel: "subscription",
    pricingSummary: "Included with Claude Pro $20/mo, Max from $100/mo, Team, Enterprise, or API token billing.",
    modelSupport: "single-provider",
    modelSummary: "Claude models only, with Opus, Sonnet, and Haiku tiers depending on plan and settings.",
    sourceStatus: "public-repo",
    githubRepo: "https://github.com/anthropics/claude-code",
    githubStars: 114000,
    latestRelease: "2026-04-18",
    releaseCadence: "daily",
    releaseSummary: "v2.1.114 shipped Apr 18, 2026 after several releases in the same week.",
    status: "active",
    bestFor: "Hard repo work where a Claude-only toolchain is acceptable and terminal control matters.",
    watchOut: "Heavy agent use can hit plan limits quickly, and API usage is billed by tokens.",
    website: "https://code.claude.com/docs/en/overview",
    sourceUrls: [
      { label: "Overview", url: "https://code.claude.com/docs/en/overview" },
      { label: "Costs", url: "https://code.claude.com/docs/en/costs" },
      { label: "Claude pricing", url: "https://claude.com/pricing" },
      { label: "GitHub releases", url: "https://github.com/anthropics/claude-code/releases" },
    ],
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    company: "GitHub",
    tagline: "Mainstream coding assistant with completions, chat, agent mode, code review, and GitHub-native workflows.",
    category: "editor-extension",
    surfaces: ["GitHub", "VS Code", "Visual Studio", "JetBrains", "Xcode", "CLI"],
    pricingModel: "freemium",
    pricingSummary: "Free, Pro $10/mo, Pro+ $39/mo, Business $19/user/mo, Enterprise $39/user/mo.",
    modelSupport: "curated-multi-model",
    modelSummary: "OpenAI, Anthropic, Google, xAI, and GitHub-tuned models vary by plan and client.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: "2026-04-20",
    releaseCadence: "managed",
    releaseSummary: "Managed GitHub service with usage-based billing changes scheduled for Jun 1, 2026.",
    status: "active",
    bestFor: "Teams already living in GitHub who need broad IDE coverage and enterprise controls.",
    watchOut: "Model access, multipliers, and billing rules vary by plan.",
    website: "https://github.com/features/copilot",
    sourceUrls: [
      { label: "Plans", url: "https://docs.github.com/en/copilot/get-started/plans" },
      {
        label: "Supported models",
        url: "https://docs.github.com/en/copilot/reference/ai-models/supported-models",
      },
      {
        label: "Model pricing",
        url: "https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing",
      },
    ],
  },
  {
    id: "openai-codex",
    name: "OpenAI Codex",
    company: "OpenAI",
    tagline: "Local CLI, IDE extension, desktop app, and cloud coding agent tied to ChatGPT plans.",
    category: "terminal-agent",
    surfaces: ["CLI", "VS Code", "Cursor", "Windsurf", "Desktop", "Cloud", "GitHub review"],
    pricingModel: "subscription",
    pricingSummary: "Included with ChatGPT Plus, Pro, Business, Edu, and Enterprise. Limited Free and Go access is promotional.",
    modelSupport: "single-provider",
    modelSummary: "Codex uses GPT-5.1-Codex family in current CLI and IDE docs, with Mini as an option.",
    sourceStatus: "open-source",
    githubRepo: "https://github.com/openai/codex",
    githubStars: 75300,
    latestRelease: "2026-04-17",
    releaseCadence: "daily",
    releaseSummary: "0.122.0 alpha builds shipped several times on Apr 17, 2026 after 0.121.0 on Apr 15.",
    status: "active",
    bestFor: "Developers who want a fast terminal agent and already pay for ChatGPT.",
    watchOut: "Codex model availability is separate from normal ChatGPT model access.",
    website: "https://chatgpt.com/codex",
    sourceUrls: [
      {
        label: "ChatGPT plan access",
        url: "https://help.openai.com/en/articles/11369540-codex-in-chatgpt",
      },
      {
        label: "CLI getting started",
        url: "https://help.openai.com/en/articles/11096431-openai-codex-ci-getting-started",
      },
      { label: "GitHub releases", url: "https://github.com/openai/codex/releases" },
    ],
  },
  {
    id: "devin",
    name: "Devin",
    company: "Cognition",
    tagline: "Autonomous cloud software engineer for planning, coding, testing, and shipping tasks.",
    category: "cloud-agent",
    surfaces: ["Cloud workspace", "Slack", "Linear", "MCP", "GitHub", "GitLab", "Bitbucket"],
    pricingModel: "freemium",
    pricingSummary: "Free, Pro $20/mo, Max $200/mo, Teams $80/mo, Enterprise custom.",
    modelSupport: "undisclosed",
    modelSummary: "Powered by Devin. The public pricing page does not expose a normal model picker.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: "2026-04-28",
    releaseCadence: "managed",
    releaseSummary: "Managed cloud product with current self-serve pricing and enterprise plan controls.",
    status: "active",
    bestFor: "Delegating scoped tasks to a cloud worker that can keep running after handoff.",
    watchOut: "The abstraction is a product, not a model router. Evaluate task quality directly.",
    website: "https://devin.ai/pricing",
    sourceUrls: [{ label: "Pricing", url: "https://devin.ai/pricing" }],
  },
  {
    id: "cline",
    name: "Cline",
    company: "Cline Bot",
    tagline: "Open-source IDE agent that reads, edits, runs commands, uses the browser, and keeps approval visible.",
    category: "editor-extension",
    surfaces: ["VS Code", "Cursor", "Windsurf", "JetBrains", "CLI", "MCP"],
    pricingModel: "usage-based",
    pricingSummary: "Free open-source extension. Pay for inference through Cline credits or BYOK. Enterprise is custom.",
    modelSupport: "byok-multi-provider",
    modelSummary: "Cline provider, OpenRouter, Anthropic, OpenAI, Gemini, Bedrock, Vertex, Ollama, LM Studio, and more.",
    sourceStatus: "open-source",
    githubRepo: "https://github.com/cline/cline",
    githubStars: 60400,
    latestRelease: "2026-04-16",
    releaseCadence: "weekly",
    releaseSummary: "v3.79.0 shipped Apr 16, 2026 with Claude Opus 4.7 model support.",
    status: "active",
    bestFor: "Developers who want an inspectable editor agent and direct control over model spend.",
    watchOut: "Power users need to watch token costs because BYOK makes model choice the budget.",
    website: "https://cline.bot",
    sourceUrls: [
      { label: "Pricing", url: "https://cline.bot/pricing" },
      { label: "Models", url: "https://docs.cline.bot/api/models" },
      { label: "GitHub releases", url: "https://github.com/cline/cline/releases" },
    ],
  },
  {
    id: "windsurf",
    name: "Windsurf",
    company: "Windsurf",
    tagline: "AI IDE with Cascade, in-house SWE models, major frontier models, deploys, and Devin handoff.",
    category: "ide",
    surfaces: ["Desktop IDE", "Cascade", "Devin Cloud", "Deploys", "Teams"],
    pricingModel: "freemium",
    pricingSummary: "Free, Pro $20/mo, Max $200/mo, Teams $40/user/mo, Enterprise custom.",
    modelSupport: "curated-multi-model",
    modelSummary: "SWE-1.5, SWE-1, OpenAI, Claude, Gemini, xAI, and BYOK for selected Claude models.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: "2026-04-15",
    releaseCadence: "managed",
    releaseSummary: "Commercial product cadence. Windsurf 2.0 and Devin in Windsurf landed in April 2026.",
    status: "active",
    bestFor: "Developers who want an AI-first IDE plus a path into autonomous cloud work.",
    watchOut: "Usage allowances refresh by plan and extra usage bills at model API price.",
    website: "https://windsurf.com",
    sourceUrls: [
      { label: "Pricing", url: "https://windsurf.com/pricing" },
      { label: "Models", url: "https://docs.windsurf.com/windsurf/models" },
      { label: "Devin integration", url: "https://docs.windsurf.com/windsurf/devin" },
    ],
  },
  {
    id: "augment-code",
    name: "Augment Code",
    company: "Augment",
    tagline: "Production-scale coding agent with Context Engine, PR review, Slack, CLI, and enterprise controls.",
    category: "enterprise-platform",
    surfaces: ["VS Code", "JetBrains", "CLI", "Slack", "GitHub review", "MCP"],
    pricingModel: "subscription",
    pricingSummary: "Indie $20/mo, Standard $60/developer/mo, Max $200/developer/mo, Enterprise custom.",
    modelSupport: "curated-multi-model",
    modelSummary: "Claude Haiku, Sonnet, Opus, Gemini 3.1 Pro, GPT-5.1, GPT-5.2, and GPT-5.4.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: "2026-04-28",
    releaseCadence: "managed",
    releaseSummary: "Closed-source commercial product with public pricing, docs, and changelog surfaces.",
    status: "active",
    bestFor: "Large codebases where context retrieval and PR review are as important as chat.",
    watchOut: "Credit math matters. Complex tasks can consume thousands of credits.",
    website: "https://www.augmentcode.com",
    sourceUrls: [
      { label: "Pricing", url: "https://www.augmentcode.com/pricing" },
      { label: "Available models", url: "https://docs.augmentcode.com/models/available-models" },
    ],
  },
  {
    id: "opencode",
    name: "OpenCode",
    company: "Anomaly",
    tagline: "Open-source coding agent for terminal, IDE, and desktop with broad provider support.",
    category: "terminal-agent",
    surfaces: ["CLI", "Desktop", "IDE", "GitHub Copilot login", "ChatGPT login"],
    pricingModel: "freemium",
    pricingSummary: "Open source. Free models included, or connect providers and subscriptions. Zen adds optimized hosted models.",
    modelSupport: "byok-multi-provider",
    modelSummary: "75+ providers through Models.dev, local models, GitHub Copilot login, and ChatGPT Plus or Pro login.",
    sourceStatus: "open-source",
    githubRepo: "https://github.com/anomalyco/opencode",
    githubStars: 146000,
    latestRelease: "2026-04-18",
    releaseCadence: "daily",
    releaseSummary: "v1.4.11 shipped Apr 18, 2026 after hundreds of public releases.",
    status: "active",
    bestFor: "Terminal-first developers who want open tooling and the widest model surface.",
    watchOut: "The ecosystem is moving fast, so pin versions for team workflows.",
    website: "https://opencode.ai",
    sourceUrls: [
      { label: "Website", url: "https://opencode.ai" },
      { label: "GitHub", url: "https://github.com/anomalyco/opencode" },
      { label: "GitHub releases", url: "https://github.com/sst/opencode/releases" },
    ],
  },
  {
    id: "kilo-code",
    name: "Kilo Code",
    company: "Kilo",
    tagline: "Open agentic engineering platform for VS Code, JetBrains, and CLI with Kilo Gateway.",
    category: "editor-extension",
    surfaces: ["VS Code", "JetBrains", "CLI", "Kilo Gateway", "Teams"],
    pricingModel: "freemium",
    pricingSummary: "Kilo Code is free and open source. Kilo Pass starts at $19/mo. Teams $15/user/mo.",
    modelSupport: "byok-multi-provider",
    modelSummary: "500+ models, Kilo Gateway, OpenRouter, Vercel, Bedrock, Azure, Google, local models, and BYOK.",
    sourceStatus: "open-source",
    githubRepo: "https://github.com/Kilo-Org/kilocode",
    githubStars: 18300,
    latestRelease: "2026-04-17",
    releaseCadence: "daily",
    releaseSummary: "v7.2.14 shipped Apr 17, 2026 with active daily release rhythm.",
    status: "active",
    bestFor: "Teams that want Roo/Cline-style editor agents with explicit open-source commitments.",
    watchOut: "The platform is young and moves quickly, so migration notes matter.",
    website: "https://kilo.ai",
    sourceUrls: [
      { label: "Pricing", url: "https://kilo.ai/pricing" },
      { label: "Open source commitment", url: "https://kilo.ai/open" },
      { label: "GitHub releases", url: "https://github.com/Kilo-Org/kilocode/releases" },
    ],
  },
  {
    id: "continue",
    name: "Continue",
    company: "Continue",
    tagline: "Source-controlled AI checks and agents that run as GitHub status checks in CI.",
    category: "review-ci",
    surfaces: ["CLI", "GitHub status checks", "VS Code", "JetBrains", "Agents"],
    pricingModel: "usage-based",
    pricingSummary: "Starter $3 per million input and output tokens. Team $20/seat/mo with $10 credits. Company custom.",
    modelSupport: "curated-multi-model",
    modelSummary: "Frontier-model credits in Starter and Team. Company plan supports BYOK.",
    sourceStatus: "open-source",
    githubRepo: "https://github.com/continuedev/continue",
    githubStars: 32900,
    latestRelease: "2026-03-27",
    releaseCadence: "weekly",
    releaseSummary: "v1.2.22-vscode was the latest GitHub release on Mar 27, 2026.",
    status: "active",
    bestFor: "Teams that want review logic encoded as repo files instead of hidden prompts.",
    watchOut: "The current product center is AI checks and CI, not a pure pair-programming assistant.",
    website: "https://www.continue.dev",
    sourceUrls: [
      { label: "Pricing", url: "https://www.continue.dev/pricing" },
      { label: "GitHub", url: "https://github.com/continuedev/continue" },
      { label: "GitHub releases", url: "https://github.com/continuedev/continue/releases" },
    ],
  },
  {
    id: "aider",
    name: "Aider",
    company: "Aider",
    tagline: "Git-aware AI pair programmer that runs in the terminal and auto-commits changes.",
    category: "terminal-agent",
    surfaces: ["CLI", "Git", "IDE comment workflow", "Web pages", "Images"],
    pricingModel: "free",
    pricingSummary: "Free open-source tool. You pay the model provider or local infrastructure.",
    modelSupport: "local-models",
    modelSummary: "Works with Claude, DeepSeek, OpenAI, Gemini, Llama, OpenRouter, and local models.",
    sourceStatus: "open-source",
    githubRepo: "https://github.com/Aider-AI/aider",
    githubStars: 43500,
    latestRelease: "2025-08-09",
    releaseCadence: "slow",
    releaseSummary: "v0.86.0 shipped Aug 9, 2025 with GPT-5 and Grok-4 support.",
    status: "active",
    bestFor: "Terminal users who want Git-native edits and a mature repo-map workflow.",
    watchOut: "Release cadence is slower than the 2026 agent wave, so check model support before standardizing.",
    website: "https://aider.chat",
    sourceUrls: [
      { label: "Website", url: "https://aider.chat" },
      { label: "GitHub", url: "https://github.com/Aider-AI/aider" },
      { label: "GitHub releases", url: "https://github.com/Aider-AI/aider/releases" },
    ],
  },
  {
    id: "amazon-q-developer",
    name: "Amazon Q Developer",
    company: "AWS",
    tagline: "AWS-native coding assistant across IDE, CLI, console, security, and transformation workflows.",
    category: "enterprise-platform",
    surfaces: ["IDE", "CLI", "AWS Console", "Java transformation", ".NET transformation"],
    pricingModel: "freemium",
    pricingSummary: "Free tier with monthly limits. Pro is $19/user/mo.",
    modelSupport: "curated-multi-model",
    modelSummary: "AWS-managed model access with latest Claude models called out in pricing docs.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: "2026-04-28",
    releaseCadence: "managed",
    releaseSummary: "Managed AWS service with Free and Pro tiers documented in AWS guides.",
    status: "active",
    bestFor: "AWS-heavy teams that want code help tied to cloud operations and modernization.",
    watchOut: "The product is strongest when your engineering workflow already runs through AWS.",
    website: "https://aws.amazon.com/q/developer",
    sourceUrls: [
      { label: "Pricing", url: "https://aws.amazon.com/q/developer/pricing/" },
      {
        label: "Tiers",
        url: "https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/q-tiers.html",
      },
    ],
  },
  {
    id: "jetbrains-ai-assistant",
    name: "JetBrains AI Assistant",
    company: "JetBrains",
    tagline: "AI built into JetBrains IDEs with cloud quota tiers, BYOK options, and local model connections.",
    category: "ide",
    surfaces: ["JetBrains IDEs", "AI Chat", "Inline edits", "BYOK", "Local models"],
    pricingModel: "freemium",
    pricingSummary: "AI Free, AI Pro $20/mo, AI Ultimate $60/mo, AI Enterprise $60/mo or higher.",
    modelSupport: "curated-multi-model",
    modelSummary: "JetBrains AI service includes Claude, Gemini, and other models. BYOK and local models are supported.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: "2026-04-01",
    releaseCadence: "managed",
    releaseSummary: "Tied to JetBrains IDE versions and AI Assistant documentation updates.",
    status: "active",
    bestFor: "Teams already standardized on JetBrains IDEs who want AI without changing editors.",
    watchOut: "Cloud model access depends on region, IDE version, and quota tier.",
    website: "https://www.jetbrains.com/ai/",
    sourceUrls: [
      {
        label: "Plans and usage",
        url: "https://www.jetbrains.com/help/ai-assistant/licensing-and-subscriptions.html",
      },
      {
        label: "Supported models",
        url: "https://www.jetbrains.com/help/ai-assistant/supported-llms.html",
      },
    ],
  },
  {
    id: "zed-ai",
    name: "Zed AI",
    company: "Zed",
    tagline: "Fast collaborative editor with hosted AI models, edit predictions, external agents, and BYOK.",
    category: "ide",
    surfaces: ["Zed editor", "Agent panel", "Hosted models", "BYOK", "External agents"],
    pricingModel: "freemium",
    pricingSummary: "Personal $0, Pro $10/mo with $5 hosted-model tokens included, Enterprise custom.",
    modelSupport: "curated-multi-model",
    modelSummary: "Hosted Claude, OpenAI, Gemini, and xAI models, plus external providers and agents.",
    sourceStatus: "open-source",
    githubRepo: "https://github.com/zed-industries/zed",
    githubStars: 79300,
    latestRelease: "2026-04-18",
    releaseCadence: "weekly",
    releaseSummary: "v0.233.2-pre shipped Apr 18, 2026 and stable v0.232.2 shipped Apr 15.",
    status: "active",
    bestFor: "Developers who care about editor performance and want AI without a VS Code fork.",
    watchOut: "The agent surface is still lighter than dedicated coding-agent products.",
    website: "https://zed.dev",
    sourceUrls: [
      { label: "Pricing", url: "https://zed.dev/pricing" },
      { label: "Models", url: "https://zed.dev/docs/ai/models" },
      { label: "GitHub releases", url: "https://github.com/zed-industries/zed/releases" },
    ],
  },
  {
    id: "tabnine",
    name: "Tabnine",
    company: "Tabnine",
    tagline: "Privacy-heavy AI coding platform with completions, chat, agents, and deploy-anywhere options.",
    category: "enterprise-platform",
    surfaces: ["Major IDEs", "CLI", "MCP", "Jira", "Self-hosted", "Air-gapped"],
    pricingModel: "enterprise",
    pricingSummary: "Code Assistant $39/user/mo annually. Agentic Platform $59/user/mo annually.",
    modelSupport: "curated-multi-model",
    modelSummary: "Leading LLMs from Anthropic, OpenAI, Google, Meta, Mistral, and others. BYO/self-hosted options.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: "2026-04-28",
    releaseCadence: "managed",
    releaseSummary: "Commercial platform cadence focused on enterprise deployments and governance.",
    status: "enterprise-focused",
    bestFor: "Enterprises that need privacy controls, self-hosting, or air-gapped deployments.",
    watchOut: "This is priced and packaged for organizations more than individual developers.",
    website: "https://www.tabnine.com",
    sourceUrls: [{ label: "Pricing", url: "https://www.tabnine.com/pricing/" }],
  },
];

export interface AiDevToolsFilters {
  category: AiDevToolCategory | "all";
  pricing: AiDevToolPricingModel | "all";
  model: AiDevToolModelSupport | "all";
  source: AiDevToolSourceStatus | "all";
  query: string;
}

export function filterAiDevTools(
  tools: readonly AiDevTool[],
  filters: AiDevToolsFilters
): AiDevTool[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return tools.filter((tool) => {
    if (filters.category !== "all" && tool.category !== filters.category) {
      return false;
    }
    if (filters.pricing !== "all" && tool.pricingModel !== filters.pricing) {
      return false;
    }
    if (filters.model !== "all" && tool.modelSupport !== filters.model) {
      return false;
    }
    if (filters.source !== "all" && tool.sourceStatus !== filters.source) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      tool.name,
      tool.company,
      tool.tagline,
      tool.pricingSummary,
      tool.modelSummary,
      tool.bestFor,
      tool.surfaces.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function formatGithubStars(stars: number | null): string {
  if (stars === null) {
    return "N/A";
  }
  if (stars >= 1000) {
    const value = stars / 1000;
    return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}k`;
  }
  return stars.toString();
}

export function formatReleaseDate(isoDate: string | null): string {
  if (!isoDate) {
    return "N/A";
  }
  const date = new Date(`${isoDate}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
