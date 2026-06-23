import type { ReadonlyURLSearchParams } from "next/navigation";
import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import type { LaLigaClub, LaLigaRouteState, LaLigaView } from "@/types/la-liga";
import * as core from "./la-liga-state.core";

// Snapshot-bound wrappers. These keep the original public API used by the
// server page and the unit tests, but the heavy `laLigaSnapshot` import lives
// ONLY here (server side). The client imports the pure `la-liga-state.core`
// module instead and feeds it the lean `summary` data it already has.

export const LA_LIGA_ROUTE = core.LA_LIGA_ROUTE;

const ALIAS_MAP = core.buildClubAliasMap(laLigaSnapshot.teams);

export const DEFAULT_LA_LIGA_STATE: LaLigaRouteState = core.resolveDefaultState(
  laLigaSnapshot.clubs
);

export function canonicalizeLaLigaClubId(clubId: string | null): string | null {
  return core.canonicalizeClubId(clubId, ALIAS_MAP);
}

export function filterClubsForView(view: LaLigaView): LaLigaClub[] {
  return core.filterClubs(laLigaSnapshot.clubs, view);
}

export function getDefaultClubForView(view: LaLigaView): string {
  return core.getDefaultClub(laLigaSnapshot.clubs, view, DEFAULT_LA_LIGA_STATE.club);
}

export function normalizeLaLigaState(input: core.SearchParamInput): LaLigaRouteState {
  return core.normalizeState(input, DEFAULT_LA_LIGA_STATE, ALIAS_MAP);
}

export function buildLaLigaHref(
  state: LaLigaRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return core.buildHref(state, DEFAULT_LA_LIGA_STATE, ALIAS_MAP, baseSearchParams);
}
