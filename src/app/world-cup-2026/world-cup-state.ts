import type { ReadonlyURLSearchParams } from "next/navigation";
import type { WorldCupRouteState, WorldCupView } from "@/types/worldCup";

export const WORLD_CUP_ROUTE = "/world-cup-2026";

export const WORLD_CUP_VIEW_OPTIONS = [
  "groups",
  "knockout",
  "schedule",
] as const;

export const WORLD_CUP_VIEW_LABELS: Record<WorldCupView, string> = {
  groups: "Group stage",
  knockout: "Knockout bracket",
  schedule: "Match schedule",
};

export const DEFAULT_WORLD_CUP_STATE: WorldCupRouteState = {
  view: "groups",
  team: null,
};

const VALID_VIEWS = new Set<WorldCupView>(WORLD_CUP_VIEW_OPTIONS);

// Team ids are URL-safe slugs (e.g. "united-states"). Mirrors the shape check
// in src/lib/worldCupSnapshot.ts so route state can't smuggle in a malformed id.
const TEAM_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/i;

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

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

export function normalizeTeamParam(team: string | null): string | null {
  if (!team) return null;
  const trimmed = team.trim().toLowerCase();
  return TEAM_ID_PATTERN.test(trimmed) ? trimmed : null;
}

export function normalizeWorldCupState(
  input: SearchParamInput
): WorldCupRouteState {
  const view = readParam(input, "view");
  const team = readParam(input, "team");
  return {
    view: VALID_VIEWS.has((view ?? "") as WorldCupView)
      ? (view as WorldCupView)
      : DEFAULT_WORLD_CUP_STATE.view,
    team: normalizeTeamParam(team),
  };
}

export function buildWorldCupHref(
  state: WorldCupRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );

  if (state.view === DEFAULT_WORLD_CUP_STATE.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  const team = normalizeTeamParam(state.team);
  if (team) {
    params.set("team", team);
  } else {
    params.delete("team");
  }

  const query = params.toString();
  return `${WORLD_CUP_ROUTE}${query ? `?${query}` : ""}`;
}
