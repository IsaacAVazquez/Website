import type { ReadonlyURLSearchParams } from "next/navigation";
import type { PollingRouteState, PollingView, Race } from "@/types/polling";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

const POLLING_ROUTE = "/polling-aggregator";

// The race tables lead, then the national approval and ballot polls. The old
// Overview view is gone, so ?view=overview falls back to the default.
export const POLLING_VIEW_OPTIONS = ["senate", "governors", "approval"] as const;

export const POLLING_VIEW_LABELS: Record<PollingView, string> = {
  senate: "Senate",
  governors: "Governors",
  approval: "Approval",
};

export const DEFAULT_POLLING_STATE: PollingRouteState = {
  view: "senate",
  race: null,
};

function normalizeRaceParam(race: string | null): string | null {
  const trimmed = race?.trim() ?? "";
  return /^[a-z][a-z0-9-]*$/.test(trimmed) ? trimmed : null;
}

export function normalizePollingState(input: SearchParamInput): PollingRouteState {
  return {
    view: readEnum(input, "view", POLLING_VIEW_OPTIONS, DEFAULT_POLLING_STATE.view),
    race: normalizeRaceParam(readParam(input, "race")),
  };
}

export function buildPollingHref(
  state: PollingRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return buildHref(
    POLLING_ROUTE,
    { view: state.view, race: state.race || null },
    DEFAULT_POLLING_STATE,
    baseSearchParams
  );
}

// ─── Race helpers ──────────────────────────────────────────────────────────────

/** Closest race first, then by state name, so a tie in the margin is still stable. */
export function sortRacesByMargin(races: Race[]): Race[] {
  return [...races].sort(
    (left, right) => left.margin - right.margin || left.state.localeCompare(right.state)
  );
}
