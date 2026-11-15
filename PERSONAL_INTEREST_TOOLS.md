# Personal-Interest Tools

The browser-persisted lifestyle surfaces: `/travel`, `/travel-deals`,
`/wine-cellar`, `/museum-log`, `/recipe-finder`, `/food-map`, and
`/blackjack-trainer`. They have no
server, no API, and no snapshot pipeline — state lives in the user's browser.
This doc captures the shared pattern and the per-tool specifics so the next one
is easy to add.

**Last updated:** 2026-11-10

---

## Two sub-patterns

These tools split into two shapes:

1. **User-authored stores** — the user *creates* the data (trips, wine bottles,
   museum visits). State is persisted to `localStorage` behind a versioned key
   and surfaced through a hook. No server ever sees it. → `/travel`,
   `/wine-cellar`, `/museum-log`.
2. **Curated catalog + light client state** — the *content* is shipped as a
   curated dataset; the browser only remembers small preferences. →
   `/recipe-finder` (curated recipes; persisted pantry, saved recipes, and meal
   plan), `/travel-deals` (curated fare bands and tactics; persisted trip setup),
   `/food-map` (curated places, in-memory + URL filters, persisted saved and
   visited flags and a note per place).

Three of the curated datasets, the museum catalog, the travel deal data, and
the food map, carry a verified flag set to `false` beside their review date
(`MUSEUM_SNAPSHOT_VERIFIED` with the catalog's `generatedAt`,
`TRAVEL_DEALS_VERIFIED` with `TRAVEL_DEALS_AS_OF`, and `FOOD_MAP_VERIFIED` with
`FOOD_MAP_AS_OF`). The weekly curated-data audit
(`scripts/auditCuratedData.ts`) fails any of them on age or structure, and the
museum catalog also on an exhibition that closed after its `generatedAt` date. The
recipe catalog carries neither a flag nor a date and is not audited.

---

## The user-authored store pattern

A store is three files (the museum log has no `src/lib` module and keeps its
decoder in the hook):

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
  array-shape checks). Stored text that does not parse into the expected shape
  falls back to an empty state, and a malformed entry is repaired or dropped
  field by field. The trip planner repairs a bad date to today so a stop is
  never deleted, while the cellar drops an entry with no name or an unknown wine
  type. Never trust persisted JSON.
- **Ids** — `crypto.randomUUID()` when available, with a `Math.random` fallback,
  prefixed per entity (`trip-…`, `act-…`, `jrn-…`, `wine-…`) by the shared
  `prefixedId` in `src/lib/utils.ts`.
- **SSR-safe** — every `window`/`localStorage` access is guarded
  (`typeof window === "undefined"`), so the hook returns an empty snapshot during
  server render and hydrates on the client.

Two hook patterns are in use, and both sit on the shared
`src/lib/browserStorage.ts` helper. It mirrors each write in memory, reports a
`memory-only` status when `localStorage` refuses a write, and keeps a listener
set per key plus one `storage` event handler. `useTravelPlanner` and
`useWineCellar` read their key through `useLocalStorageString`, which wraps
`useSyncExternalStore` around that helper to keep multiple tabs consistent and
give React a stable external store. I would use this pattern for new stores, and
`useBrowserRecord` packages it for one key and one parser, rereading the latest
save before each edit.

`useMuseumLog` uses `useState` and `useEffect`, subscribes to the shared browser
storage helper, and applies each edit to the latest validated save. It also
receives changes from other tabs and other hook instances in the same tab.

---

## The tools

### `/travel` — trip planner *(the blueprint; most complex)*

- Files: `src/hooks/useTravelPlanner.ts`, `src/lib/travelPlanner.ts`,
  `src/lib/travelExtras.ts` (activity costs and the calendar export),
  `src/types/travel.ts`; client `src/app/travel/travel-planner-client.tsx` with
  `itinerary.ts` (the timeline columns and the boarding pass).
- Key: `travel_planner_trips_v1`.
- Model: trips → day-bucketed activities, each with an optional planned cost
  (categories: transit/lodging/food/sight/activity/other) → per-trip journal
  entries (moods:
  amazing/good/neutral/rough/tired). Derived `TripSummary` via
  `calculateTripSummary`.
