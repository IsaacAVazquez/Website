import type { ReadonlyURLSearchParams } from "next/navigation";
import { nflSeeds } from "@/components/football/seedLadder";
import type { NFLRouteState, NFLTeamStanding, NFLView } from "@/types/nfl";
import { readParam, type SearchParamInput } from "@/lib/searchParams";

// Pure, snapshot-free route-state core for /nfl. Importing this module never
// pulls the multi-thousand-line `nflSnapshot` into the bundle, so the client
// can derive route state from the lean `summary` prop it already receives
// instead of dragging the full snapshot into browser JS. The snapshot-bound
// wrappers in `nfl-state.ts` reuse these helpers for server + test code.

export const NFL_ROUTE = "/nfl";

/** Ultimate static fallback team id (DEN) when no standings data exists. */
export const NFL_FALLBACK_TEAM = "den";

const VALID_VIEWS = new Set<NFLView>(["league", "afc", "nfc", "playoffs"]);

type TeamAliasSource = { id: string; abbr: string };

export function buildTeamAliasMap(teams: readonly TeamAliasSource[]): Map<string, string> {
  return new Map(
    teams.flatMap((team) => {
      const canonical = team.id;
      return [
        [team.id.toLowerCase(), canonical],
        [team.abbr.toLowerCase(), canonical],
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

export function normalizeState(
  input: SearchParamInput,
  defaultState: NFLRouteState,
  aliasMap: Map<string, string>
): NFLRouteState {
  const view = readParam(input, "view");
  const team = canonicalizeTeamId(readParam(input, "team"), aliasMap);

  return {
    view: VALID_VIEWS.has((view ?? "") as NFLView)
      ? (view as NFLView)
      : defaultState.view,
    team: team ?? defaultState.team,
  };
}

export function buildHref(
  state: NFLRouteState,
  defaultState: NFLRouteState,
  aliasMap: Map<string, string>,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );
  const canonicalTeamId = canonicalizeTeamId(state.team, aliasMap) ?? defaultState.team;

  if (state.view === defaultState.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (canonicalTeamId === defaultState.team && state.view === defaultState.view) {
    params.delete("team");
  } else {
    params.set("team", canonicalTeamId);
  }

  const query = params.toString();
  return `${NFL_ROUTE}${query ? `?${query}` : ""}`;
}
