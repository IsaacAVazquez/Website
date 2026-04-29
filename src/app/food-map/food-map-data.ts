export const FOOD_MAP_NEIGHBORHOOD_IDS = [
  "east-austin",
  "downtown",
  "south-congress",
  "south-lamar",
] as const;

export type FoodMapNeighborhoodId = (typeof FOOD_MAP_NEIGHBORHOOD_IDS)[number];

export const FOOD_MAP_CUISINE_IDS = [
  "barbecue",
  "tacos",
  "mexican",
  "japanese",
  "asian",
  "pizza",
  "american",
  "seafood",
  "coffee",
] as const;

export type FoodMapCuisineId = (typeof FOOD_MAP_CUISINE_IDS)[number];

export const FOOD_MAP_MEAL_IDS = [
  "all",
  "breakfast",
  "lunch",
  "dinner",
  "coffee",
] as const;

export type FoodMapMealId = (typeof FOOD_MAP_MEAL_IDS)[number];

export interface FoodMapNeighborhood {
  id: FoodMapNeighborhoodId;
  name: string;
  blurb: string;
  shape: { x: number; y: number; width: number; height: number };
  labelX: number;
  labelY: number;
  accent: string;
}

export interface FoodMapCuisine {
  id: FoodMapCuisineId;
  label: string;
}

export interface FoodMapMeal {
  id: FoodMapMealId;
  label: string;
}

export interface FoodMapPlace {
  id: string;
  name: string;
  neighborhood: FoodMapNeighborhoodId;
  cuisine: FoodMapCuisineId;
  meals: ReadonlyArray<Exclude<FoodMapMealId, "all">>;
  price: "$" | "$$" | "$$$";
  signature: string;
  why: string;
  x: number;
  y: number;
}

export const FOOD_MAP_NEIGHBORHOODS: readonly FoodMapNeighborhood[] = [
  {
    id: "east-austin",
    name: "East Austin",
    blurb:
      "I send people here first. The density of barbecue, taquerias, and dinner rooms doing their own thing is hard to match anywhere else in town.",
    shape: { x: 56, y: 22, width: 32, height: 26 },
    labelX: 72,
    labelY: 19,
    accent: "var(--home-haze)",
  },
  {
    id: "downtown",
    name: "Downtown",
    blurb:
      "I think of downtown as the workday option. It is more about a reliable hotel-bar dinner than a spot I would drive across town for.",
    shape: { x: 30, y: 30, width: 22, height: 18 },
    labelX: 41,
    labelY: 27,
    accent: "var(--home-moss)",
  },
  {
    id: "south-congress",
    name: "South Congress",
    blurb:
      "South Congress is where I take visitors when they want the all-day version of Austin food, from breakfast through oysters at night.",
    shape: { x: 36, y: 58, width: 24, height: 22 },
    labelX: 48,
    labelY: 84,
    accent: "var(--home-acid)",
  },
  {
    id: "south-lamar",
    name: "South Lamar",
    blurb:
      "South Lamar is the one I pick when I want a longer dinner. The rooms feel a little more grown up and the cooking has more reps behind it.",
    shape: { x: 14, y: 58, width: 22, height: 22 },
    labelX: 25,
    labelY: 84,
    accent: "var(--home-ink)",
  },
] as const;

export const FOOD_MAP_CUISINES: readonly FoodMapCuisine[] = [
  { id: "barbecue", label: "Barbecue" },
  { id: "tacos", label: "Tacos" },
  { id: "mexican", label: "Mexican" },
  { id: "japanese", label: "Japanese" },
  { id: "asian", label: "Asian smokehouse" },
  { id: "pizza", label: "Pizza" },
  { id: "american", label: "American" },
  { id: "seafood", label: "Seafood" },
  { id: "coffee", label: "Coffee" },
] as const;

export const FOOD_MAP_MEALS: readonly FoodMapMeal[] = [
  { id: "all", label: "All meals" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "coffee", label: "Coffee" },
] as const;

