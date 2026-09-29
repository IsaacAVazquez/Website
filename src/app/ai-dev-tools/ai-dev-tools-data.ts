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

// Every entry was read against its own pricing, model, and release pages, and
// against the GitHub API for stars and releases, on 2026-09-28. `latestRelease`
// is null for a managed product with no dated public changelog entry, since a
// made-up date would win the "most recent release" readout on the page.
export const AI_DEV_TOOLS_GENERATED_AT = "2026-09-28T08:00:00.000Z";
// Stays false until the entries have had a second, independent review.
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
    company: "Anysphere (SpaceX)",
    tagline: "VS Code-style AI editor with agent mode, tab completion, and cloud agents.",
    category: "ide",
    surfaces: ["Desktop IDE", "Cloud agents", "MCP"],
    pricingModel: "subscription",
    pricingSummary:
      "Free Hobby, Pro $20/mo, Pro+ $60/mo, Ultra $200/mo, Teams $40/user/mo Standard or $120/user/mo Premium, Enterprise custom.",
    modelSupport: "curated-multi-model",
    modelSummary:
      "Grok, Claude, GPT, Gemini, and Muse Spark models alongside Cursor's own Composer models.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: "2026-09-23",
    releaseCadence: "managed",
    releaseSummary:
      "Closed-source product with a public changelog, whose newest entry is dated Sep 23, 2026. SpaceX completed its acquisition of Cursor on Aug 14, 2026.",
    status: "active",
    bestFor: "Developers who want the agent, model picker, and codebase context inside one editor.",
    watchOut: "Usage economics move with the selected model and quota tier.",
    website: "https://cursor.com",
    sourceUrls: [
      { label: "Pricing", url: "https://cursor.com/pricing" },
      { label: "Models and pricing", url: "https://cursor.com/docs/models-and-pricing" },
      { label: "Changelog", url: "https://cursor.com/changelog" },
      { label: "Acquisition announcement", url: "https://cursor.com/blog/joining-spacex" },
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
    modelSummary: "Claude models only, with Fable, Opus, Sonnet, and Haiku tiers depending on plan and settings.",
    sourceStatus: "public-repo",
    githubRepo: "https://github.com/anthropics/claude-code",
    githubStars: 148388,
    latestRelease: "2026-09-25",
    releaseCadence: "daily",
    releaseSummary: "v2.1.283 shipped Sep 25, 2026, the fourth release in four days.",
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
    pricingSummary:
      "Free, Pro $10/mo, Pro+ $39/mo, Max $100/mo, Business $19/user/mo, Enterprise $39/user/mo.",
    modelSupport: "curated-multi-model",
    modelSummary: "OpenAI, Anthropic, Google, xAI, and GitHub-tuned models vary by plan and client.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: null,
    releaseCadence: "managed",
    releaseSummary:
      "Managed GitHub service. Usage is billed in AI credits at $0.01 each, and a month includes 1,500 on Pro, 7,000 on Pro+, and 20,000 on Max.",
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
      {
        label: "AI credits for individuals",
        url: "https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing",
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
    pricingSummary:
      "Free, Go $8/mo, Plus $20/mo, Pro from $100/mo, Business $20/user/mo billed annually, plus Edu and Enterprise.",
    modelSupport: "single-provider",
    modelSummary:
      "GPT-6 Sol and GPT-6 Luna are the recommended models, and the GPT-5.6 family stays available during the rollout. GPT-5.5 retires from Codex on Oct 14, 2026.",
    sourceStatus: "open-source",
    githubRepo: "https://github.com/openai/codex",
    githubStars: 126848,
    latestRelease: "2026-09-28",
    releaseCadence: "daily",
    releaseSummary: "rust-v0.158.0 shipped Sep 28, 2026, with alpha builds of 0.159.0 landing the same day.",
    status: "active",
    bestFor: "Developers who want a fast terminal agent and already pay for ChatGPT.",
    watchOut: "Codex model availability is separate from normal ChatGPT model access.",
    website: "https://chatgpt.com/codex",
    sourceUrls: [
      { label: "Pricing", url: "https://learn.chatgpt.com/docs/pricing" },
      { label: "Models", url: "https://learn.chatgpt.com/docs/models" },
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
    pricingSummary:
      "Free, Pro $20/mo, Max $200/mo, Teams $80/mo plus $40/mo per full dev seat, Enterprise custom.",
    modelSupport: "curated-multi-model",
    modelSummary:
      "The pricing page names Cognition's SWE-2 as the newest model, and the paid plans include models from the major providers.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: "2026-09-23",
    releaseCadence: "managed",
    releaseSummary:
      "Managed cloud product with public release notes, whose newest entry is dated Sep 23, 2026.",
    status: "active",
    bestFor: "Delegating scoped tasks to a cloud worker that can keep running after handoff.",
    watchOut: "The abstraction is a product, not a model router. Evaluate task quality directly.",
    website: "https://devin.ai/pricing",
    sourceUrls: [
      { label: "Pricing", url: "https://devin.ai/pricing" },
      { label: "Models", url: "https://docs.devin.ai/desktop/models" },
      { label: "Release notes", url: "https://docs.devin.ai/release-notes/overview" },
    ],
  },
  {
    id: "cline",
    name: "Cline",
    company: "Cline Bot",
    tagline: "Open-source IDE agent that reads, edits, runs commands, uses the browser, and keeps approval visible.",
    category: "editor-extension",
    surfaces: ["VS Code", "Cursor", "Windsurf", "JetBrains", "CLI", "MCP"],
    pricingModel: "usage-based",
    pricingSummary:
      "Free open-source extension. Pay for inference at cost through Cline or BYOK, or take ClinePass at $9.99/mo for open-weight models. Enterprise is custom.",
    modelSupport: "byok-multi-provider",
    modelSummary: "Cline provider, OpenRouter, Anthropic, OpenAI, Gemini, Bedrock, Vertex, Ollama, LM Studio, and more.",
    sourceStatus: "open-source",
    githubRepo: "https://github.com/cline/cline",
    githubStars: 69464,
    latestRelease: "2026-09-26",
    releaseCadence: "weekly",
    releaseSummary:
      "The repo tags the extension, CLI, desktop app, and SDK separately. desktop-v0.0.37 shipped Sep 26, 2026, and extension v4.1.21 shipped Sep 24.",
    status: "active",
    bestFor: "Developers who want an inspectable editor agent and direct control over model spend.",
    watchOut: "Power users need to watch token costs because BYOK makes model choice the budget.",
    website: "https://cline.bot",
    sourceUrls: [
      { label: "Pricing", url: "https://cline.bot/pricing" },
      { label: "ClinePass", url: "https://cline.bot/cline-pass" },
      { label: "Models", url: "https://docs.cline.bot/api/models" },
      { label: "GitHub releases", url: "https://github.com/cline/cline/releases" },
    ],
  },
  {
    // The id stays "windsurf" so links shared before the rename still open this entry.
    id: "windsurf",
    name: "Devin Desktop",
    company: "Cognition",
    tagline:
      "The IDE formerly called Windsurf, now a desktop home for local and cloud agents with in-house SWE models.",
    category: "ide",
    surfaces: ["Desktop IDE", "Agent Command Center", "Devin Cloud", "Devin CLI", "Teams"],
    pricingModel: "freemium",
    pricingSummary:
      "Free, Pro $20/mo, Max $200/mo, Teams $80/mo plus $40/mo per full dev seat, Enterprise custom.",
    modelSupport: "curated-multi-model",
    modelSummary: "In-house SWE-2, SWE-1.7, and SWE-1.6 models, plus Claude and GPT models.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: "2026-06-02",
    releaseCadence: "managed",
    releaseSummary: "Cognition renamed Windsurf to Devin Desktop on Jun 2, 2026.",
    status: "active",
    bestFor: "Developers who want an AI-first IDE plus a path into autonomous cloud work.",
    watchOut: "Usage allowances refresh by plan and extra usage bills at model API price.",
    website: "https://devin.ai/desktop",
    sourceUrls: [
      { label: "Pricing", url: "https://devin.ai/pricing" },
      { label: "Models", url: "https://docs.devin.ai/desktop/models" },
      { label: "Rename announcement", url: "https://devin.ai/blog/windsurf-is-now-devin-desktop" },
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
    pricingSummary:
      "Standard $20/mo flat and Business $100/mo flat, each covering up to 50 seats with that much usage included. Enterprise custom.",
    modelSupport: "curated-multi-model",
    modelSummary:
      "Claude Fable, Opus, Sonnet, and Haiku, GPT-6 Astra and the GPT-5.6 family, Gemini 3.8 Flash and 3.1 Pro, and Grok 4.6.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: null,
    releaseCadence: "managed",
    releaseSummary: "Closed-source commercial product with public pricing, docs, and changelog surfaces.",
    status: "active",
    bestFor: "Large codebases where context retrieval and PR review are as important as chat.",
    watchOut: "The flat price includes a fixed amount of usage, and anything past it is a pay as you go top-up.",
    website: "https://www.augmentcode.com",
    sourceUrls: [
      { label: "Pricing", url: "https://www.augmentcode.com/pricing" },
      { label: "Available models", url: "https://docs.augmentcode.com/models/available-models" },
      { label: "Changelog", url: "https://www.augmentcode.com/changelog" },
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
    pricingSummary:
      "Open source. Free models included, or connect providers and subscriptions. Go is $10/mo for low cost coding models, and Zen is a pay as you go balance for tested models.",
    modelSupport: "byok-multi-provider",
    modelSummary: "75+ providers through Models.dev, local models, GitHub Copilot login, and ChatGPT Plus or Pro login.",
    sourceStatus: "open-source",
    githubRepo: "https://github.com/anomalyco/opencode",
    githubStars: 210489,
    latestRelease: "2026-09-28",
    releaseCadence: "weekly",
    releaseSummary: "v1.18.33 shipped Sep 28, 2026, a week after v1.18.32.",
    status: "active",
    bestFor: "Terminal-first developers who want open tooling and the widest model surface.",
    watchOut: "The ecosystem is moving fast, so pin versions for team workflows.",
    website: "https://opencode.ai",
    sourceUrls: [
      { label: "Website", url: "https://opencode.ai" },
      { label: "Go", url: "https://opencode.ai/go" },
      { label: "Zen", url: "https://opencode.ai/zen" },
      { label: "GitHub", url: "https://github.com/anomalyco/opencode" },
      { label: "GitHub releases", url: "https://github.com/anomalyco/opencode/releases" },
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
    githubStars: 27428,
    latestRelease: "2026-09-25",
    releaseCadence: "daily",
    releaseSummary: "v7.8.1 shipped Sep 25, 2026, a day after the v7.7.12 prerelease.",
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
    company: "Continue (acquired by Cursor)",
    tagline: "Open-source coding agent for the CLI, VS Code, and JetBrains, now in its final release.",
    category: "editor-extension",
    surfaces: ["CLI", "VS Code", "JetBrains"],
    pricingModel: "free",
    pricingSummary:
      "No paid plan is on offer. The pricing page is gone, and the open-source code stays free to use.",
    modelSupport: "byok-multi-provider",
    modelSummary:
      "The final release took authentication out, so models come from the providers and keys you configure yourself.",
    sourceStatus: "open-source",
    githubRepo: "https://github.com/continuedev/continue",
    githubStars: 36050,
    latestRelease: "2026-06-19",
    releaseCadence: "slow",
    releaseSummary:
      "v2.0.0 on Jun 19, 2026 was the final release of the extension, CLI, and JetBrains plugin.",
    status: "transition",
    bestFor: "Teams that want an open-source agent they can fork and run on their own terms.",
    watchOut: "Cursor acquired Continue, and the repository is read-only and no longer maintained, so plan on maintaining a fork yourself.",
    website: "https://continue.dev",
    sourceUrls: [
      { label: "Acquisition notice", url: "https://continue.dev" },
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
    githubStars: 49222,
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
    latestRelease: null,
    releaseCadence: "managed",
    releaseSummary:
      "Managed AWS service. AWS will end support for the Amazon Q Developer IDE plugins on Apr 30, 2027 and points to Kiro for similar capabilities.",
    status: "transition",
    bestFor: "AWS-heavy teams that want code help tied to cloud operations and modernization.",
    watchOut: "The IDE plugins lose support on Apr 30, 2027, so a team starting now should look at Kiro first.",
    website: "https://aws.amazon.com/q/developer",
    sourceUrls: [
      { label: "End of support notice", url: "https://aws.amazon.com/q/developer/" },
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
    pricingSummary:
      "AI Free, then AI Pro $10 and AI Ultimate $30 for individuals. Organizations pay $20 and $60 per user, and AI Enterprise is $60.",
    modelSupport: "curated-multi-model",
    modelSummary: "JetBrains AI service includes Claude, Gemini, and other models. BYOK and local models are supported.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: null,
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
    pricingSummary:
      "Personal $0, Pro $10/mo with $5 of hosted-model tokens included, Business $30 per seat a month.",
    modelSupport: "curated-multi-model",
    modelSummary: "Hosted Claude, OpenAI, Gemini, and xAI models, plus external providers and agents.",
    sourceStatus: "open-source",
    githubRepo: "https://github.com/zed-industries/zed",
    githubStars: 90982,
    latestRelease: "2026-09-23",
    releaseCadence: "weekly",
    releaseSummary: "Stable v1.21.0 and v1.22.0-pre both shipped Sep 23, 2026.",
    status: "active",
    bestFor: "Developers who care about editor performance and want AI without a VS Code fork.",
    watchOut: "The agent surface is still lighter than dedicated coding-agent products.",
    website: "https://zed.dev",
    sourceUrls: [
      { label: "Pricing", url: "https://zed.dev/pricing" },
      { label: "Models", url: "https://zed.dev/docs/account/zed-hosted-models" },
      { label: "GitHub releases", url: "https://github.com/zed-industries/zed/releases" },
    ],
  },
  {
    id: "tabnine",
    name: "Tabnine",
    company: "Tabnine (acquired by Tricentis)",
    tagline: "Privacy-heavy AI coding platform with completions, chat, agents, and deploy-anywhere options.",
    category: "enterprise-platform",
    surfaces: ["Major IDEs", "CLI", "MCP", "Jira", "Self-hosted", "Air-gapped"],
    pricingModel: "enterprise",
    pricingSummary:
      "No public pricing. Tricentis acquired Tabnine on Jul 30, 2026, and the old pricing page now redirects to the Tricentis contact page.",
    modelSupport: "curated-multi-model",
    modelSummary:
      "Tabnine's own models for completions and chat, with optional Claude and GPT chat models listed in its docs.",
    sourceStatus: "proprietary",
    githubRepo: null,
    githubStars: null,
    latestRelease: null,
    releaseCadence: "managed",
    releaseSummary:
      "Tricentis says it will build Tabnine's Enterprise Context Engine into its quality engineering platform.",
    status: "transition",
    bestFor: "Enterprises that need privacy controls, self-hosting, or air-gapped deployments.",
    watchOut: "The standalone product's future is not stated, so ask Tricentis what is still sold before planning around it.",
    website: "https://docs.tabnine.com/main",
    sourceUrls: [
      {
        label: "Acquisition announcement",
        url: "https://www.tricentis.com/news/tricentis-acquires-tabnine",
      },
      { label: "AI models", url: "https://docs.tabnine.com/main/welcome/readme/ai-models" },
    ],
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
