import { MBA_COMPANIES } from "@/constants/mba-companies";

export interface CaseStudyData {
  slug: string;
  title: string;
  description: string;
  role: string;
  timeline: string;
  tools: string[];
  metrics: string;
  link?: string | null;
  overview: {
    summary: string;
  };
}

export const caseStudiesData: Record<string, CaseStudyData> = {
  "investment-analytics-platform": {
    slug: "investment-analytics-platform",
    title: "Investment Analytics Platform",
    description:
      "Full-stack investment platform reading committed snapshots of a Yahoo Finance dataset, with Finnhub quotes. Portfolio tracking, gain/loss analytics, and side-by-side stock comparison with 30+ metrics.",
    role: "Full-Stack Developer & Designer",
    timeline: "2025",
    tools: ["Next.js", "TypeScript", "Finnhub API", "Tailwind CSS"],
    metrics: "Committed snapshots · 30+ metrics per stock · Side-by-side comparison",
    link: "/investments",

    overview: {
      summary:
        "I built an investment research workspace for tracking positions, comparing stocks, and scanning valuation, profitability, and growth in one place.",
    },
  },


  "before-you-buy": {
    slug: "before-you-buy",
    title: "Before You Buy",
    description:
      "A product concept for Google Finance where you can edit your portfolio and compare two purchases using the same amount, with changes in concentration and historical market behavior shown together.",
    role: "Product Concept, Design & Build",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "React", "Portfolio Analytics"],
    metrics: "Editable portfolio · Two purchase options · Shared historical comparison",
    link: "/investments/before-you-buy",

    overview: {
      summary:
        "An independent concept by Isaac Vazquez, not affiliated with or endorsed by Google. I built it for the moment right before a trade, when the question is what one more stock would do to the portfolio you already have.",
    },
  },

  "fantasy-football-analytics": {
    slug: "fantasy-football-analytics",
    title: "Fantasy Football Analytics Platform",
    description:
      "Fantasy football platform with snapshot-backed consensus rankings, tier views, scoring toggles, and a manual draft assistant, fed by an automated data pipeline that runs daily from July into early January and weekly the rest of the year.",
    role: "Solo Builder",
    timeline: "2024–2026",
    tools: ["Next.js", "TypeScript", "React", "GitHub Actions"],
    metrics: "Live · Weekly FantasyPros snapshots · PPR / Half / Standard",
    link: "/fantasy-football",

    overview: {
      summary:
        "I built a fantasy football platform that combines consensus rankings, tier views, and an automated data refresh into a single workflow, with the refresh running daily from July into early January and weekly the rest of the year.",
    },
  },

  "interchange-iq": {
    slug: "interchange-iq",
    title: "Interchange IQ",
    description:
      "I built a fee analyzer that compares online and in-person costs using dated US processor rates, includes required plan fees, and separates assumed custom contracts from published pricing.",
    role: "Builder",
    timeline: "2025",
    tools: ["Next.js", "TypeScript", "React", "Payments Economics"],
    metrics: "6 processors · Payment channel comparisons · Dated rate sources",
    link: "/fintech-tools/interchange-iq",

    overview: {
      summary:
        "I created a payment fee analyzer that turns interchange tables into a clear processor comparison with live breakeven logic.",
    },
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
    link: "/fintech-tools/budget-planner",

    overview: {
      summary:
        "I designed a monthly budgeting workspace that keeps planning, savings targets, and manual expense tracking in one browser-persisted flow.",
    },
  },

  "rent-vs-buy-calculator": {
    slug: "rent-vs-buy-calculator",
    title: "Rent vs. Buy Calculator",
    description:
      "I built a rent-vs-buy calculator that runs a month-by-month net-worth model, credits the renter the opportunity cost of a buyer's down payment and closing costs, and reports about how many years and months it takes buying to pull ahead, past the point where a monthly payment comparison stops.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "React", "Financial Modeling"],
    metrics: "Break-even year · Opportunity-cost model · Browser persistence",
    link: "/fintech-tools/rent-vs-buy",

    overview: {
      summary:
        "I created a housing-decision tool that models the full net-worth tradeoff between renting and buying, which goes further than comparing monthly payments.",
    },
  },

  "offer-comparison": {
    slug: "offer-comparison",
    title: "Offer Comparison Calculator",
    description:
      "I built an offer comparison calculator that lines up two or three job offers year by year across a four year equity vest, so a large signing bonus or a back loaded grant counts in the year it actually pays and the offer that wins year one can differ from the one that wins over four years.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "React", "Financial Modeling"],
    metrics: "Four year view · Vesting schedules · Browser persistence",
    link: "/fintech-tools/offer-comparison",

    overview: {
      summary:
        "I created a job offer calculator that compares base, target bonus, signing bonus, equity vesting, and retirement match one year at a time instead of as a single headline number.",
    },
  },

  "news-pulse-dashboard": {
    slug: "news-pulse-dashboard",
    title: "News Pulse Dashboard",
    description:
      "Live news media analytics tool aggregating RSS feeds from 6 major outlets. Visualizes coverage patterns, extracts trending topics, and performs lightweight sentiment analysis, all without an outside NLP service.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "RSS", "Tailwind CSS"],
    metrics: "6 outlets · Live feeds · Client-side NLP",
    link: "/news-pulse",

    overview: {
      summary:
        "I built a media analytics dashboard that tracks coverage patterns, topic frequency, and tone across major outlets without external NLP services.",
    },
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
    link: "/decision-lab",

    overview: {
      summary:
        "I built a product-bet triage tool that keeps impact, confidence, effort, and reversibility separate before forcing a decision.",
    },
  },

  "automation-enablement-assistant": {
    slug: "automation-enablement-assistant",
    title: "Automation Enablement Assistant",
    description:
      "Internal platform enablement tool that recommends a standard test stack, builds an onboarding plan, answers setup questions, and turns unresolved questions into a documentation backlog.",
    role: "Product Builder & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Quality Engineering", "Decision Support UX"],
    metrics: "12 seeded teams · 7 scored toolchains · 5 ranked documentation gaps",
    link: "/enablement-assistant",

    overview: {
      summary:
        "I built a first line of support for central tooling teams that have more adoption demand than they can handle one team at a time.",
    },
  },

  "food-map": {
    slug: "food-map",
    title: "Food Map",
    description:
      "Curated restaurant map across ten cities, from Austin to Tokyo, filterable by city, curator, and cuisine, for sending friends a single deep-linkable shortlist.",
    role: "Product Builder & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "SVG", "Editorial UX"],
    metrics: "12 curated stops · 4 neighborhoods · Deep-linkable filters",
    link: "/food-map",

    overview: {
      summary:
        "I built a curated food map across ten cities, from Austin to Tokyo, that puts the restaurants I actually send people to next to Anthony Bourdain's picks and the top-rated spots on Google, all on one deep-linkable map.",
    },
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
    link: "/march-madness-2026",

    overview: {
      summary:
        "I created a bracket analysis product that combines rankings, seed context, injuries, and travel penalties into one picking workflow.",
    },
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
    link: "/la-liga",

    overview: {
      summary:
        "I built a league dashboard for tracking title-race pressure, European qualification, relegation, and leaderboards in one view.",
    },
  },

  "mba-role-tracker": {
    slug: "mba-role-tracker",
    title: "Job Search",
    description:
      "Full-time job search tracker that polls public tech company job boards for business roles across Greenhouse, Ashby, Lever, SmartRecruiters, and manual career-page fallbacks, with an application pipeline and fit scoring.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Job board parsing", "Notification UX"],
    metrics: `${MBA_COMPANIES.length} companies · ${MBA_COMPANIES.filter((company) => company.atsType !== "manual").length} live boards · Fit scores and pipeline`,
    link: "/mba-internship-notifications",

    overview: {
      summary:
        "I built a job search tracker that monitors public tech-company job boards for full-time business roles in one place and keeps my application pipeline beside the feed.",
    },
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
    link: "/spacex-mission-control",

    overview: {
      summary:
        "I designed a mission-control-style launch board that makes upcoming missions, recent launches, and mission detail easier to explore.",
    },
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
    link: "/premier-league",

    overview: {
      summary:
        "I built a Premier League dashboard that packages a checked-in competition snapshot into a deep-linkable page for standings, fixtures, and club-level recent form.",
    },
  },

  "frontier-model-tracker": {
    slug: "frontier-model-tracker",
    title: "Frontier Model Tracker",
    description:
      "Curated dashboard of leading large language models with context windows, pricing, modality coverage, and editorial notes, built to show quickly how close the price and capability tiers between models have gotten.",
    role: "Product Designer & Developer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "D3.js", "Tailwind CSS"],
    metrics: "9 models · 7 providers · curated weekly",
    link: "/frontier-models",

    overview: {
      summary:
        "I built a side-by-side reference for frontier LLMs that surfaces the spec details product teams actually argue about: context window, blended price, modality coverage, and reasoning support.",
    },
  },

  "ai-dev-tool-ecosystem": {
    slug: "ai-dev-tool-ecosystem",
    title: "AI Dev Tool Directory",
    description:
      "Filterable directory of AI coding and agent tools with pricing tiers, model support, GitHub stars, release cadence, and source links.",
    role: "Product Designer & Developer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Developer Tools", "Market Research"],
    metrics: "16 tools · pricing tiers · model support · release cadence",
    link: "/ai-dev-tools",

    overview: {
      summary:
        "I built a market map for AI coding tools that makes it easier to compare Cursor, Claude Code, Copilot, Devin, Cline, and the open-source agent layer without maintaining a spreadsheet.",
    },
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
    link: "/github-trending-pulse",

    overview: {
      summary:
        "I built a developer-trend dashboard that turns GitHub search data into a daily snapshot across languages, topics, and repository-level star movement.",
    },
  },

  "tech-startup-tracker": {
    slug: "tech-startup-tracker",
    title: "Tech Startup Tracker",
    description:
      "Curated dashboard of notable private tech companies by sector and funding stage, with valuations, total raised, latest rounds, and a momentum score from a checked-in snapshot.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Snapshot pipeline", "Data design"],
    metrics: "24 startups · 6 sectors · Sector & stage views",
    link: "/tech-startup-tracker",

    overview: {
      summary:
        "I built a startup dashboard that organizes notable private tech companies by sector and funding stage, with valuations, total raised, and a momentum score from a curated snapshot.",
    },
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
    link: "/formula-1",

    overview: {
      summary:
        "I built a Formula 1 dashboard that puts the next Grand Prix, championship tables, and race-by-race context on a single snapshot-driven page.",
    },
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
    link: "/fantasy-formula-1",

    overview: {
      summary:
        "I built a Fantasy Formula 1 optimizer that turns the existing OpenF1 snapshot into a practical team-building tool with transparent pricing and projection assumptions.",
    },
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
    link: "/golf",

    overview: {
      summary:
        "I built a PGA Tour tournament dashboard that turns a checked-in tournament snapshot into a deep-linkable page.",
    },
  },

  "earthquake-pulse": {
    slug: "earthquake-pulse",
    title: "Earthquake Pulse",
    description:
      "Live global earthquake monitor that polls the USGS feed every five minutes and falls back to a checked-in snapshot, with the past 24 hours of seismic activity, significant quakes worldwide, magnitude distribution, and the busiest regions on one deep-linkable screen.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "USGS GeoJSON", "Live feed with snapshot fallback"],
    metrics: "24h seismic pulse · Significant worldwide quakes · Region & magnitude breakdowns",
    link: "/earthquake-pulse",

    overview: {
      summary:
        "I built a global earthquake dashboard that polls the USGS GeoJSON feed every five minutes, falls back to a checked-in snapshot when the feed is down, and turns that data into one deep-linkable page for recent activity, significant events, and regional breakdowns.",
    },
  },

  "world-cup-pulse": {
    slug: "world-cup-pulse",
    title: "World Cup Pulse",
    description:
      "Snapshot-backed 2026 FIFA World Cup dashboard covering all 12 group tables, the expanded 32-team knockout bracket, the full match schedule, and host venues across the United States, Canada, and Mexico.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "ESPN API", "Snapshot pipeline"],
    metrics: "Group standings · 32-team knockout bracket · Schedule & host venues",
    link: "/world-cup-2026",

    overview: {
      summary:
        "I built a 2026 FIFA World Cup dashboard that turns an ESPN snapshot into one deep-linkable page for group standings, the new 32-team knockout bracket, and the full three-country schedule.",
    },
  },

  "bay-area-transit-pulse": {
    slug: "bay-area-transit-pulse",
    title: "Bay Area Transit Pulse",
    description:
      "BART dashboard for the Bay Area that reads the BART public API about once a minute and falls back to a checked-in snapshot, with the line map, per-station departure boards, and active service alerts on one deep-linkable screen.",
    role: "Full-Stack Developer & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "BART API", "Snapshot pipeline"],
    metrics: "Line map · Per-station departures · Service alerts",
    link: "/bay-area-transit",

    overview: {
      summary:
        "I built a BART dashboard that reads the BART public API about once a minute while the page is open, falls back to a checked-in snapshot when it can't, and puts the line map, the next trains at any station, and live service alerts on one page.",
    },
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
    link: "/mlb",

    overview: {
      summary:
        "I built an MLB dashboard that combines division standings, league splits, wild card pressure, and league-wide stat leaders into one snapshot-driven view.",
    },
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
    link: "/nba",

    overview: {
      summary:
        "I built an NBA dashboard that packages conference standings, playoff seeding, play-in pressure, and league-wide stat leaders into one snapshot-driven view.",
    },
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
    link: "/nfl",

    overview: {
      summary:
        "I built an NFL dashboard that packages conference standings, division context, playoff pressure, and stat leaders into one snapshot-driven view.",
    },
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
    link: "/polling-aggregator",

    overview: {
      summary:
        "I built a polling aggregator that combines presidential approval, the generic ballot, and competitive 2026 Senate and governor races into one snapshot-driven dashboard.",
    },
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
    link: "/museum-log",

    overview: {
      summary:
        "I built a Letterboxd-style tracker for museums where users browse a curated catalog, save spots to a watchlist, and log visits with personal ratings.",
    },
  },

  "wine-cellar": {
    slug: "wine-cellar",
    title: "Wine Cellar",
    description:
      "Personal wine reviewing app for logging tastings, rating bottles, and tracking the wines you've poured. Saved locally in your browser.",
    role: "Product Builder & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Local persistence", "Editorial UX"],
    metrics: "Tasting log · Bottle ratings · Browser-persisted cellar",
    link: "/wine-cellar",

    overview: {
      summary:
        "I built a personal wine reviewing app for logging tastings, rating bottles, and tracking the wines I've poured.",
    },
  },

  "recipe-finder": {
    slug: "recipe-finder",
    title: "Recipe Finder",
    description:
      "Pantry-aware recipe finder that ranks recipes by how much of each one your on-hand ingredients cover, so weeknight cooking decisions take seconds.",
    role: "Product Builder & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Search UX", "Local persistence"],
    metrics: "Pantry-aware ranking · Curated recipe corpus · Client-side scoring",
    link: "/recipe-finder",

    overview: {
      summary:
        "I built an ingredient-driven recipe finder that ranks recipes by how much of each one your on-hand ingredients cover.",
    },
  },

  "travel-planner": {
    slug: "travel-planner",
    title: "Travel Planner",
    description:
      "Browser-persisted trip planner that turns dates into a day-by-day itinerary you can check off and journal against, with no account required.",
    role: "Product Builder & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Local persistence", "Itinerary UX"],
    metrics: "Day-by-day itinerary · Stop check-off · Per-trip journal",
    link: "/travel",

    overview: {
      summary:
        "I built a travel planner that lays a trip's dates out as a day-by-day itinerary, lets you check off stops, and keeps a journal entry per day.",
    },
  },
  "travel-deal-lab": {
    slug: "travel-deal-lab",
    title: "Travel Deal Lab",
    description:
      "A travel cost optimizer that tells you when to book, whether a fare or an award is a good deal, and how to split a budget, then hands you the playbook and tools for finding deals.",
    role: "Product Builder & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Pure engine", "Local persistence"],
    metrics: "Booking-window timing · Fare deal-score · Cash-vs-points check",
    link: "/travel-deals",

    overview: {
      summary:
        "I built a travel optimizer that turns a trip's shape into concrete decisions: when to book for the destination, whether a quoted fare beats the typical band, and what an award redemption is really worth per point.",
    },
  },
  "blackjack-trainer": {
    slug: "blackjack-trainer",
    title: "Blackjack Trainer",
    description:
      "A basic strategy trainer that deals hands, grades every decision against the chart for the table's rules, and drills card counting one deck at a time.",
    role: "Product Builder & Designer",
    timeline: "2026",
    tools: ["Next.js", "TypeScript", "Pure engine", "Local persistence"],
    metrics: "Graded decisions · Rule-aware strategy chart · Hi-Lo and REKO counting drill",
    link: "/blackjack-trainer",

    overview: {
      summary:
        "I built a blackjack trainer that deals from a shoe, grades each hit, stand, double, split, and surrender against basic strategy, and keeps a record of the plays I miss most.",
    },
  },
};

