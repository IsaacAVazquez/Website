import type { ReadonlyURLSearchParams } from "next/navigation";
import type { PremierLeagueRouteState, PremierLeagueStandingRow, PremierLeagueView } from "@/types/premier-league";

export const PREMIER_LEAGUE_ROUTE = "/premier-league";

export const PREMIER_LEAGUE_VIEW_OPTIONS = ["table", "title-race", "europe", "relegation"] as const;

const VALID_VIEWS = new Set<PremierLeagueView>(PREMIER_LEAGUE_VIEW_OPTIONS);

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_PREMIER_LEAGUE_STATE: PremierLeagueRouteState = {
  view: "table",
  team: null,
};

export const PREMIER_LEAGUE_VIEW_LABELS: Record<PremierLeagueView, string> = {
  table: "Full table",
  "title-race": "Title chase",
  europe: "European places",
  relegation: "Relegation fight",
};

export const PREMIER_LEAGUE_VIEW_DESCRIPTIONS: Record<PremierLeagueView, string> = {
  table: "All 20 clubs in the current standings order.",
  "title-race": "The top four clubs competing for Champions League places.",
  europe: "Clubs inside the Champions League, Europa League, and Conference League lines.",
  relegation: "Bottom-five pressure view around the safety and drop lines.",
};

function readParam(input: SearchParamInput, key: string): string | null {
  if ("get" in input && typeof input.get === "function") {
    return (input as URLSearchParams).get(key);
  }

  const rawValue = (input as SearchParamRecord)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

function normalizeTeamParam(team: string | null): string | null {
  if (!team) return null;
  const trimmed = team.trim();
  return /^[1-9]\d*$/.test(trimmed) ? trimmed : null;
}

export function filterStandingsForView(
  standings: PremierLeagueStandingRow[],
  view: PremierLeagueView
): PremierLeagueStandingRow[] {
  switch (view) {
    case "title-race":
      return standings.filter((row) => row.position <= 4);
    case "europe":
      return standings.filter((row) => row.position <= 7);
    case "relegation":
      return standings.filter((row) => row.position >= 16);
    case "table":
    default:
      return standings;
  }
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
