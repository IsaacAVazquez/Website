import {
  isFoodMapCityId,
  isFoodMapCuisineId,
  isFoodMapCuratorId,
  isFoodMapPlaceId,
  type FoodMapCityId,
  type FoodMapCuisineId,
  type FoodMapCuratorId,
} from "./food-map-data";
import { buildHref, readParam, type SearchParamInput } from "@/lib/searchParams";

export interface FoodMapState {
  city: FoodMapCityId;
  curators: ReadonlyArray<FoodMapCuratorId>;
  cuisines: ReadonlyArray<FoodMapCuisineId>;
  pick: string | null;
}

export const FOOD_MAP_ROUTE = "/food-map";

const DEFAULT_CITY: FoodMapCityId = "austin";

export const DEFAULT_FOOD_MAP_STATE: FoodMapState = {
  city: DEFAULT_CITY,
  curators: [],
  cuisines: [],
  pick: null,
};

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
  return buildHref(
    FOOD_MAP_ROUTE,
    {
      city: state.city,
      curator: state.curators.join(",") || null,
      cuisine: state.cuisines.join(",") || null,
      pick: state.pick || null,
    },
    { city: DEFAULT_CITY }
  );
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
