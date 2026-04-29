import type { ReadonlyURLSearchParams } from "next/navigation";
import { mlbSnapshot } from "@/data/mlbSnapshot";
import type { MlbRouteState, MlbStandingsRow, MlbView } from "@/types/mlb";

export const MLB_ROUTE = "/mlb";

const VALID_VIEWS = new Set<MlbView>(["all", "al", "nl", "wildcard"]);

const TEAM_ID_BY_ALIAS = new Map<string, string>(
  mlbSnapshot.teams.flatMap((team) => {
    const canonical = team.id;
    return [
      [team.id.toLowerCase(), canonical],
      [team.abbreviation.toLowerCase(), canonical],
    ] as const;
  })
);

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_MLB_STATE: MlbRouteState = {
  view: "all",
  team: mlbSnapshot.standings[0]?.id ?? mlbSnapshot.teams[0]?.id ?? "147",
};

export function canonicalizeMlbTeamId(teamId: string | null): string | null {
  if (!teamId) return null;
  return TEAM_ID_BY_ALIAS.get(teamId.trim().toLowerCase()) ?? null;
}

function readParam(input: SearchParamInput, key: string): string | null {
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

export function filterStandingsForView(view: MlbView): MlbStandingsRow[] {
  const all = mlbSnapshot.standings;
  switch (view) {
    case "al":
      return all.filter((row) => row.league === "AL").sort(sortByDivisionRank);
    case "nl":
      return all.filter((row) => row.league === "NL").sort(sortByDivisionRank);
    case "wildcard":
      return all
        .filter((row) => row.divisionRank > 1 && row.wildCardRank !== null && row.wildCardRank <= 6)
        .sort((a, b) => {
          if (a.league !== b.league) return a.league.localeCompare(b.league);
          return sortByWildCard(a, b);
        });
    case "all":
    default:
      return [...all].sort(sortByDivisionRank);
  }
}

export function getDefaultTeamForView(view: MlbView): string {
  return filterStandingsForView(view)[0]?.id ?? DEFAULT_MLB_STATE.team;
}

export function normalizeMlbState(input: SearchParamInput): MlbRouteState {
  const view = readParam(input, "view");
  const team = canonicalizeMlbTeamId(readParam(input, "team"));

  return {
    view: VALID_VIEWS.has((view ?? "") as MlbView) ? (view as MlbView) : DEFAULT_MLB_STATE.view,
    team: team ?? DEFAULT_MLB_STATE.team,
  };
}

export function buildMlbHref(
  state: MlbRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );
  const canonical = canonicalizeMlbTeamId(state.team) ?? DEFAULT_MLB_STATE.team;

  if (state.view === DEFAULT_MLB_STATE.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (canonical === DEFAULT_MLB_STATE.team && state.view === DEFAULT_MLB_STATE.view) {
    params.delete("team");
  } else {
    params.set("team", canonical);
  }

  const query = params.toString();
  return `${MLB_ROUTE}${query ? `?${query}` : ""}`;
}
