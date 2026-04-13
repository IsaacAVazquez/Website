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
};

const HOMEPAGE_FEATURED_SLUGS = [
  "investment-analytics-platform",
  "interchange-iq",
  "news-pulse-dashboard",
  "spacex-mission-control",
] as const;

const PORTFOLIO_PROJECT_ORDER = [
  "investment-analytics-platform",
  "interchange-iq",
  "news-pulse-dashboard",
  "budget-planner",
  "spacex-mission-control",
  "premier-league-pulse",
  "fantasy-football-analytics",
  "la-liga-pulse",
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
