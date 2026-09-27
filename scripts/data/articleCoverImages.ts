/**
 * Cover-image plan for every article under `content/blog`.
 *
 * This is the source of truth the `update:article-images` builder reads to give
 * each post a real, license-safe cover photo instead of the auto-generated
 * `/writing/<slug>/opengraph-image` editorial card. It also doubles as a
 * complete coverage record: every published slug appears here exactly once, so
 * nothing is silently skipped.
 *
 * Three strategies:
 *
 *   - `wikimedia`  Fetch a freely licensed photo from Wikimedia Commons using
 *                  `query`, save it under `public/images/writing/covers/`, and
 *                  write the four cover-image frontmatter fields (coverImage,
 *                  coverImageAlt, coverImageCredit, coverImageCreditUrl). The
 *                  builder derives credit + license from the Commons API at
 *                  fetch time, so attribution is always accurate to the file
 *                  that actually lands. `alt` is written verbatim — keep it
 *                  broad enough to stay true for any top result of `query`.
 *
 *   - `editorial-card`  Deliberately keep the generated editorial card. Used for
 *                  abstract commentary (AI, PM workflows, QA, fintech product
 *                  pieces) where the only available stock photo would be generic
 *                  filler ("laptop with code") that reads worse than the clean
 *                  typographic card. `reason` records why.
 *
 *   - `manual`     A cover photo is already curated by hand in frontmatter (the
 *                  World Cup contender team photos). The builder leaves these
 *                  untouched.
 *
 * To move a post from a card to a photo, change its `strategy` to `wikimedia`
 * and add a `query` + `alt`, then run `npm run update:article-images -- --only=<slug>`.
 */

export type ArticleCoverImageSpec =
  | {
      slug: string;
      strategy: "wikimedia";
      /** Wikimedia Commons full-text search phrase (File namespace). */
      query: string;
      /** Alt text written to frontmatter. Keep true for any top result. */
      alt: string;
    }
  | {
      slug: string;
      strategy: "editorial-card";
      reason: string;
    }
  | {
      slug: string;
      strategy: "manual";
      note: string;
    };

const ABSTRACT_AI = "Abstract AI/agent commentary; no natural photo, stock would be filler.";
const ABSTRACT_PM = "Abstract PM-workflow piece; no natural photo, stock would be filler.";
const ABSTRACT_QA = "Abstract QA/engineering piece; no natural photo, stock would be filler.";
const ABSTRACT_PRODUCT = "Product/process piece about software; no non-generic subject photo.";
const ABSTRACT_MACRO = "Diffuse macro/markets commentary; no single neutral subject to picture.";
const ABSTRACT_FINTECH = "Fintech product piece; only generic money/calculator stock available.";
const RECAP_CARD = "Season-recap post that already ships a bespoke editorial cover card in frontmatter; keep it.";

// Set on 2026-09-14 after every fetched cover was viewed against its post.
const COVER_WRONG_SUBJECT = "The fetched photo showed a different subject than the post, so it was dropped on review.";
// Set on 2026-09-24 when the riso plates replaced the fetched photos.
const RISO_PLATE = "Riso plate made for the site; no third-party credit, and the builder must not overwrite it.";
// Set on 2026-09-25 for the write-ups about past employers.
const CAREER_WRITEUP = "Career write-up about a past employer; the only real subject is the company's own brand, which is not ours to use.";

