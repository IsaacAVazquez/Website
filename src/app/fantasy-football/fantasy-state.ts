import type { ReadonlyURLSearchParams } from "next/navigation";
import {
  FantasyRoutePosition,
  FantasyRouteScoring,
  normalizeFantasyRoutePosition,
  normalizeFantasyRouteScoring,
} from "@/lib/fantasy";
import {
  isFantasyVorpTeamSize,
  type FantasyVorpTeamSize,
} from "@/lib/fantasyVorp";
import { buildHref, readParam, type SearchParamInput } from "@/lib/searchParams";

type FantasyRankingMode = "consensus" | "vorp";

export interface FantasySearchState {
  position: FantasyRoutePosition;
  scoring: FantasyRouteScoring;
  ranking: FantasyRankingMode;
  teams: FantasyVorpTeamSize;
  query: string;
}

export const DEFAULT_FANTASY_STATE: FantasySearchState = {
  position: "overall",
  scoring: "ppr",
  ranking: "consensus",
  teams: 12,
  query: "",
};

function normalizeFantasyTeams(value: string | null): FantasyVorpTeamSize {
  const parsed = Number.parseInt(value ?? "", 10);
  return isFantasyVorpTeamSize(parsed) ? parsed : 12;
}

export function normalizeFantasyState(input: SearchParamInput): FantasySearchState {
  return {
    position: normalizeFantasyRoutePosition(readParam(input, "position")),
    scoring: normalizeFantasyRouteScoring(readParam(input, "scoring")),
    ranking: readParam(input, "ranking")?.trim().toLowerCase() === "vorp" ? "vorp" : "consensus",
    teams: normalizeFantasyTeams(readParam(input, "teams")),
    query: (readParam(input, "q") ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
  };
}

export function buildFantasyHref(
  state: FantasySearchState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const vorp = state.ranking === "vorp";
  return buildHref(
    "/fantasy-football",
    {
      position: state.position,
      scoring: state.scoring,
      // The board dropped its list/tiers toggle; strip the dead param from
      // inherited links instead of carrying it forward.
      view: null,
      ranking: vorp ? "vorp" : null,
      teams: vorp ? state.teams : null,
      q: state.query,
    },
    { q: "" },
    baseSearchParams
  );
}
