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

export type FantasyRankingMode = "consensus" | "vorp";

export interface FantasySearchState {
  position: FantasyRoutePosition;
  scoring: FantasyRouteScoring;
  ranking: FantasyRankingMode;
  teams: FantasyVorpTeamSize;
  query: string;
}

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;
type FantasySearchParamKey =
  | "position"
  | "scoring"
  | "ranking"
  | "teams"
  | "q";

export const DEFAULT_FANTASY_STATE: FantasySearchState = {
  position: "overall",
  scoring: "ppr",
  ranking: "consensus",
  teams: 12,
  query: "",
};

function readParam(input: SearchParamInput, key: FantasySearchParamKey): string | null {
  if ("get" in input && typeof input.get === "function") {
    return input.get(key);
  }

  const rawValue = (input as Record<string, string | string[] | undefined | null>)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

function normalizeFantasyQuery(value: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function normalizeFantasyRanking(value: string | null): FantasyRankingMode {
  return value?.trim().toLowerCase() === "vorp" ? "vorp" : "consensus";
}

function normalizeFantasyTeams(value: string | null): FantasyVorpTeamSize {
  const parsed = Number.parseInt(value ?? "", 10);
  return isFantasyVorpTeamSize(parsed) ? parsed : 12;
}

export function normalizeFantasyState(input: SearchParamInput): FantasySearchState {
  return {
    position: normalizeFantasyRoutePosition(readParam(input, "position")),
    scoring: normalizeFantasyRouteScoring(readParam(input, "scoring")),
    ranking: normalizeFantasyRanking(readParam(input, "ranking")),
    teams: normalizeFantasyTeams(readParam(input, "teams")),
    query: normalizeFantasyQuery(readParam(input, "q")),
  };
}

export function buildFantasyHref(
  state: FantasySearchState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(baseSearchParams ? Array.from(baseSearchParams.entries()) : []);
  params.set("position", state.position);
  params.set("scoring", state.scoring);
  // The board dropped its list/tiers toggle; strip the dead param from
  // inherited links instead of carrying it forward.
  params.delete("view");
  if (state.ranking === "vorp") {
    params.set("ranking", "vorp");
    params.set("teams", String(state.teams));
  } else {
    params.delete("ranking");
    params.delete("teams");
  }
  if (state.query) {
    params.set("q", state.query);
  } else {
    params.delete("q");
  }
  return `/fantasy-football?${params.toString()}`;
}
