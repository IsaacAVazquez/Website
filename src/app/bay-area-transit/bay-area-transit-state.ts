import type { ReadonlyURLSearchParams } from "next/navigation";
import type { TransitRouteState, TransitView } from "@/types/bayAreaTransit";
import { readParam, type SearchParamInput } from "@/lib/searchParams";

export const TRANSIT_ROUTE = "/bay-area-transit";
// "stations" was the Departures tab until station search moved onto the board.
// An old ?view=stations link falls back to the default view and keeps its station.
export const TRANSIT_VIEW_OPTIONS = ["lines", "advisories"] as const;

const VALID_VIEWS = new Set<TransitView>(TRANSIT_VIEW_OPTIONS);

export const DEFAULT_TRANSIT_STATE: TransitRouteState = {
  view: "lines",
  station: null,
};

export const TRANSIT_VIEW_LABELS: Record<TransitView, string> = {
  lines: "Lines",
  advisories: "Alerts",
};

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