export const HOMEPAGE_FEATURED_SLUGS = [
  "before-you-buy",
  "news-pulse-dashboard",
  "interchange-iq",
] as const;

const PORTFOLIO_PROJECT_ORDER = [
  "before-you-buy",
  "investment-analytics-platform",
  "interchange-iq",
  "news-pulse-dashboard",
  "ai-dev-tool-ecosystem",
  "frontier-model-tracker",
  "github-trending-pulse",
  "tech-startup-tracker",
  "decision-lab",
  "automation-enablement-assistant",
  "food-map",
  "museum-log",
  "wine-cellar",
  "recipe-finder",
  "travel-planner",
  "travel-deal-lab",
  "blackjack-trainer",
  "budget-planner",
  "rent-vs-buy-calculator",
  "offer-comparison",
  "mba-role-tracker",
  "polling-aggregator",
  "spacex-mission-control",
  "bay-area-transit-pulse",
  "premier-league-pulse",
  "la-liga-pulse",
  "world-cup-pulse",
  "fantasy-football-analytics",
  "nfl-pulse",
  "formula-1-pulse",
  "fantasy-formula-1-optimizer",
  "pga-tour-pulse",
  "earthquake-pulse",
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

// The build article in content/blog for every built portfolio project, keyed by project slug.
export const PROJECT_BUILD_NOTES: Readonly<Record<string, string>> = {
  "before-you-buy": "building-before-you-buy",
  "march-madness-2026": "building-a-march-madness-bracket-workspace",
  "travel-deal-lab": "building-a-travel-deal-lab",
  "investment-analytics-platform": "building-an-investment-research-platform",
  "fantasy-football-analytics": "building-a-fantasy-football-rankings-platform",
  "interchange-iq": "interchange-iq-payment-fee-analyzer",
  "budget-planner": "building-a-budget-planner",
  "rent-vs-buy-calculator": "building-a-rent-vs-buy-calculator",
  "news-pulse-dashboard": "building-news-pulse-dashboard",
  "decision-lab": "building-decision-lab",
  "automation-enablement-assistant": "building-an-automation-enablement-assistant",
  "food-map": "building-an-austin-food-map",
  "la-liga-pulse": "building-a-la-liga-dashboard",
  "mba-role-tracker": "building-an-mba-recruiting-tracker",
  "spacex-mission-control": "building-spacex-mission-control",
  "premier-league-pulse": "building-a-premier-league-dashboard",
  "frontier-model-tracker": "building-a-frontier-model-tracker",
  "ai-dev-tool-ecosystem": "mapping-the-ai-dev-tool-ecosystem",
  "github-trending-pulse": "building-a-github-trending-dashboard",
  "tech-startup-tracker": "building-a-tech-startup-tracker",
  "formula-1-pulse": "building-a-formula-1-dashboard",
  "fantasy-formula-1-optimizer": "building-a-fantasy-formula-1-optimizer",
  "pga-tour-pulse": "building-a-pga-tour-dashboard",
  "earthquake-pulse": "building-an-earthquake-dashboard",
  "world-cup-pulse": "building-a-world-cup-dashboard",
  "bay-area-transit-pulse": "building-a-bart-transit-dashboard",
  "mlb-pulse": "building-an-mlb-dashboard",
  "nba-pulse": "building-an-nba-dashboard",
  "nfl-pulse": "building-an-nfl-dashboard",
  "polling-aggregator": "building-a-polling-aggregator",
  "museum-log": "building-a-museum-log",
  "wine-cellar": "building-a-wine-cellar-app",
  "recipe-finder": "building-a-pantry-aware-recipe-finder",
  "travel-planner": "building-a-travel-planner",
};

export function getProjectCardSummary(study: CaseStudyData): string {
  return study.overview.summary.trim() || study.description;
}

export function getHomepageFeaturedCaseStudies(): CaseStudyData[] {
  return getStudiesByOrderedSlugs(HOMEPAGE_FEATURED_SLUGS);
}

export function getPortfolioProjects(): CaseStudyData[] {
  const orderedProjects = getStudiesByOrderedSlugs(PORTFOLIO_PROJECT_ORDER);
  const seen = new Set(orderedProjects.map((study) => study.slug));
  const unorderedProjects = Object.values(caseStudiesData).filter(
    (study) => !seen.has(study.slug)
  );

  return [...orderedProjects, ...unorderedProjects];
}
