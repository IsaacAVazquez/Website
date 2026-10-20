import type { ReadonlyURLSearchParams } from "next/navigation";

import {
  normalizeFantasyRouteScoring,
  type FantasyRouteScoring,
} from "@/lib/fantasy";
import { repairFantasyTradePlayerIds } from "@/lib/fantasyTradePersistence";
import { enumValue } from "@/lib/utils";
import { buildHref, readParam, type SearchParamInput } from "@/lib/searchParams";

export const TRADE_CALCULATOR_TEAM_COUNTS = [8, 10, 12, 14, 16] as const;
export const TRADE_CALCULATOR_ROSTER_SIZES = [13, 14, 15, 16, 17, 18] as const;
export const TRADE_CALCULATOR_LINEUP_PRESETS = [
  "traditional",
  "three-wr",
  "three-wr-no-kdst",
] as const;

type TradeCalculatorTeamCount = (typeof TRADE_CALCULATOR_TEAM_COUNTS)[number];
type TradeCalculatorRosterSize = (typeof TRADE_CALCULATOR_ROSTER_SIZES)[number];
type TradeCalculatorLineupPreset =
  (typeof TRADE_CALCULATOR_LINEUP_PRESETS)[number];

export interface TradeCalculatorSearchState {
  scoring: FantasyRouteScoring;
  teams: TradeCalculatorTeamCount;
  rosterSize: TradeCalculatorRosterSize;
  lineup: TradeCalculatorLineupPreset;
}

export const DEFAULT_TRADE_CALCULATOR_STATE: TradeCalculatorSearchState = {
  scoring: "ppr",
  teams: 12,
  rosterSize: 15,
  lineup: "traditional",
};

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
    lineup: enumValue(
      readParam(input, "lineup")?.trim().toLowerCase(),
      TRADE_CALCULATOR_LINEUP_PRESETS,
      DEFAULT_TRADE_CALCULATOR_STATE.lineup,
    ),
  };
}

export function buildTradeCalculatorHref(
  state: TradeCalculatorSearchState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams,
): string {
  return buildHref(
    "/fantasy-football/trade-calculator",
    {
      scoring: state.scoring,
      teams: state.teams,
      rosterSize: state.rosterSize,
      lineup: state.lineup,
    },
    {},
    baseSearchParams,
  );
}

export interface TradeCalculatorShareSelection {
  givePlayerIds: string[];
  getPlayerIds: string[];
}

function splitSharePlayerIds(value: string | null): string[] {
  return value === null ? [] : value.split(",");
}

/**
 * Reads the shared deal from the give/get URL params (comma-separated player
 * IDs). Returns null when neither param is present, so links minted before
 * the share params existed keep reading the stored deal instead of clearing
 * it. Both sides pass through the persistence repair, which trims, dedupes,
 * caps each side, and lets the give side win a cross-side duplicate.
 */
export function parseTradeCalculatorShare(
  input: SearchParamInput,
): TradeCalculatorShareSelection | null {
  const giveRaw = readParam(input, "give");
  const getRaw = readParam(input, "get");
  if (giveRaw === null && getRaw === null) return null;

  const givePlayerIds = repairFantasyTradePlayerIds(splitSharePlayerIds(giveRaw));
  return {
    givePlayerIds,
    getPlayerIds: repairFantasyTradePlayerIds(
      splitSharePlayerIds(getRaw),
      new Set(givePlayerIds),
    ),
  };
}

/**
 * Rewrites only the give/get share params over the current query, so mirroring
 * a deal into the URL never rewrites league settings the visitor has not
 * touched.
 */
export function buildTradeCalculatorShareHref(
  share: TradeCalculatorShareSelection,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams,
): string {
  return buildHref(
    "/fantasy-football/trade-calculator",
    {
      give: share.givePlayerIds.join(",") || null,
      get: share.getPlayerIds.join(",") || null,
    },
    {},
    baseSearchParams,
  );
}
