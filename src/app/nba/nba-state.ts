import type { ReadonlyURLSearchParams } from "next/navigation";
import { nbaSnapshot } from "@/data/nbaSnapshot";
import type { NbaConference, NbaRouteState, NbaTeam, NbaView } from "@/types/nba";

export const NBA_ROUTE = "/nba";

const VALID_VIEWS = new Set<NbaView>(["east", "west", "playoff", "play-in"]);

const allTeams: NbaTeam[] = [
  ...nbaSnapshot.teamsByConference.east,
  ...nbaSnapshot.teamsByConference.west,
];

const NBA_TEAM_ID_BY_ALIAS = new Map<string, string>(
  allTeams.flatMap((team) => {
    const canonical = team.id.toLowerCase();
    const aliases = [team.id.toLowerCase(), team.abbreviation.toLowerCase()];
    return aliases.map((alias) => [alias, canonical] as const);
  })
);

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_NBA_STATE: NbaRouteState = {
  view: "east",
  team:
    nbaSnapshot.teamsByConference.east[0]?.id ??
    nbaSnapshot.teamsByConference.west[0]?.id ??
    allTeams[0]?.id ??
    "bos",
};

export function canonicalizeNbaTeamId(teamId: string | null): string | null {
  if (!teamId) return null;
  return NBA_TEAM_ID_BY_ALIAS.get(teamId.trim().toLowerCase()) ?? null;
}

function readParam(input: SearchParamInput, key: string): string | null {
  if ("get" in input && typeof input.get === "function") {
    return input.get(key);
  }
  const rawValue = (input as SearchParamRecord)[key];
  if (Array.isArray(rawValue)) return rawValue[0] ?? null;
  return rawValue ?? null;
}

export function getConferenceForView(view: NbaView): NbaConference | "both" {
  switch (view) {
    case "west":
      return "west";
    case "east":
      return "east";
    case "playoff":
    case "play-in":
    default:
      return "both";
  }
}

export function filterTeamsForView(view: NbaView): NbaTeam[] {
  const east = nbaSnapshot.teamsByConference.east;
  const west = nbaSnapshot.teamsByConference.west;

  switch (view) {
    case "east":
      return east;
    case "west":
      return west;
    case "playoff":
      return [...east.slice(0, 6), ...west.slice(0, 6)];
    case "play-in":
      return [...east.slice(6, 10), ...west.slice(6, 10)];
    default:
      return [...east, ...west];
  }
}

export function getDefaultTeamForView(view: NbaView): string {
  return filterTeamsForView(view)[0]?.id ?? DEFAULT_NBA_STATE.team;
}

export function normalizeNbaState(input: SearchParamInput): NbaRouteState {
  const view = readParam(input, "view");
  const team = canonicalizeNbaTeamId(readParam(input, "team"));

  return {
    view: VALID_VIEWS.has((view ?? "") as NbaView) ? (view as NbaView) : DEFAULT_NBA_STATE.view,
    team: team ?? DEFAULT_NBA_STATE.team,
  };
}

export function buildNbaHref(
  state: NbaRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );
  const canonicalTeamId = canonicalizeNbaTeamId(state.team) ?? DEFAULT_NBA_STATE.team;

  if (state.view === DEFAULT_NBA_STATE.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (canonicalTeamId === DEFAULT_NBA_STATE.team && state.view === DEFAULT_NBA_STATE.view) {
    params.delete("team");
  } else {
    params.set("team", canonicalTeamId);
  }

  const query = params.toString();
  return `${NBA_ROUTE}${query ? `?${query}` : ""}`;
}
