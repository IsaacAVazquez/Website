import type { ReadonlyURLSearchParams } from "next/navigation";
import { nbaSnapshot } from "@/data/nbaSnapshot";
import type { NbaConference, NbaRouteState, NbaTeam, NbaView } from "@/types/nba";
import * as core from "./nba-state.core";

// Snapshot-bound wrappers. These keep the original public API used by the
// server page and the unit tests, but the heavy `nbaSnapshot` import lives
// ONLY here (server side). The client imports the pure `nba-state.core`
// module instead and feeds it the lean `summary` data it already has.

export const NBA_ROUTE = core.NBA_ROUTE;

const east = nbaSnapshot.teamsByConference.east;
const west = nbaSnapshot.teamsByConference.west;

const ALIAS_MAP = core.buildTeamAliasMap([...east, ...west]);

export const DEFAULT_NBA_STATE: NbaRouteState = core.resolveDefaultState(east, west);

export function canonicalizeNbaTeamId(teamId: string | null): string | null {
  return core.canonicalizeTeamId(teamId, ALIAS_MAP);
}

export function getConferenceForView(view: NbaView): NbaConference | "both" {
  return core.getConferenceForView(view);
}

export function filterTeamsForView(view: NbaView): NbaTeam[] {
  return core.filterTeams(east, west, view);
}

export function getDefaultTeamForView(view: NbaView): string {
  return core.getDefaultTeam(east, west, view, DEFAULT_NBA_STATE.team);
}

export function normalizeNbaState(input: core.SearchParamInput): NbaRouteState {
  return core.normalizeState(input, DEFAULT_NBA_STATE, ALIAS_MAP);
}

export function buildNbaHref(
  state: NbaRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return core.buildHref(state, DEFAULT_NBA_STATE, ALIAS_MAP, baseSearchParams);
}
