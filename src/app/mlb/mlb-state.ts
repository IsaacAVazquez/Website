import type { ReadonlyURLSearchParams } from "next/navigation";
import { mlbSnapshot } from "@/data/mlbSnapshot";
import type { MlbRouteState, MlbStandingsRow, MlbView } from "@/types/mlb";
import * as core from "./mlb-state.core";

// Snapshot-bound wrappers. These keep the original public API used by the
// server page and the unit tests, but the heavy `mlbSnapshot` import lives
// ONLY here (server side). The client imports the pure `mlb-state.core`
// module instead and feeds it the lean `summary` data it already has.

export const MLB_ROUTE = core.MLB_ROUTE;

const ALIAS_MAP = core.buildTeamAliasMap(mlbSnapshot.teams);

export const DEFAULT_MLB_STATE: MlbRouteState = core.resolveDefaultState(
  mlbSnapshot.standings,
  mlbSnapshot.teams
);

export function canonicalizeMlbTeamId(teamId: string | null): string | null {
  return core.canonicalizeTeamId(teamId, ALIAS_MAP);
}

export function filterStandingsForView(view: MlbView): MlbStandingsRow[] {
  return core.filterStandings(mlbSnapshot.standings, view);
}

export function getDefaultTeamForView(view: MlbView): string {
  return core.getDefaultTeam(mlbSnapshot.standings, view, DEFAULT_MLB_STATE.team);
}

export function normalizeMlbState(input: core.SearchParamInput): MlbRouteState {
  return core.normalizeState(input, DEFAULT_MLB_STATE, ALIAS_MAP);
}

export function buildMlbHref(
  state: MlbRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return core.buildHref(state, DEFAULT_MLB_STATE, ALIAS_MAP, baseSearchParams);
}
