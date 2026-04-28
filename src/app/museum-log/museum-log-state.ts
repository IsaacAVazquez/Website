import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  MuseumRegionFilter,
  MuseumRouteState,
  MuseumSort,
  MuseumTypeFilter,
  MuseumView,
} from "@/types/museum";

export const MUSEUM_LOG_ROUTE = "/museum-log";

export const MUSEUM_VIEW_OPTIONS = ["discover", "journal", "lists", "museum"] as const;

export const MUSEUM_VIEW_LABELS: Record<MuseumView, string> = {
  discover: "Discover",
  journal: "Journal",
  lists: "Lists",
  museum: "Museum",
};

export const MUSEUM_VIEW_DESCRIPTIONS: Record<MuseumView, string> = {
  discover: "Browse the curated catalog and filter by type and region.",
  journal: "Curator's reviews and visit log timeline.",
  lists: "Themed collections of museums grouped by trip, region, or vibe.",
  museum: "Single museum detail with curator review, exhibits, and your visit toggles.",
};

const VALID_VIEWS = new Set<MuseumView>(MUSEUM_VIEW_OPTIONS);
const VALID_SORTS = new Set<MuseumSort>(["rating", "popular", "recent", "alpha"]);
const VALID_TYPES = new Set<MuseumTypeFilter>([
  "all",
  "art",
  "history",
  "science",
  "natural-history",
  "design",
  "photography",
  "specialty",
]);
const VALID_REGIONS = new Set<MuseumRegionFilter>([
  "all",
  "northeast",
  "south",
  "midwest",
  "west",
  "europe",
  "asia",
  "latin-america",
]);

export const DEFAULT_MUSEUM_STATE: MuseumRouteState = {
  view: "discover",
  museum: null,
  list: null,
  sort: "rating",
  type: "all",
  region: "all",
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

function normalizeSlugParam(slug: string | null): string | null {
  if (!slug) return null;
  const trimmed = slug.trim();
  return /^[a-z][a-z0-9-]*$/.test(trimmed) ? trimmed : null;
}

export function normalizeMuseumState(input: SearchParamInput): MuseumRouteState {
  const view = readParam(input, "view");
  const museum = normalizeSlugParam(readParam(input, "museum"));
  const list = normalizeSlugParam(readParam(input, "list"));
  const sort = readParam(input, "sort");
  const type = readParam(input, "type");
  const region = readParam(input, "region");

  // If a museum slug is present, force the museum view so deep links work.
  let resolvedView: MuseumView;
  if (museum) {
    resolvedView = "museum";
  } else if (list) {
    resolvedView = "lists";
  } else {
    resolvedView = VALID_VIEWS.has((view ?? "") as MuseumView)
      ? (view as MuseumView)
      : DEFAULT_MUSEUM_STATE.view;
  }

  return {
    view: resolvedView,
    museum,
    list,
    sort: VALID_SORTS.has((sort ?? "") as MuseumSort)
      ? (sort as MuseumSort)
      : DEFAULT_MUSEUM_STATE.sort,
    type: VALID_TYPES.has((type ?? "") as MuseumTypeFilter)
      ? (type as MuseumTypeFilter)
      : DEFAULT_MUSEUM_STATE.type,
    region: VALID_REGIONS.has((region ?? "") as MuseumRegionFilter)
      ? (region as MuseumRegionFilter)
      : DEFAULT_MUSEUM_STATE.region,
  };
}

export function buildMuseumHref(
  state: MuseumRouteState,
  baseSearchParams?: URLSearchParams | ReadonlyURLSearchParams,
): string {
  const params = new URLSearchParams(
    baseSearchParams ? Array.from(baseSearchParams.entries()) : [],
  );

  const setOrDelete = (key: string, value: string, defaultValue: string) => {
    if (value === defaultValue) params.delete(key);
    else params.set(key, value);
  };

  setOrDelete("view", state.view, DEFAULT_MUSEUM_STATE.view);
  setOrDelete("sort", state.sort, DEFAULT_MUSEUM_STATE.sort);
  setOrDelete("type", state.type, DEFAULT_MUSEUM_STATE.type);
  setOrDelete("region", state.region, DEFAULT_MUSEUM_STATE.region);

  if (state.museum) params.set("museum", state.museum);
  else params.delete("museum");

  if (state.list) params.set("list", state.list);
  else params.delete("list");

  // The view is implied when museum or list is set — drop redundant noise.
  if (state.museum) params.delete("view");
  if (state.list && state.view === "lists") params.delete("view");

  const query = params.toString();
  return `${MUSEUM_LOG_ROUTE}${query ? `?${query}` : ""}`;
}
