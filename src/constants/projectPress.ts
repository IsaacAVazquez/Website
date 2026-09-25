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
};

export function getProjectPress(route: string): ProjectPress | undefined {
  return PROJECT_PRESS[route];
}
