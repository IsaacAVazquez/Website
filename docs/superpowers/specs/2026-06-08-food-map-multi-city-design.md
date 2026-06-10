# Food Map — Multi-City, Curator-Driven Redesign

**Date:** 2026-06-08
**Status:** Approved, in implementation
**Route:** `/food-map` (unchanged)

## Problem

`/food-map` is a polished but **Austin-only** Next.js surface built on a hand-drawn
**SVG** of Austin (abstract `x`/`y` coordinates, no geographic projection). A separate
effort (the Haas Tech Club site, commit `5a9459c`) built a **multi-city, curator-driven**
"Where to Eat" map on **real Leaflet** tiles — different cities (SF, NYC, New Orleans, LA,
Tokyo), attributed to curators (Anthony Bourdain, Isaac's Picks, Top-Rated on Google).

That commit targets a Vite + React Router app and cannot be cherry-picked into this Next.js
App Router project. This spec **merges the ideas natively** into the existing `/food-map`.

## Decisions (locked with the user)

1. **Merge** into the existing `/food-map` (not a new route, not a replace).
2. **Real Leaflet everywhere.** Replace the stylized Austin SVG with one OSM/Leaflet map
   for all cities. Austin becomes one city among six and gets real lat/lng.
3. **Uniform, simple filters:** City (single-select) + Curator (multi) + Cuisine (multi).
   Retire the neighborhood filter, the meal toggle, and the occasion shortlists.
   Neighborhood + price remain as **display-only** metadata on Austin cards.

## Data model — `food-map-data.ts` (rewrite)

```ts
type LatLng = [number, number];

interface FoodMapCity    { id; name; country; center: LatLng; zoom }   // austin, sf, nyc, nola, la, tokyo
interface FoodMapCurator { id; name; blurb; accent /* hex */ }         // bourdain, isaac, google
interface FoodMapCuisine { id; label }                                  // unified ~16-id taxonomy
interface FoodMapPlace {
  id; name;
  city: FoodMapCityId;            // NEW
  curators: FoodMapCuratorId[];   // NEW (>= 1)
  cuisine: FoodMapCuisineId;      // merged from Austin `cuisine` + Haas `category`
  coords: LatLng;                 // NEW real lat/lng (replaces x/y)
  order: string;                  // "what to get" (Austin `signature` / Haas `order`)
  why: string;                    // longer reason  (Austin `why` / Haas `blurb`)
  neighborhood?: string;          // Austin-only, display-only
  price?: "$" | "$$" | "$$$";     // Austin-only, display-only
}
```

- **Curators own the color system.** First curator drives a place's pin + card accent
  (replacing the old `neighborhood.accent`). Pin colors are hex (Leaflet markers are inline
  SVG): Bourdain = muted red, Isaac = amber, Google = green, tuned to the editorial feel.
- **Austin's 12 spots** keep cuisine/price/neighborhood/order/why, gain approximate real
  lat/lng + curator tags (all `isaac`; a few iconic ones also `google`).
- **22 travel spots** ported from the Haas data (SF/NYC/NOLA/LA/Tokyo) verbatim, remapped
  to the unified field names + cuisine taxonomy.
- Helpers: `getFoodMapCity`, `getFoodMapCurator`, `getFoodMapCuisine`, `getFoodMapPlace`,
  type guards `isFoodMapCityId` / `isFoodMapCuratorId` / `isFoodMapCuisineId` /
  `isFoodMapPlaceId`, `filterFoodMapPlaces`, `countPlacesByCity`, and `mapsLink(place)`
  (Google Maps search URL for the detail panel).
- The unified cuisine taxonomy merges Austin cuisines with travel categories; each of the
  34 spots maps to exactly one id (e.g. deli, steakhouse, sushi, ramen, cajun, italian,
  bakery, oysters, hot-chicken alongside the original barbecue/tacos/mexican/etc.).

## Map — two new files

- **`food-map/leaflet.ts`** — port the Haas dependency-free CDN loader (pinned Leaflet
  1.9.4, OSM tiles, no API key, cached promise, minimal typings, rejects on server / CDN
  failure). No npm dependency.
- **`food-map/food-map-leaflet.tsx`** — port `FoodMap.tsx`, restyled to `--home-*` /
  `tool-card`. Pins colored by first curator's accent; `fitBounds` to the visible spots;
  `flyTo` + open popup on active selection; **`setView` instead of `flyTo` under reduced
  motion**; graceful list fallback when the CDN can't load (loading + error states).

## State + URL — `food-map-state.ts` (rewrite)

| Old | New |
|---|---|
| `neighborhoods: []` | `city: FoodMapCityId` (single, **default `austin`**) |
| — | `curators: []` (multi) |
| `cuisines: []` | `cuisines: []` (kept) |
| `meal` | removed |
| `pick` | `pick` (kept) |

- URL: `?city=&curator=&cuisine=&pick=`, still normalized + deep-linkable. `city=austin`
  is the default and is omitted from the href.
- Mutators: `setCity`, `toggleCurator`, `toggleCuisine`, `setPick`, `resetFoodMapFilters`.
  Changing city/curator/cuisine clears `pick`.
- `filterFoodMapPlaces`: city (exact) → curators (any overlap) → cuisines (any overlap).

## UI + page

`food-map-client.tsx` (rewrite):
- Filters: **City selector** (single-select, flies the map) + **CuratorChips** (multi,
  color-coded) + **CuisineChips** (multi, scoped to cuisines present in the active city).
  Remove `MealSegmented`, `ShortlistsRail`, `SHORTLISTS`, `FoodMapSvg`,
  `NeighborhoodChips`.
- Sidebar default (no pick): **curator legend** — the three curators with blurbs + accent
  dots — which also explains the pin colors.
- `PlaceCard` / `PlaceDetail`: accent by first curator; show city + (Austin) neighborhood +
  price when present; detail shows curator attribution, the **order**, the **why**, and a
  **Google Maps link**.
- Stats: Cities (6) · Curators (3) · Cuisines · Curated stops (34) · Currently visible ·
  Active filters.

`page.tsx`: metadata/description/keywords/structured-data updated from "Austin restaurants"
to a multi-city curator-driven guide; `searchParams` type → `{ city, curator, cuisine, pick }`.
Route, nav, and sitemap unchanged.

## Tests

Rewrite all four files under `__tests__/` to the new model:
- `food-map-data.test.ts` — every spot has a known city/curator(s)/cuisine, valid lat/lng,
  filter behavior, per-city counts.
- `food-map-state.test.ts` — default = `{ city: "austin", curators: [], cuisines: [],
  pick: null }`, normalize/serialize round-trips, mutators clear pick.
- `food-map-client.test.tsx` — mock the Leaflet map component; assert filters write the URL,
  pick → detail panel, empty state. Default city Austin shows Austin spots.
- `page.test.tsx` — mock the map; one h1, no nested `main`, curator legend copy present.

## Risks

- Leaflet is client-only + CDN-loaded → covered by the existing loading/error fallback;
  jsdom tests **mock the map component** for determinism.
- **No global CSP** today (`next.config.mjs` `headers()` sets none; the `script-src 'none'`
  there is image-scoped for `dangerouslyAllowSVG`). If a global CSP is added later, allowlist
  `unpkg.com` (script/style) and `*.tile.openstreetmap.org` (img).

## Scope

2 new files, 4 rewritten source files, 4 rewritten test files. No new npm deps. No route,
nav, or sitemap changes.