export const ARTICLE_COVER_IMAGES: ArticleCoverImageSpec[] = [
  // ---------------------------------------------------------------------------
  // Sports & Fantasy — concrete sport imagery
  // ---------------------------------------------------------------------------
  { slug: "2025-fantasy-football-draft-strategy", strategy: "manual", note: RISO_PLATE },
  { slug: "fantasy-football-beginners-complete-guide", strategy: "manual", note: RISO_PLATE },
  { slug: "june-fantasy-football-prep-2026", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "mastering-fantasy-football-analytics", strategy: "wikimedia", query: "American football NFL play line of scrimmage", alt: "American football players lined up for a play" },
  { slug: "rb-vs-wr-draft-strategy-modeling-positional-value", strategy: "manual", note: RISO_PLATE },
  { slug: "understanding-fantasy-football-analytics", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "waiver-wire-mastery-hidden-gems", strategy: "manual", note: RISO_PLATE },
  { slug: "building-a-fantasy-football-rankings-platform", strategy: "manual", note: RISO_PLATE },

  { slug: "2026-march-madness-bracket-analysis", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "2026-march-madness-postmortem", strategy: "wikimedia", query: "college basketball arena crowd game", alt: "A packed arena during a college basketball game" },

  { slug: "building-a-fantasy-formula-1-optimizer", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "building-a-formula-1-dashboard", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "2026-belgian-grand-prix-antonelli-title-lead", strategy: "manual", note: RISO_PLATE },

  { slug: "building-a-la-liga-dashboard", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "building-a-premier-league-dashboard", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "building-a-world-cup-dashboard", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "what-the-48-team-world-cup-changes", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "world-cup-2026-groups-a-b-c-decided", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "world-cup-2026-groups-d-e-f-final-round", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "world-cup-2026-groups-g-h-i-final-round", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "world-cup-2026-groups-j-k-l-final-round", strategy: "wikimedia", query: "football soccer goal net pitch", alt: "A football and goal net" },
  { slug: "world-cup-2026-top-ten-contenders", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "world-cup-2026-48-team-format-verdict", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "world-cup-2026-final-spain-argentina", strategy: "wikimedia", query: "Spain national football team match", alt: "Spain's national football team during a match" },

  { slug: "building-a-pga-tour-dashboard", strategy: "wikimedia", query: "golf tournament player green PGA", alt: "A golfer on the green during a tournament" },
  { slug: "building-an-mlb-dashboard", strategy: "manual", note: RISO_PLATE },
  { slug: "building-an-nba-dashboard", strategy: "manual", note: RISO_PLATE },
  { slug: "building-an-nfl-dashboard", strategy: "manual", note: RISO_PLATE },

  // ---------------------------------------------------------------------------
  // Signals & Commentary — concrete where a neutral subject exists
  // ---------------------------------------------------------------------------
  { slug: "2026-week-april-6-tariffs-trade-war-market-reaction", strategy: "manual", note: RISO_PLATE },
  { slug: "2026-week-in-tech-agentic-ai-infrastructure-arms-race", strategy: "wikimedia", query: "data center server room racks", alt: "Rows of servers in a data center" },
  { slug: "2026-week-in-tech-ai-infra-geopolitics", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "a-history-of-horology", strategy: "wikimedia", query: "antique mechanical pocket watch movement", alt: "The movement of an antique mechanical pocket watch" },
  { slug: "aws-vs-azure-vs-gcp-cloud-provider-comparison", strategy: "wikimedia", query: "data center servers cloud computing", alt: "Servers in a cloud data center" },
  { slug: "companies-and-watches-that-shaped-horology", strategy: "wikimedia", query: "luxury mechanical wristwatch", alt: "A mechanical luxury wristwatch" },
  { slug: "is-the-ai-mega-cap-rally-a-bubble", strategy: "manual", note: RISO_PLATE },
  { slug: "reading-q1-2026-earnings-ai-capex-lens", strategy: "manual", note: RISO_PLATE },
  { slug: "spacex-ipo-case-for-going-public", strategy: "manual", note: RISO_PLATE },

  // ---------------------------------------------------------------------------
  // Space & Experiments — concrete subjects (rockets, transit, food, wine, etc.)
  // ---------------------------------------------------------------------------
  { slug: "artemis-ii-first-crewed-lunar-mission", strategy: "manual", note: RISO_PLATE },
  { slug: "building-a-bart-transit-dashboard", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "building-a-museum-log", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "building-a-pantry-aware-recipe-finder", strategy: "manual", note: RISO_PLATE },
  { slug: "building-a-travel-planner", strategy: "manual", note: RISO_PLATE },
  { slug: "building-a-wine-cellar-app", strategy: "manual", note: RISO_PLATE },
  { slug: "building-an-austin-food-map", strategy: "manual", note: RISO_PLATE },
  { slug: "building-an-earthquake-dashboard", strategy: "wikimedia", query: "seismograph seismogram earthquake recording", alt: "A seismograph recording ground motion" },
  { slug: "building-news-pulse-dashboard", strategy: "manual", note: RISO_PLATE },
  { slug: "building-spacex-mission-control", strategy: "manual", note: RISO_PLATE },

  // ---------------------------------------------------------------------------
  // Systems & Quality — one concrete framing subject
  // ---------------------------------------------------------------------------
  { slug: "qa-engineering-silicon-valley-uc-berkeley-mba-perspective", strategy: "manual", note: RISO_PLATE },

  // ---------------------------------------------------------------------------
  // Manual — curated team photos already in frontmatter
  // ---------------------------------------------------------------------------
  { slug: "world-cup-2026-contenders-1-spain", strategy: "manual", note: "Wikimedia team photo curated in frontmatter." },
  { slug: "world-cup-2026-contenders-2-france", strategy: "manual", note: "Wikimedia team photo curated in frontmatter." },
  { slug: "world-cup-2026-contenders-3-england", strategy: "manual", note: "Wikimedia team photo curated in frontmatter." },
  { slug: "world-cup-2026-contenders-4-argentina", strategy: "manual", note: "Wikimedia team photo curated in frontmatter." },
  { slug: "world-cup-2026-contenders-5-brazil", strategy: "manual", note: "Wikimedia team photo curated in frontmatter." },
  { slug: "world-cup-2026-contenders-6-portugal", strategy: "manual", note: "Wikimedia team photo curated in frontmatter." },
  { slug: "world-cup-2026-contenders-7-germany", strategy: "manual", note: "Wikimedia team photo curated in frontmatter." },
  { slug: "world-cup-2026-contenders-8-netherlands", strategy: "manual", note: "Wikimedia team photo curated in frontmatter." },
  { slug: "world-cup-2026-contenders-9-morocco", strategy: "manual", note: "Wikimedia team photo curated in frontmatter." },
  { slug: "world-cup-2026-contenders-10-belgium", strategy: "manual", note: "Wikimedia team photo curated in frontmatter." },

  // ---------------------------------------------------------------------------
  // Editorial card — abstract pieces that read better with the typographic card
  // ---------------------------------------------------------------------------
  // Signals & Commentary
  { slug: "2026-week-april-6-ai-coding-tools-developer-displacement", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "2026-week-march-23-30-economy-politics", strategy: "editorial-card", reason: ABSTRACT_MACRO },
  { slug: "agentic-ai-line-item-not-pilot", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "ai-coding-tools-developer-displacement-2026", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "ai-productivity-not-in-macro-data-yet", strategy: "editorial-card", reason: ABSTRACT_MACRO },
  { slug: "kimi-k3-ai-chip-selloff-2026", strategy: "editorial-card", reason: ABSTRACT_MACRO },
  { slug: "building-a-polling-aggregator", strategy: "editorial-card", reason: "Election-polling tool; avoid charged/partisan imagery on portfolio." },
  { slug: "building-a-tech-startup-tracker", strategy: "editorial-card", reason: ABSTRACT_PRODUCT },
  { slug: "mcp-winning-integration-war-enterprise-default", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "new-model-economics-tier-collapse-2026", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "tech-job-market-splitting-2026-macro-backdrop", strategy: "editorial-card", reason: ABSTRACT_MACRO },

  // Space & Experiments (software-only subjects)
  { slug: "building-a-github-trending-dashboard", strategy: "editorial-card", reason: ABSTRACT_PRODUCT },
  { slug: "building-an-mba-recruiting-tracker", strategy: "editorial-card", reason: ABSTRACT_PRODUCT },
  { slug: "building-the-pulse-dashboard-family", strategy: "editorial-card", reason: ABSTRACT_PRODUCT },

  // Agentic AI cluster
  { slug: "agentic-ai-explained-for-product-managers", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "agentic-ai-marketing-content-workflows", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "agentic-ai-research-to-deck-workflow", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "ai-agent-delegation-failure-modes", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "ai-agents-customer-support-what-works", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "build-vs-buy-agentic-ai-platform", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "building-a-frontier-model-tracker", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "context-engineering-replacing-prompt-engineering", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "evaluate-agentic-ai-product-pm-framework", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "is-rag-dead-2026", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "mapping-the-ai-dev-tool-ecosystem", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "mcp-integration-layer-what-it-means", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "multi-agent-ai-architectures-business", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "prompt-injection-is-a-product-problem", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "reasoning-model-economics-when-to-use-which", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "what-an-ai-agent-actually-costs-in-production", strategy: "editorial-card", reason: ABSTRACT_AI },

  // Systems & Quality cluster
  { slug: "ai-in-software-testing-future-of-qa", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "building-ai-powered-analytics-fantasy-football-to-enterprise", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "building-an-automation-enablement-assistant", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "building-reliable-software-systems", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "complete-guide-qa-engineering", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "cybersecurity-in-age-of-ai-software-engineer-perspective", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "evals-are-the-new-test-suite", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "evolution-software-architecture-monoliths-ai-native-systems", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "getting-started-with-automated-testing", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "low-code-no-code-vs-traditional-development-when-to-choose", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "proactive-performance-intelligence", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "qa-automation-daily-deploys", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "qa-engineer-guide-testing-ai-systems", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "runningmate-platform-launch", strategy: "editorial-card", reason: ABSTRACT_PRODUCT },
  { slug: "scaling-civic-engagement-platform", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "vibe-coding-where-the-line-is", strategy: "editorial-card", reason: ABSTRACT_QA },

  // PM Workflows cluster
  { slug: "ai-competitive-analysis-workflow", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "ai-email-stakeholder-comms-pm", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "ai-prd-writing-prompts-structure", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "ai-product-discovery-workflow", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "ai-product-manager-interview-2026", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "ai-quant-cases-financial-modeling", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "ai-roadmapping-from-feedback", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "ai-skills-pm-internship-2026", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "ai-user-research-synthesis-workflow", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "ai-workflow-mba-product-manager-daily", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "building-decision-lab", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "campaign-self-service-analytics", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "digital-acquisition-strategy", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "mba-ai-misuse-how-to-stand-out", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "textout-platform", strategy: "editorial-card", reason: ABSTRACT_PRODUCT },

  // Fintech Product & Pricing
  { slug: "building-a-budget-planner", strategy: "editorial-card", reason: ABSTRACT_FINTECH },
  { slug: "building-an-investment-research-platform", strategy: "editorial-card", reason: ABSTRACT_FINTECH },
  { slug: "interchange-iq-payment-fee-analyzer", strategy: "editorial-card", reason: ABSTRACT_FINTECH },
  { slug: "pricing-strategy-initiative", strategy: "editorial-card", reason: ABSTRACT_FINTECH },

  // ---------------------------------------------------------------------------
  // 2025-26 season recaps — Grand Prix, Premier League, La Liga, World Cup
  // ---------------------------------------------------------------------------
  // These recaps already ship a bespoke editorial cover card in frontmatter.
  { slug: "2026-australian-grand-prix-mercedes-new-era", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "2026-austrian-grand-prix-russell-title-race", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "2026-barcelona-catalunya-grand-prix-hamilton-ferrari", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "2026-british-grand-prix-leclerc-silverstone", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "2026-canadian-grand-prix-mercedes-civil-war", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "2026-chinese-grand-prix-antonelli-first-win", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "2026-japanese-grand-prix-antonelli-title-lead", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "2026-miami-grand-prix-mclaren-mercedes", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "2026-monaco-grand-prix-antonelli-grand-slam", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "premier-league-2025-26-april-title-swing", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "premier-league-2025-26-arsenal-champions", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "premier-league-2025-26-august-opening-weeks", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "premier-league-2025-26-awards", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "premier-league-2025-26-december-festive-fixtures", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "premier-league-2025-26-february-run-in-shape", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "premier-league-2025-26-january-wobble-window", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "premier-league-2025-26-march-united-surge", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "premier-league-2025-26-november-clean-sheets", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "premier-league-2025-26-october-arsenal-go-top", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "premier-league-2025-26-relegation-and-survival", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "premier-league-2025-26-season-in-review", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "premier-league-2025-26-september-promoted-teams", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "world-cup-2026-round-of-16-recap", strategy: "editorial-card", reason: RECAP_CARD },
  { slug: "world-cup-2026-round-of-32-recap", strategy: "editorial-card", reason: RECAP_CARD },
  // La Liga round-ups have no cover yet; fetch a licensed match photo like the peers.
  { slug: "la-liga-2025-26-arbeloa-madrid-midseason", strategy: "wikimedia", query: "La Liga football soccer match stadium", alt: "A football match at a stadium" },
  { slug: "la-liga-2025-26-barcelona-clinch-title", strategy: "wikimedia", query: "La Liga football soccer match stadium", alt: "A football match at a stadium" },
  { slug: "la-liga-2025-26-barcelona-retake-top", strategy: "wikimedia", query: "La Liga football soccer match stadium", alt: "A football match at a stadium" },
  { slug: "la-liga-2025-26-final-day", strategy: "wikimedia", query: "La Liga football soccer match stadium", alt: "A football match at a stadium" },
  { slug: "la-liga-2025-26-first-clasico", strategy: "wikimedia", query: "La Liga football soccer match stadium", alt: "A football match at a stadium" },
  { slug: "la-liga-2025-26-joan-garcia-zamora", strategy: "wikimedia", query: "La Liga football soccer match stadium", alt: "A football match at a stadium" },
  { slug: "la-liga-2025-26-mbappe-pichichi", strategy: "wikimedia", query: "La Liga football soccer match stadium", alt: "A football match at a stadium" },
  { slug: "la-liga-2025-26-oviedo-relegated", strategy: "wikimedia", query: "La Liga football soccer match stadium", alt: "A football match at a stadium" },
  { slug: "la-liga-2025-26-real-madrid-flying-start", strategy: "wikimedia", query: "La Liga football soccer match stadium", alt: "A football match at a stadium" },
  { slug: "la-liga-2025-26-season-preview", strategy: "wikimedia", query: "La Liga football soccer match stadium", alt: "A football match at a stadium" },
  { slug: "la-liga-2025-26-season-verdict", strategy: "wikimedia", query: "La Liga football soccer match stadium", alt: "A football match at a stadium" },
  { slug: "la-liga-2025-26-supercopa-alonso-sacked", strategy: "wikimedia", query: "La Liga football soccer match stadium", alt: "A football match at a stadium" },
  { slug: "la-liga-2025-26-title-race-run-in", strategy: "wikimedia", query: "La Liga football soccer match stadium", alt: "A football match at a stadium" },

  // ---------------------------------------------------------------------------
  // Weekly series — year coverage (Sundays, 2025-07-20 through 2026-07-19)
  // ---------------------------------------------------------------------------

  // Sports & Fantasy — concrete sport imagery
  { slug: "world-cup-2026-quarterfinals-recap", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "world-cup-2026-final-spain-champions", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "fantasy-football-training-camp-2025-signal-vs-noise", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "fantasy-football-2025-draft-tiers-adp", strategy: "manual", note: RISO_PLATE },
  { slug: "fantasy-football-2025-draft-day-decisions", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "nfl-2025-week-1-overreactions", strategy: "manual", note: RISO_PLATE },
  { slug: "fantasy-football-2025-playoff-push", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "mlb-2025-postseason-what-october-rewards", strategy: "manual", note: RISO_PLATE },
  { slug: "super-bowl-lx-preview-seahawks-patriots", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "super-bowl-lx-seahawks-defense", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "space-2025-year-in-review", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "apple-iphone-17-ai-strategy-2025", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "ces-2026-what-mattered", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },

  // Signals & Commentary — editorial cards (macro/AI commentary, stock would be filler)
  { slug: "ai-talent-war-summer-2025", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "hyperscaler-capex-2025-when-does-it-pay-off", strategy: "editorial-card", reason: ABSTRACT_MACRO },
  { slug: "openai-devday-2025-platform-play", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "ai-circular-financing-2025", strategy: "editorial-card", reason: ABSTRACT_MACRO },
  { slug: "2025-off-year-elections-signal", strategy: "editorial-card", reason: "Diffuse politics and economy commentary; no single neutral subject to picture." },
  { slug: "gpt-5-1-and-the-model-release-treadmill", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "ai-2025-year-in-review-agents-mainstream", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "2026-predictions-what-i-actually-believe", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "ai-capex-vs-real-economy-2026", strategy: "editorial-card", reason: ABSTRACT_MACRO },
  { slug: "ai-mid-february-2026-signals", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "week-in-tech-march-22-2026", strategy: "editorial-card", reason: ABSTRACT_MACRO },
  { slug: "markets-ai-mid-may-2026", strategy: "editorial-card", reason: ABSTRACT_MACRO },
  { slug: "wwdc-2026-apple-ai-recap", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "gpt-5-launch-what-actually-changed", strategy: "editorial-card", reason: ABSTRACT_AI },

  // Agentic AI cluster
  { slug: "agentic-ai-production-reality-check-fall-2025", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "agents-in-high-stakes-workflows", strategy: "editorial-card", reason: ABSTRACT_AI },
  { slug: "context-window-arms-race-2026", strategy: "editorial-card", reason: ABSTRACT_AI },

  // Systems & Quality cluster
  { slug: "on-call-for-ai-features", strategy: "editorial-card", reason: ABSTRACT_QA },
  { slug: "supply-chain-risk-agent-era", strategy: "editorial-card", reason: ABSTRACT_QA },

  // PM Workflows cluster
  { slug: "ai-annual-planning-pm-2026", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "product-management-2026-what-the-job-becomes", strategy: "editorial-card", reason: ABSTRACT_PM },
  { slug: "shipping-ai-feature-under-deadline", strategy: "editorial-card", reason: ABSTRACT_PM },

  // Fintech Product & Pricing
  { slug: "2026-investing-setup-rates-and-risk", strategy: "editorial-card", reason: ABSTRACT_FINTECH },
  { slug: "tariff-volatility-boring-portfolio", strategy: "editorial-card", reason: ABSTRACT_FINTECH },

  // August 2026 batch
  { slug: "2026-hungarian-grand-prix-russell-clean-weekend", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "2026-dutch-grand-prix-antonelli-zandvoort", strategy: "manual", note: RISO_PLATE },
  { slug: "building-a-fantasy-trade-calculator", strategy: "manual", note: RISO_PLATE },
  { slug: "building-a-best-ball-draft-room", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "how-i-run-a-draft-with-my-own-tools", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "building-a-score-pools-engine", strategy: "editorial-card", reason: COVER_WRONG_SUBJECT },
  { slug: "building-a-rent-vs-buy-calculator", strategy: "manual", note: RISO_PLATE },
  { slug: "dashboards-that-read-committed-files", strategy: "manual", note: RISO_PLATE },
  { slug: "building-a-draft-companion-that-cannot-click", strategy: "editorial-card", reason: ABSTRACT_PRODUCT },

  // September 2026 batch
  { slug: "juno-mba-growth-internship", strategy: "editorial-card", reason: CAREER_WRITEUP },
  { slug: "civitech-quality-and-product-work", strategy: "editorial-card", reason: CAREER_WRITEUP },
];
