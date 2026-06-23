import type { ReadonlyURLSearchParams } from "next/navigation";
import { nflSnapshot } from "@/data/nflSnapshot";
import type { NFLRouteState, NFLTeamStanding, NFLView } from "@/types/nfl";
import * as core from "./nfl-state.core";

// Snapshot-bound wrappers. These keep the original public API used by the
// server page and the unit tests, but the heavy `nflSnapshot` import lives
// ONLY here (server side). The client imports the pure `nfl-state.core`
// module instead and feeds it the lean `summary` data it already has.

export const NFL_ROUTE = core.NFL_ROUTE;

const ALIAS_MAP = core.buildTeamAliasMap(nflSnapshot.teams);

export const DEFAULT_NFL_STATE: NFLRouteState = core.resolveDefaultState(
  nflSnapshot.teams
);

export function canonicalizeNflTeamId(teamId: string | null | undefined): string | null {
  return core.canonicalizeTeamId(teamId, ALIAS_MAP);
}

export function filterTeamsForView(view: NFLView): NFLTeamStanding[] {
  return core.filterTeams(nflSnapshot.teams, view);
}

export function getDefaultTeamForView(view: NFLView): string {
  return core.getDefaultTeam(nflSnapshot.teams, view, DEFAULT_NFL_STATE.team);
}

export function normalizeNflState(input: core.SearchParamInput): NFLRouteState {
  return core.normalizeState(input, DEFAULT_NFL_STATE, ALIAS_MAP);
}

export function buildNflHref(
  state: NFLRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return core.buildHref(state, DEFAULT_NFL_STATE, ALIAS_MAP, baseSearchParams);
}
