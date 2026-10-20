import type { ReadonlyURLSearchParams } from "next/navigation";
import type { EarthquakeRouteState, EarthquakeView } from "@/types/earthquake";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

export const EARTHQUAKE_ROUTE = "/earthquake-pulse";
export const EARTHQUAKE_VIEW_OPTIONS = [
  "recent",
  "significant",
  "regions",
] as const;

export const DEFAULT_EARTHQUAKE_STATE: EarthquakeRouteState = {
  view: "recent",
  quake: null,
};

export const EARTHQUAKE_VIEW_LABELS: Record<EarthquakeView, string> = {
  recent: "Recent",
  significant: "Significant",
  regions: "Regions",
};

function normalizeQuakeParam(quake: string | null): string | null {
  const trimmed = quake?.trim() ?? "";
  return /^[a-z0-9]{6,24}$/i.test(trimmed) ? trimmed : null;
}

export function normalizeEarthquakeState(
  input: SearchParamInput
): EarthquakeRouteState {
  return {
    view: readEnum(input, "view", EARTHQUAKE_VIEW_OPTIONS, DEFAULT_EARTHQUAKE_STATE.view),
    quake: normalizeQuakeParam(readParam(input, "quake")),
  };
}

export function buildEarthquakeHref(
  state: EarthquakeRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return buildHref(
    EARTHQUAKE_ROUTE,
    { view: state.view, quake: state.quake || null },
    DEFAULT_EARTHQUAKE_STATE,
    baseSearchParams
  );
}
