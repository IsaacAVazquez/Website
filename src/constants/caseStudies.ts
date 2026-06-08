export interface CaseStudyData {
  slug: string;
  title: string;
  description: string;
  role: string;
  timeline: string;
  tools: string[];
  metrics: string;
  github?: string | null;
  link?: string | null;
  featured?: boolean;
  comingSoon?: boolean;

  overview: {
    summary: string;
    impact: string;
  };
  problem: {
    context: string;
    painPoints: string[];
    stakes: string;
  };
  process: {
    approach: string;
    methodology: string[];
    decisions: string[];
    collaboration?: string;
  };
  result: {
    outcomes: string[];
    testimonial?: {
      quote: string;
      author: string;
      role: string;
    };
    lessonsLearned: string[];
  };
  detailedMetrics?: {
    label: string;
    value: string;
    improvement?: string;
  }[];

  // PM-specific fields
  userSegments: string[];
  northStarMetric: string;
  tradeoffs: {
    decision: string;
    optionChosen: string;
    optionRejected: string;
    reasoning: string;
  }[];
  retrospective: string;
  pmFramework?: string;
}

export const caseStudiesData: Record<string, CaseStudyData> = {
  "investment-analytics-platform": {
    slug: "investment-analytics-platform",
    title: "Investment Analytics Platform",
    description:
      "Full-stack investment platform with live Yahoo Finance data. Portfolio tracking, gain/loss analytics, and side-by-side stock comparison with 30+ metrics and analyst consensus ratings.",
    role: "Full-Stack Developer & Designer",
    timeline: "2025",
    tools: ["Next.js", "TypeScript", "Yahoo Finance API", "Tailwind CSS"],
    metrics: "Live data · 30+ metrics per stock · Analyst consensus ratings",
    github: "https://github.com/IsaacAVazquez",
    link: "/investments",
    featured: true,

    overview: {
      summary:
        "I built an investment research workspace for tracking positions, comparing stocks, and scanning valuation, profitability, and analyst signals in one place.",
      impact:
        "Turns scattered market data into a faster decision surface for portfolio tracking and side-by-side equity research.",
    },
    problem: {
      context:
        "Retail investors often jump between broker apps, spreadsheets, and finance sites to answer basic portfolio and comparison questions.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },


  "fantasy-football-analytics": {
    slug: "fantasy-football-analytics",
    title: "Fantasy Football Analytics Platform",
    description:
      "Fantasy football platform with snapshot-backed consensus rankings, tier views, scoring toggles, and a manual draft assistant fed by an automated weekly data pipeline.",
    role: "Solo Builder",
    timeline: "2024–2026",
    tools: ["Next.js", "TypeScript", "React", "GitHub Actions"],
    metrics: "Live · Weekly FantasyPros snapshots · PPR / Half / Standard",
    github: "https://github.com/IsaacAVazquez",
    link: "/fantasy-football",
    featured: true,
    comingSoon: false,

    overview: {
      summary:
        "I built a fantasy football platform that combines consensus rankings, tier views, and an automated weekly data refresh into a single workflow.",
      impact:
        "Gives players one place to move from raw rankings to draft decisions with less tab-hopping, and keeps data freshness explicit instead of implied.",
    },
    problem: {
      context:
        "Fantasy players usually stitch rankings, tiers, and matchup context together from scattered sources with little transparency into the underlying data.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "interchange-iq": {
    slug: "interchange-iq",
    title: "Interchange IQ",
    description:
      "I built a fee analyzer that models real payment processing costs across 7 major processors using published 2024 interchange rate data. Adjust volume, avg ticket, and card mix to see live fee comparisons and a breakeven analysis.",
    role: "Builder",
    timeline: "2025",
    tools: ["Next.js", "TypeScript", "React", "Payments Economics"],
    metrics: "7 processors · Real interchange data · Breakeven calc",
    github: "https://github.com/IsaacAVazquez",
    link: "/fintech-tools/interchange-iq",
    featured: true,

    overview: {
      summary:
        "I created a payment fee analyzer that turns interchange tables into a clear processor comparison with live breakeven logic.",
      impact:
        "Makes processor tradeoffs legible before a business commits to flat-rate or interchange-plus pricing.",
    },
    problem: {
      context:
        "Merchants and fintech founders struggle to compare flat-rate and interchange-plus pricing because processor economics are intentionally opaque.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "budget-planner": {
    slug: "budget-planner",
    title: "Budget Planner",
    description:
      "Browser-persisted monthly budgeting tool for planning income, savings targets, category budgets, and manual expenses in an editorial ledger-style workspace.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "React", "Personal Finance UX"],
    metrics: "Monthly planner · Browser persistence · Category insights",
    github: "https://github.com/IsaacAVazquez",
    link: "/fintech-tools/budget-planner",
    featured: true,

    overview: {
      summary:
        "I designed a monthly budgeting workspace that keeps planning, savings targets, and manual expense tracking in one browser-persisted flow.",
      impact:
        "Keeps personal finance planning lightweight enough to use consistently without adding account-sync complexity.",
    },
    problem: {
      context:
        "Many budgeting tools either over-automate around bank connections or make simple monthly planning feel rigid and noisy.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "news-pulse-dashboard": {
    slug: "news-pulse-dashboard",
    title: "News Pulse Dashboard",
    description:
      "Live news media analytics tool aggregating RSS feeds from 6 major outlets. Visualizes coverage patterns, extracts trending topics, and performs lightweight sentiment analysis, all without external dependencies.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "RSS", "Tailwind CSS"],
    metrics: "6 outlets · Live feeds · Client-side NLP",
    github: "https://github.com/IsaacAVazquez",
    link: "/news-pulse",
    featured: true,

    overview: {
      summary:
        "I built a media analytics dashboard that tracks coverage patterns, topic frequency, and tone across major outlets without external NLP services.",
      impact:
        "Turns RSS feeds into a faster comparison surface for media monitoring and story framing analysis.",
    },
    problem: {
      context:
        "Following how multiple outlets frame the same story usually means scanning feeds manually with no lightweight way to compare patterns.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "pulse-dashboards": {
    slug: "pulse-dashboards",
    title: "Pulse Dashboards",
    description:
      "I designed and shipped a family of live dashboards that turn fragmented sports, media, developer, and political data into fast, deep-linkable product surfaces.",
    role: "Product Designer, Full-Stack Developer, and Data UX Builder",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Snapshot pipelines", "Dashboard UX"],
    metrics: "9 live dashboards · Shared interaction model · Deep-linkable state",
    github: "https://github.com/IsaacAVazquez",
    featured: true,

    overview: {
      summary:
        "I built the Pulse dashboard family to package live context into one scan instead of forcing users across standings pages, schedules, leaderboards, and news tabs.",
      impact:
        "Users get a faster read on what changed, what matters now, and where to click next without stitching the context together themselves.",
    },
    problem: {
      context:
        "Most live data products answer only one slice of the question. A standings table shows rank, a schedule shows timing, a leaderboard shows leaders, and an article explains one angle, but the user still has to assemble the actual state by hand.",
      painPoints: [
        "Season pressure, trend shifts, and next-step context are usually split across multiple screens.",
        "Generic data products optimize for completeness, not for quick orientation.",
        "Without deep-linkable state, sharing a specific view usually means sending instructions instead of a usable link.",
      ],
      stakes:
        "If the product does not compress the state cleanly, the dashboards become nice-looking reference pages instead of tools people return to when they need a fast answer.",
    },
    process: {
      approach:
        "I treated the dashboards as one product family rather than unrelated pages. The goal was a shared interaction model with domain-specific framing layered on top, so each surface could feel familiar without flattening the subject matter.",
      methodology: [
        "Mapped the recurring user question for each domain before choosing the view model, filters, and summary hierarchy.",
        "Built each route around a compact first screen that surfaces pressure, movement, and the most likely next interaction.",
        "Standardized URL state, snapshot handling, and card patterns so the family feels coherent even when the inputs differ.",
        "Used snapshot or lightweight live fetch paths depending on the domain so the surfaces stay fast and operationally simple.",
      ],
      decisions: [
        "Kept the primary scan state visible before deeper drilldowns so the user gets value without committing to a long session.",
        "Preferred shareable route state over session-only filters so a specific league, team, or segment view can travel in a link.",
        "Used editorial framing and pressure cues instead of raw tables alone so the dashboards answer why the data matters now.",
      ],
      collaboration:
        "This was solo product, design, data, and implementation work. I used the repeated pattern across routes to tighten the product system with each new dashboard.",
    },
    result: {
      outcomes: [
        "Shipped nine live Pulse dashboards across news, developer trends, and multiple sports surfaces under one shared product system.",
        "Made standings pressure, leaderboard movement, and cross-source comparison easier to scan in a few seconds instead of through tab-hopping.",
        "Created deep-linkable views so a specific team, league slice, or comparison state can be shared directly.",
        "Established a reusable dashboard pattern that made it faster to launch new Pulse surfaces without rebuilding the interaction model from scratch.",
      ],
      lessonsLearned: [
        "A dashboard family needs consistency in navigation and state, but the narrative frame still has to match the domain.",
        "Users care less about the full dataset than about whether the default view answers the first real question quickly.",
        "Snapshot-driven architecture is often the right tradeoff when the product value is orientation, not millisecond-level live precision.",
      ],
    },
    userSegments: [
      "Fans who want a fast read on standings pressure, form, and leaderboards.",
      "Readers and analysts comparing how a live information cycle is shifting.",
      "People who want a shareable link to the exact view they are discussing.",
    ],
    northStarMetric:
      "Time to useful context from landing on the dashboard to understanding what changed and why it matters.",
    tradeoffs: [
      {
        decision: "Shared system versus custom one-off route design",
        optionChosen: "A common Pulse interaction model with domain-specific framing",
        optionRejected: "Designing every dashboard from scratch",
        reasoning:
          "The shared model keeps the family learnable and faster to extend, while domain-specific framing preserves what is unique about each subject.",
      },
      {
        decision: "Snapshot-backed data versus fully live runtime dependencies",
        optionChosen: "Use snapshots where the product needs fast orientation and stable delivery",
        optionRejected: "Rely on live third-party APIs for every route",
        reasoning:
          "Snapshots reduce operational fragility and keep performance predictable, which matters more here than second-by-second freshness.",
      },
      {
        decision: "Editorial framing versus raw data density",
        optionChosen: "Lead with pressure, movement, and likely user questions",
        optionRejected: "Show every table first and let the user infer the story",
        reasoning:
          "The value of these dashboards is fast orientation. The interface has to tell the user why the data matters, not just expose it.",
      },
    ],
    retrospective:
      "If I keep extending the family, I would add a shared landing surface that shows the entire Pulse system in one place. Right now the common product logic is strong, but the family is still discovered route by route instead of through a dedicated hub.",
  },

  "decision-lab": {
    slug: "decision-lab",
    title: "Decision Lab",
    description:
      "Product-bet triage tool for scoring impact, confidence, effort, and reversibility, then forcing a plain ship, test, or hold recommendation.",
    role: "Product Builder & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Decision Support UX", "Tailwind CSS"],
    metrics: "6 presets · Deep-linkable state · Deterministic scoring model",
    github: "https://github.com/IsaacAVazquez",
    link: "/decision-lab",
    featured: true,

    overview: {
      summary:
        "I built a product-bet triage tool that keeps impact, confidence, effort, and reversibility separate before forcing a decision.",
      impact:
        "Makes roadmap debates more legible by turning fuzzy prioritization arguments into an explicit ship, test, or hold call.",
    },
    problem: {
      context:
        "Product discussions often collapse multiple tradeoffs into one vague conviction, which makes it easier to argue confidently than to reason clearly.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "food-map": {
    slug: "food-map",
    title: "Food Map",
    description:
      "Curated Austin restaurant map for sending friends to the right neighborhood, cuisine, and meal with a single deep-linkable shortlist.",
    role: "Product Builder & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "SVG", "Editorial UX"],
    metrics: "12 curated stops · 4 neighborhoods · Deep-linkable filters",
    github: "https://github.com/IsaacAVazquez",
    link: "/food-map",
    featured: true,

    overview: {
      summary:
        "I built a curated Austin food map that turns my actual go-to restaurant shortlist into a single deep-linkable product surface.",
      impact:
        "Replaces the same restaurant text-thread I keep retyping with one shareable link that already filters by neighborhood, cuisine, and meal.",
    },
    problem: {
      context:
        "Most food guides are either too long to be useful or too generic to be honest. A friend asking where to eat usually wants a short, opinionated answer, not a list of forty options.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "march-madness-2026": {
    slug: "march-madness-2026",
    title: "March Madness 2026 Bracket Analysis",
    description:
      "Data-driven NCAA tournament bracket built on KenPom metrics, the Trapezoid of Excellence, S-curve seeding analysis, injury reports, and a custom time zone travel penalty model.",
    role: "Data Analyst & Builder",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "React"],
    metrics: "15 ranked teams · 20 picks · 4 regions",
    github: "https://github.com/IsaacAVazquez",
    link: "/march-madness-2026",
    featured: true,

    overview: {
      summary:
        "I created a bracket analysis product that combines rankings, seed context, injuries, and travel penalties into one picking workflow.",
      impact:
        "Makes each pick easier to justify with a transparent framework instead of isolated hot takes.",
    },
    problem: {
      context:
        "Bracket picks are often based on seed bias or isolated stats instead of a consistent framework that weighs matchup context.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "la-liga-pulse": {
    slug: "la-liga-pulse",
    title: "La Liga Pulse",
    description:
      "Interactive La Liga dashboard for title-race context, European qualification pressure, relegation tracking, and curated scorer and assist leaderboards.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Sports Data", "UI Design"],
    metrics: "Matchday 30 snapshot · deep-linkable views · top-10 leaders",
    github: "https://github.com/IsaacAVazquez",
    link: "/la-liga",
    featured: true,

    overview: {
      summary:
        "I built a league dashboard for tracking title-race pressure, European qualification, relegation, and leaderboards in one view.",
      impact:
        "Compresses the season state into one product surface instead of forcing fans across standings, fixtures, and stat tables.",
    },
    problem: {
      context:
        "League tables rarely combine standings pressure, leaderboards, and next-step context into a single product surface.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "mba-role-tracker": {
    slug: "mba-role-tracker",
    title: "Job Search",
    description:
      "Recruiting-intelligence dashboard tracking public tech company job boards for MBA internships and full-time business roles across Greenhouse, Ashby, Lever, and manual career-page fallbacks.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Job board parsing", "Notification UX"],
    metrics: "32 companies · Live role filters · Alerts and digests",
    github: "https://github.com/IsaacAVazquez",
    link: "/mba-internship-notifications",
    featured: false,

    overview: {
      summary:
        "I built a recruiting-intelligence tracker that monitors public tech-company job boards for MBA internships and full-time business roles in one place.",
      impact:
        "Compresses repetitive recruiting checks into a faster decision surface with filters, alerts, and manual fallbacks.",
    },
    problem: {
      context:
        "MBA recruiting is fragmented across Greenhouse, Ashby, Lever, and manual career pages, which turns simple monitoring into repetitive tab work.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "spacex-mission-control": {
    slug: "spacex-mission-control",
    title: "SpaceX Mission Control",
    description:
      "Mission-control-style SpaceX launch board with a next-launch hero, upcoming and past mission browsing, and deep-linked relationship-aware mission detail.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "REST APIs", "Product Design"],
    metrics: "Live API surface · deep-linked mission detail",
    github: "https://github.com/IsaacAVazquez",
    link: "/spacex-mission-control",
    featured: true,

    overview: {
      summary:
        "I designed a mission-control-style launch board that makes upcoming missions, recent launches, and mission detail easier to explore.",
      impact:
        "Turns public mission data into a more navigable story and planning surface for enthusiasts.",
    },
    problem: {
      context:
        "Space launch information is often fragmented across plain tables, isolated articles, and inconsistent detail pages, and hard to aggregate for those that are curious.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "premier-league-pulse": {
    slug: "premier-league-pulse",
    title: "Premier League Pulse",
    description:
      "Premier League dashboard with standings, recent and upcoming fixtures, and club-level form drilldowns backed by a checked-in snapshot.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Snapshot pipeline", "Tailwind CSS"],
    metrics: "Checked-in standings · Fixture tracking · Club form drilldowns",
    github: "https://github.com/IsaacAVazquez",
    link: "/premier-league",
    featured: true,

    overview: {
      summary:
        "I built a Premier League dashboard that packages a checked-in competition snapshot into a deep-linkable product surface for standings, fixtures, and club-level recent-form exploration.",
      impact:
        "Turns a scheduled snapshot pipeline into a fast, shareable league exploration tool without a live runtime dependency.",
    },
    problem: {
      context:
        "League standings, fixture schedules, and club form are typically scattered across separate tabs or sites with no unified deep-linkable view.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "frontier-model-tracker": {
    slug: "frontier-model-tracker",
    title: "Frontier Model Tracker",
    description:
      "Curated dashboard of leading large language models with context windows, pricing, modality coverage, and editorial notes — built to make AI tier-collapse readable in seconds.",
    role: "Product Designer & Developer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "D3.js", "Tailwind CSS"],
    metrics: "9 models · 7 providers · curated weekly",
    link: "/frontier-models",
    featured: true,

    overview: {
      summary:
        "I built a side-by-side reference for frontier LLMs that surfaces the spec details product teams actually argue about: context window, blended price, modality coverage, and reasoning support.",
      impact:
        "Turns a moving market into a quick decision surface, paired with the model-economics writing on the same site.",
    },
    problem: {
      context:
        "Provider docs read like marketing pages. Comparing five frontier models takes a tab graveyard and a spreadsheet.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "ai-dev-tool-ecosystem": {
    slug: "ai-dev-tool-ecosystem",
    title: "AI Dev Tool Ecosystem",
    description:
      "Filterable directory of AI coding and agent tools with pricing tiers, model support, GitHub stars, release cadence, and source links.",
    role: "Product Designer & Developer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Developer Tools", "Market Research"],
    metrics: "16 tools · pricing tiers · model support · release cadence",
    link: "/ai-dev-tools",
    featured: true,

    overview: {
      summary:
        "I built a market map for AI coding tools that makes it easier to compare Cursor, Claude Code, Copilot, Devin, Cline, and the open-source agent layer without maintaining a spreadsheet.",
      impact:
        "Turns a fast-moving tool market into a shareable decision surface with filters, deep links, and sourced detail panels.",
    },
    problem: {
      context:
        "AI coding tools change pricing, model access, and release pace constantly. The useful comparison is not just features, but cost model, model control, open-source traction, and update velocity.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "github-trending-pulse": {
    slug: "github-trending-pulse",
    title: "GitHub Trending Pulse",
    description:
      "Daily-refreshed snapshot of active public GitHub repositories by language and topic, with weekly star movement carried forward from the public GitHub API.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "GitHub API", "Snapshot pipeline"],
    metrics: "14 segments · Daily refresh · Weekly star deltas",
    github: "https://github.com/IsaacAVazquez",
    link: "/github-trending-pulse",
    featured: true,

    overview: {
      summary:
        "I built a developer-trend dashboard that turns GitHub search data into a daily snapshot across languages, topics, and repository-level star movement.",
      impact:
        "Makes open source momentum easier to scan without treating GitHub Trending as a static leaderboard.",
    },
    problem: {
      context:
        "GitHub discovery is noisy when popular projects, freshly active repos, and topic-specific momentum all sit in different search paths.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "formula-1-pulse": {
    slug: "formula-1-pulse",
    title: "Formula 1 Pulse",
    description:
      "Editorial Formula 1 dashboard with the next Grand Prix, driver and constructor standings, and race-by-race context from a checked-in OpenF1 snapshot.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "OpenF1 API", "Snapshot pipeline"],
    metrics: "Driver & constructor tables · Race-by-race context · Snapshot-driven",
    github: "https://github.com/IsaacAVazquez",
    link: "/formula-1",
    featured: true,

    overview: {
      summary:
        "I built a Formula 1 dashboard that compresses the next Grand Prix, championship tables, and race-by-race context into a single snapshot-driven surface.",
      impact:
        "Turns OpenF1 history into a fast season-state view without forcing fans across separate F1 sites and spreadsheets.",
    },
    problem: {
      context:
        "F1 standings, driver form, and race calendars are typically fragmented across separate sites with no unified deep-linkable view.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "fantasy-formula-1-optimizer": {
    slug: "fantasy-formula-1-optimizer",
    title: "Fantasy Formula 1 Optimizer",
    description:
      "Practical Fantasy Formula 1 team optimizer with model-based prices, five-driver and two-constructor lineup constraints, locked picks, and local browser persistence.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "OpenF1 API", "Optimization UX"],
    metrics: "$100m budget model · 5 drivers + 2 constructors · Local lineup persistence",
    github: "https://github.com/IsaacAVazquez",
    link: "/fantasy-formula-1",
    featured: true,

    overview: {
      summary:
        "I built a Fantasy Formula 1 optimizer that turns the existing OpenF1 snapshot into a practical team-building surface with transparent pricing and projection assumptions.",
      impact:
        "Gives F1 fantasy players a faster way to compare lineup tradeoffs before a race weekend without pretending unofficial model data is official scoring.",
    },
    problem: {
      context:
        "Fantasy Formula 1 decisions usually mix official-game constraints, subjective form reads, and scattered race context with little visibility into why a lineup works.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "pga-tour-pulse": {
    slug: "pga-tour-pulse",
    title: "PGA Tour Pulse",
    description:
      "Snapshot-backed PGA Tour tournament dashboard for leaderboard scanning, player drilldowns, round-by-round movement, and weekend cut-line context.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Sports Data", "Snapshot pipeline"],
    metrics: "Tournament leaderboard · Round-by-round movement · Player drilldowns",
    github: "https://github.com/IsaacAVazquez",
    link: "/golf",
    featured: true,

    overview: {
      summary:
        "I built a PGA Tour tournament dashboard that turns a checked-in tournament snapshot into a clean, deep-linkable product surface.",
      impact:
        "Makes weekend leaderboard scanning, round-by-round movement, and cut-line context legible without juggling separate live sites.",
    },
    problem: {
      context:
        "Most tour leaderboards make it hard to compare round-by-round movement, cut-line pressure, and player form on a single screen.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "mlb-pulse": {
    slug: "mlb-pulse",
    title: "MLB Pulse",
    description:
      "Interactive Major League Baseball dashboard with division standings, AL and NL splits, wild card race, recent results, and league-wide hitting and pitching leaders.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "MLB Stats API", "Snapshot pipeline"],
    metrics: "Division standings · Wild card race · Hitting & pitching leaders",
    github: "https://github.com/IsaacAVazquez",
    link: "/mlb",
    featured: true,

    overview: {
      summary:
        "I built an MLB dashboard that combines division standings, league splits, wild card pressure, and league-wide stat leaders into one snapshot-driven surface.",
      impact:
        "Compresses scattered baseball data into a faster decision surface for tracking races, recent form, and league leaders.",
    },
    problem: {
      context:
        "League standings, wild card context, and stat leaders are usually split across separate tabs with no unified view of what actually matters that week.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "nba-pulse": {
    slug: "nba-pulse",
    title: "NBA Pulse",
    description:
      "Interactive NBA dashboard with conference standings, playoff seeding, play-in race context, and snapshot leaderboards for points, rebounds, and assists.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "ESPN API", "Snapshot pipeline"],
    metrics: "Conference standings · Play-in race · League stat leaders",
    github: "https://github.com/IsaacAVazquez",
    link: "/nba",
    featured: true,

    overview: {
      summary:
        "I built an NBA dashboard that packages conference standings, playoff seeding, play-in pressure, and league-wide stat leaders into one snapshot-driven view.",
      impact:
        "Turns scattered basketball context into a fast comparison surface for late-season races and league leaders.",
    },
    problem: {
      context:
        "Conference standings, playoff seeding, the play-in picture, and stat leaders rarely live on a single shareable surface.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "nfl-pulse": {
    slug: "nfl-pulse",
    title: "NFL Pulse",
    description:
      "Interactive NFL dashboard with conference seeding, division races, playoff cutoff context, point differential, and stat leaders from a checked-in NFLverse snapshot.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "NFLverse", "Snapshot pipeline"],
    metrics: "Conference seeding · Playoff race · Passing, rushing, receiving, and sack leaders",
    github: "https://github.com/IsaacAVazquez",
    link: "/nfl",
    featured: true,

    overview: {
      summary:
        "I built an NFL dashboard that packages conference standings, division context, playoff pressure, and stat leaders into one snapshot-driven surface.",
      impact:
        "Turns NFLverse data into a faster season-state view without forcing fans across standings pages, box scores, and stat tables.",
    },
    problem: {
      context:
        "NFL standings, playoff seeding, point differential, and player leaders usually live in separate places, which makes the season picture harder to scan quickly.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "polling-aggregator": {
    slug: "polling-aggregator",
    title: "Polling Aggregator",
    description:
      "Political polling aggregator tracking presidential approval, the generic congressional ballot, and key 2026 Senate and governor race polls in a deep-linkable dashboard.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Polling data", "Snapshot pipeline"],
    metrics: "Presidential approval · Generic ballot · 2026 Senate & governor races",
    github: "https://github.com/IsaacAVazquez",
    link: "/polling-aggregator",
    featured: true,

    overview: {
      summary:
        "I built a polling aggregator that combines presidential approval, the generic ballot, and competitive 2026 Senate and governor races into one snapshot-driven dashboard.",
      impact:
        "Turns scattered polling memos and single-state pages into a single deep-linkable view of where the cycle actually sits.",
    },
    problem: {
      context:
        "Polling context is fragmented across separate aggregators, single-state pages, and partisan blogs with no shared deep-linkable surface.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "museum-log": {
    slug: "museum-log",
    title: "Museum Log",
    description:
      "A Letterboxd-style museum tracker for browsing a curated catalog, reading curator reviews, saving museums to a watchlist, and logging visits with personal ratings.",
    role: "Product Builder & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Local-first state", "Editorial UX"],
    metrics: "Curated catalog · Watchlist & visit log · Local-first state",
    github: "https://github.com/IsaacAVazquez",
    link: "/museum-log",
    featured: true,

    overview: {
      summary:
        "I built a Letterboxd-style tracker for museums where users browse a curated catalog, save spots to a watchlist, and log visits with personal ratings.",
      impact:
        "Gives museum-goers one product surface for discovery, planning, and review instead of scattered notes and bookmarks.",
    },
    problem: {
      context:
        "There is no equivalent of Letterboxd for museums, so visit notes, watchlists, and exhibit memories live across spreadsheets, photo albums, and group chats.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "wine-cellar": {
    slug: "wine-cellar",
    title: "Wine Cellar",
    description:
      "Personal wine reviewing app for logging tastings, rating bottles, and tracking the wines you've poured — saved locally in your browser.",
    role: "Product Builder & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Local persistence", "Editorial UX"],
    metrics: "Tasting log · Bottle ratings · Browser-persisted cellar",
    github: "https://github.com/IsaacAVazquez",
    link: "/wine-cellar",
    featured: true,

    overview: {
      summary:
        "I built a personal wine reviewing app for logging tastings, rating bottles, and tracking the wines I've poured.",
      impact:
        "Keeps a wine journal lightweight enough to actually maintain without the friction of an account-backed tasting service.",
    },
    problem: {
      context:
        "Most wine apps lean heavy on social or commerce features when the core need is a private journaling surface for tasting notes.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },

  "recipe-finder": {
    slug: "recipe-finder",
    title: "Recipe Finder",
    description:
      "Pantry-aware recipe aggregator that ranks recipes by how many of your on-hand ingredients they cover, so weeknight cooking decisions take seconds.",
    role: "Product Builder & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Search UX", "Local persistence"],
    metrics: "Pantry-aware ranking · Curated recipe corpus · Client-side scoring",
    github: "https://github.com/IsaacAVazquez",
    link: "/recipe-finder",
    featured: true,

    overview: {
      summary:
        "I built an ingredient-driven recipe aggregator that ranks recipes by how many of your on-hand ingredients they cover.",
      impact:
        "Turns 'what can I cook with what's already in the kitchen?' into a fast answer instead of a long scroll.",
    },
    problem: {
      context:
        "Most recipe sites optimize for browsing inspiration, not for actually cooking with what is already in your pantry.",
      painPoints: [],
      stakes: "",
    },
    process: { approach: "", methodology: [], decisions: [] },
    result: { outcomes: [], lessonsLearned: [] },
    userSegments: [],
    northStarMetric: "",
    tradeoffs: [],
    retrospective: "",
  },
};

const HOMEPAGE_FEATURED_SLUGS = [
  "investment-analytics-platform",
  "news-pulse-dashboard",
  "interchange-iq",
] as const;

const PORTFOLIO_PROJECT_ORDER = [
  "investment-analytics-platform",
  "interchange-iq",
  "news-pulse-dashboard",
  "pulse-dashboards",
  "ai-dev-tool-ecosystem",
  "frontier-model-tracker",
  "github-trending-pulse",
  "decision-lab",
  "food-map",
  "museum-log",
  "wine-cellar",
  "recipe-finder",
  "budget-planner",
  "mba-role-tracker",
  "polling-aggregator",
  "spacex-mission-control",
  "premier-league-pulse",
  "la-liga-pulse",
  "fantasy-football-analytics",
  "nfl-pulse",
  "formula-1-pulse",
  "fantasy-formula-1-optimizer",
  "pga-tour-pulse",
  "mlb-pulse",
  "nba-pulse",
  "march-madness-2026",
] as const;

function getStudiesByOrderedSlugs(slugs: readonly string[]): CaseStudyData[] {
  return slugs.flatMap((slug) => {
    const study = caseStudiesData[slug];
    return study ? [study] : [];
  });
}

export function getProjectCardSummary(study: CaseStudyData): string {
  return study.overview.summary.trim() || study.description;
}

export function getProjectCardProblem(study: CaseStudyData): string {
  return (
    study.problem.context.trim() ||
    study.overview.impact.trim() ||
    study.description
  );
}

export function getProjectCardOutcome(study: CaseStudyData): string {
  for (const value of [
    study.overview.impact,
    study.result.outcomes[0],
    study.metrics,
    study.description,
  ]) {
    if (value?.trim()) {
      return value.trim();
    }
  }

  return "";
}

/** Get featured case studies (for homepage) */
export function getFeaturedCaseStudies(): CaseStudyData[] {
  return getPortfolioProjects().filter((cs) => cs.featured);
}

export function getHomepageFeaturedCaseStudies(): CaseStudyData[] {
  return getStudiesByOrderedSlugs(HOMEPAGE_FEATURED_SLUGS);
}

export function getPortfolioProjects(): CaseStudyData[] {
  const orderedProjects = getStudiesByOrderedSlugs(PORTFOLIO_PROJECT_ORDER).filter(
    (study) => !study.comingSoon
  );
  const seen = new Set(orderedProjects.map((study) => study.slug));
  const unorderedProjects = Object.values(caseStudiesData).filter(
    (study) => !study.comingSoon && !seen.has(study.slug)
  );

  return [...orderedProjects, ...unorderedProjects];
}

/** Get all case studies as an array */
export function getAllCaseStudies(): CaseStudyData[] {
  return Object.values(caseStudiesData);
}
