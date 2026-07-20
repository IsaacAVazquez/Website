// Food Map data — a curated, multi-city restaurant map.
//
// Spots live in one of a handful of cities and are attributed to one or more
// "curators" (a point of view: Anthony Bourdain's picks, Isaac's personal
// go-tos, or simply what's top-rated on Google). The page (`food-map-client`)
// and the Leaflet map (`food-map-leaflet`) read from this file.
//
// Coordinates are approximate — good enough to drop a pin on the right block.
// Detail links resolve to a Google Maps search so they stay valid if a venue
// moves; always verify hours before making a trip.

export const FOOD_MAP_AS_OF = "2026-04-28";
export const FOOD_MAP_VERIFIED = false;

export type LatLng = [number, number];

/* -------------------------------------------------------------------------- */
/* Cities                                                                      */
/* -------------------------------------------------------------------------- */

export const FOOD_MAP_CITY_IDS = [
  "austin",
  "sf",
  "nyc",
  "nola",
  "la",
  "miami",
  "atlanta",
  "tokyo",
  "cph",
  "san-sebastian",
] as const;

export type FoodMapCityId = (typeof FOOD_MAP_CITY_IDS)[number];

export interface FoodMapCity {
  id: FoodMapCityId;
  name: string;
  country: string;
  /** Map center when this city is selected. */
  center: LatLng;
  /** Zoom level when this city is selected. */
  zoom: number;
}

export const FOOD_MAP_CITIES: readonly FoodMapCity[] = [
  { id: "austin", name: "Austin", country: "USA", center: [30.2649, -97.747], zoom: 12 },
  { id: "sf", name: "San Francisco Bay Area", country: "USA", center: [37.79, -122.41], zoom: 12 },
  { id: "nyc", name: "New York City", country: "USA", center: [40.72, -73.99], zoom: 12 },
  { id: "nola", name: "New Orleans", country: "USA", center: [29.95, -90.07], zoom: 12 },
  { id: "la", name: "Los Angeles", country: "USA", center: [34.05, -118.27], zoom: 11 },
  { id: "miami", name: "Miami", country: "USA", center: [25.78, -80.2], zoom: 12 },
  { id: "atlanta", name: "Atlanta", country: "USA", center: [33.755, -84.39], zoom: 11 },
  // NOTE: longitudes are signed. Tokyo and Copenhagen sit east of the prime
  // meridian (positive); San Sebastián is just west of it (negative). Tokyo's
  // source data used a negative sign, which plotted pins in the Pacific.
  { id: "tokyo", name: "Tokyo", country: "Japan", center: [35.67, 139.74], zoom: 11 },
  { id: "cph", name: "Copenhagen", country: "Denmark", center: [55.6761, 12.5683], zoom: 12 },
  { id: "san-sebastian", name: "San Sebastián", country: "Spain", center: [43.3183, -1.9812], zoom: 13 },
] as const;

/* -------------------------------------------------------------------------- */
/* Curators                                                                    */
/* -------------------------------------------------------------------------- */

export const FOOD_MAP_CURATOR_IDS = ["bourdain", "isaac", "google"] as const;

export type FoodMapCuratorId = (typeof FOOD_MAP_CURATOR_IDS)[number];

export interface FoodMapCurator {
  id: FoodMapCuratorId;
  name: string;
  blurb: string;
  /** Hex accent for the map pin + card. Leaflet markers are inline SVG, so a
   *  real color value is required here rather than a CSS variable. Tuned to sit
   *  alongside the editorial palette. */
  accent: string;
}

