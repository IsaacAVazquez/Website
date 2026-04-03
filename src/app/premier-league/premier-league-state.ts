import type { ReadonlyURLSearchParams } from "next/navigation";
import type { PremierLeagueRouteState, PremierLeagueView } from "@/types/premier-league";

export const PREMIER_LEAGUE_ROUTE = "/premier-league";

export const PREMIER_LEAGUE_VIEW_OPTIONS = ["overview", "fixtures", "team"] as const;

const VALID_VIEWS = new Set<PremierLeagueView>(PREMIER_LEAGUE_VIEW_OPTIONS);

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_PREMIER_LEAGUE_STATE: PremierLeagueRouteState = {
  view: "overview",
  team: null,
};

export const PREMIER_LEAGUE_VIEW_LABELS: Record<PremierLeagueView, string> = {
  overview: "Overview",
  fixtures: "Fixtures",
  team: "Club View",
};

function readParam(input: SearchParamInput, key: keyof PremierLeagueRouteState): string | null {
  if ("get" in input && typeof input.get === "function") {
    return input.get(key);
  }

  const rawValue = (input as SearchParamRecord)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

function normalizeTeamParam(team: string | null): string | null {
  if (!team) {
    return null;
  }

  const trimmed = team.trim();
  return /^[1-9]\d*$/.test(trimmed) ? trimmed : null;
}

export function normalizePremierLeagueState(
  input: SearchParamInput
): PremierLeagueRouteState {
  const view = readParam(input, "view");
  const team = readParam(input, "team");

  return {
    view: VALID_VIEWS.has((view ?? "") as PremierLeagueView)
      ? (view as PremierLeagueView)
      : DEFAULT_PREMIER_LEAGUE_STATE.view,
    team: normalizeTeamParam(team),
  };
}

export function buildPremierLeagueHref(
  state: PremierLeagueRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );

  if (state.view === DEFAULT_PREMIER_LEAGUE_STATE.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (state.team) {
    params.set("team", state.team);
  } else {
    params.delete("team");
  }

  const query = params.toString();
  return `${PREMIER_LEAGUE_ROUTE}${query ? `?${query}` : ""}`;
}