- Cross-tab sync via `useSyncExternalStore`. Offers the richest validation
  surface — copy it when building a new store.

### `/wine-cellar` — tasting log

- Files: `src/hooks/useWineCellar.ts`, `src/lib/wineCellar.ts`, `src/types/wine.ts`;
  client `src/app/wine-cellar/wine-cellar-client.tsx` with `wineRack.ts` (one
  rack row per region).
- Key: `wine_cellar_entries_v1`.
- Model: wine entries typed by `WineType` (red/white/rose/sparkling/dessert/
  fortified/orange), 0.5–5 star ratings (`MIN_RATING`/`MAX_RATING`/`RATING_STEP`),
  with a derived `WineSummary` / per-type breakdown.

### `/museum-log` — visit tracker

- Files: `src/hooks/useMuseumLog.ts`, `src/types/museum.ts`; catalog
  `src/data/museumSnapshot.ts`; client `src/app/museum-log/museum-log-client.tsx`.
- Key: `museum_log_user_state_v1`.
- Model: a curated museum catalog (snapshot) + the user's `visited` records (one
  per museum, with its date and an optional note) and `watchlist` / `liked` id
  lists persisted locally. Uses the `useState` + `useEffect` flavor.
  A visit's `rating` is optional, since a quick visit records only the museum
  and the date, and the validator still drops a visit whose rating is present
  and invalid. Logging a visit takes the museum off the watchlist.
- The view, the sort, the type and region filters, and the open museum or list
  live in the URL (`view`, `sort`, `type`, `region`, `museum`, `list`), read and
  written by `src/app/museum-log/museum-log-state.ts`.

### `/recipe-finder` — curated catalog + pantry

