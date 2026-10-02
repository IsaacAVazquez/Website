import type { NbaRouteState, NbaTeam, NbaView } from "@/types/nba";
import { createTeamRouteState } from "@/lib/searchParams";

// Pure, snapshot-free route-state core for /nba. Importing this module never
// pulls the multi-thousand-line `nbaSnapshot` into the bundle, so the client
// can derive route state from the lean `summary` prop it already receives
// instead of dragging the full snapshot into browser JS.

export const NBA_ROUTE = "/nba";

/** Ultimate static fallback team id (BOS) when no standings data exists. */
const NBA_FALLBACK_TEAM = "bos";

export { canonicalizeId as canonicalizeTeamId } from "@/lib/searchParams";
export const { normalizeState, buildHref } = createTeamRouteState<NbaView>(NBA_ROUTE, [
  "east",
  "west",
  "playoff",
  "play-in",
]);

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
