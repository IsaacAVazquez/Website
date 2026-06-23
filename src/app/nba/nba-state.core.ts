import type { ReadonlyURLSearchParams } from "next/navigation";
import type { NbaConference, NbaRouteState, NbaTeam, NbaView } from "@/types/nba";

// Pure, snapshot-free route-state core for /nba. Importing this module never
// pulls the multi-thousand-line `nbaSnapshot` into the bundle, so the client
// can derive route state from the lean `summary` prop it already receives
// instead of dragging the full snapshot into browser JS. The snapshot-bound
// wrappers in `nba-state.ts` reuse these helpers for server + test code.

export const NBA_ROUTE = "/nba";

/** Ultimate static fallback team id (BOS) when no standings data exists. */
export const NBA_FALLBACK_TEAM = "bos";

const VALID_VIEWS = new Set<NbaView>(["east", "west", "playoff", "play-in"]);

export type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

type TeamAliasSource = { id: string; abbreviation: string };

export function buildTeamAliasMap(teams: readonly TeamAliasSource[]): Map<string, string> {
  return new Map(
    teams.flatMap((team) => {
      const canonical = team.id.toLowerCase();
      return [
        [team.id.toLowerCase(), canonical],
        [team.abbreviation.toLowerCase(), canonical],
      ] as const;
    })
  );
}

export function canonicalizeTeamId(
  teamId: string | null | undefined,
  aliasMap: Map<string, string>
): string | null {
  if (!teamId) return null;
  return aliasMap.get(teamId.trim().toLowerCase()) ?? null;
}

export function readParam(input: SearchParamInput, key: string): string | null {
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

export function filterTeams(
  east: readonly NbaTeam[],
  west: readonly NbaTeam[],
  view: NbaView
): NbaTeam[] {
  switch (view) {
    case "east":
      return [...east];
    case "west":
      return [...west];
    case "playoff":
      return [...east.slice(0, 6), ...west.slice(0, 6)];
    case "play-in":
      return [...east.slice(6, 10), ...west.slice(6, 10)];
    default:
      return [...east, ...west];
  }
}

export function getDefaultTeam(
  east: readonly NbaTeam[],
  west: readonly NbaTeam[],
  view: NbaView,
  fallback: string
): string {
  return filterTeams(east, west, view)[0]?.id ?? fallback;
}

export function resolveDefaultState(
  east: readonly NbaTeam[],
  west: readonly NbaTeam[]
): NbaRouteState {
  return {
    view: "east",
    team: east[0]?.id ?? west[0]?.id ?? NBA_FALLBACK_TEAM,
  };
}

export function normalizeState(
  input: SearchParamInput,
  defaultState: NbaRouteState,
  aliasMap: Map<string, string>
): NbaRouteState {
  const view = readParam(input, "view");
  const team = canonicalizeTeamId(readParam(input, "team"), aliasMap);

  return {
    view: VALID_VIEWS.has((view ?? "") as NbaView) ? (view as NbaView) : defaultState.view,
    team: team ?? defaultState.team,
  };
}

export function buildHref(
  state: NbaRouteState,
  defaultState: NbaRouteState,
  aliasMap: Map<string, string>,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );
  const canonical = canonicalizeTeamId(state.team, aliasMap) ?? defaultState.team;

  if (state.view === defaultState.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (canonical === defaultState.team && state.view === defaultState.view) {
    params.delete("team");
  } else {
    params.set("team", canonical);
  }

  const query = params.toString();
  return `${NBA_ROUTE}${query ? `?${query}` : ""}`;
}
