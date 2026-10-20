import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  TechStartupRouteState,
  TechStartupSegmentKind,
  TechStartupSnapshot,
  TechStartupSortKey,
} from "@/types/techStartup";
import { enumValue } from "@/lib/utils";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

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

export const DEFAULT_TECH_STARTUP_STATE: TechStartupRouteState = {
  kind: "sector",
  segment: "all",
  sort: "momentum",
  selectedStartupId: null,
};

export function normalizeTechStartupState(
  input: SearchParamInput
): TechStartupRouteState {
  return {
    kind: readEnum(input, "view", TECH_STARTUP_KIND_OPTIONS, DEFAULT_TECH_STARTUP_STATE.kind),
    segment: readParam(input, "segment")?.trim() || "all",
    sort: readEnum(input, "sort", TECH_STARTUP_SORT_OPTIONS, DEFAULT_TECH_STARTUP_STATE.sort),
    selectedStartupId: readParam(input, "startup")?.trim() || null,
  };
}

export function resolveTechStartupState(
  state: TechStartupRouteState,
  snapshot: TechStartupSnapshot
): TechStartupRouteState {
  const kind = enumValue(state.kind, TECH_STARTUP_KIND_OPTIONS, DEFAULT_TECH_STARTUP_STATE.kind);
  const segments = kind === "sector" ? snapshot.sectors : snapshot.stages;
  const validSegments = new Set(segments.map((segment) => segment.key));
  const segment =
    state.segment === "all" || validSegments.has(state.segment)
      ? state.segment
      : "all";
  // Validate the selection against the *visible* segment, not all startups,
  // since a deep link like ?segment=sector-fintech&startup=openai would
  // otherwise keep the param while expanding nothing.
  const visibleStartupIds = new Set(
    segment === "all"
      ? snapshot.startups.map((startup) => startup.id)
      : segments.find((entry) => entry.key === segment)?.startupIds ?? []
  );

  return {
    kind,
    segment,
    sort: enumValue(state.sort, TECH_STARTUP_SORT_OPTIONS, DEFAULT_TECH_STARTUP_STATE.sort),
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
  return buildHref(
    TECH_STARTUP_ROUTE,
    {
      view: state.kind,
      segment: state.segment,
      sort: state.sort,
      startup: state.selectedStartupId || null,
    },
    { ...DEFAULT_TECH_STARTUP_STATE, view: DEFAULT_TECH_STARTUP_STATE.kind },
    baseSearchParams
  );
}
