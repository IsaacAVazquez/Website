import type { ReadonlyURLSearchParams } from "next/navigation";
import {
  isFoodMapCuisineId,
  isFoodMapMealId,
  isFoodMapNeighborhoodId,
  isFoodMapPlaceId,
  type FoodMapCuisineId,
  type FoodMapMealId,
  type FoodMapNeighborhoodId,
} from "./food-map-data";

type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | Record<string, string | string[] | undefined | null>;

export interface FoodMapState {
  neighborhoods: ReadonlyArray<FoodMapNeighborhoodId>;
  cuisines: ReadonlyArray<FoodMapCuisineId>;
  meal: FoodMapMealId;
  pick: string | null;
}

export const FOOD_MAP_ROUTE = "/food-map";

export const DEFAULT_FOOD_MAP_STATE: FoodMapState = {
  neighborhoods: [],
  cuisines: [],
  meal: "all",
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
  const neighborhoods = parseList(readParam(input, "neighborhood")).filter(
    isFoodMapNeighborhoodId
  );
  const cuisines = parseList(readParam(input, "cuisine")).filter(
    isFoodMapCuisineId
  );

  const rawMeal = readParam(input, "meal");
  const meal: FoodMapMealId = isFoodMapMealId(rawMeal)
    ? rawMeal
    : DEFAULT_FOOD_MAP_STATE.meal;

  const rawPick = readParam(input, "pick");
  const pick = isFoodMapPlaceId(rawPick) ? rawPick : null;

  return {
    neighborhoods,
    cuisines,
    meal,
    pick,
  };
}

export function buildFoodMapHref(state: FoodMapState): string {
  const params = new URLSearchParams();

  if (state.neighborhoods.length > 0) {
    params.set("neighborhood", state.neighborhoods.join(","));
  }

  if (state.cuisines.length > 0) {
    params.set("cuisine", state.cuisines.join(","));
  }

  if (state.meal !== DEFAULT_FOOD_MAP_STATE.meal) {
    params.set("meal", state.meal);
  }

  if (state.pick) {
    params.set("pick", state.pick);
  }

  const query = params.toString();
  return query ? `${FOOD_MAP_ROUTE}?${query}` : FOOD_MAP_ROUTE;
}

export function toggleNeighborhood(
  state: FoodMapState,
  neighborhood: FoodMapNeighborhoodId
): FoodMapState {
  const exists = state.neighborhoods.includes(neighborhood);
  const next = exists
    ? state.neighborhoods.filter((entry) => entry !== neighborhood)
    : [...state.neighborhoods, neighborhood];

  return { ...state, neighborhoods: next, pick: null };
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

export function setMeal(state: FoodMapState, meal: FoodMapMealId): FoodMapState {
  return { ...state, meal, pick: null };
}

export function setPick(state: FoodMapState, pick: string | null): FoodMapState {
  return { ...state, pick };
}

export function resetFoodMapFilters(state: FoodMapState): FoodMapState {
  return { ...DEFAULT_FOOD_MAP_STATE, pick: state.pick };
}
