import type { ReadonlyURLSearchParams } from "next/navigation";

import { normalizeContestId, type BestBallContestId } from "@/lib/bestBall";

export type BestBallPositionFilter = "all" | "QB" | "RB" | "WR" | "TE";

export interface BestBallSearchState {
  contest: BestBallContestId;
  position: BestBallPositionFilter;
  query: string;
}

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

const POSITIONS = new Set<BestBallPositionFilter>(["all", "QB", "RB", "WR", "TE"]);

function readParam(input: SearchParamInput, key: string): string | null {
  if ("get" in input && typeof input.get === "function") {
    return input.get(key);
  }

  const rawValue = (input as Record<string, string | string[] | undefined | null>)[key];
  if (Array.isArray(rawValue)) return rawValue[0] ?? null;
  return rawValue ?? null;
}

function normalizePosition(value: string | null): BestBallPositionFilter {
  if (!value) return "all";
  const normalized = value.toUpperCase();
  if (normalized === "ALL") return "all";
  return POSITIONS.has(normalized as BestBallPositionFilter)
    ? (normalized as BestBallPositionFilter)
    : "all";
}

/**
 * The URL's form of a search query. The client compares the typed value against
 * this before writing, so a trailing space stays under the cursor instead of
 * being trimmed away and read back.
 */
export function normalizeBestBallQuery(value: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function normalizeBestBallState(input: SearchParamInput): BestBallSearchState {
  return {
    contest: normalizeContestId(readParam(input, "contest")),
    position: normalizePosition(readParam(input, "position")),
    query: normalizeBestBallQuery(readParam(input, "q")),
  };
}

export function buildBestBallHref(
  state: BestBallSearchState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams,
): string {
  const params = new URLSearchParams(baseSearchParams ? Array.from(baseSearchParams.entries()) : []);
  params.set("contest", state.contest);

  if (state.position === "all") params.delete("position");
  else params.set("position", state.position.toLowerCase());

  if (state.query) params.set("q", state.query);
  else params.delete("q");

  return `/fantasy-football/best-ball?${params.toString()}`;
}
