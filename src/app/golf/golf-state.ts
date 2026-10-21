import type { ReadonlyURLSearchParams } from "next/navigation";
import type { GolfRouteState, GolfView } from "@/types/golf";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

export const GOLF_ROUTE = "/golf";
export const GOLF_VIEW_OPTIONS = ["leaderboard", "players"] as const;

export const DEFAULT_GOLF_STATE: GolfRouteState = {
  view: "leaderboard",
  player: null,
};

export const GOLF_VIEW_LABELS: Record<GolfView, string> = {
  leaderboard: "Leaderboard",
  players: "Players",
};

function normalizePlayerParam(player: string | null): string | null {
  const trimmed = player?.trim() ?? "";
  return /^[a-z0-9-]+$/.test(trimmed) ? trimmed : null;
}

export function normalizeGolfState(input: SearchParamInput): GolfRouteState {
  return {
    view: readEnum(input, "view", GOLF_VIEW_OPTIONS, DEFAULT_GOLF_STATE.view),
    player: normalizePlayerParam(readParam(input, "player")),
  };
}

export function buildGolfHref(
  state: GolfRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return buildHref(
    GOLF_ROUTE,
    { view: state.view, player: state.player || null },
    DEFAULT_GOLF_STATE,
    baseSearchParams
  );
}
