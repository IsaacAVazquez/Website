import { nflSeeds } from "@/components/football/seedLadder";
import type { NFLRouteState, NFLTeamStanding, NFLView } from "@/types/nfl";
import { buildTeamAliasMap as buildAliasMap, createTeamRouteState } from "@/lib/searchParams";

// Pure, snapshot-free route-state core for /nfl. Importing this module never
// pulls the multi-thousand-line `nflSnapshot` into the bundle, so the client
// can derive route state from the lean `summary` prop it already receives
// instead of dragging the full snapshot into browser JS.

export const NFL_ROUTE = "/nfl";

/** Ultimate static fallback team id (DEN) when no standings data exists. */
const NFL_FALLBACK_TEAM = "den";

export { canonicalizeId as canonicalizeTeamId } from "@/lib/searchParams";
export const { normalizeState, buildHref } = createTeamRouteState<NFLView>(
  NFL_ROUTE,
  ["league", "afc", "nfc", "playoffs"]
);

export const buildTeamAliasMap = (teams: readonly { id: string; abbr: string }[]) =>
  buildAliasMap(teams, (team) => team.abbr);

export function filterTeams(
  teams: readonly NFLTeamStanding[],
  view: NFLView
): NFLTeamStanding[] {
  switch (view) {
    case "afc":
      return teams.filter((team) => team.conference === "AFC");
    case "nfc":
      return teams.filter((team) => team.conference === "NFC");
    case "playoffs": {
      // The NFLverse snapshot leaves `seed` null until the league actually
      // publishes it, so the playoffs view is built from the same derived
      // seeding the seed-ladder signature uses instead of the raw field,
      // which would otherwise leave this view empty all season.
      const seeds = nflSeeds(teams);
      return teams
        .filter((team) => seeds.has(team.id))
        .toSorted((a, b) => (seeds.get(a.id) ?? 0) - (seeds.get(b.id) ?? 0));
    }
    case "league":
    default:
      return [...teams];
  }
}

export function getDefaultTeam(
  teams: readonly NFLTeamStanding[],
  view: NFLView,
  fallback: string
): string {
  return filterTeams(teams, view)[0]?.id ?? fallback;
}

export function resolveDefaultState(teams: readonly NFLTeamStanding[]): NFLRouteState {
  return {
    view: "league",
    team: teams[0]?.id ?? NFL_FALLBACK_TEAM,
  };
}
