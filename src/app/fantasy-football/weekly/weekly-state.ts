import type { FantasyRouteScoring } from "@/lib/fantasy";

export type WeeklyBoardKey = "flex" | "quarterbacks";

export interface WeeklyRouteState {
  scoring: FantasyRouteScoring;
  board: WeeklyBoardKey;
}

/**
 * A plain module, so the server pages and the client share one rule. An export
 * of a "use client" module is a client reference a server component cannot call.
 */
export function normalizeWeeklyBoard(value: string | null | undefined): WeeklyBoardKey {
  return value === "quarterbacks" ? "quarterbacks" : "flex";
}
