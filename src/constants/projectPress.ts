/**
 * A project route's two riso inks. The lead prints the hero sheet and the
 * second is the overprint on every sheet below it. Data colours (team
 * liveries, line colours, party colours) are not inks and never live here.
 */
export type RisoInk = "blue" | "saffron" | "vermilion" | "green" | "teal" | "pink";

export interface ProjectPress {
  lead: RisoInk;
  second: RisoInk;
}

/** Keyed by exact pathname. Each family PR adds its own rows. */
export const PROJECT_PRESS: Readonly<Record<string, ProjectPress>> = {
  "/earthquake-pulse": { lead: "teal", second: "vermilion" },
  "/news-pulse": { lead: "blue", second: "saffron" },
  "/github-trending-pulse": { lead: "green", second: "blue" },
  "/frontier-models": { lead: "pink", second: "blue" },
  "/ai-dev-tools": { lead: "teal", second: "saffron" },
  "/tech-startup-tracker": { lead: "green", second: "saffron" },
  "/polling-aggregator": { lead: "saffron", second: "teal" },
  "/bay-area-transit": { lead: "teal", second: "saffron" },
  "/spacex-mission-control": { lead: "blue", second: "vermilion" },
  "/wine-cellar": { lead: "vermilion", second: "blue" },
  "/museum-log": { lead: "pink", second: "blue" },
  "/recipe-finder": { lead: "saffron", second: "vermilion" },
  "/travel": { lead: "teal", second: "saffron" },
  "/travel-deals": { lead: "blue", second: "saffron" },
  "/food-map": { lead: "vermilion", second: "saffron" },
  "/premier-league": { lead: "green", second: "blue" },
  "/la-liga": { lead: "green", second: "vermilion" },
  "/mlb": { lead: "green", second: "vermilion" },
  "/nba": { lead: "saffron", second: "blue" },
  "/nfl": { lead: "vermilion", second: "blue" },
  "/world-cup-2026": { lead: "teal", second: "vermilion" },
  "/golf": { lead: "green", second: "saffron" },
  "/formula-1": { lead: "vermilion", second: "blue" },
  "/fantasy-formula-1": { lead: "saffron", second: "vermilion" },
  "/march-madness-2026": { lead: "blue", second: "vermilion" },
  "/fintech-tools/budget-planner": { lead: "green", second: "saffron" },
  "/fintech-tools/interchange-iq": { lead: "blue", second: "saffron" },
  "/fintech-tools/rent-vs-buy": { lead: "teal", second: "vermilion" },
  "/investments": { lead: "blue", second: "saffron" },
  "/investments/before-you-buy": { lead: "blue", second: "saffron" },
  "/decision-lab": { lead: "pink", second: "blue" },
  "/enablement-assistant": { lead: "blue", second: "saffron" },
  "/mba-internship-notifications": { lead: "teal", second: "vermilion" },
  "/fantasy-football": { lead: "green", second: "saffron" },
  "/fantasy-football/draft-tracker": { lead: "green", second: "saffron" },
  "/fantasy-football/best-ball": { lead: "green", second: "saffron" },
  "/fantasy-football/best-ball/draft-tracker": { lead: "green", second: "saffron" },
  "/fantasy-football/mock-draft": { lead: "green", second: "saffron" },
  "/fantasy-football/trade-calculator": { lead: "green", second: "saffron" },
  "/fantasy-football/weekly": { lead: "green", second: "saffron" },
  "/fantasy-football/waivers": { lead: "green", second: "saffron" },
};

export function getProjectPress(route: string): ProjectPress | undefined {
  return PROJECT_PRESS[route];
}