export const FOOD_MAP_PLACES: readonly FoodMapPlace[] = [
  {
    id: "franklin-barbecue",
    name: "Franklin Barbecue",
    neighborhood: "east-austin",
    cuisine: "barbecue",
    meals: ["lunch"],
    price: "$$",
    signature: "Brisket, fatty end",
    why: "The line is the price of admission, and I think it still earns it. I plan a Franklin lunch like an event, not a casual stop.",
    x: 64,
    y: 32,
  },
  {
    id: "la-barbecue",
    name: "La Barbecue",
    neighborhood: "east-austin",
    cuisine: "barbecue",
    meals: ["lunch"],
    price: "$$",
    signature: "Brisket plate with the sausage add-on",
    why: "I rotate La Barbecue in when I want the same caliber of brisket without committing the whole morning to a queue.",
    x: 71,
    y: 41,
  },
  {
    id: "veracruz-all-natural",
    name: "Veracruz All Natural",
    neighborhood: "east-austin",
    cuisine: "tacos",
    meals: ["breakfast", "lunch"],
    price: "$",
    signature: "Migas taco",
    why: "I think the migas taco is the single best argument for Austin breakfast. I order two and never feel like that was a mistake.",
    x: 60,
    y: 38,
  },
  {
    id: "suerte",
    name: "Suerte",
    neighborhood: "east-austin",
    cuisine: "mexican",
    meals: ["dinner"],
    price: "$$$",
    signature: "Suadero tacos",
    why: "Suerte is where I take dinners that need to land. The masa work alone makes it the most distinctive Mexican kitchen in town.",
    x: 75,
    y: 35,
  },
  {
    id: "kemuri-tatsu-ya",
    name: "Kemuri Tatsu-ya",
    neighborhood: "east-austin",
    cuisine: "japanese",
    meals: ["dinner"],
    price: "$$",
    signature: "Brisket ramen",
    why: "I love that Kemuri does not pretend Texas and Japan are separate ideas. The brisket ramen reads as a real dish, not a gimmick.",
    x: 80,
    y: 28,
  },
  {
    id: "cuvee-coffee",
    name: "Cuvée Coffee",
    neighborhood: "east-austin",
    cuisine: "coffee",
    meals: ["coffee", "breakfast"],
    price: "$",
    signature: "Black & Blue nitro",
    why: "I write here when I need a long, quiet morning. The nitro is the one I miss when I am out of town.",
    x: 58,
    y: 44,
  },
  {
    id: "uchi",
    name: "Uchi",
    neighborhood: "south-lamar",
    cuisine: "japanese",
    meals: ["dinner"],
    price: "$$$",
    signature: "Hama chili",
    why: "Uchi is the dinner I send out-of-town friends to when they want the full version. The hama chili still sets the bar.",
    x: 25,
    y: 64,
  },
  {
    id: "loro",
    name: "Loro",
    neighborhood: "south-lamar",
    cuisine: "asian",
    meals: ["lunch", "dinner"],
    price: "$$",
    signature: "Oak-grilled hamachi",
    why: "Loro is my answer when someone wants smoke and a patio without the Franklin commitment. I usually start with the hamachi and a slushie.",
    x: 31,
    y: 71,
  },
  {
    id: "home-slice-pizza",
    name: "Home Slice Pizza",
    neighborhood: "south-congress",
    cuisine: "pizza",
    meals: ["lunch", "dinner"],
    price: "$",
    signature: "Cheese slice, doubled up",
    why: "I think Home Slice is the most honest pizza in town. I order two cheese slices and walk South Congress like a tourist on purpose.",
    x: 45,
    y: 70,
  },
  {
    id: "junes-all-day",
    name: "June's All Day",
    neighborhood: "south-congress",
    cuisine: "american",
    meals: ["breakfast", "lunch", "dinner"],
    price: "$$",
    signature: "Breakfast sandwich",
    why: "June's is my default when I cannot tell what meal I am in the mood for. The room flexes between brunch and dinner without losing the thread.",
    x: 51,
    y: 64,
  },
  {
    id: "perlas",
    name: "Perla's",
    neighborhood: "south-congress",
    cuisine: "seafood",
    meals: ["dinner"],
    price: "$$$",
    signature: "Oyster tower",
    why: "Perla's is the patio I pick when the night needs to feel like a proper Austin evening. Oysters first, then whatever the chalkboard says.",
    x: 49,
    y: 78,
  },
  {
    id: "eberly",
    name: "Eberly",
    neighborhood: "downtown",
    cuisine: "american",
    meals: ["dinner"],
    price: "$$",
    signature: "Cedar Tavern bar snacks",
    why: "Eberly is my downtown move when the night is part work, part dinner. The Cedar Tavern bar still feels like the city's living room.",
    x: 39,
    y: 43,
  },
] as const;

