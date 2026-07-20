"use client";

import { usePathname } from "next/navigation";
import {
  Footer,
  type FooterVariant,
} from "@/components/Footer";
import { ProjectBuildNote } from "@/components/ProjectBuildNote";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

interface ProjectBuildNoteConfig {
  href: string;
  purpose?: string;
  method?: string;
}

const projectBuildNotes: Record<string, ProjectBuildNoteConfig> = {
  "/ai-dev-tools": {
    href: "/writing/mapping-the-ai-dev-tool-ecosystem",
    purpose:
      "I use this directory to compare coding assistants and agents against the constraints that actually shape a product decision, including model access, price, source availability, and release pace. The filters keep those tradeoffs in one view instead of reducing the choice to a popularity ranking.",
    method:
      "I maintain the entries as an editorial dataset and pair product details with public GitHub signals where they exist. The page is built for comparison and shortlisting, so every filter and selected tool can be shared through the URL.",
  },
  "/bay-area-transit": {
    href: "/writing/building-a-bart-transit-dashboard",
    purpose:
      "I built this around the questions I usually have before taking BART, from which line serves a station, to what is leaving next, to whether an alert changes the trip. It puts the system map, station board, and service context on one screen.",
    method:
      "The dashboard turns BART's public station, departure, alert, and elevator data into a stored snapshot. That keeps the page quick and predictable while preserving the source time, which matters because this is useful trip context rather than a guarantee of live service.",
  },
  "/decision-lab": { href: "/writing/building-decision-lab" },
  "/earthquake-pulse": {
    href: "/writing/building-an-earthquake-dashboard",
    purpose:
      "I built this to make a busy earthquake feed easier to scan. It answers where meaningful activity happened, how strong and deep the events were, and which regions have been most active without requiring someone to sort through the raw event list first.",
    method:
      "The page uses a stored snapshot of public USGS Earthquake Hazards Program data, then groups the events into recent, significant, magnitude, and regional views. The source time stays visible because the dashboard is a recent summary, not a live warning system.",
  },
  "/fantasy-formula-1": {
    href: "/writing/building-a-fantasy-formula-1-optimizer",
    purpose:
      "I use this optimizer to test how five drivers and two constructors fit under a model budget, especially when I want to lock a few picks and see what the remaining roster can support. It makes the cost of each lineup choice explicit.",
    method:
      "Prices and projections are my model outputs built from stored OpenF1 season data, and they should be read as a planning aid rather than official Fantasy Formula 1 values. Lineups stay in the browser, so the tool can support iteration without collecting account data.",
  },
  "/fantasy-football": {
    href: "/writing/building-a-fantasy-football-rankings-platform",
    purpose:
      "I use this board to turn one large fantasy ranking into the decisions I actually make on draft day, including position runs, scoring changes, tier breaks, and where average draft position disagrees with expert consensus.",
    method:
      "The rankings come from a dated FantasyPros consensus snapshot across PPR, half PPR, and standard formats. The page publishes that snapshot time, while queues, notes, comparisons, and draft state stay in the browser instead of being presented as shared expert data.",
  },
  "/fintech-tools/budget-planner": { href: "/writing/building-a-budget-planner" },
  "/fintech-tools/interchange-iq": { href: "/writing/interchange-iq-payment-fee-analyzer" },
  "/food-map": { href: "/writing/building-an-austin-food-map" },
  "/formula-1": {
    href: "/writing/building-a-formula-1-dashboard",
    purpose:
      "I use this dashboard to move between the next Grand Prix, the driver and constructor standings, and the result of each race without losing the season context. The point is a clean answer to where the championship stands and what changed at the last meeting.",
    method:
      "The page is built from a stored OpenF1 season snapshot rather than making live requests while someone is browsing. That makes the route fast and repeatable, while the generated date makes clear how current the standings and classifications are.",
  },
  "/frontier-models": {
    href: "/writing/building-a-frontier-model-tracker",
    purpose:
      "I use this tracker when a model decision has to account for price, context window, modalities, and reasoning support at the same time. It is meant to narrow a product shortlist and make the cost and capability tradeoffs visible before a team starts testing.",
    method:
      "I maintain the model specifications, prices, and notes as an editorial snapshot. The as of date matters because providers change these details often, and the table is a comparison starting point rather than a substitute for checking a provider's current documentation.",
  },
  "/golf": {
    href: "/writing/building-a-pga-tour-dashboard",
    purpose:
      "I built this for the part of a golf tournament that is hard to read from a flat leaderboard, including how a player moved round by round, where the cut line sits, and what the course and field context mean for the current position.",
    method:
      "The dashboard stores a snapshot from ESPN's public golf leaderboard feed and exposes the source time next to the tournament. That makes player drilldowns quick, but the page should be read as a recent tournament view rather than an official live scoring service.",
  },
  "/github-trending-pulse": {
    href: "/writing/building-a-github-trending-dashboard",
    purpose:
      "I use this to find public repositories that are gaining attention within a language or topic, then separate total popularity from recent movement. That distinction is useful when I am looking for an active project rather than the repository with the largest historical star count.",
    method:
      "A daily job reads the public GitHub Search API and stores a snapshot, while prior snapshots provide the weekly star change. The page keeps the generated time and repository links visible so the ranking can be checked against the underlying source.",
  },
  "/investments": {
    href: "/writing/building-an-investment-research-platform",
    purpose:
      "I use this workspace to move from a portfolio-level question into the company detail behind it, comparing price history, financial context, valuation ratios, and holdings without turning the research into a spreadsheet maze.",
    method:
      "The research views read committed company snapshots and show the relevant market dates rather than treating build time as data freshness. Live quotes are labeled separately when available, and a delayed or missing value stays visible instead of being filled with invented precision.",
  },
  "/la-liga": {
    href: "/writing/building-a-la-liga-dashboard",
    purpose:
      "I use this dashboard to see the pressure inside the La Liga table, from the title race, to European qualification, to relegation. Those cuts make the standings more useful than a single rank order and make it easier to understand what a club is playing for.",
    method:
      "The page is built from a stored football-data.org competition snapshot and keeps the update time visible. Team selection and each table view live in the URL, so a specific club or part of the race can be shared without asking someone to rebuild the same filters.",
  },
  "/mba-internship-notifications": { href: "/writing/building-an-mba-recruiting-tracker" },
  "/mlb": {
    href: "/writing/building-an-mlb-dashboard",
    purpose:
      "I use this dashboard to move between division standings, the AL and NL races, and the wild card picture without treating them as separate products. Team drilldowns connect the table to recent results and the league's hitting and pitching leaders.",
    method:
      "The page stores data from the public MLB Stats API and exposes the snapshot time alongside the results. That local snapshot keeps the experience fast, while the URL preserves the selected race and team for a direct, repeatable view.",
  },
  "/museum-log": { href: "/writing/building-a-museum-log" },
  "/nba": {
    href: "/writing/building-an-nba-dashboard",
    purpose:
      "I use this dashboard to read the NBA standings through the decisions that matter late in the season, including playoff seeds, the play in line, and the gap between neighboring teams. It also keeps points, rebounds, and assists leaders close to the team picture.",
    method:
      "The page turns ESPN's public NBA data into a stored snapshot with a visible update time. Conference, seed, and team state are carried in the URL, which makes the same standings view easy to revisit or share.",
  },
  "/news-pulse": {
    href: "/writing/building-news-pulse-dashboard",
    purpose:
      "I built this to compare what major newsrooms are emphasizing at the same moment, then see which topics cross outlet lines and where the headline tone differs. It is a media coverage view, not another general news homepage.",
    method:
      "The dashboard combines RSS headlines from six outlets, groups recurring terms, and applies a lightweight headline sentiment signal. That signal describes the words in a headline rather than the meaning or quality of the reporting, so the source stories remain the place to read the actual coverage.",
  },
  "/nfl": {
    href: "/writing/building-an-nfl-dashboard",
    purpose:
      "I use this dashboard to read the NFL table through conference seeds, division races, and the playoff cutoff, then connect those standings to point differential and the major player leaderboards. It keeps the team and league questions in one place.",
    method:
      "The page is built from a stored NFLverse snapshot and carries its update time with the data. Each conference view and team selection can be shared through the URL, while the snapshot avoids depending on a third party request during every visit.",
  },
  "/polling-aggregator": {
    href: "/writing/building-a-polling-aggregator",
    purpose:
      "I built this interface to test how approval, the generic ballot, and individual Senate and governor races can sit in one coherent polling product. The useful part is moving from a national trend to the poll history behind a specific race without losing context.",
    method:
      "The figures in this version are illustrative sample data, so no one should read the averages as current polling or a race forecast. The page demonstrates the aggregation and drilldown model, including how a selected view and race can be shared through the URL.",
  },
  "/premier-league": {
    href: "/writing/building-a-premier-league-dashboard",
    purpose:
      "I use this dashboard to connect the Premier League table with the fixtures that produced it and the matches coming next. Club drilldowns make recent form easier to read without turning the overview into a wall of match data.",
    method:
      "The page is built from a stored football-data.org competition snapshot, with the generated time kept alongside the standings and fixtures. Overview, fixture, and club states live in the URL, so the exact view can be shared or revisited.",
  },
  "/recipe-finder": { href: "/writing/building-a-pantry-aware-recipe-finder" },
  "/spacex-mission-control": {
    href: "/writing/building-spacex-mission-control",
    purpose:
      "I use this board to answer what SpaceX is launching next, what has already flown, and how a mission connects to its rocket, payload, crew, capsule, and pad. Keeping those relationships together makes the launch list more useful than a calendar alone.",
    method:
      "The dashboard uses stored Launch Library 2 data and preserves the precision of each published launch time instead of implying certainty the source does not have. Mission and panel choices stay in the URL, which makes a specific launch detail easy to share.",
  },
  "/tech-startup-tracker": {
    href: "/writing/building-a-tech-startup-tracker",
    purpose:
      "I use this tracker to compare notable startups across sector, funding stage, valuation, capital raised, and recent financing without pretending that one number explains momentum. The goal is a research shortlist that can be sorted and inspected, not a definitive company ranking.",
    method:
      "I maintain the company set and figures by hand in a dated editorial snapshot. The entries are not independently verified market data, so the source date and disclosure matter, and anyone making a financial or career decision should confirm the underlying company information.",
  },
  "/travel": { href: "/writing/building-a-travel-planner" },
  "/wine-cellar": { href: "/writing/building-a-wine-cellar-app" },
  "/world-cup-2026": {
    href: "/writing/building-a-world-cup-dashboard",
    purpose:
      "I use this dashboard to move from the 2026 World Cup groups to the expanded knockout bracket, then down to the schedule and host venues. It keeps the tournament structure visible while making a specific team or stage easy to inspect.",
    method:
      "The page turns a stored snapshot of ESPN's public tournament data into group, bracket, schedule, and team views. The update time stays with the data, and the selected view and team live in the URL so a specific tournament state can be shared.",
  },
};

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const selfShellRoutes = new Set([
    "/about",
    "/accessibility",
    "/ai-dev-tools",
    "/analytics-reference",
    "/arcade",
    "/bay-area-transit",
    "/changelog",
    "/contact",
    "/decision-lab",
    "/earthquake-pulse",
    "/fantasy-formula-1",
    "/fantasy-football",
    "/fantasy-football/draft-tracker",
    "/fintech-tools/budget-planner",
    "/fintech-tools/interchange-iq",
    "/food-map",
    "/formula-1",
    "/frontier-models",
    "/golf",
    "/github-trending-pulse",
    "/investments",
    "/la-liga",
    "/march-madness-2026",
    "/mba-internship-notifications",
    "/mlb",
    "/museum-log",
    "/nba",
    "/news-pulse",
    "/nfl",
    "/now",
    "/polling-aggregator",
    "/premier-league",
    "/portfolio",
    "/recipe-finder",
    "/release-notes",
    "/resume",
    "/score-pools",
    "/search",
    "/spacex-mission-control",
    "/tech-startup-tracker",
    "/travel",
    "/travel-deals",
    "/wine-cellar",
    "/world-cup-2026",
    "/writing",
  ]);
  const isSelfShellRoute =
    selfShellRoutes.has(pathname) ||
    pathname.startsWith("/portfolio/") ||
    pathname.startsWith("/score-pools/") ||
    pathname.startsWith("/writing/");
  const compactFooterRoutes = new Set(["/", "/contact"]);
  const footerVariant: FooterVariant = compactFooterRoutes.has(pathname)
    ? "compact"
    : "full";
  const buildNote = projectBuildNotes[pathname];
  return (
    <>
      <div className="min-h-screen">
        <main
          id="main-content"
          role="main"
          aria-label={isHomePage ? "Isaac Vazquez Portfolio Homepage" : "Portfolio Content"}
          tabIndex={-1}
        >
          {isHomePage ? (
            children
          ) : isSelfShellRoute ? (
            children
          ) : (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
              {children}
            </div>
          )}
          {buildNote ? (
            <ProjectBuildNote
              href={buildNote.href}
              purpose={buildNote.purpose}
              method={buildNote.method}
            />
          ) : null}
        </main>
      </div>

      <Footer variant={footerVariant} />
    </>
  );
}
