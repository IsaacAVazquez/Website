# Personal-Interest Tools

The browser-persisted lifestyle surfaces: `/travel`, `/wine-cellar`,
`/museum-log`, `/recipe-finder`, and `/food-map`. They have no server, no API,
and no snapshot pipeline — state lives in the user's browser. This doc captures
the shared pattern and the per-tool specifics so the next one is easy to add.

**Last updated:** 2026-06-16

---

## Two sub-patterns

These tools split into two shapes:

1. **User-authored stores** — the user *creates* the data (trips, wine bottles,
   museum visits). State is persisted to `localStorage` behind a versioned key
   and surfaced through a hook. No server ever sees it. → `/travel`,
   `/wine-cellar`, `/museum-log`.
2. **Curated catalog + light client state** — the *content* is shipped as a
   curated dataset; the browser only remembers small preferences. →
   `/recipe-finder` (curated recipes, persisted pantry), `/food-map` (curated
   places, in-memory + URL filters, nothing persisted).

---

## The user-authored store pattern

Each store is three files plus a hook:

| Piece | Example (`/travel`) | Role |
|------|---------------------|------|
| **Types** | `src/types/travel.ts` | Entity + summary shapes |
| **Pure helpers + storage key** | `src/lib/travelPlanner.ts` | `*_STORAGE_KEY`, `load/parse/save`, `create*` factories, validators, derived summaries — all framework-free and unit-testable |
| **Hook** | `src/hooks/useTravelPlanner.ts` | React binding that reads/writes the store and re-renders on change |

Conventions that hold across the stores:

- **Versioned keys** — `*_v1` suffix so a future shape change can migrate rather
  than corrupt (e.g. `travel_planner_trips_v1`).
- **Defensive parsing** — `load*`/`parse*` validate every field coming out of
  `localStorage` (type guards like `isIsoDate`, `clampString` length caps,
  array-shape checks) and fall back to an empty state on anything malformed.
  Never trust persisted JSON.
- **Ids** — `crypto.randomUUID()` when available, with a `Math.random` fallback,
  prefixed per entity (`trip-…`, `wine-…`).
- **SSR-safe** — every `window`/`localStorage` access is guarded
  (`typeof window === "undefined"`), so the hook returns an empty snapshot during
  server render and hydrates on the client.

Two hook flavors are in use, both valid:

- **`useSyncExternalStore` + cross-tab sync** (`useTravelPlanner`): a module-level
  listener set plus a `storage` event handler keeps multiple tabs consistent and
  gives React a stable external store. Prefer this for new stores.
- **`useState` + `useEffect`** (`useMuseumLog`): simpler, single-tab; fine for
  smaller surfaces.

---

## The tools

### `/travel` — trip planner *(the blueprint; most complex)*

- Files: `src/hooks/useTravelPlanner.ts`, `src/lib/travelPlanner.ts`,
  `src/types/travel.ts`; client `src/app/travel/travel-planner-client.tsx`.
- Key: `travel_planner_trips_v1`.
- Model: trips → day-bucketed activities (categories: transit/lodging/food/
  sight/activity/other) → per-trip journal entries (moods:
  amazing/good/neutral/rough/tired). Derived `TripSummary` via
  `calculateTripSummary`.
- Cross-tab sync via `useSyncExternalStore`. Offers the richest validation
  surface — copy it when building a new store.

### `/wine-cellar` — tasting log

- Files: `src/hooks/useWineCellar.ts`, `src/lib/wineCellar.ts`, `src/types/wine.ts`.
- Key: `wine_cellar_entries_v1`.
- Model: wine entries typed by `WineType` (red/white/rosé/sparkling/dessert/
  fortified/orange), 0.5–5 star ratings (`MIN_RATING`/`MAX_RATING`/`RATING_STEP`),
  with a derived `WineSummary` / per-type breakdown.

### `/museum-log` — visit tracker

- Files: `src/hooks/useMuseumLog.ts`, `src/types/museum.ts`; catalog
  `src/data/museumSnapshot.ts`.
- Key: `museum_log_user_state_v1`.
- Model: a curated museum catalog (snapshot) + the user's `visited` / `watchlist`
  / `liked` id lists persisted locally. Uses the `useState` + `useEffect` flavor.

### `/recipe-finder` — curated catalog + pantry

- Files: `src/lib/recipes.ts` (types, ingredient normalizer, match scoring),
  catalog `src/data/recipesSnapshot.ts`; client
  `src/app/recipe-finder/recipe-finder-client.tsx`.
- Persisted: the user's pantry only, under `recipe-finder:pantry:v1`. The recipe
  corpus is curated and read-only; the client scores recipes against the pantry
  (staple pantry items don't count against a "missing ingredients" score).

### `/food-map` — curated map *(no persistence)*

- Files: `src/app/food-map/food-map-data.ts` (curated places),
  `food-map-leaflet.tsx` + `leaflet.ts` (Leaflet map, lazy-loaded),
  `food-map-state.ts` (deep-link/filter state), `food-map-client.tsx`.
- Stores nothing in `localStorage`: search/filter state is in-memory and
  reflected in the URL. The odd one out — included here because it's a
  personal-interest surface, but it is a curated-data map, not a user store.

---

## Notes for contributors

- The same localStorage discipline powers non-lifestyle surfaces too —
  `useBudgetPlanner` (`budget_planner_months_v1`), `useInvestments`
  (`portfolio_holdings`), `useRetirementPlan` (`retirement_plan`), and the fantasy
  draft tracker — so improvements to the pattern can be shared.
- **Testing:** because there's no server state, cover the pure
  `src/lib/<tool>.ts` helpers (parse/validate/derive) with Jest; the hooks and
  clients are thin. Malformed-JSON and version-bump cases are the high-value
  tests.
- **Privacy:** nothing here leaves the browser. Keep it that way — don't add an
  API or analytics call that ships a user's trips/cellar/log off-device without a
  deliberate decision.
