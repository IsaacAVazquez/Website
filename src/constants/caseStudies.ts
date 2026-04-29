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
      "Full-stack fantasy football platform with live tier rankings, D3 visualizations, and an automated data pipeline.",
    role: "Solo Builder",
    timeline: "2024–2025",
    tools: ["Next.js", "D3.js", "TypeScript", "SQLite"],
    metrics: "Live platform · 2026 season coming soon",
    github: "https://github.com/IsaacAVazquez",
    link: "/fantasy-football",
    featured: true,
    comingSoon: false,

    overview: {
      summary:
        "I built a fantasy football platform that combines tier rankings, visualizations, and automated data refreshes into a single weekly workflow.",
      impact:
        "Gives players one place to move from raw rankings to lineup and waiver decisions with less tab-hopping.",
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

  "textout-platform": {
    slug: "textout-platform",
    title: "TextOut Platform",
    description:
      "Product case study for a peer-to-peer texting platform where user research, workflow redesign, and GCP automation drove higher engagement and faster client onboarding.",
    role: "Product Owner & User Research Lead",
    timeline: "2024",
    tools: ["User Research", "Product Strategy", "GCP", "Campaign Analytics"],
    metrics: "35% engagement lift · 90% faster onboarding",
    github: null,
    featured: false,

    overview: {
      summary:
        "I owned product vision for a peer-to-peer texting platform, connecting campaign manager research to workflow improvements and onboarding automation.",
      impact:
        "Raised platform engagement while cutting client setup from a multi-week process to a same-day workflow for campaign teams.",
    },
    problem: {
      context:
        "Campaign teams needed to launch voter outreach quickly, but confusing workflows and manual setup steps made the platform harder to adopt during time-sensitive cycles.",
      painPoints: [
        "Campaign managers had limited visibility into message performance and volunteer activity.",
        "New client onboarding required manual configuration and repeated technical handoffs.",
        "Training new users took too long for campaign teams operating on fixed election timelines.",
      ],
      stakes:
        "In campaign technology, slow onboarding and unclear performance data can cost teams the days when voter contact matters most.",
    },
    process: {
      approach:
        "I combined user interviews, usage analysis, and product requirements to prioritize the parts of the texting workflow that created the most friction.",
      methodology: [
        "Interviewed campaign managers and users to identify onboarding and dashboard pain points.",
        "Translated research into user stories, acceptance criteria, and staged workflow improvements.",
        "Worked with engineering on GCP automation that reduced manual setup and made campaign data easier to access.",
      ],
      decisions: [
        "Prioritized dashboard clarity and onboarding speed over lower-impact feature requests.",
        "Used automation as a product feature because faster setup directly changed the customer experience.",
        "Kept reporting focused on the metrics campaign teams could act on during active outreach.",
      ],
      collaboration:
        "Partnered with engineering, client services, and campaign stakeholders to keep research findings connected to implementation decisions.",
    },
    result: {
      outcomes: [
        "Increased platform engagement by 35%.",
        "Reduced client onboarding time by 90% through GCP-backed automation.",
        "Improved campaign manager visibility into message delivery, volunteer activity, and outreach performance.",
      ],
      lessonsLearned: [
        "Automation creates more product value when it removes visible user friction, not just internal work.",
        "Campaign software has to respect calendar pressure, because users do not get to move the deadline.",
      ],
    },
    detailedMetrics: [
      { label: "Engagement lift", value: "35%" },
      { label: "Onboarding speed", value: "90% faster" },
      { label: "Setup time", value: "Same day" },
      { label: "Workflow", value: "Self-service" },
    ],
    userSegments: [
      "Campaign managers launching peer-to-peer texting programs.",
      "Client services teams responsible for campaign setup and support.",
      "Volunteer texting teams that needed clearer workflows and faster feedback.",
    ],
    northStarMetric: "Time from client kickoff to first usable campaign workflow.",
    tradeoffs: [
      {
        decision: "Where to focus the first product improvements",
        optionChosen: "Onboarding and campaign dashboard clarity",
        optionRejected: "A broader set of lower-confidence feature requests",
        reasoning:
          "The highest-leverage user pain showed up before and during launch, so reducing setup time made every later feature easier to adopt.",
      },
    ],
    retrospective:
      "I would bring engineers into more user interviews earlier so the automation ideas could emerge directly from hearing the customer workflow.",
  },

  "runningmate-platform": {
    slug: "runningmate-platform",
    title: "RunningMate Platform Launch",
    description:
      "Product and quality launch case study for an AI-powered campaign management platform, translating feedback into requirements, QA strategy, and a faster release motion.",
    role: "Product Development & Quality Lead",
    timeline: "2025",
    tools: ["Product Requirements", "AI Workflows", "QA Strategy", "Release Management"],
    metrics: "90% fewer critical defects · NPS 23 to 36 · Monthly to biweekly releases",
    github: null,
    featured: false,

    overview: {
      summary:
        "I helped launch RunningMate by turning leadership and user feedback into product requirements, quality criteria, and a release process the team could run repeatedly.",
      impact:
        "Reduced critical defects, improved NPS, and moved the product from monthly releases toward a biweekly operating rhythm.",
    },
    problem: {
      context:
        "The team needed to ship an AI-powered campaign management platform while keeping product feedback, QA planning, and release readiness aligned across functions.",
      painPoints: [
        "Feedback from leadership, users, and client teams needed to become clearer engineering work.",
        "Release validation was too manual for the pace the product needed.",
        "Quality signals were not visible enough across product, engineering, and client services.",
      ],
      stakes:
        "A launch with avoidable defects would have weakened customer trust at the exact moment the platform needed adoption momentum.",
    },
    process: {
      approach:
        "I built the connective tissue between product discovery, acceptance criteria, QA planning, and release operations.",
      methodology: [
        "Translated feedback into user stories and product requirements.",
        "Designed structured manual and automated QA coverage across core workflows.",
        "Built AI-assisted triage and workflow automation to reduce coordination time.",
      ],
      decisions: [
        "Made quality criteria part of product definition instead of a final release gate.",
        "Focused automation on repeatable triage and validation work before expanding coverage.",
        "Used release metrics to make delivery risk visible across teams.",
      ],
      collaboration:
        "Worked across product, engineering, leadership, and client services to keep launch scope, quality, and customer readiness connected.",
    },
    result: {
      outcomes: [
        "Reduced critical defects by 90%.",
        "Moved NPS from 23 to 36.",
        "Accelerated releases from monthly to biweekly.",
        "Reduced bug triage time by 40% through AI-powered workflow automation.",
      ],
      lessonsLearned: [
        "Launch quality improves when acceptance criteria are treated as product work, not QA cleanup.",
        "AI workflow automation is most useful when it removes coordination drag around repeated decisions.",
      ],
    },
    detailedMetrics: [
      { label: "Critical defects", value: "90% fewer" },
      { label: "NPS", value: "23 to 36" },
      { label: "Release cadence", value: "Biweekly" },
      { label: "Triage time", value: "40% lower" },
    ],
    userSegments: [
      "Campaign teams using the platform to manage voter engagement and analytics.",
      "Internal product and engineering teams responsible for launch readiness.",
      "Client services teams supporting customer activation and issue resolution.",
    ],
    northStarMetric: "Reliable campaign workflow activation without critical release defects.",
    tradeoffs: [
      {
        decision: "How to structure launch quality work",
        optionChosen: "Quality criteria tied directly to product requirements",
        optionRejected: "A separate QA checklist after implementation",
        reasoning:
          "The platform was moving quickly, so quality had to be part of the work definition rather than a late-stage inspection layer.",
      },
    ],
    retrospective:
      "I would formalize the release metrics earlier so the team could compare quality improvements from the first launch cycle instead of midway through the rollout.",
  },

  "civic-engagement-platform-scale": {
    slug: "civic-engagement-platform-scale",
    title: "Scaling a Platform to 60M+ Users",
    description:
      "Reliability and quality strategy case study for scaling a civic engagement platform through high-stakes election traffic while protecting uptime and release speed.",
    role: "Product Reliability & Quality Lead",
    timeline: "2022",
    tools: ["Cypress", "Jest", "React", "Node.js"],
    metrics: "60M+ users · 99.9% uptime · 30% faster releases",
    github: null,
    featured: false,

    overview: {
      summary:
        "I led quality and reliability work for a civic engagement platform that needed to scale from 5M to 60M+ users during the 2022 midterm cycle.",
      impact:
        "Helped the team protect uptime, improve release speed, and catch more issues before production during a high-pressure election window.",
    },
    problem: {
      context:
        "Election software has fixed deadlines and traffic spikes. The platform needed to scale quickly without letting release pressure create reliability failures.",
      painPoints: [
        "Manual test coverage could not keep up with rapid feature development.",
        "Critical user paths needed stronger protection before election-day traffic.",
        "Release cycles had to get faster without lowering confidence.",
      ],
      stakes:
        "Reliability issues during election periods can damage client trust and interrupt voter outreach work at the worst possible moment.",
    },
    process: {
      approach:
        "I built a reliability-focused quality strategy around automated coverage, critical-path validation, and stakeholder-visible release signals.",
      methodology: [
        "Mapped the highest-risk voter outreach workflows and platform edge cases.",
        "Expanded automated test coverage across critical product paths.",
        "Created release reporting that made readiness and risk easier for stakeholders to inspect.",
      ],
      decisions: [
        "Prioritized critical election-day flows before lower-risk coverage expansion.",
        "Used automation to shorten validation time while keeping manual review for high-risk scenarios.",
        "Focused reporting on signals that could change release decisions.",
      ],
      collaboration:
        "Partnered with product, engineering, and compliance stakeholders to connect test strategy to customer and regulatory risk.",
    },
    result: {
      outcomes: [
        "Supported scale from 5M to 60M+ users.",
        "Achieved 99.9% uptime during the election cycle.",
        "Improved release velocity by 30%.",
        "Raised pre-production bug detection to 95%.",
      ],
      lessonsLearned: [
        "High-scale reliability work has to start with the workflows users cannot afford to lose.",
        "A faster release process only works when confidence signals are visible and trusted.",
      ],
    },
    detailedMetrics: [
      { label: "Users reached", value: "60M+" },
      { label: "Uptime", value: "99.9%" },
      { label: "Release speed", value: "30% faster" },
      { label: "Pre-prod detection", value: "95%" },
    ],
    userSegments: [
      "Campaign and advocacy teams operating voter outreach programs.",
      "Internal teams responsible for election-cycle platform reliability.",
      "Stakeholders who needed release confidence under fixed deadlines.",
    ],
    northStarMetric: "Reliable voter outreach workflows during election-cycle scale.",
    tradeoffs: [
      {
        decision: "How to prioritize test coverage under time pressure",
        optionChosen: "Critical election-day workflows first",
        optionRejected: "Broad but shallow coverage across the whole product",
        reasoning:
          "The highest-risk failures were concentrated in core outreach and data workflows, so depth mattered more than vanity coverage.",
      },
    ],
    retrospective:
      "I would create the stakeholder-facing risk dashboard earlier so release conversations could move from status updates to decision-making sooner.",
  },

  "qa-automation-framework": {
    slug: "qa-automation-framework",
    title: "Unlocking Daily Deploys Through Process Automation",
    description:
      "Automation and release-process case study for turning QA from a late release bottleneck into a repeatable delivery system across multiple product stacks.",
    role: "QA Automation & Process Lead",
    timeline: "2023",
    tools: ["Selenium", "Python", "Docker", "CI/CD"],
    metrics: "50% fewer defects · 85% critical-path coverage · 300% ROI",
    github: null,
    featured: false,

    overview: {
      summary:
        "I designed an automation framework and release workflow that reduced manual validation time and made faster deployment cadence realistic.",
      impact:
        "Cut production defects, raised critical-path coverage, and moved quality work closer to the engineering workflow.",
    },
    problem: {
      context:
        "Manual testing across multiple tech stacks was slowing releases and letting defects reach production after repetitive validation work.",
      painPoints: [
        "Release validation took too long and blocked deployment momentum.",
        "Coverage gaps made recurring production defects hard to prevent.",
        "QA work was too dependent on manual repetition instead of reusable test assets.",
      ],
      stakes:
        "Slow validation was costing the team speed, while escaped defects were eroding confidence in each release.",
    },
    process: {
      approach:
        "I built a modular automation framework with reusable patterns, containerized execution, and CI visibility.",
      methodology: [
        "Identified high-value regression paths before adding lower-priority coverage.",
        "Implemented reusable test components and page objects.",
        "Integrated automation into CI so failures surfaced before release handoff.",
      ],
      decisions: [
        "Chose reliability and maintainability over chasing the largest possible test count.",
        "Used Docker to standardize execution across teams and environments.",
        "Created reporting that grouped failures by likely cause instead of raw failure volume.",
      ],
      collaboration:
        "Trained engineers and QA teammates on automation patterns so the framework could survive beyond one owner.",
    },
    result: {
      outcomes: [
        "Reduced production defects by 50%.",
        "Raised critical-path coverage to 85%.",
        "Reduced test execution from days to hours.",
        "Saved roughly 160 QA hours per month through reusable automation.",
      ],
      lessonsLearned: [
        "Stable tests beat broad flaky coverage every time.",
        "Automation adoption depends as much on documentation and training as on the framework itself.",
      ],
    },
    detailedMetrics: [
      { label: "Defects", value: "50% fewer" },
      { label: "Coverage", value: "85%" },
      { label: "Time saved", value: "160 hrs/mo" },
      { label: "ROI", value: "300%" },
    ],
    userSegments: [
      "Engineering teams that needed faster feedback on release risk.",
      "QA teams responsible for repeatable regression validation.",
      "Product stakeholders waiting on clearer release readiness signals.",
    ],
    northStarMetric: "Release validation time without increasing escaped defects.",
    tradeoffs: [
      {
        decision: "What mattered most in the automation roadmap",
        optionChosen: "Stable critical-path automation",
        optionRejected: "Maximum test count across low-value paths",
        reasoning:
          "The team needed confidence, not a brittle test inventory that created more triage work than signal.",
      },
    ],
    retrospective:
      "I would invest in ownership documentation even earlier so each product team could extend the suite without waiting on a central QA lead.",
  },

  "campaign-analytics-dashboard": {
    slug: "campaign-analytics-dashboard",
    title: "Transforming Client Reporting into Self-Service Analytics",
    description:
      "Analytics product case study for replacing manual Excel reporting with automated dashboards that made campaign performance visible faster.",
    role: "Analytics Product Lead",
    timeline: "2020-2021",
    tools: ["SQL", "Tableau", "Python", "ETL"],
    metrics: "40% faster decisions · 25% conversion lift · 60 hours saved monthly",
    github: null,
    featured: false,

    overview: {
      summary:
        "I led a reporting-to-analytics shift that replaced manual spreadsheet work with automated dashboards and cleaner client-facing performance views.",
      impact:
        "Campaign teams moved from stale reports to faster decisions, better targeting, and a more scalable client analytics model.",
    },
    problem: {
      context:
        "Campaign managers were spending too much time assembling reports from disconnected systems, which slowed optimization and made clients wait for answers.",
      painPoints: [
        "Manual reporting consumed dozens of hours every month.",
        "Reports were often stale by the time stakeholders reviewed them.",
        "Non-technical users needed clearer views of campaign performance and trends.",
      ],
      stakes:
        "Reporting work was limiting the team's ability to scale clients and spend time on strategy instead of spreadsheet assembly.",
    },
    process: {
      approach:
        "I treated reporting as a product workflow, starting with the decisions users needed to make and then building the data pipeline around those decisions.",
      methodology: [
        "Interviewed campaign managers to identify recurring reporting questions.",
        "Modeled campaign data into repeatable SQL and ETL workflows.",
        "Built dashboard views that prioritized the metrics clients used in weekly decisions.",
      ],
      decisions: [
        "Kept the first version focused on the highest-frequency reporting questions.",
        "Balanced refresh frequency against API limits and operational cost.",
        "Designed for self-service use rather than internal analyst handholding.",
      ],
      collaboration:
        "Worked with campaign managers, data partners, and client-facing teams to validate dashboard usefulness with real campaign scenarios.",
    },
    result: {
      outcomes: [
        "Reduced monthly reporting work by roughly 60 hours.",
        "Accelerated campaign decision-making by 40%.",
        "Improved conversion by 25% through better-informed segmentation.",
        "Helped the team support more clients without adding reporting headcount.",
      ],
      lessonsLearned: [
        "The best dashboard is the one that replaces a real recurring decision workflow.",
        "Self-service analytics only works when the data model matches how users already think about the work.",
      ],
    },
    detailedMetrics: [
      { label: "Decision speed", value: "40% faster" },
      { label: "Conversion lift", value: "25%" },
      { label: "Time saved", value: "60 hrs/mo" },
      { label: "Client scale", value: "3x" },
    ],
    userSegments: [
      "Campaign managers optimizing voter outreach programs.",
      "Client stakeholders reviewing campaign performance.",
      "Internal teams responsible for recurring reporting and analysis.",
    ],
    northStarMetric: "Time from campaign data refresh to usable client decision.",
    tradeoffs: [
      {
        decision: "How much dashboard scope to ship first",
        optionChosen: "A focused set of high-frequency decision views",
        optionRejected: "A broad reporting portal with every possible metric",
        reasoning:
          "The immediate value came from replacing the reports people already used, not from creating another place to hunt for data.",
      },
    ],
    retrospective:
      "I would define dashboard ownership and metric governance earlier so the reporting product could keep improving without turning into a one-off build.",
  },

  "performance-intelligence": {
    slug: "performance-intelligence",
    title: "Preventing Outages Through Proactive Performance Intelligence",
    description:
      "Reliability case study for shifting a product team from reactive incident response to proactive performance monitoring and clearer alerting.",
    role: "Product Reliability Lead",
    timeline: "2022-2023",
    tools: ["New Relic", "Grafana", "JMeter", "Incident Review"],
    metrics: "60% faster load times · 99.95% uptime · 85% proactive issue detection",
    github: null,
    featured: false,

    overview: {
      summary:
        "I built a performance intelligence workflow that helped the team find reliability issues before users felt them.",
      impact:
        "Improved load times, raised uptime, and made performance risk part of planning instead of only incident response.",
    },
    problem: {
      context:
        "The team was reacting to performance issues after user impact, and the existing monitoring did not connect technical signals to product risk clearly enough.",
      painPoints: [
        "Alerts were either too noisy or too late to guide action.",
        "Performance regressions were difficult to connect to releases.",
        "Stakeholders lacked a clear view of which reliability issues mattered most.",
      ],
      stakes:
        "Every preventable outage or slow workflow weakened user trust and pulled the team away from planned product work.",
    },
    process: {
      approach:
        "I connected monitoring, load testing, and incident review into one workflow for spotting risk and prioritizing performance fixes.",
      methodology: [
        "Defined performance thresholds around user-facing workflows.",
        "Built dashboards that separated actionable signals from background noise.",
        "Added load-testing and incident-review loops to catch recurring bottlenecks.",
      ],
      decisions: [
        "Set alert thresholds around user impact instead of raw infrastructure noise.",
        "Tracked regressions by product workflow so fixes could be prioritized.",
        "Used incident reviews to update monitoring coverage instead of just documenting failures.",
      ],
      collaboration:
        "Worked with engineering and product stakeholders to make performance tradeoffs explicit during planning and release review.",
    },
    result: {
      outcomes: [
        "Reduced page load times by 60%.",
        "Improved uptime to 99.95%.",
        "Raised proactive issue detection to 85% before user impact.",
        "Made performance reporting part of regular product review.",
      ],
      lessonsLearned: [
        "Monitoring is only useful when it changes what the team does next.",
        "Performance work lands better when it is framed around user workflows, not isolated infrastructure metrics.",
      ],
    },
    detailedMetrics: [
      { label: "Load time", value: "60% faster" },
      { label: "Uptime", value: "99.95%" },
      { label: "Response time", value: "250ms avg" },
      { label: "Proactive detection", value: "85%" },
    ],
    userSegments: [
      "Product teams responsible for reliable campaign workflows.",
      "Engineering teams responding to performance incidents.",
      "Stakeholders who needed clearer reliability risk before launches.",
    ],
    northStarMetric: "User-impacting performance issues detected before escalation.",
    tradeoffs: [
      {
        decision: "How to tune alerting",
        optionChosen: "User-impact thresholds tied to key workflows",
        optionRejected: "Broad infrastructure alerts for every metric movement",
        reasoning:
          "The team needed fewer, better signals that mapped to user pain and product priority.",
      },
    ],
    retrospective:
      "I would pair the dashboards with runbooks earlier so each alert had a clearer owner and first response path.",
  },

  "pricing-strategy-initiative": {
    slug: "pricing-strategy-initiative",
    title: "Pricing Strategy Initiative",
    description:
      "Product strategy case study for aligning engineering, sales, and finance around product value, packaging, and revenue expansion.",
    role: "Strategy Lead",
    timeline: "2022",
    tools: ["Financial Modeling", "Market Analysis", "Stakeholder Alignment", "Executive Dashboards"],
    metrics: "$4M additional annual revenue · Pricing framework adopted",
    github: null,
    featured: false,

    overview: {
      summary:
        "I led a cross-functional pricing initiative that connected market analysis, product value, and financial modeling into a clearer pricing strategy.",
      impact:
        "Generated $4M in additional annual revenue and gave the organization a repeatable framework for future pricing decisions.",
    },
    problem: {
      context:
        "The organization needed a pricing strategy that reflected product value, market position, and customer willingness to pay rather than inherited assumptions.",
      painPoints: [
        "Pricing conversations were split across sales, finance, product, and engineering.",
        "Decision-makers lacked a shared model for product value and market comparison.",
        "Packaging decisions needed clearer revenue and customer-impact tradeoffs.",
      ],
      stakes:
        "Weak pricing strategy can leave revenue on the table while making future packaging changes harder to explain to customers.",
    },
    process: {
      approach:
        "I built the analytical and stakeholder alignment layer needed to make pricing a product decision rather than a finance-only exercise.",
      methodology: [
        "Researched market benchmarks and competitor packaging.",
        "Modeled pricing scenarios against revenue, adoption, and operational constraints.",
        "Created executive-facing materials that made tradeoffs explicit.",
      ],
      decisions: [
        "Centered the strategy on product value and customer segment fit.",
        "Separated near-term revenue opportunities from longer-term packaging bets.",
        "Used a repeatable model so the work could guide future product lines.",
      ],
      collaboration:
        "Aligned engineering, sales, finance, and leadership around the assumptions behind each pricing scenario.",
    },
    result: {
      outcomes: [
        "Generated $4M in additional annual revenue.",
        "Created a market analysis framework adopted for future pricing work.",
        "Secured executive buy-in through clear scenario modeling.",
      ],
      lessonsLearned: [
        "Pricing work is product work when it changes packaging, value communication, and roadmap tradeoffs.",
        "Stakeholder alignment improves when every group can see its assumptions in the model.",
      ],
    },
    detailedMetrics: [
      { label: "Revenue impact", value: "$4M" },
      { label: "Function alignment", value: "4 teams" },
      { label: "Framework", value: "Adopted" },
      { label: "Decision model", value: "Reusable" },
    ],
    userSegments: [
      "Executive stakeholders making pricing and packaging decisions.",
      "Sales teams needing clearer value articulation.",
      "Product and engineering teams planning value-driving roadmap work.",
    ],
    northStarMetric: "Incremental annual revenue tied to clearer product value capture.",
    tradeoffs: [
      {
        decision: "How to frame pricing recommendations",
        optionChosen: "Scenario-based product value model",
        optionRejected: "One fixed price recommendation without tradeoff context",
        reasoning:
          "Pricing needed executive confidence, and that required showing the assumptions and customer impact behind each option.",
      },
    ],
    retrospective:
      "I would add customer validation earlier in the model so willingness-to-pay evidence could sit beside market and financial analysis from the start.",
  },

  "digital-acquisition-strategy": {
    slug: "digital-acquisition-strategy",
    title: "Digital Acquisition Strategy",
    description:
      "Growth product case study for using segmentation, personalized messaging, and experimentation to improve voter acquisition and campaign conversion.",
    role: "Growth Product & Analytics Lead",
    timeline: "2020",
    tools: ["A/B Testing", "Email Marketing", "Segmentation", "Analytics"],
    metrics: "5x user growth · 25% conversion lift · Experimentation framework adopted",
    github: null,
    featured: false,

    overview: {
      summary:
        "I built a growth workflow around segmentation, personalized outreach, and experimentation so campaign acquisition decisions could move from instinct to evidence.",
      impact:
        "Helped grow the user base 5x while improving conversion through sharper targeting and repeatable testing.",
    },
    problem: {
      context:
        "Digital acquisition work was too dependent on broad messaging and one-off campaign tactics, making it difficult to learn what actually converted users.",
      painPoints: [
        "Audience segments were not being used consistently across outreach.",
        "Campaign tests were hard to compare because they lacked a repeatable structure.",
        "Teams needed faster feedback on which messages and channels were working.",
      ],
      stakes:
        "Without a stronger acquisition system, campaign growth would depend on volume rather than learning, personalization, and better targeting.",
    },
    process: {
      approach:
        "I treated acquisition as a product loop, tying segmentation, messaging, testing, and analytics into one repeatable workflow.",
      methodology: [
        "Built audience segments around user behavior and campaign context.",
        "Ran structured A/B tests across messaging and call-to-action variants.",
        "Created reporting loops that connected acquisition tactics to conversion outcomes.",
      ],
      decisions: [
        "Prioritized tests that could inform future campaigns, not just one send.",
        "Focused personalization around meaningful segment differences instead of superficial tokens.",
        "Made learnings reusable through a shared experimentation framework.",
      ],
      collaboration:
        "Worked with campaign, analytics, and communications teams to connect growth experiments to real outreach goals.",
    },
    result: {
      outcomes: [
        "Grew the user base 5x over 12 months.",
        "Improved conversion by 25% through optimized segmentation.",
        "Created an A/B testing framework adopted across future campaigns.",
      ],
      lessonsLearned: [
        "Experimentation works best when each test creates reusable learning.",
        "Segmentation only matters when it changes the message, offer, or timing in a meaningful way.",
      ],
    },
    detailedMetrics: [
      { label: "User growth", value: "5x" },
      { label: "Conversion lift", value: "25%" },
      { label: "Test framework", value: "Adopted" },
      { label: "Timeline", value: "12 months" },
    ],
    userSegments: [
      "Campaign teams responsible for digital acquisition.",
      "Voters and supporters receiving segmented outreach.",
      "Internal stakeholders comparing growth-channel performance.",
    ],
    northStarMetric: "Qualified user growth from repeatable acquisition experiments.",
    tradeoffs: [
      {
        decision: "How to structure acquisition testing",
        optionChosen: "Repeatable segment and message experiments",
        optionRejected: "One-off campaign blasts optimized only for short-term volume",
        reasoning:
          "The team needed compounding learning, so each campaign had to improve the next one.",
      },
    ],
    retrospective:
      "I would build the experiment repository earlier so future teams could reuse past learnings without reconstructing them from reports.",
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
  "pga-tour-pulse",
  "mlb-pulse",
  "nba-pulse",
  "march-madness-2026",
  "textout-platform",
  "runningmate-platform",
  "civic-engagement-platform-scale",
  "campaign-analytics-dashboard",
  "qa-automation-framework",
  "performance-intelligence",
  "pricing-strategy-initiative",
  "digital-acquisition-strategy",
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
