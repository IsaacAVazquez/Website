import type { ReadonlyURLSearchParams } from "next/navigation";
import {
  isFoodMapCityId,
  isFoodMapCuisineId,
  isFoodMapCuratorId,
  isFoodMapPlaceId,
  type FoodMapCityId,
  type FoodMapCuisineId,
  type FoodMapCuratorId,
} from "./food-map-data";

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

export interface FoodMapState {
  city: FoodMapCityId;
  curators: ReadonlyArray<FoodMapCuratorId>;
  cuisines: ReadonlyArray<FoodMapCuisineId>;
  pick: string | null;
}

export const FOOD_MAP_ROUTE = "/food-map";

export const DEFAULT_CITY: FoodMapCityId = "austin";

export const DEFAULT_FOOD_MAP_STATE: FoodMapState = {
  city: DEFAULT_CITY,
  curators: [],
  cuisines: [],
  pick: null,
};

function readParam(input: SearchParamInput, key: string): string | null {
  if ("get" in input && typeof input.get === "function") {
    return (input as URLSearchParams).get(key);
  }

  const rawValue = (input as Record<string, string | string[] | undefined | null>)[key];
  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }
  return rawValue ?? null;
}

function parseList(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const piece of raw.split(",")) {
    const trimmed = piece.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

export function normalizeFoodMapState(input: SearchParamInput): FoodMapState {
  const rawCity = readParam(input, "city");
  const city: FoodMapCityId = isFoodMapCityId(rawCity) ? rawCity : DEFAULT_CITY;

  const curators = parseList(readParam(input, "curator")).filter(
    isFoodMapCuratorId
  );
  const cuisines = parseList(readParam(input, "cuisine")).filter(
    isFoodMapCuisineId
  );

  const rawPick = readParam(input, "pick");
  const pick = isFoodMapPlaceId(rawPick) ? rawPick : null;

  return {
    city,
    curators,
    cuisines,
    pick,
  };
}

export function buildFoodMapHref(state: FoodMapState): string {
  const params = new URLSearchParams();

  if (state.city !== DEFAULT_CITY) {
    params.set("city", state.city);
  }

  if (state.curators.length > 0) {
    params.set("curator", state.curators.join(","));
  }

  if (state.cuisines.length > 0) {
    params.set("cuisine", state.cuisines.join(","));
  }

  if (state.pick) {
    params.set("pick", state.pick);
  }

  const query = params.toString();
  return query ? `${FOOD_MAP_ROUTE}?${query}` : FOOD_MAP_ROUTE;
}

export function setCity(state: FoodMapState, city: FoodMapCityId): FoodMapState {
  if (city === state.city) {
    return state;
  }
  // Switching cities clears city-scoped cuisine selections and the active pick.
  return { ...state, city, cuisines: [], pick: null };
}

export function toggleCurator(
  state: FoodMapState,
  curator: FoodMapCuratorId
): FoodMapState {
  const exists = state.curators.includes(curator);
  const next = exists
    ? state.curators.filter((entry) => entry !== curator)
    : [...state.curators, curator];

  return { ...state, curators: next, pick: null };
}

export function toggleCuisine(
  state: FoodMapState,
  cuisine: FoodMapCuisineId
): FoodMapState {
  const exists = state.cuisines.includes(cuisine);
  const next = exists
    ? state.cuisines.filter((entry) => entry !== cuisine)
    : [...state.cuisines, cuisine];

  return { ...state, cuisines: next, pick: null };
}

export function setPick(state: FoodMapState, pick: string | null): FoodMapState {
  return { ...state, pick };
}

/** Clears the curator + cuisine filters but stays in the current city and keeps
 *  the active pick. */
export function resetFoodMapFilters(state: FoodMapState): FoodMapState {
  return { city: state.city, curators: [], cuisines: [], pick: state.pick };
}
