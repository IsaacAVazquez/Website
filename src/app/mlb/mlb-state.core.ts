import type { MlbRouteState, MlbStandingsRow, MlbView } from "@/types/mlb";
import { buildTeamAliasMap as buildAliasMap, createTeamRouteState } from "@/lib/searchParams";

// Pure, snapshot-free route-state core for /mlb. Importing this module never
// pulls the multi-thousand-line `mlbSnapshot` into the bundle, so the client
// can derive route state from the lean `summary` prop it already receives
// instead of dragging the full snapshot into browser JS.

export const MLB_ROUTE = "/mlb";

/** Ultimate static fallback team id (NYY) when no standings data exists. */
const MLB_FALLBACK_TEAM = "147";

export { canonicalizeId as canonicalizeTeamId } from "@/lib/searchParams";
export const { normalizeState, buildHref } = createTeamRouteState<MlbView>(
  MLB_ROUTE,
  ["all", "al", "nl", "wildcard"]
);

export const buildTeamAliasMap = (teams: readonly { id: string; abbreviation: string }[]) =>
  buildAliasMap(teams, (team) => team.abbreviation);

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
