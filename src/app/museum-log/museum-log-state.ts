import type { ReadonlyURLSearchParams } from "next/navigation";
import type { MuseumRouteState } from "@/types/museum";
import { buildHref, readEnum, readParam, type SearchParamInput } from "@/lib/searchParams";
import { REGION_FILTER_OPTIONS, SORT_OPTIONS, TYPE_FILTER_OPTIONS } from "./museum-log-helpers";

const MUSEUM_LOG_ROUTE = "/museum-log";

const MUSEUM_VIEW_OPTIONS = ["discover", "journal", "lists", "museum"] as const;

// The values the selects and sort buttons offer, so the URL accepts exactly those.
const TYPES = TYPE_FILTER_OPTIONS.map((option) => option.value);
const REGIONS = REGION_FILTER_OPTIONS.map((option) => option.value);

export const DEFAULT_MUSEUM_STATE: MuseumRouteState = {
  view: "discover",
  museum: null,
  list: null,
  sort: "rating",
  type: "all",
  region: "all",
};

function normalizeSlugParam(slug: string | null): string | null {
  const trimmed = slug?.trim() ?? "";
  return /^[a-z][a-z0-9-]*$/.test(trimmed) ? trimmed : null;
}

export function normalizeMuseumState(input: SearchParamInput): MuseumRouteState {
  const museum = normalizeSlugParam(readParam(input, "museum"));
  const list = normalizeSlugParam(readParam(input, "list"));

  return {
    // A museum or list slug forces its view so deep links work.
    view: museum
      ? "museum"
      : list
        ? "lists"
        : readEnum(input, "view", MUSEUM_VIEW_OPTIONS, DEFAULT_MUSEUM_STATE.view),
    museum,
    list,
    sort: readEnum(input, "sort", SORT_OPTIONS, DEFAULT_MUSEUM_STATE.sort),
    type: readEnum(input, "type", TYPES, DEFAULT_MUSEUM_STATE.type),
    region: readEnum(input, "region", REGIONS, DEFAULT_MUSEUM_STATE.region),
  };
}

export function buildMuseumHref(
  state: MuseumRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams,
): string {
  // The view is implied when museum or list is set, so it drops out of the URL.
  const viewImplied = Boolean(state.museum || (state.list && state.view === "lists"));
  return buildHref(
    MUSEUM_LOG_ROUTE,
    {
      view: viewImplied ? null : state.view,
      sort: state.sort,
      type: state.type,
      region: state.region,
      museum: state.museum || null,
      list: state.list || null,
    },
    DEFAULT_MUSEUM_STATE,
    baseSearchParams,
  );
}
