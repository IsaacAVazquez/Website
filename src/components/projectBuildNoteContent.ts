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
  "/enablement-assistant": {
    purpose:
      "I built this to show how a small central tooling team could support many product teams without repeating the same onboarding work for each one. The program view ranks the setup questions the knowledge base could not answer and shows which teams have drifted from the standard, and the team view turns a three-step intake into a scored stack, an onboarding plan, and a handoff to a person when the confidence is too low.",
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
      "I built this to see what a card payment actually costs under flat rate pricing versus interchange plus, since a flat rate bundles the interchange, the network fees, and the processor's markup into one number. It compares the same payment channel across published flat rates, includes Shopify's required plan fee, and keeps assumed custom contracts behind an explicit choice. Each published rate links to its source and carries a check date.",
  },
  "/fantasy-football/best-ball": {
    purpose:
      "I built this to read one best ball board through the rules of each Underdog contest I might enter, from Best Ball Mania VII to Superflex. Each lens shows the room, how I read it, and a build range, and the board under it follows Underdog ADP, or a sourced Superflex consensus, with the expert ranks printed beside it.",
  },
  "/fantasy-football/best-ball/draft-tracker": {
    purpose:
      "I use this room to log a manual best ball draft pick by pick on Underdog or a similar site. It keeps the snake order straight, checks my build against the contest's roster targets and the rest of the room, and saves each contest's room separately in this browser so one set of picks never overwrites another.",
  },
  "/fantasy-football/draft-tracker": {
    purpose:
      "I use this to follow a redraft room as it happens, logging every pick in the room against the consensus board so I can see reaches, steals, position runs, and what my roster still needs on each turn. The room saves in this browser, and the recap afterward replays each of my turns against what the board suggested.",
  },
  "/fantasy-football/trade-calculator": {
    purpose:
      "I built this to check a one-QB redraft trade against something steadier than my gut, turning expert consensus and mock-draft ADP into values for my league's scoring, size, and lineup before the season, and rest-of-season consensus and this season's scoring once it starts. It withholds the verdict when a source is stale, because I would rather it say nothing than say something I cannot support.",
  },
  "/food-map": {
    purpose:
      "I built this to keep the places I actually send people to on one map, next to Anthony Bourdain's picks and the ones the crowd rates highest on Google, with each pin colored by who is vouching for it. The city, the curator and cuisine filters, and the pick live in the URL, so a link I send opens on the exact city and stop with what to order already showing.",
  },
  "/formula-1": {
    purpose:
      "I use this dashboard to move between the next Grand Prix, the driver and constructor standings, and the result of each race without losing the season context. The point is a clear answer to where the championship stands and what changed at the last meeting.",
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
      "I use this workspace to move from a portfolio-level question into the company detail behind it, comparing price history, financial context, valuation ratios, and holdings without moving the research into a spreadsheet.",
  },
  "/la-liga": {
    purpose:
      "I use this dashboard to see the pressure inside the La Liga table, from the title race, to European qualification, to relegation. Those cuts make the standings more useful than a single rank order and make it easier to understand what a club is playing for.",
  },
  "/march-madness-2026": {
    purpose:
      "I built this so I could inspect my 2026 bracket pick by pick. It starts from consensus ratings and shows every place I moved a pick for a time-zone travel penalty, a committee seeding error, or an injury, and it keeps the picks as I made them on March 17 next to how the tournament actually went.",
  },
  "/mba-internship-notifications": {
    purpose:
      "I built this because the fastest way I have found to scan full-time business roles is to stop bouncing across dozens of career pages. It polls the public job boards of the companies I am targeting and filters them down to the roles I care about, and anything I track moves into a pipeline that keeps follow-ups, interview rounds, and deadlines in my own browser.",
  },
  "/mlb": {
    purpose:
      "I use this dashboard to move between division standings, the AL and NL races, and the wild card picture without treating them as separate products. Team drilldowns connect the table to recent results and the league's hitting and pitching leaders.",
  },
  "/museum-log": {
    purpose:
      "I wanted a Letterboxd for museums, so this is the catalog of the ones I'd actually send a friend to, each drawn as its admission ticket with my rating, the admission price, and whether an exhibit is on today. Logging a visit takes one press, the rating and a note come from the museum's own page, and the journal and the themed lists are there for planning a trip around a city's museums.",
  },
  "/nba": {
    purpose:
      "I use this dashboard to read the NBA standings through the decisions that matter late in the season, including playoff seeds, the play in line, and the gap between neighboring teams. It also keeps points, rebounds, and assists leaders close to the team picture.",
  },
  "/news-pulse": {
    purpose:
      "I built this to compare what major newsrooms are emphasizing at the same moment, then see which topics cross outlet lines and where the headline tone differs. It is a media coverage view for comparing outlets against each other.",
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
  "/score-pools": {
    purpose:
      "I run exact-score prediction pools, and this page does the part I used to do by hand, which is working out which exact score should earn the most points under my pool's own rules and my place in the standings. It prices each match from betting-market odds, and each match's detail shows the working behind the pick.",
  },
  "/score-pools/settings": {
    purpose:
      "Every recommendation depends on the pool's own rules, so this is where I set the points for an exact score, a correct goal difference, and a correct outcome, and whether the 90-minute or the final result counts. The standing, the risk approach, and the guess at what the rest of the pool picks sit under advanced settings, since their defaults work for a new pool.",
  },
  "/score-pools/tracker": {
    purpose:
      "I use the tracker after the games, when the question changes from what to pick to how the picks actually scored. It scores my saved picks against the results under the pool's rules, keeps a running total, and lets me enter a result by hand or a rival's picks when no feed has them.",
  },
  "/recipe-finder": {
    purpose:
      "I built this around the question I actually have at dinner, which is what I can make with what's already in the kitchen. The recipes reorder by how much of each one the pantry already covers, staples like salt and oil never count against a recipe, and the pantry stays saved in this browser for the next night.",
  },
  "/spacex-mission-control": {
    purpose:
      "I use this board to answer what SpaceX is launching next, what has already flown, and how a mission connects to its rocket, payload, crew, capsule, and pad. Keeping those relationships together makes the launch list more useful than a calendar alone.",
  },
  "/tech-startup-tracker": {
    purpose:
      "I use this tracker to compare notable startups across sector, funding stage, valuation, capital raised, and recent financing without pretending that one number explains momentum. The goal is a research shortlist that can be sorted and inspected, and I wouldn't read its order as a definitive company ranking.",
  },
  "/travel": {
    purpose:
      "I wanted one dated plan per trip that reads the way the trip happens, a day at a time, with each stop under its time and ticked off once it's done. The time grid beside the days shows when a day is overloaded or two stops overlap, and the journal keeps a note of what each day was actually like. Everything stays in this browser, so there is no account to make before planning a weekend.",
  },
  "/travel-deals": {
    purpose:
      "I built this to judge a fare I've already found, since the harder part of booking travel is knowing whether a quote is any good. It places the quote against a typical band for the region, marks where today sits in the booking window, splits the budget, and checks whether points beat cash. The playbook under it is the short list of tactics and search tools I actually use.",
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
