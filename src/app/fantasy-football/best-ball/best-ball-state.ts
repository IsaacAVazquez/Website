import type { ReadonlyURLSearchParams } from "next/navigation";

import { normalizeContestId, type BestBallContestId } from "@/lib/bestBall";
import { enumValue } from "@/lib/utils";
import { buildHref, readParam, type SearchParamInput } from "@/lib/searchParams";

export type BestBallPositionFilter = "all" | "QB" | "RB" | "WR" | "TE";

export interface BestBallSearchState {
  contest: BestBallContestId;
  position: BestBallPositionFilter;
  query: string;
}

const POSITIONS = ["QB", "RB", "WR", "TE"] as const;

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
    position: enumValue(readParam(input, "position")?.toUpperCase(), POSITIONS, "all"),
    query: normalizeBestBallQuery(readParam(input, "q")),
  };
}

export function buildBestBallHref(
  state: BestBallSearchState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams,
): string {
  return buildHref(
    "/fantasy-football/best-ball",
    { contest: state.contest, position: state.position.toLowerCase(), q: state.query },
    { position: "all", q: "" },
    baseSearchParams,
  );
}
