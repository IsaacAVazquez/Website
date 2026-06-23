import type { ReadonlyURLSearchParams } from "next/navigation";
import type { MlbRouteState, MlbStandingsRow, MlbView } from "@/types/mlb";

// Pure, snapshot-free route-state core for /mlb. Importing this module never
// pulls the multi-thousand-line `mlbSnapshot` into the bundle, so the client
// can derive route state from the lean `summary` prop it already receives
// instead of dragging the full snapshot into browser JS. The snapshot-bound
// wrappers in `mlb-state.ts` reuse these helpers for server + test code.

export const MLB_ROUTE = "/mlb";

/** Ultimate static fallback team id (NYY) when no standings data exists. */
export const MLB_FALLBACK_TEAM = "147";

const VALID_VIEWS = new Set<MlbView>(["all", "al", "nl", "wildcard"]);

export type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

type TeamAliasSource = { id: string; abbreviation: string };

export function buildTeamAliasMap(teams: readonly TeamAliasSource[]): Map<string, string> {
  return new Map(
    teams.flatMap((team) => {
      const canonical = team.id;
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
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }
  return rawValue ?? null;
}

function sortByDivisionRank(a: MlbStandingsRow, b: MlbStandingsRow): number {
  if (a.league !== b.league) return a.league.localeCompare(b.league);
  if (a.division !== b.division) return a.division.localeCompare(b.division);
  return a.divisionRank - b.divisionRank;
}

function sortByWildCard(a: MlbStandingsRow, b: MlbStandingsRow): number {
  const aRank = a.wildCardRank ?? 99;
  const bRank = b.wildCardRank ?? 99;
  if (aRank !== bRank) return aRank - bRank;
  return b.pct - a.pct;
}

export function filterStandings(
  standings: readonly MlbStandingsRow[],
  view: MlbView
): MlbStandingsRow[] {
  switch (view) {
    case "al":
      return standings.filter((row) => row.league === "AL").sort(sortByDivisionRank);
    case "nl":
      return standings.filter((row) => row.league === "NL").sort(sortByDivisionRank);
    case "wildcard":
      return standings
        .filter((row) => row.divisionRank > 1 && row.wildCardRank !== null && row.wildCardRank <= 6)
        .sort((a, b) => {
          if (a.league !== b.league) return a.league.localeCompare(b.league);
          return sortByWildCard(a, b);
        });
    case "all":
    default:
      return [...standings].sort(sortByDivisionRank);
  }
}

export function getDefaultTeam(
  standings: readonly MlbStandingsRow[],
  view: MlbView,
  fallback: string
): string {
  return filterStandings(standings, view)[0]?.id ?? fallback;
}

export function resolveDefaultState(
  standings: readonly MlbStandingsRow[],
  teams: readonly { id: string }[]
): MlbRouteState {
  return {
    view: "all",
    team: standings[0]?.id ?? teams[0]?.id ?? MLB_FALLBACK_TEAM,
  };
}

export function normalizeState(
  input: SearchParamInput,
  defaultState: MlbRouteState,
  aliasMap: Map<string, string>
): MlbRouteState {
  const view = readParam(input, "view");
  const team = canonicalizeTeamId(readParam(input, "team"), aliasMap);

  return {
    view: VALID_VIEWS.has((view ?? "") as MlbView) ? (view as MlbView) : defaultState.view,
    team: team ?? defaultState.team,
  };
}

export function buildHref(
  state: MlbRouteState,
  defaultState: MlbRouteState,
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
  return `${MLB_ROUTE}${query ? `?${query}` : ""}`;
}
