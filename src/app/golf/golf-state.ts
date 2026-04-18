import type { ReadonlyURLSearchParams } from "next/navigation";
import type { GolfRouteState, GolfView } from "@/types/golf";

export const GOLF_ROUTE = "/golf";
export const GOLF_VIEW_OPTIONS = ["leaderboard", "players"] as const;

const VALID_VIEWS = new Set<GolfView>(GOLF_VIEW_OPTIONS);

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_GOLF_STATE: GolfRouteState = {
  view: "leaderboard",
  player: null,
};

export const GOLF_VIEW_LABELS: Record<GolfView, string> = {
  leaderboard: "Leaderboard",
  players: "Players",
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

function normalizePlayerParam(player: string | null): string | null {
  if (!player) {
    return null;
  }

  const trimmed = player.trim();
  return /^[a-z0-9-]+$/.test(trimmed) ? trimmed : null;
}

export function normalizeGolfState(input: SearchParamInput): GolfRouteState {
  const view = readParam(input, "view");
  const player = readParam(input, "player");

  return {
    view: VALID_VIEWS.has((view ?? "") as GolfView)
      ? (view as GolfView)
      : DEFAULT_GOLF_STATE.view,
    player: normalizePlayerParam(player),
  };
}

export function buildGolfHref(
  state: GolfRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );

  if (state.view === DEFAULT_GOLF_STATE.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (state.player) {
    params.set("player", state.player);
  } else {
    params.delete("player");
  }

  const query = params.toString();
  return `${GOLF_ROUTE}${query ? `?${query}` : ""}`;
}
