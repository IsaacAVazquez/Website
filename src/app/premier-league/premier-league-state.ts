import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  PremierLeagueRouteState,
  PremierLeagueStandingRow,
  PremierLeagueView,
} from "@/types/premier-league";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

export const PREMIER_LEAGUE_ROUTE = "/premier-league";

export const PREMIER_LEAGUE_VIEW_OPTIONS = ["table", "title-race", "europe", "relegation"] as const;
const PREMIER_LEAGUE_DETAIL_OPTIONS = ["fixtures", "scorers"] as const;

export const DEFAULT_PREMIER_LEAGUE_STATE: PremierLeagueRouteState = {
  view: "table",
  team: null,
  detail: "fixtures",
};

export const PREMIER_LEAGUE_VIEW_LABELS: Record<PremierLeagueView, string> = {
  table: "Full table",
  "title-race": "Title chase",
  europe: "European places",
  relegation: "Relegation fight",
};

function normalizeTeamParam(team: string | null): string | null {
  const trimmed = team?.trim() ?? "";
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
  return {
    view: readEnum(input, "view", PREMIER_LEAGUE_VIEW_OPTIONS, DEFAULT_PREMIER_LEAGUE_STATE.view),
    team: normalizeTeamParam(readParam(input, "team")),
    detail: readEnum(
      input,
      "detail",
      PREMIER_LEAGUE_DETAIL_OPTIONS,
      DEFAULT_PREMIER_LEAGUE_STATE.detail
    ),
  };
}

export function buildPremierLeagueHref(
  state: PremierLeagueRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return buildHref(
    PREMIER_LEAGUE_ROUTE,
    { view: state.view, team: state.team || null, detail: state.detail || null },
    DEFAULT_PREMIER_LEAGUE_STATE,
    baseSearchParams
  );
}
