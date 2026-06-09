import type { ReadonlyURLSearchParams } from "next/navigation";
import type { TransitRouteState, TransitView } from "@/types/bayAreaTransit";

export const TRANSIT_ROUTE = "/bay-area-transit";
export const TRANSIT_VIEW_OPTIONS = [
  "lines",
  "stations",
  "advisories",
] as const;

const VALID_VIEWS = new Set<TransitView>(TRANSIT_VIEW_OPTIONS);

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

type SearchParamRecord = Record<string, string | string[] | undefined | null>;

export const DEFAULT_TRANSIT_STATE: TransitRouteState = {
  view: "lines",
  station: null,
};

export const TRANSIT_VIEW_LABELS: Record<TransitView, string> = {
  lines: "Lines",
  stations: "Departures",
  advisories: "Alerts",
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

function normalizeStationParam(station: string | null): string | null {
  if (!station) {
    return null;
  }

  const trimmed = station.trim().toLowerCase();
  return /^[a-z0-9]{2,8}$/.test(trimmed) ? trimmed : null;
}

export function normalizeTransitState(
  input: SearchParamInput
): TransitRouteState {
  const view = readParam(input, "view");
  const station = readParam(input, "station");

  return {
    view: VALID_VIEWS.has((view ?? "") as TransitView)
      ? (view as TransitView)
      : DEFAULT_TRANSIT_STATE.view,
    station: normalizeStationParam(station),
  };
}

export function buildTransitHref(
  state: TransitRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : []
  );

  if (state.view === DEFAULT_TRANSIT_STATE.view) {
    params.delete("view");
  } else {
    params.set("view", state.view);
  }

  if (state.station) {
    params.set("station", state.station);
  } else {
    params.delete("station");
  }

  const query = params.toString();
  return `${TRANSIT_ROUTE}${query ? `?${query}` : ""}`;
}
