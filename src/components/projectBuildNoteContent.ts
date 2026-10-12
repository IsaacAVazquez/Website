/**
 * Per-route purpose prose for the project build-note aside; the method
 * belongs to the write-up the aside links to. This module is imported only
 * by ProjectBuildNote, which ConditionalLayout loads with next/dynamic. Keep
 * it that way so the prose ships in its own chunk instead of the shared
 * first-load bundle every route downloads.
 */
export interface ProjectBuildNoteContext {
  purpose: string;
}

export const PROJECT_BUILD_NOTE_CONTEXT: Record<string, ProjectBuildNoteContext> = {
  "/investments/before-you-buy": {
    purpose:
      "I built this independent product concept around the question I want answered before adding a stock, which is how the purchase changes what I already own. It compares the current portfolio with the proposed mix, keeping concentration and historical market behavior in the same view.",
  },
  "/agent-build-index": {
    purpose:
      "I built this as a focused read on the agents slice of my GitHub trending snapshot, since the full board mixes agent repositories in with every other language and topic I track. It ranks them by measured star movement over the week, keeps each figure labeled as measured, partial, or a new baseline, and sets agents beside the other topic groups so the number has something to be compared against.",
  },
  "/ai-dev-tools": {
    purpose:
      "I use this directory to compare coding assistants and agents against the constraints that actually shape a product decision, including model access, price, source availability, and release pace. The filters keep those tradeoffs in one view instead of reducing the choice to a popularity ranking.",
  },
  "/bay-area-transit": {
    purpose:
      "I built this around the questions I usually have before taking BART, from which line serves a station, to what is leaving next, to whether an alert changes the trip. It puts the system map, station board, and service context on one screen.",
  },
  "/decision-lab": {
    purpose:
      "I built this to score a product bet on impact, confidence, effort, and reversibility one at a time, before anyone argues for it as a whole, and then let a weighted score and three plain rules call it ship, test, or hold. Every slider lives in the URL, so a scored bet can be shared as a link and argued about on the same numbers.",
  },
  "/earthquake-pulse": {
    purpose:
      "I built this to make a busy earthquake feed easier to scan. It answers where meaningful activity happened, how strong and deep the events were, and which regions have been most active without requiring someone to sort through the raw event list first.",
  },
  "/fantasy-formula-1": {
    purpose:
      "I use this optimizer to test how five drivers and two constructors fit under a model budget, especially when I want to lock a few picks and see what the remaining roster can support. It makes the cost of each lineup choice explicit.",
  },
  "/fantasy-football": {
    purpose:
      "I use this board to turn one large fantasy ranking into the decisions I actually make on draft day, including position runs, scoring changes, tier breaks, and where average draft position disagrees with expert consensus.",
  },
  "/fintech-tools/budget-planner": {
    purpose:
      "I built this to plan a month of spending before it happens, the way envelope budgeting works, where income minus a savings target is the money that gets split across the categories. Every expense I log comes out of its envelope and out of a running balance in the register, and each month saves in the browser and exports as a CSV when I want it in a spreadsheet.",
  },
  "/fintech-tools/interchange-iq": {
    purpose:
      "I built this to see what a card payment actually costs under flat rate pricing versus interchange plus, since a flat rate bundles the interchange, the network fees, and the processor's markup into one number. It prices the same month of volume, ticket size, and card mix across seven processors' public rates and shows the ticket size where Stripe's interchange plus starts costing less than its flat rate.",
  },
  "/formula-1": {
    purpose:
      "I use this dashboard to move between the next Grand Prix, the driver and constructor standings, and the result of each race without losing the season context. The point is a clean answer to where the championship stands and what changed at the last meeting.",
  },
  "/frontier-models": {
    purpose:
      "I use this tracker when a model decision has to account for price, context window, modalities, and reasoning support at the same time. It is meant to narrow a product shortlist and make the cost and capability tradeoffs visible before a team starts testing.",
  },
  "/golf": {
    purpose:
      "I built this for the part of a golf tournament that is hard to read from a flat leaderboard, including how a player moved round by round, where the cut line sits, and what the course and field context mean for the current position.",
  },
  "/github-trending-pulse": {
    purpose:
      "I use this to find public repositories that are gaining attention within a language or topic, then separate total popularity from recent movement. That distinction is useful when I am looking for an active project rather than the repository with the largest historical star count.",
  },
  "/investments": {
    purpose:
      "I use this workspace to move from a portfolio-level question into the company detail behind it, comparing price history, financial context, valuation ratios, and holdings without turning the research into a spreadsheet maze.",
  },
  "/la-liga": {
    purpose:
      "I use this dashboard to see the pressure inside the La Liga table, from the title race, to European qualification, to relegation. Those cuts make the standings more useful than a single rank order and make it easier to understand what a club is playing for.",
  },
  "/mlb": {
    purpose:
      "I use this dashboard to move between division standings, the AL and NL races, and the wild card picture without treating them as separate products. Team drilldowns connect the table to recent results and the league's hitting and pitching leaders.",
  },
  "/nba": {
    purpose:
      "I use this dashboard to read the NBA standings through the decisions that matter late in the season, including playoff seeds, the play in line, and the gap between neighboring teams. It also keeps points, rebounds, and assists leaders close to the team picture.",
  },
  "/news-pulse": {
    purpose:
      "I built this to compare what major newsrooms are emphasizing at the same moment, then see which topics cross outlet lines and where the headline tone differs. It is a media coverage view, not another general news homepage.",
  },
  "/nfl": {
    purpose:
      "I use this dashboard to read the NFL table through conference seeds, division races, and the playoff cutoff, then connect those standings to point differential and the major player leaderboards. It keeps the team and league questions in one place.",
  },
  "/polling-aggregator": {
    purpose:
      "I built this interface to test how approval, the generic ballot, and individual Senate and governor races can sit in one coherent polling product. The useful part is moving from a national trend to the poll history behind a specific race without losing context.",
  },
  "/fintech-tools/rent-vs-buy": {
    purpose:
      "I built this because most rent versus buy comparisons stop at the monthly payment, and the question I actually care about is what I would be worth years from now on each path. It keeps the five inputs that move the answer most beside the verdict and the net-worth chart, with the rest one click away.",
  },
  "/premier-league": {
    purpose:
      "I use this dashboard to connect the Premier League table with the fixtures that produced it and the matches coming next. Club drilldowns make recent form easier to read without turning the overview into a wall of match data.",
  },
  "/spacex-mission-control": {
    purpose:
      "I use this board to answer what SpaceX is launching next, what has already flown, and how a mission connects to its rocket, payload, crew, capsule, and pad. Keeping those relationships together makes the launch list more useful than a calendar alone.",
  },
  "/tech-startup-tracker": {
    purpose:
      "I use this tracker to compare notable startups across sector, funding stage, valuation, capital raised, and recent financing without pretending that one number explains momentum. The goal is a research shortlist that can be sorted and inspected, not a definitive company ranking.",
  },
  "/world-cup-2026": {
    purpose:
      "I use this dashboard to move from the 2026 World Cup groups to the expanded knockout bracket, then down to the schedule and host venues. It keeps the tournament structure visible while making a specific team or stage easy to inspect.",
  },
  "/wine-cellar": {
    purpose:
      "I wanted a cellar book I would actually keep, with one line per bottle carrying the producer, the vintage, where it is from, and what I thought of it on a half-star scale. The log is the page, so adding a bottle and finding the one I opened last month happen in the same place.",
  },
};
