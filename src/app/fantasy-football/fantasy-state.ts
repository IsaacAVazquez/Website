import type { ReadonlyURLSearchParams } from "next/navigation";
import {
  FantasyRoutePosition,
  FantasyRouteScoring,
  normalizeFantasyRoutePosition,
  normalizeFantasyRouteScoring,
} from "@/lib/fantasy";

export type FantasyView = "list" | "tiers";

export interface FantasySearchState {
  position: FantasyRoutePosition;
  scoring: FantasyRouteScoring;
  view: FantasyView;
}

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

export const DEFAULT_FANTASY_STATE: FantasySearchState = {
  position: "overall",
  scoring: "ppr",
  view: "list",
};

function readParam(input: SearchParamInput, key: keyof FantasySearchState): string | null {
  if ("get" in input && typeof input.get === "function") {
    return input.get(key);
  }

  const rawValue = (input as Record<string, string | string[] | undefined | null>)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

function normalizeFantasyView(value: string | null): FantasyView {
  return value === "tiers" ? "tiers" : "list";
}

export function normalizeFantasyState(input: SearchParamInput): FantasySearchState {
  return {
    position: normalizeFantasyRoutePosition(readParam(input, "position")),
    scoring: normalizeFantasyRouteScoring(readParam(input, "scoring")),
    view: normalizeFantasyView(readParam(input, "view")),
  };
}

export function buildFantasyHref(
  state: FantasySearchState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(baseSearchParams ? Array.from(baseSearchParams.entries()) : []);
  params.set("position", state.position);
  params.set("scoring", state.scoring);
  if (state.view === "tiers") {
    params.set("view", "tiers");
  } else {
    params.delete("view");
  }
  return `/fantasy-football?${params.toString()}`;
}
