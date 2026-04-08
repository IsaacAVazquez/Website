import type { ReadonlyURLSearchParams } from "next/navigation";
import type { PollingRouteState, PollingView, Race, RaceRating } from "@/types/polling";

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

export const POLLING_VIEW_DESCRIPTIONS: Record<PollingView, string> = {
  overview: "Top-level summary of approval ratings, the generic ballot, and key race ratings.",
  approval: "Presidential job approval polling trend and recent polls.",
  senate: "Key competitive U.S. Senate races for the 2026 midterms.",
  governors: "Key competitive governor races for the 2026 midterms.",
};

const VALID_VIEWS = new Set<PollingView>(POLLING_VIEW_OPTIONS);

export const DEFAULT_POLLING_STATE: PollingRouteState = {
  view: "overview",
  race: null,
};

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

function readParam(input: SearchParamInput, key: string): string | null {
  if ("get" in input && typeof input.get === "function") {
    return (input as URLSearchParams).get(key);
  }
  const rawValue = (input as SearchParamRecord)[key];
  if (Array.isArray(rawValue)) return rawValue[0] ?? null;
  return rawValue ?? null;
}

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

// ─── Rating helpers ────────────────────────────────────────────────────────────

export const RATING_ORDER: RaceRating[] = [
  "Safe D",
  "Likely D",
  "Lean D",
  "Toss-up",
  "Lean R",
  "Likely R",
  "Safe R",
];

export function ratingScore(rating: RaceRating): number {
  return RATING_ORDER.indexOf(rating); // 0 = safest D, 6 = safest R
}

export function sortRacesByCompetitiveness(races: Race[]): Race[] {
  return [...races].sort((a, b) => {
    const aDist = Math.abs(ratingScore(a.rating) - 3); // distance from Toss-up
    const bDist = Math.abs(ratingScore(b.rating) - 3);
    if (aDist !== bDist) return aDist - bDist; // toss-ups first
    return a.state.localeCompare(b.state);
  });
}

export function getRacesByRating(races: Race[], rating: RaceRating): Race[] {
  return races.filter((r) => r.rating === rating);
}

export function countSeatsByParty(races: Race[]): { demLeading: number; repLeading: number; tossup: number } {
  let demLeading = 0;
  let repLeading = 0;
  let tossup = 0;
  for (const race of races) {
    const score = ratingScore(race.rating);
    if (score <= 2) demLeading++;
    else if (score >= 4) repLeading++;
    else tossup++;
  }
  return { demLeading, repLeading, tossup };
}
