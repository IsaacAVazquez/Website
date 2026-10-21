import type { ReadonlyURLSearchParams } from "next/navigation";
import type { WorldCupRouteState } from "@/types/worldCup";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

export const WORLD_CUP_ROUTE = "/world-cup-2026";

const WORLD_CUP_VIEW_OPTIONS = [
  "groups",
  "knockout",
  "schedule",
] as const;

export const DEFAULT_WORLD_CUP_STATE: WorldCupRouteState = {
  view: "groups",
  team: null,
};

// Team ids are URL-safe slugs (e.g. "united-states"). Mirrors the shape check
// in src/lib/worldCupSnapshot.ts so route state can't smuggle in a malformed id.
const TEAM_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/i;

export function normalizeTeamParam(team: string | null): string | null {
  const trimmed = team?.trim().toLowerCase() ?? "";
  return TEAM_ID_PATTERN.test(trimmed) ? trimmed : null;
}

export function normalizeWorldCupState(
  input: SearchParamInput
): WorldCupRouteState {
  return {
    view: readEnum(input, "view", WORLD_CUP_VIEW_OPTIONS, DEFAULT_WORLD_CUP_STATE.view),
    team: normalizeTeamParam(readParam(input, "team")),
  };
}

export function buildWorldCupHref(
  state: WorldCupRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return buildHref(
    WORLD_CUP_ROUTE,
    { view: state.view, team: normalizeTeamParam(state.team) },
    DEFAULT_WORLD_CUP_STATE,
    baseSearchParams
  );
}