export const FOOD_MAP_CURATORS: readonly FoodMapCurator[] = [
  {
    id: "bourdain",
    name: "Anthony Bourdain",
    blurb:
      "The late chef's no-reservations picks — dives, legends, and gut-truth cooking.",
    accent: "#B3493E",
  },
  {
    id: "isaac",
    name: "Isaac's Picks",
    blurb: "My personal go-tos — the places I actually send friends to.",
    accent: "#C2872E",
  },
  {
    id: "google",
    name: "Top Rated on Google",
    blurb: "Crowd favorites with the reviews to back them up.",
    accent: "#3B7A57",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Cuisines                                                                    */
/* -------------------------------------------------------------------------- */

export const FOOD_MAP_CUISINE_IDS = [
  "barbecue",
  "tacos",
  "mexican",
  "oaxacan",
  "japanese",
  "sushi",
  "ramen",
  "noodles",
  "asian",
  "pizza",
  "american",
  "californian",
  "steakhouse",
  "deli",
  "cajun",
  "po-boys",
  "italian",
  "bakery",
  "seafood",
  "oysters",
  "hot-chicken",
  "cuban",
  "southern",
  "nordic",
  "street-food",
  "basque",
  "pintxos",
  "coffee",
] as const;

export type FoodMapCuisineId = (typeof FOOD_MAP_CUISINE_IDS)[number];

export interface FoodMapCuisine {
  id: FoodMapCuisineId;
  label: string;
}

export const FOOD_MAP_CUISINES: readonly FoodMapCuisine[] = [
  { id: "barbecue", label: "Barbecue" },
  { id: "tacos", label: "Tacos" },
  { id: "mexican", label: "Mexican" },
  { id: "oaxacan", label: "Oaxacan" },
  { id: "japanese", label: "Japanese" },
  { id: "sushi", label: "Sushi" },
  { id: "ramen", label: "Ramen" },
  { id: "noodles", label: "Noodles" },
  { id: "asian", label: "Asian" },
  { id: "pizza", label: "Pizza" },
  { id: "american", label: "American" },
  { id: "californian", label: "Californian" },
  { id: "steakhouse", label: "Steakhouse" },
  { id: "deli", label: "Deli" },
  { id: "cajun", label: "Cajun" },
  { id: "po-boys", label: "Po-Boys" },
  { id: "italian", label: "Italian" },
  { id: "bakery", label: "Bakery" },
  { id: "seafood", label: "Seafood" },
  { id: "oysters", label: "Oysters" },
  { id: "hot-chicken", label: "Hot Chicken" },
  { id: "cuban", label: "Cuban" },
  { id: "southern", label: "Southern & soul" },
  { id: "nordic", label: "New Nordic" },
  { id: "street-food", label: "Street food" },
  { id: "basque", label: "Basque" },
  { id: "pintxos", label: "Pintxos" },
  { id: "coffee", label: "Coffee" },
] as const;

/* -------------------------------------------------------------------------- */
/* Places                                                                      */
/* -------------------------------------------------------------------------- */

export interface FoodMapPlace {
  id: string;
  name: string;
  city: FoodMapCityId;
  /** Curator ids who recommend this spot (at least one). */
  curators: ReadonlyArray<FoodMapCuratorId>;
  cuisine: FoodMapCuisineId;
  coords: LatLng;
  /** The signature order — what to actually get. */
  order: string;
  /** Why it earns the spot. */
  why: string;
  /** Display-only neighborhood label (Austin spots). */
  neighborhood?: string;
  /** Display-only price band (Austin spots). */
  price?: "$" | "$$" | "$$$";
}

export const FOOD_MAP_PLACES: readonly FoodMapPlace[] = [
  // ---- Austin ----
  {
    id: "franklin-barbecue",
    name: "Franklin Barbecue",
    city: "austin",
    curators: ["isaac", "google"],
    cuisine: "barbecue",
    coords: [30.2701, -97.7314],
    order: "Brisket, fatty end",
    why: "The line is the price of admission, and I think it still earns it. I plan a Franklin lunch like an event, not a casual stop.",
    neighborhood: "East Austin",
    price: "$$",
  },
  {
    id: "la-barbecue",
    name: "La Barbecue",
    city: "austin",
    curators: ["isaac"],
    cuisine: "barbecue",
    coords: [30.2575, -97.7212],
    order: "Brisket plate with the sausage add-on",
    why: "I rotate La Barbecue in when I want the same caliber of brisket without committing the whole morning to a queue.",
    neighborhood: "East Austin",
    price: "$$",
  },
  {
    id: "veracruz-all-natural",
    name: "Veracruz All Natural",
    city: "austin",
    curators: ["isaac", "google"],
    cuisine: "tacos",
    coords: [30.2553, -97.7193],
    order: "Migas taco",
    why: "I think the migas taco is the single best argument for Austin breakfast. I order two and never feel like that was a mistake.",
    neighborhood: "East Austin",
    price: "$",
  },
  {
    id: "suerte",
    name: "Suerte",
    city: "austin",
    curators: ["isaac"],
    cuisine: "mexican",
    coords: [30.2607, -97.7224],
    order: "Suadero tacos",
    why: "Suerte is where I take dinners that need to land. The masa work alone makes it the most distinctive Mexican kitchen in town.",
    neighborhood: "East Austin",
    price: "$$$",
  },
  {
    id: "kemuri-tatsu-ya",
    name: "Kemuri Tatsu-ya",
    city: "austin",
    curators: ["isaac"],
    cuisine: "japanese",
    coords: [30.2543, -97.7079],
    order: "Brisket ramen",
    why: "I love that Kemuri does not pretend Texas and Japan are separate ideas. The brisket ramen reads as a real dish, not a gimmick.",
    neighborhood: "East Austin",
    price: "$$",
  },
  {
    id: "cuvee-coffee",
    name: "Cuvée Coffee",
    city: "austin",
    curators: ["isaac"],
    cuisine: "coffee",
    coords: [30.2662, -97.7212],
    order: "Black & Blue nitro",
    why: "I write here when I need a long, quiet morning. The nitro is the one I miss when I am out of town.",
    neighborhood: "East Austin",
    price: "$",
  },
  {
    id: "uchi",
    name: "Uchi",
    city: "austin",
    curators: ["isaac", "google"],
    cuisine: "japanese",
    coords: [30.2586, -97.7639],
    order: "Hama chili",
    why: "Uchi is the dinner I send out-of-town friends to when they want the full version. The hama chili still sets the bar.",
    neighborhood: "South Lamar",
    price: "$$$",
  },
  {
    id: "loro",
    name: "Loro",
    city: "austin",
    curators: ["isaac"],
    cuisine: "asian",
    coords: [30.249, -97.7831],
    order: "Oak-grilled hamachi",
    why: "Loro is my answer when someone wants smoke and a patio without the Franklin commitment. I usually start with the hamachi and a slushie.",
    neighborhood: "South Lamar",
    price: "$$",
  },
  {
    id: "home-slice-pizza",
    name: "Home Slice Pizza",
    city: "austin",
    curators: ["isaac", "google"],
    cuisine: "pizza",
    coords: [30.2495, -97.7501],
    order: "Cheese slice, doubled up",
    why: "I think Home Slice is the most honest pizza in town. I order two cheese slices and walk South Congress like a tourist on purpose.",
    neighborhood: "South Congress",
    price: "$",
  },
  {
    id: "junes-all-day",
    name: "June's All Day",
    city: "austin",
    curators: ["isaac"],
    cuisine: "american",
    coords: [30.2475, -97.7502],
    order: "Breakfast sandwich",
    why: "June's is my default when I cannot tell what meal I am in the mood for. The room flexes between brunch and dinner without losing the thread.",
    neighborhood: "South Congress",
    price: "$$",
  },
  {
    id: "perlas",
    name: "Perla's",
    city: "austin",
    curators: ["isaac"],
    cuisine: "seafood",
    coords: [30.2503, -97.7501],
    order: "Oyster tower",
    why: "Perla's is the patio I pick when the night needs to feel like a proper Austin evening. Oysters first, then whatever the chalkboard says.",
    neighborhood: "South Congress",
    price: "$$$",
  },
  {
    id: "eberly",
    name: "Eberly",
    city: "austin",
    curators: ["isaac"],
    cuisine: "american",
    coords: [30.2614, -97.7626],
    order: "Cedar Tavern bar snacks",
    why: "Eberly is my downtown move when the night is part work, part dinner. The Cedar Tavern bar still feels like the city's living room.",
    neighborhood: "Downtown",
    price: "$$",
  },

  // ---- San Francisco Bay Area ----
  {
    id: "swan-oyster-depot",
    name: "Swan Oyster Depot",
    city: "sf",
    curators: ["bourdain", "isaac"],
    cuisine: "seafood",
    coords: [37.7916, -122.4205],
    order: "Half-dozen oysters, crab back, and a cold Anchor Steam.",
    why: "A 100-year-old marble counter Bourdain called one of his favorite places on earth.",
  },
  {
    id: "la-taqueria",
    name: "La Taqueria",
    city: "sf",
    curators: ["google"],
    cuisine: "tacos",
    coords: [37.751, -122.4181],
    order: "Carnitas burrito, dorado-style (griddled), no rice.",
    why: "Mission institution that's topped national 'best burrito' lists for years.",
  },
  {
    id: "zuni-cafe",
    name: "Zuni Café",
    city: "sf",
    curators: ["google", "isaac"],
    cuisine: "californian",
    coords: [37.7726, -122.4216],
    order: "The brick-oven roast chicken for two with bread salad.",
    why: "A Market Street classic where the roast chicken is basically a religion.",
  },
  {
    id: "cheese-board-pizza",
    name: "Cheese Board Pizza",
    city: "sf",
    curators: ["isaac"],
    cuisine: "pizza",
    coords: [37.8797, -122.269],
    order: "Whatever's on the board — there's only one, and it's always good.",
    why: "Worker-owned Berkeley co-op with one vegetarian pizza a day and a line out the door.",
  },
  {
    id: "tartine-bakery",
    name: "Tartine Bakery",
    city: "sf",
    curators: ["google"],
    cuisine: "bakery",
    coords: [37.7614, -122.4241],
    order: "Morning bun and a slice of the pressed sandwich.",
    why: "The bakery that set the modern country-loaf standard.",
  },

  // ---- New York City ----
  {
    id: "katzs-deli",
    name: "Katz's Delicatessen",
    city: "nyc",
    curators: ["bourdain", "google"],
    cuisine: "deli",
    coords: [40.7223, -73.9874],
    order: "Hand-cut pastrami on rye, mustard only.",
    why: "Since 1888 — the platonic ideal of a New York deli, ticket system and all.",
  },
  {
    id: "russ-and-daughters",
    name: "Russ & Daughters",
    city: "nyc",
    curators: ["bourdain"],
    cuisine: "deli",
    coords: [40.7226, -73.9882],
    order: "Bagel with sable, cream cheese, and a little smoked salmon.",
    why: "Century-old Lower East Side appetizing shop and a Bourdain pilgrimage stop.",
  },
  {
    id: "di-fara-pizza",
    name: "Di Fara Pizza",
    city: "nyc",
    curators: ["bourdain"],
    cuisine: "pizza",
    coords: [40.625, -73.9615],
    order: "Classic round pie with fresh basil snipped on top.",
    why: "Dom DeMarco's Midwood shrine — every pie made by hand, no rushing.",
  },
  {
    id: "peter-luger",
    name: "Peter Luger Steak House",
    city: "nyc",
    curators: ["google"],
    cuisine: "steakhouse",
    coords: [40.7099, -73.9626],
    order: "Porterhouse for two, creamed spinach, and the bacon to start.",
    why: "Williamsburg's cash-only steak temple, slinging porterhouse since 1887.",
  },
  {
    id: "xian-famous-foods",
    name: "Xi'an Famous Foods",
    city: "nyc",
    curators: ["isaac"],
    cuisine: "noodles",
    coords: [40.7159, -73.997],
    order: "Spicy cumin lamb hand-ripped noodles.",
    why: "Hand-pulled noodles and cumin lamb that started in a Flushing basement.",
  },

  // ---- New Orleans ----
  {
    id: "domilises",
    name: "Domilise's Po-Boys",
    city: "nola",
    curators: ["bourdain"],
    cuisine: "po-boys",
    coords: [29.927, -90.099],
    order: "Fried shrimp po-boy, dressed, with a Barq's root beer.",
    why: "A corner shop and a Bourdain favorite for the real, dressed New Orleans po-boy.",
  },
  {
    id: "cochon",
    name: "Cochon",
    city: "nola",
    curators: ["bourdain", "google"],
    cuisine: "cajun",
    coords: [29.943, -90.0668],
    order: "Fried boudin, the wood-fired oyster roast, and the namesake cochon.",
    why: "Donald Link's Warehouse District ode to whole-hog Cajun cooking.",
  },
  {
    id: "cafe-du-monde",
    name: "Café du Monde",
    city: "nola",
    curators: ["google"],
    cuisine: "coffee",
    coords: [29.9575, -90.0617],
    order: "Order of three beignets and a café au lait.",
    why: "The 24-hour French Quarter coffee stand that defines a NOLA morning.",
  },
  {
    id: "casamentos",
    name: "Casamento's",
    city: "nola",
    curators: ["isaac"],
    cuisine: "oysters",
    coords: [29.923, -90.098],
    order: "Oyster loaf on pan bread.",
    why: "Tile-walled Uptown oyster house, open only when oysters are in season.",
  },

  // ---- Los Angeles ----
  {
    id: "langers-deli",
    name: "Langer's Delicatessen",
    city: "la",
    curators: ["bourdain", "google"],
    cuisine: "deli",
    coords: [34.0577, -118.276],
    order: "The #19 — pastrami, Swiss, slaw, and Russian on double-baked rye.",
    why: "Bourdain swore the #19 was the best pastrami sandwich in America.",
  },
  {
    id: "guelaguetza",
    name: "Guelaguetza",
    city: "la",
    curators: ["bourdain", "isaac"],
    cuisine: "oaxacan",
    coords: [34.0566, -118.294],
    order: "Mole negro plate and a michelada.",
    why: "The James Beard-honored heart of LA's Oaxacan cooking.",
  },
  {
    id: "howlin-rays",
    name: "Howlin' Ray's",
    city: "la",
    curators: ["google"],
    cuisine: "hot-chicken",
    coords: [34.0617, -118.2387],
    order: "The sando at 'medium' — that's plenty hot.",
    why: "Chinatown Nashville hot chicken worth the famously long line.",
  },
  {
    id: "bestia",
    name: "Bestia",
    city: "la",
    curators: ["isaac"],
    cuisine: "italian",
    coords: [34.0335, -118.23],
    order: "Cavatelli alla Norcina and any pizza off the wood oven.",
    why: "Arts District Italian that's been a hard reservation for a decade.",
  },

  // ---- Tokyo ----
  {
    id: "sukiyabashi-jiro",
    name: "Sukiyabashi Jiro",
    city: "tokyo",
    curators: ["bourdain"],
    cuisine: "sushi",
    coords: [35.672, 139.7636],
    order: "Whatever Jiro's counter serves, in the order it's served.",
    why: "The Ginza basement omakase made famous worldwide — pure, exacting edomae sushi.",
  },
  {
    id: "rokurinsha",
    name: "Rokurinsha",
    city: "tokyo",
    curators: ["isaac", "google"],
    cuisine: "ramen",
    coords: [35.6812, 139.7671],
    order: "Tsukemen — thick noodles, dip in the rich pork-fish broth.",
    why: "Tokyo Station's Ramen Street legend that helped make tsukemen famous.",
  },
  {
    id: "ichiran-shibuya",
    name: "Ichiran Shibuya",
    city: "tokyo",
    curators: ["google"],
    cuisine: "ramen",
    coords: [35.6595, 139.7005],
    order: "Classic tonkotsu, customize the richness and spice on the slip.",
    why: "Solo-booth tonkotsu chain perfected for a heads-down, focused bowl.",
  },
  {
    id: "tsukiji-outer-market",
    name: "Tsukiji Outer Market",
    city: "tokyo",
    curators: ["bourdain", "isaac"],
    cuisine: "seafood",
    coords: [35.6654, 139.7707],
    order: "Grilled scallop on a stick, then a tuna bowl. Go hungry.",
    why: "Stalls of tamagoyaki, uni, and the freshest sushi breakfast in the city.",
  },

  // ---- Miami ----
  {
    id: "joes-stone-crab",
    name: "Joe's Stone Crab",
    city: "miami",
    curators: ["bourdain", "google"],
    cuisine: "seafood",
    coords: [25.7689, -80.1347],
    order: "Stone crab claws with mustard sauce, hash browns, and key lime pie.",
    why: "A Miami Beach institution since 1913 — stone crab season is the whole point.",
  },
  {
    id: "versailles",
    name: "Versailles",
    city: "miami",
    curators: ["google", "isaac"],
    cuisine: "cuban",
    coords: [25.765, -80.2199],
    order: "A cubano, a cortadito, and a guava pastelito.",
    why: "The Little Havana cafeteria that doubles as Miami's Cuban town square.",
  },
  {
    id: "el-rey-de-las-fritas",
    name: "El Rey de las Fritas",
    city: "miami",
    curators: ["isaac"],
    cuisine: "cuban",
    coords: [25.7659, -80.2126],
    order: "Frita cubana piled with shoestring potatoes and a mamey batido.",
    why: "The Cuban-style burger done the way it should be — messy and worth it.",
  },
  {
    id: "garcias-seafood",
    name: "Garcia's Seafood Grille",
    city: "miami",
    curators: ["isaac"],
    cuisine: "seafood",
    coords: [25.7773, -80.2103],
    order: "Stone crab and a grilled fish sandwich on the river deck.",
    why: "A working fish house on the Miami River — the antidote to South Beach.",
  },
  {
    id: "enriquetas",
    name: "Enriqueta's Sandwich Shop",
    city: "miami",
    curators: ["bourdain"],
    cuisine: "cuban",
    coords: [25.8013, -80.1907],
    order: "Pan con bistec and a cortadito at the counter.",
    why: "A no-frills Cuban lunch counter that long predates the Wynwood crowds.",
  },

  // ---- Atlanta ----
  {
    id: "busy-bee-cafe",
    name: "Busy Bee Cafe",
    city: "atlanta",
    curators: ["bourdain", "google"],
    cuisine: "southern",
    coords: [33.7556, -84.4099],
    order: "Fried chicken, mac and cheese, and collard greens.",
    why: "A Westside soul-food landmark that's been feeding Atlanta since 1947.",
  },
  {
    id: "fox-bros-bbq",
    name: "Fox Bros. Bar-B-Q",
    city: "atlanta",
    curators: ["isaac", "google"],
    cuisine: "barbecue",
    coords: [33.7616, -84.349],
    order: "Brisket, Brunswick stew, and the Frito pie.",
    why: "Texas-style smoke that made Atlanta take barbecue seriously.",
  },
  {
    id: "staplehouse",
    name: "Staplehouse",
    city: "atlanta",
    curators: ["isaac"],
    cuisine: "american",
    coords: [33.7546, -84.3717],
    order: "The tasting menu — the pâté is non-negotiable.",
    why: "A nonprofit fine-dining room that quietly became one of the South's best.",
  },
  {
    id: "antico-pizza",
    name: "Antico Pizza Napoletana",
    city: "atlanta",
    curators: ["google"],
    cuisine: "pizza",
    coords: [33.778, -84.4087],
    order: "A margherita from the wood oven at a communal table.",
    why: "Westside Neapolitan pizza in a cash-friendly, no-frills room.",
  },
  {
    id: "heirloom-market-bbq",
    name: "Heirloom Market BBQ",
    city: "atlanta",
    curators: ["bourdain"],
    cuisine: "barbecue",
    coords: [33.8665, -84.4474],
    order: "Korean-style pork and the spicy 'K-Town' ribs.",
    why: "Korean-Texan barbecue from a tiny roadside spot worth the detour.",
  },

  // ---- Copenhagen ----
  {
    id: "noma",
    name: "Noma",
    city: "cph",
    curators: ["google", "isaac"],
    cuisine: "nordic",
    coords: [55.6837, 12.61],
    order: "Whatever the season's menu is — book months ahead.",
    why: "The restaurant that rewrote modern fine dining around New Nordic ideas.",
  },
  {
    id: "geranium",
    name: "Geranium",
    city: "cph",
    curators: ["google"],
    cuisine: "nordic",
    coords: [55.7029, 12.5726],
    order: "The vegetable-forward tasting menu.",
    why: "Three Michelin stars looking out over Fælledparken.",
  },
  {
    id: "aamanns",
    name: "Aamanns",
    city: "cph",
    curators: ["isaac"],
    cuisine: "nordic",
    coords: [55.6869, 12.5719],
    order: "A board of smørrebrød — start with the pickled herring.",
    why: "Smørrebrød taken seriously: house-cured fish on dense rye.",
  },
  {
    id: "hart-bageri",
    name: "Hart Bageri",
    city: "cph",
    curators: ["google"],
    cuisine: "bakery",
    coords: [55.6786, 12.5443],
    order: "A cardamom bun and the country loaf.",
    why: "The bakery, from a Tartine alum, that set Copenhagen's pastry bar.",
  },
  {
    id: "johns-hotdog-deli",
    name: "John's Hotdog Deli",
    city: "cph",
    curators: ["bourdain"],
    cuisine: "street-food",
    coords: [55.676, 12.571],
    order: "A ristet pølse, dragged through the garden.",
    why: "The Danish hot dog done with real care — a true Copenhagen street snack.",
  },

  // ---- San Sebastián ----
  {
    id: "la-vina",
    name: "La Viña",
    city: "san-sebastian",
    curators: ["google", "isaac"],
    cuisine: "basque",
    coords: [43.3247, -1.9846],
    order: "The burnt Basque cheesecake, obviously.",
    why: "The Parte Vieja bar that invented the burnt cheesecake the world now copies.",
  },
  {
    id: "bar-nestor",
    name: "Bar Néstor",
    city: "san-sebastian",
    curators: ["bourdain", "isaac"],
    cuisine: "basque",
    coords: [43.3216, -1.987],
    order: "The txuleta steak, tomato salad, and one of the day's tortillas — arrive early.",
    why: "A tiny Old Town bar with one daily tortilla and a legendary steak.",
  },
  {
    id: "gandarias",
    name: "Gandarias",
    city: "san-sebastian",
    curators: ["google"],
    cuisine: "pintxos",
    coords: [43.3231, -1.9856],
    order: "A solomillo pintxo and a glass of txakoli.",
    why: "A dependable Parte Vieja bar for the pintxos classics.",
  },
  {
    id: "arzak",
    name: "Arzak",
    city: "san-sebastian",
    curators: ["bourdain", "google"],
    cuisine: "basque",
    coords: [43.3262, -1.9608],
    order: "The tasting menu — three generations of Basque haute cuisine.",
    why: "Juan Mari and Elena Arzak's three-star, a cornerstone of New Basque Cuisine.",
  },
  {
    id: "la-cuchara-de-san-telmo",
    name: "La Cuchara de San Telmo",
    city: "san-sebastian",
    curators: ["isaac", "bourdain"],
    cuisine: "pintxos",
    coords: [43.324, -1.9852],
    order: "Braised carrillera (beef cheek) and the seared foie.",
    why: "Hot, cooked-to-order pintxos off a chalkboard — no display case.",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Lookups + guards                                                            */
/* -------------------------------------------------------------------------- */

const cityMap = new Map(FOOD_MAP_CITIES.map((entry) => [entry.id, entry]));
const curatorMap = new Map(FOOD_MAP_CURATORS.map((entry) => [entry.id, entry]));
const cuisineMap = new Map(FOOD_MAP_CUISINES.map((entry) => [entry.id, entry]));
const placeMap = new Map(FOOD_MAP_PLACES.map((entry) => [entry.id, entry]));

export function isFoodMapCityId(
  value: string | null | undefined
): value is FoodMapCityId {
  return Boolean(value && cityMap.has(value as FoodMapCityId));
}

export function isFoodMapCuratorId(
  value: string | null | undefined
): value is FoodMapCuratorId {
  return Boolean(value && curatorMap.has(value as FoodMapCuratorId));
}

export function isFoodMapCuisineId(
  value: string | null | undefined
): value is FoodMapCuisineId {
  return Boolean(value && cuisineMap.has(value as FoodMapCuisineId));
}

export function isFoodMapPlaceId(value: string | null | undefined): boolean {
  return Boolean(value && placeMap.has(value));
}

export function getFoodMapCity(id: FoodMapCityId): FoodMapCity {
  return cityMap.get(id) ?? FOOD_MAP_CITIES[0];
}

export function getFoodMapCurator(id: FoodMapCuratorId): FoodMapCurator {
  return curatorMap.get(id) ?? FOOD_MAP_CURATORS[0];
}

export function getFoodMapCuisine(id: FoodMapCuisineId): FoodMapCuisine {
  return cuisineMap.get(id) ?? FOOD_MAP_CUISINES[0];
}

export function getFoodMapPlace(id: string): FoodMapPlace | undefined {
  return placeMap.get(id);
}

/** First curator drives a place's pin + card accent color. */
export function getPlaceAccent(place: FoodMapPlace): string {
  return getFoodMapCurator(place.curators[0]).accent;
}

/* -------------------------------------------------------------------------- */
/* Filtering + counts                                                          */
/* -------------------------------------------------------------------------- */

export interface FoodMapFilters {
  city: FoodMapCityId;
  curators: ReadonlyArray<FoodMapCuratorId>;
  cuisines: ReadonlyArray<FoodMapCuisineId>;
}

export function filterFoodMapPlaces(
  places: ReadonlyArray<FoodMapPlace>,
  filters: FoodMapFilters
): FoodMapPlace[] {
  return places.filter((place) => {
    if (place.city !== filters.city) {
      return false;
    }

    if (
      filters.curators.length > 0 &&
      !filters.curators.some((curator) => place.curators.includes(curator))
    ) {
      return false;
    }

    if (filters.cuisines.length > 0 && !filters.cuisines.includes(place.cuisine)) {
      return false;
    }

    return true;
  });
}

export function countPlacesByCity(
  places: ReadonlyArray<FoodMapPlace>
): Record<FoodMapCityId, number> {
  const counts = FOOD_MAP_CITIES.reduce<Record<FoodMapCityId, number>>(
    (acc, city) => {
      acc[city.id] = 0;
      return acc;
    },
    {} as Record<FoodMapCityId, number>
  );

  for (const place of places) {
    counts[place.city] = (counts[place.city] ?? 0) + 1;
  }

  return counts;
}

/** Cuisines actually present in a city, in canonical order — used to scope the
 *  cuisine filter chips to the selected city. */
export function getCuisinesForCity(
  cityId: FoodMapCityId
): FoodMapCuisine[] {
  const present = new Set(
    FOOD_MAP_PLACES.filter((place) => place.city === cityId).map(
      (place) => place.cuisine
    )
  );
  return FOOD_MAP_CUISINES.filter((cuisine) => present.has(cuisine.id));
}

/** Google Maps search link for a spot, resilient to a venue moving address. */
export function mapsLink(place: FoodMapPlace): string {
  const city = getFoodMapCity(place.city);
  const query = encodeURIComponent(`${place.name} ${city.name}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
