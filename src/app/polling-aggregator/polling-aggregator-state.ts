import type { ReadonlyURLSearchParams } from "next/navigation";
import type { PollingRouteState, PollingView, Race } from "@/types/polling";
import { readParam, type SearchParamInput } from "@/lib/searchParams";

export const POLLING_ROUTE = "/polling-aggregator";

export const POLLING_VIEW_OPTIONS = [
  "overview",
  "approval",
  "senate",
  "governors",
] as const;

export const POLLING_VIEW_LABELS: Record<PollingView, string> = {
  overview: "Overview",
  approval: "Approval",
  senate: "Senate",
  governors: "Governors",
};

const VALID_VIEWS = new Set<PollingView>(POLLING_VIEW_OPTIONS);

export const DEFAULT_POLLING_STATE: PollingRouteState = {
  view: "overview",
  race: null,
};

function normalizeRaceParam(race: string | null): string | null {
  if (!race) return null;
  const trimmed = race.trim();
  return /^[a-z][a-z0-9-]*$/.test(trimmed) ? trimmed : null;
}

export function normalizePollingState(input: SearchParamInput): PollingRouteState {
  const view = readParam(input, "view");
  const race = readParam(input, "race");
  return {
    view: VALID_VIEWS.has((view ?? "") as PollingView)
      ? (view as PollingView)
      : DEFAULT_POLLING_STATE.view,
    race: normalizeRaceParam(race),
  };
}

export function buildPollingHref(
  state: PollingRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );

  if (state.view === DEFAULT_POLLING_STATE.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (state.race) {
    params.set("race", state.race);
  } else {
    params.delete("race");
  }

  const query = params.toString();
  return `${POLLING_ROUTE}${query ? `?${query}` : ""}`;
}

// ─── Race helpers ──────────────────────────────────────────────────────────────

/** Closest race first, then by state name, so a tie in the margin is still stable. */
export function sortRacesByMargin(races: Race[]): Race[] {
  return [...races].sort(
    (left, right) => left.margin - right.margin || left.state.localeCompare(right.state)
  );
}
