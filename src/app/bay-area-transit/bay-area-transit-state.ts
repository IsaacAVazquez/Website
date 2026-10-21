import type { ReadonlyURLSearchParams } from "next/navigation";
import type { TransitRouteState } from "@/types/bayAreaTransit";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";

export const TRANSIT_ROUTE = "/bay-area-transit";
// "stations" was the Departures tab until station search moved onto the board.
// An old ?view=stations link falls back to the default view and keeps its station.
const TRANSIT_VIEW_OPTIONS = ["lines", "advisories"] as const;

export const DEFAULT_TRANSIT_STATE: TransitRouteState = {
  view: "lines",
  station: null,
};

function normalizeStationParam(station: string | null): string | null {
  const trimmed = station?.trim().toLowerCase() ?? "";
  return /^[a-z0-9]{2,8}$/.test(trimmed) ? trimmed : null;
}

export function normalizeTransitState(
  input: SearchParamInput
): TransitRouteState {
  return {
    view: readEnum(input, "view", TRANSIT_VIEW_OPTIONS, DEFAULT_TRANSIT_STATE.view),
    station: normalizeStationParam(readParam(input, "station")),
  };
}

export function buildTransitHref(
  state: TransitRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams
): string {
  return buildHref(
    TRANSIT_ROUTE,
    { view: state.view, station: state.station || null },
    DEFAULT_TRANSIT_STATE,
    baseSearchParams
  );
}