- Files: `src/lib/recipes.ts` (types, ingredient normalizer, match scoring),
  `src/lib/recipePlan.ts` (plan parser, the seven-date week, shopping list),
  catalog `src/data/recipesSnapshot.ts`; client
  `src/app/recipe-finder/recipe-finder-client.tsx` with `RecipeMealPlan.tsx` and
  `indexCard.ts` (each card's ingredient ticks, taken from the shared matcher).
- Persisted: the pantry under `recipe-finder:pantry:v1`, and saved recipe IDs and dated meals under `recipe-finder-plan-v1`. The recipe
  corpus is curated and read-only; the client scores recipes against the pantry
  (staple pantry items don't count against a "missing ingredients" score).

### `/travel-deals` — Travel Deal Lab *(curated catalog + pure engine + light state)*

- Files: `src/lib/travelDeals.ts` (pure engine), `src/types/travelDeals.ts`,
  curated dataset `src/data/travelDealsSnapshot.ts`; client
  `src/app/travel-deals/travel-deal-lab-client.tsx` with `fareGauge.ts` (the
  fare gauge and booking strip that `FareGaugeSignature.tsx` draws).
- Persisted: the trip setup (region, departure date, nights, travelers, budget),
  the quoted fare (clamped 0 to 100,000 on read), and the "applied" tactic ids,
  under `travel-deals:v1`. The points award inputs are ephemeral component
  state, and the field says so.
- The engine is framework-free and unit-tested (`src/lib/__tests__/travelDeals.test.ts`):
  booking-window timing, a fare deal-score against a typical band, cents-per-point
  award valuation, and a budget split. It reasons against curated fare bands and a
  points baseline that are tagged `TRAVEL_DEALS_VERIFIED = false` with a
  `TRAVEL_DEALS_AS_OF` date and disclosed on-page as estimates, following the
  curated-unverified convention. The tactics and recommended tools are a
  hand-authored playbook. A companion to the `/travel` planner, not a replacement.

### `/blackjack-trainer` — basic strategy trainer *(pure engine + one saved record)*

- Files: `src/lib/blackjack/` (`cards.ts`, `tableRules.ts`, `strategy.ts`, `round.ts`,
  `counting.ts`, `progress.ts`), `src/hooks/useBlackjackProgress.ts`; client
  `src/app/blackjack-trainer/blackjack-trainer-client.tsx` with `TableView`,
  `StrategyChartView`, `CountingView`, and `ProgressView` beside it.
- Key: `blackjack_trainer_progress_v1`, holding the graded decisions, the hand record in
  betting units, the thirty most repeated mistakes, the counting checks, and the chosen
  table. A reset clears the record and keeps the table.
- The engine is framework-free and unit-tested (`src/lib/blackjack/__tests__/`). A round is
  a pure state transition over a shoe that carries between rounds, the dealer peeks for
  blackjack, and results come back in units. `basicStrategyAction` is the one reader of the
  chart, and both the grader at the table and the printed chart call it.
- The chart is basic strategy for shoe games of four to eight decks where the dealer peeks,
  and every rule set in `tableRules.ts` stays inside that. Single-deck, double-deck, and
  no-hole-card games change a few plays, so adding one of those tables means adding its
  chart too. The page says this once, in its footer, next to the storage note.
- Ported on 2026-11-10 from the private `blackjack-mastery` repo, a Vite and React app. The
  port left out the named casino presets (their table rules were claims with no source),
  the house edge estimate, achievements, the session history charts, and export and import.

### `/food-map` — curated map with per-place records

- Files: `src/app/food-map/food-map-data.ts` (curated places),
  `food-map-leaflet.tsx` (the map) on the shared `src/lib/leaflet.ts` loader,
  which fetches Leaflet from a pinned CDN on demand,
  `food-map-state.ts` (deep-link/filter state), `food-map-client.tsx`.
- The city, curator, and cuisine filters and the selected place live in the URL
  (`city`, `curator`, `cuisine`, `pick`), and the search box text stays in memory.
- Each place can carry a saved flag, a visited flag, and a note, stored under
  `food-map-records-v1` through `useBrowserRecord` and validated by
  `parseFoodRecords` in `foodPersonal.ts`. Records for places that have left the
  catalog are kept, up to 200 of them. `RestaurantRecord.tsx` can also add a
  place to a trip in the travel planner's own store.

---

## Notes for contributors

- The same localStorage discipline powers non-lifestyle surfaces too —
  `useBudgetPlanner` (`budget_planner_months_v1`), `useInvestments`
  (`portfolio_holdings`), `useRetirementPlan` (`retirement_plan`), and the fantasy
  draft tracker — so improvements to the pattern can be shared.
- **Testing:** because there's no server state, cover the pure
  `src/lib/<tool>.ts` helpers (parse/validate/derive) with Jest; the hooks and
  clients are thin. Malformed-JSON and version-bump cases are the high-value
  tests. The three store hooks also have tests in `src/hooks/__tests__/`, which
  is where the museum log's decoder is covered, since it lives in the hook.
- **Privacy:** nothing here leaves the browser. Keep it that way — don't add an
  API or analytics call that ships a user's trips/cellar/log off-device without a
  deliberate decision.

## Changes on October 22, 2026

Travel activities now carry an optional planned cost in US dollars. A missing cost stays unknown when an older trip is restored, and zero means free. The spending summary counts priced and unpriced stops separately. Calendar export downloads an RFC 5545 file with the times as entered and no time zone. Untimed stops export as all-day events.

Recipe Finder saves favorite recipe IDs and dated meals separately from the pantry. Its shopping list groups missing ingredients for the selected seven calendar dates, keeps quantities per meal, and excludes pantry ingredients and recipe staples. The catalog's ingredient text does not support reliable conversion between units.

The other saved project workflows and their storage contracts are in `docs/PROJECT_TOOL_WORKFLOWS.md`.

## Changes on October 23, 2026

Wine Cellar now keeps owned quantities and a wishlist under `wine_cellar_inventory_v1`, alongside the existing tasting journal. Choosing Open bottle fills the tasting form. Saving the tasting reduces the latest quantity by one, while a depleted bottle leaves the form open with an explanation.

Museum Log reads saved trip dates from Travel Planner, finds selected exhibitions that overlap those dates, and writes a museum stop into the chosen itinerary. The visitor chooses the visit date. The stop keeps its cost unpriced and includes the museum's website and the catalog admission note. The new exhibition selections have a source URL and an October 23, 2026 check date, while the base catalog retains its own review date.