const neighborhoodMap = new Map(
  FOOD_MAP_NEIGHBORHOODS.map((entry) => [entry.id, entry])
);
const cuisineMap = new Map(FOOD_MAP_CUISINES.map((entry) => [entry.id, entry]));
const mealMap = new Map(FOOD_MAP_MEALS.map((entry) => [entry.id, entry]));
const placeMap = new Map(FOOD_MAP_PLACES.map((entry) => [entry.id, entry]));

export function isFoodMapNeighborhoodId(
  value: string | null | undefined
): value is FoodMapNeighborhoodId {
  return Boolean(value && neighborhoodMap.has(value as FoodMapNeighborhoodId));
}

export function isFoodMapCuisineId(
  value: string | null | undefined
): value is FoodMapCuisineId {
  return Boolean(value && cuisineMap.has(value as FoodMapCuisineId));
}

export function isFoodMapMealId(
  value: string | null | undefined
): value is FoodMapMealId {
  return Boolean(value && mealMap.has(value as FoodMapMealId));
}

export function isFoodMapPlaceId(value: string | null | undefined): boolean {
  return Boolean(value && placeMap.has(value));
}

export function getFoodMapNeighborhood(
  id: FoodMapNeighborhoodId
): FoodMapNeighborhood {
  return neighborhoodMap.get(id) ?? FOOD_MAP_NEIGHBORHOODS[0];
}

export function getFoodMapCuisine(id: FoodMapCuisineId): FoodMapCuisine {
  return cuisineMap.get(id) ?? FOOD_MAP_CUISINES[0];
}

export function getFoodMapPlace(id: string): FoodMapPlace | undefined {
  return placeMap.get(id);
}

export interface FoodMapFilters {
  neighborhoods: ReadonlyArray<FoodMapNeighborhoodId>;
  cuisines: ReadonlyArray<FoodMapCuisineId>;
  meal: FoodMapMealId;
}

export function filterFoodMapPlaces(
  places: ReadonlyArray<FoodMapPlace>,
  filters: FoodMapFilters
): FoodMapPlace[] {
  return places.filter((place) => {
    if (
      filters.neighborhoods.length > 0 &&
      !filters.neighborhoods.includes(place.neighborhood)
    ) {
      return false;
    }

    if (
      filters.cuisines.length > 0 &&
      !filters.cuisines.includes(place.cuisine)
    ) {
      return false;
    }

    if (
      filters.meal !== "all" &&
      !place.meals.includes(filters.meal as Exclude<FoodMapMealId, "all">)
    ) {
      return false;
    }

    return true;
  });
}

export function countPlacesByNeighborhood(
  places: ReadonlyArray<FoodMapPlace>
): Record<FoodMapNeighborhoodId, number> {
  const counts = FOOD_MAP_NEIGHBORHOODS.reduce<
    Record<FoodMapNeighborhoodId, number>
  >((acc, neighborhood) => {
    acc[neighborhood.id] = 0;
    return acc;
  }, {} as Record<FoodMapNeighborhoodId, number>);

  for (const place of places) {
    counts[place.neighborhood] = (counts[place.neighborhood] ?? 0) + 1;
  }

  return counts;
}
