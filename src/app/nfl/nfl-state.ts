import type { ReadonlyURLSearchParams } from "next/navigation";
import { nflSnapshot } from "@/data/nflSnapshot";
import type { NFLRouteState, NFLTeamStanding, NFLView } from "@/types/nfl";

export const NFL_ROUTE = "/nfl";

const VALID_VIEWS = new Set<NFLView>(["league", "afc", "nfc", "playoffs"]);

const NFL_TEAM_ID_BY_ALIAS = new Map<string, string>(
  nflSnapshot.teams.flatMap((team) => [
    [team.id.toLowerCase(), team.id],
    [team.abbr.toLowerCase(), team.id],
  ] as const)
);

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_NFL_STATE: NFLRouteState = {
  view: "league",
  team: nflSnapshot.teams[0]?.id ?? "den",
};

export function canonicalizeNflTeamId(teamId: string | null | undefined): string | null {
  if (!teamId) return null;
  return NFL_TEAM_ID_BY_ALIAS.get(teamId.trim().toLowerCase()) ?? null;
}

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

export function filterTeamsForView(view: NFLView): NFLTeamStanding[] {
  const all = nflSnapshot.teams;
  switch (view) {
    case "afc":
      return all.filter((team) => team.conference === "AFC");
    case "nfc":
      return all.filter((team) => team.conference === "NFC");
    case "playoffs":
      return all.filter((team) => team.seed !== null && team.seed >= 1 && team.seed <= 7);
    case "league":
    default:
      return all;
  }
}

export function getDefaultTeamForView(view: NFLView): string {
  return filterTeamsForView(view)[0]?.id ?? DEFAULT_NFL_STATE.team;
}

export function normalizeNflState(input: SearchParamInput): NFLRouteState {
  const view = readParam(input, "view");
  const team = canonicalizeNflTeamId(readParam(input, "team"));
  return {
    view: VALID_VIEWS.has((view ?? "") as NFLView)
      ? (view as NFLView)
      : DEFAULT_NFL_STATE.view,
    team: team ?? DEFAULT_NFL_STATE.team,
  };
}

export function buildNflHref(
  state: NFLRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );
  const canonicalTeamId = canonicalizeNflTeamId(state.team) ?? DEFAULT_NFL_STATE.team;

  if (state.view === DEFAULT_NFL_STATE.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (canonicalTeamId === DEFAULT_NFL_STATE.team && state.view === DEFAULT_NFL_STATE.view) {
    params.delete("team");
  } else {
    params.set("team", canonicalTeamId);
  }

  const query = params.toString();
  return `${NFL_ROUTE}${query ? `?${query}` : ""}`;
}
