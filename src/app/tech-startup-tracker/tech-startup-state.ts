import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  TechStartupRouteState,
  TechStartupSegmentKind,
  TechStartupSnapshot,
  TechStartupSortKey,
} from "@/types/techStartup";

export const TECH_STARTUP_ROUTE = "/tech-startup-tracker";

export const TECH_STARTUP_KIND_OPTIONS = ["sector", "stage"] as const;
export const TECH_STARTUP_SORT_OPTIONS = [
  "momentum",
  "valuation",
  "raised",
  "recent",
] as const;

export const TECH_STARTUP_KIND_LABELS: Record<TechStartupSegmentKind, string> = {
  sector: "Sector",
  stage: "Stage",
};

export const TECH_STARTUP_SORT_LABELS: Record<TechStartupSortKey, string> = {
  momentum: "Momentum",
  valuation: "Valuation",
  raised: "Total raised",
  recent: "Latest round",
};

const VALID_KINDS = new Set<TechStartupSegmentKind>(TECH_STARTUP_KIND_OPTIONS);
const VALID_SORTS = new Set<TechStartupSortKey>(TECH_STARTUP_SORT_OPTIONS);

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_TECH_STARTUP_STATE: TechStartupRouteState = {
  kind: "sector",
  segment: "all",
  sort: "momentum",
  selectedStartupId: null,
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

export function normalizeTechStartupState(
  input: SearchParamInput
): TechStartupRouteState {
  const kind = readParam(input, "view");
  const segment = readParam(input, "segment");
  const sort = readParam(input, "sort");
  const startup = readParam(input, "startup");

  return {
    kind: VALID_KINDS.has((kind ?? "") as TechStartupSegmentKind)
      ? (kind as TechStartupSegmentKind)
      : DEFAULT_TECH_STARTUP_STATE.kind,
    segment: segment && segment.trim().length > 0 ? segment.trim() : "all",
    sort: VALID_SORTS.has((sort ?? "") as TechStartupSortKey)
      ? (sort as TechStartupSortKey)
      : DEFAULT_TECH_STARTUP_STATE.sort,
    selectedStartupId: startup && startup.trim().length > 0 ? startup.trim() : null,
  };
}

export function resolveTechStartupState(
  state: TechStartupRouteState,
  snapshot: TechStartupSnapshot
): TechStartupRouteState {
  const kind = VALID_KINDS.has(state.kind)
    ? state.kind
    : DEFAULT_TECH_STARTUP_STATE.kind;
  const segments = kind === "sector" ? snapshot.sectors : snapshot.stages;
  const validSegments = new Set(segments.map((segment) => segment.key));
  const segment =
    state.segment === "all" || validSegments.has(state.segment)
      ? state.segment
      : "all";
  // Validate the selection against the *visible* segment, not all startups —
  // a deep link like ?segment=sector-fintech&startup=openai would otherwise
  // keep the param while expanding nothing.
  const visibleStartupIds = new Set(
    segment === "all"
      ? snapshot.startups.map((startup) => startup.id)
      : segments.find((entry) => entry.key === segment)?.startupIds ?? []
  );

  return {
    kind,
    segment,
    sort: VALID_SORTS.has(state.sort)
      ? state.sort
      : DEFAULT_TECH_STARTUP_STATE.sort,
    selectedStartupId:
      state.selectedStartupId && visibleStartupIds.has(state.selectedStartupId)
        ? state.selectedStartupId
        : null,
  };
}

export function buildTechStartupHref(
  state: TechStartupRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );

  if (state.kind === DEFAULT_TECH_STARTUP_STATE.kind) {
    params.delete("view");
  } else {
    params.set("view", state.kind);
  }

  if (state.segment === DEFAULT_TECH_STARTUP_STATE.segment) {
    params.delete("segment");
  } else {
    params.set("segment", state.segment);
  }

  if (state.sort === DEFAULT_TECH_STARTUP_STATE.sort) {
    params.delete("sort");
  } else {
    params.set("sort", state.sort);
  }

  if (!state.selectedStartupId) {
    params.delete("startup");
  } else {
    params.set("startup", state.selectedStartupId);
  }

  const query = params.toString();
  return `${TECH_STARTUP_ROUTE}${query ? `?${query}` : ""}`;
}
