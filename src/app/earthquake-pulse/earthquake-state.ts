import type { ReadonlyURLSearchParams } from "next/navigation";
import type { EarthquakeRouteState, EarthquakeView } from "@/types/earthquake";

export const EARTHQUAKE_ROUTE = "/earthquake-pulse";
export const EARTHQUAKE_VIEW_OPTIONS = [
  "recent",
  "significant",
  "regions",
] as const;

const VALID_VIEWS = new Set<EarthquakeView>(EARTHQUAKE_VIEW_OPTIONS);

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_EARTHQUAKE_STATE: EarthquakeRouteState = {
  view: "recent",
  quake: null,
};

export const EARTHQUAKE_VIEW_LABELS: Record<EarthquakeView, string> = {
  recent: "Recent",
  significant: "Significant",
  regions: "Regions",
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

function normalizeQuakeParam(quake: string | null): string | null {
  if (!quake) {
    return null;
  }

  const trimmed = quake.trim();
  return /^[a-z0-9]{6,24}$/i.test(trimmed) ? trimmed : null;
}

export function normalizeEarthquakeState(
  input: SearchParamInput
): EarthquakeRouteState {
  const view = readParam(input, "view");
  const quake = readParam(input, "quake");

  return {
    view: VALID_VIEWS.has((view ?? "") as EarthquakeView)
      ? (view as EarthquakeView)
      : DEFAULT_EARTHQUAKE_STATE.view,
    quake: normalizeQuakeParam(quake),
  };
}

export function buildEarthquakeHref(
  state: EarthquakeRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );

  if (state.view === DEFAULT_EARTHQUAKE_STATE.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (state.quake) {
    params.set("quake", state.quake);
  } else {
    params.delete("quake");
  }

  const query = params.toString();
  return `${EARTHQUAKE_ROUTE}${query ? `?${query}` : ""}`;
}
