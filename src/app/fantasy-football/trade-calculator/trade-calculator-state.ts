import type { ReadonlyURLSearchParams } from "next/navigation";

import {
  normalizeFantasyRouteScoring,
  type FantasyRouteScoring,
} from "@/lib/fantasy";

export const TRADE_CALCULATOR_TEAM_COUNTS = [8, 10, 12, 14, 16] as const;
export const TRADE_CALCULATOR_ROSTER_SIZES = [13, 14, 15, 16, 17, 18] as const;
export const TRADE_CALCULATOR_LINEUP_PRESETS = [
  "traditional",
  "three-wr",
  "three-wr-no-kdst",
] as const;

export type TradeCalculatorTeamCount = (typeof TRADE_CALCULATOR_TEAM_COUNTS)[number];
export type TradeCalculatorRosterSize = (typeof TRADE_CALCULATOR_ROSTER_SIZES)[number];
export type TradeCalculatorLineupPreset =
  (typeof TRADE_CALCULATOR_LINEUP_PRESETS)[number];

export interface TradeCalculatorSearchState {
  scoring: FantasyRouteScoring;
  teams: TradeCalculatorTeamCount;
  rosterSize: TradeCalculatorRosterSize;
  lineup: TradeCalculatorLineupPreset;
}

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

export const DEFAULT_TRADE_CALCULATOR_STATE: TradeCalculatorSearchState = {
  scoring: "ppr",
  teams: 12,
  rosterSize: 15,
  lineup: "traditional",
};

function readParam(input: SearchParamInput, key: keyof TradeCalculatorSearchState): string | null {
  if ("get" in input && typeof input.get === "function") {
    return input.get(key);
  }

  const rawValue = (input as Record<string, string | string[] | undefined | null>)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

function normalizeNumberOption<Option extends number>(
  value: string | null,
  supported: readonly Option[],
  fallback: Option,
): Option {
  if (value === null || value.trim() === "") return fallback;

  const parsed = Number(value);
  return Number.isInteger(parsed) && supported.includes(parsed as Option)
    ? (parsed as Option)
    : fallback;
}

function normalizeLineupPreset(value: string | null): TradeCalculatorLineupPreset {
  const normalized = value?.trim().toLowerCase();
  return TRADE_CALCULATOR_LINEUP_PRESETS.includes(
    normalized as TradeCalculatorLineupPreset,
  )
    ? (normalized as TradeCalculatorLineupPreset)
    : DEFAULT_TRADE_CALCULATOR_STATE.lineup;
}

export function normalizeTradeCalculatorState(
  input: SearchParamInput,
): TradeCalculatorSearchState {
  return {
    scoring: normalizeFantasyRouteScoring(readParam(input, "scoring")),
    teams: normalizeNumberOption(
      readParam(input, "teams"),
      TRADE_CALCULATOR_TEAM_COUNTS,
      DEFAULT_TRADE_CALCULATOR_STATE.teams,
    ),
    rosterSize: normalizeNumberOption(
      readParam(input, "rosterSize"),
      TRADE_CALCULATOR_ROSTER_SIZES,
      DEFAULT_TRADE_CALCULATOR_STATE.rosterSize,
    ),
    lineup: normalizeLineupPreset(readParam(input, "lineup")),
  };
}

export function buildTradeCalculatorHref(
  state: TradeCalculatorSearchState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams,
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : [],
  );
  params.set("scoring", state.scoring);
  params.set("teams", String(state.teams));
  params.set("rosterSize", String(state.rosterSize));
  params.set("lineup", state.lineup);

  return `/fantasy-football/trade-calculator?${params.toString()}`;
}
