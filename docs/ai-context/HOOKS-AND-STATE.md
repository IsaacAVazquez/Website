# Hooks & State — AI Context

Current hook inventory and state ownership.

**Last updated:** 2026-11-16

---

## Hook Inventory

| Hook | File | Main Use |
|------|------|----------|
| `useBestBallSnapshot` | `src/hooks/useBestBallSnapshot.ts` | Published best ball snapshot loading from `public/data/fantasy/best-ball.json` |
| `useBrowserRecord` | `src/hooks/useBrowserRecord.ts` | One browser-local JSON record per key, where each edit applies to the latest validated save, including one another tab wrote. The recipe finder's meal plan, the decision lab's saved bets, the enablement assistant's teams, and the transit commute preferences use it |
| `useBudgetPlanner` | `src/hooks/useBudgetPlanner.ts` | Browser-local budget planner state (`budget_planner_months_v1`) and calculations |
| `useCachedSnapshot` | `src/hooks/useCachedSnapshot.ts` | Loads the selected team's snapshot from a `/api/<league>/teams/[teamId]` route, keeps every answer so going back to a team never refetches, and retries a failed id the next time it is selected. The Premier League, La Liga, MLB, NBA, NFL, and World Cup clients use it |
| `useClientNow` | `src/hooks/useClientNow.ts` | Hydration-safe client-side timestamp state |
| `useCompareTray` | `src/hooks/useCompareTray.ts` | Browser-local fantasy compare selection (up to 3 player ids), read by the shared player drawer and the compare tray on the best ball board |
| `useDebounce` | `src/hooks/useDebounce.ts` | Debounced inputs |
| `useFantasyMyTeam` | `src/hooks/useFantasyMyTeam.ts` | Browser-local saved roster for My team on the weekly board and waivers (`fantasy-my-team-v1-<season>`) |
| `useFantasySnapshot` | `src/hooks/useFantasySnapshot.ts` | Published redraft fantasy snapshot loading |
| `useFantasyTradeCalculator` | `src/hooks/useFantasyTradeCalculator.ts` | Browser-local trade calculator player selections per format |
| `useFantasyWeeklySnapshot` | `src/hooks/useFantasyWeeklySnapshot.ts` | In-season weekly fantasy snapshot loading from `public/data/fantasy/weekly.json` |
| `useInvestments` | `src/hooks/useInvestments.ts` | Portfolio holdings + quote enrichment |
| `useIsClient` | `src/hooks/useIsClient.ts` | `false` during the server render and hydration and `true` after, for markup that has to match the server HTML first |
| `useKeyedRequest` | `src/hooks/useKeyedRequest.ts` | The request lifecycle `useLiveQuote` and `useStockData` share. A refetch on the same key keeps what is showing, a late response for a superseded key is dropped, and a null key resets |
| `useLiveQuote` | `src/hooks/useLiveQuote.ts` | Current quote fetch state |
| `useLocalStorageString` | `src/hooks/useLocalStorageString.ts` | Low-level reactive single-key localStorage reader (`useSyncExternalStore`) that most of the browser-local hooks here build on. The same file exports `useLocalStoragePersistenceStatus`, which reports whether a key's writes are durable or held only in the current tab |
| `useMBAApplications` | `src/hooks/useMBAApplications.ts` | Browser-local application tracking for the MBA role tracker |
| `useMBAJobCandidates` | `src/hooks/useMBAApplications.ts` | Sourced job candidate review and triage state with development-only sync |
| `useMBAJobs` | `src/hooks/useMBAJobs.ts` | MBA job fetch state plus seen-job and watched-company persistence |
| `useModal` | `src/hooks/useModal.ts` | Modal behavior for a panel that is not a native `<dialog>`. While open it moves focus into the panel, keeps Tab inside it, closes on Escape, and stops the page scrolling unless `lockScroll` is false, and on close it returns focus to the opener. The drawers on the sports, SpaceX, score pools, AI dev tools, and fantasy pages, the compare modal, the header search, and the job search edit dialog use it |
| `useMountOnFirstOpen` | `src/hooks/useMountOnFirstOpen.ts` | Deferred mounting helper for modals and drawers |
| `useMuseumLog` | `src/hooks/useMuseumLog.ts` | Browser-local museum visit state for `/museum-log` |
| `usePlayerNotes` | `src/hooks/usePlayerNotes.ts` | Browser-local fantasy per-player private notes (max 280 chars), edited in the rankings board's drawer and the shared player drawer |
| `usePlayerQueue` | `src/hooks/usePlayerQueue.ts` | Browser-local fantasy player queue / watchlist of player ids, shared across the rankings board, the redraft room, and the shared player drawer |
| `useReducedMotion` | `src/hooks/useReducedMotion.ts` | Whether the viewer asked for reduced motion, `false` on the server and during hydration, for motion that JavaScript drives, such as D3 transitions and smooth scrolling |
| `useRentVsBuy` | `src/hooks/useRentVsBuy.ts` | Browser-local rent vs. buy inputs (`rent_vs_buy_input_v1`) and the month-by-month net-worth comparison from `src/lib/rentVsBuy/` |
| `useRetirementPlan` | `src/hooks/useRetirementPlan.ts` | Browser-local retirement plan inputs (localStorage key `retirement_plan`) |
| `useRouteSync` | `src/hooks/useRouteSync.ts` | Keeps a dashboard's URL on the state it renders with a scroll-free `router.replace`, and returns a push for user navigation that skips the address already in the bar |
| `useScorePools` | `src/hooks/useScorePools.ts` | Browser-local score pools store (`score_pools_store_v1`), meaning the pools, picks, rivals, fixture flags, and manually entered odds and results. The scoring math lives in `src/lib/scorePools/` |
| `useStockData` | `src/hooks/useStockData.ts` | Per-symbol research section data |
| `useTablistKeyboard` | `src/hooks/useTablistKeyboard.ts` | Roving keyboard navigation for horizontal tablists (WCAG 2.1) |
| `useTravelPlanner` | `src/hooks/useTravelPlanner.ts` | Browser-local trip, itinerary, and journal state for `/travel` |
| `useWineCellar` | `src/hooks/useWineCellar.ts` | Browser-local wine cellar state for `/wine-cellar` |
| `useBlackjackProgress` | `src/hooks/useBlackjackProgress.ts` | Browser-local decision, hand, and counting record for `/blackjack-trainer` |

Hooks that no longer exist (do not reference as live): `useAllFantasyData`, `useOverallFantasyData`, `useUnifiedFantasyData`, `usePlayerImageCache`.

Two shared hooks live outside `src/hooks/`, beside the components that use them. `useKeepPressedInView` (`src/components/football/useKeepPressedInView.ts`) keeps the pressed pill of a sideways view switch on screen on the league, MLB, NBA, NFL, GitHub Trending Pulse, and Decision Lab pages, and `useFirstRowCount` (`src/components/fantasy/useFirstRowCount.ts`) counts the stickers on the first row of a draft room's last picks strip for `DraftRoomParts`. The draft room hooks are under Draft tracker state below.

---

## Investments State

### `useInvestments`

Owns:

- local holdings
- enhanced holdings with quote data
- portfolio summary
- snapshot history
- CRUD methods for holdings

Important note:

- browser-local state is central to the portfolio experience
- the keys are `portfolio_holdings`, `portfolio_snapshots` (one entry per date, capped at 365), and `portfolio_quotes_cache` (a five-minute quote cache)
- `/investments/before-you-buy` reads the saved holdings through the exported `loadHoldings` and keeps its own edited copy under `before-you-buy-portfolio-v1` (`src/lib/beforeYouBuy.ts`), so it never writes the portfolio

### `useStockData`

Owns:

- per-symbol research section fetches
- loading/error state
- short-lived caching
- section refetch logic

Used by the investments research panels. It reads the static `public/data/investments/<SYMBOL>/snapshot.json` through `src/lib/investmentsClientData.ts`, which caches each answer for five minutes, so no research API route sits in between.

### `useLiveQuote`

Owns current quote loading for UI that needs live quote enrichment separate from curated historical snapshot data. It asks `/api/investments/quotes` for one symbol, reuses an answer for a minute, and checks again every minute and on focus while the tab is visible. `ResearchAssetHeader` is its one caller.

### `useRetirementPlan`

Owns the browser-local retirement plan inputs consumed by `src/components/investments/retirement/*`. Mirrors the `useInvestments` localStorage pattern; the pure projection engine lives in `src/lib/retirement/` and is framework-free.

---

## Fantasy Football State

### `useFantasySnapshot`

The single client-side entry point for the redraft snapshot. Best ball and the weekly board load through `useBestBallSnapshot` and `useFantasyWeeklySnapshot` instead. Loads `public/data/fantasy/<scoring>.json` (cache-busted by `src/data/fantasySnapshotRevision.generated.ts`), falls back to `/api/fantasy-data` when the static file fails, and serves the rankings board, the redraft room, the mock draft, and the trade calculator. Not localStorage-backed.

### Shared cross-surface browser stores

The fantasy pages share three browser-local stores, all keyed by stable player ids so an action on one surface flags the player on the others. The hooks wire React state via `useLocalStorageString` (a generic `useSyncExternalStore` reader), with pure parse/serialize and key constants in `src/lib/fantasyLocal.ts`:

- `usePlayerQueue` is the single watchlist of player ids (the star on a rankings row and on a redraft room row, the queued filter on the rankings board, the queue line over the redraft room's board, and the queue toggle in both drawers). It exposes `queue`, `queuedSet`, `isQueued`, `toggle`, `remove`, `reorder`, `clear`, and `persistenceStatus`, under the key `fantasy-player-queue-v1`.
- `usePlayerNotes` holds short private notes keyed by player id (max 280 chars), edited in the rankings board's drawer and in `PlayerDetailDrawer`, and folded into the draft assistant's exports. It exposes `notes`, `notedIds`, `getNote`, `hasNote`, `setNote`, `maxLength`, and `persistenceStatus`, under the key `fantasy-player-notes-v1`.
- `useCompareTray` holds a compare selection of up to 3 player ids behind the Compare control in `PlayerDetailDrawer` and the `CompareTray` and `CompareModal` on the best ball board. Both draft rooms turn the drawer's Compare control off, since neither renders a tray. It exposes `compareIds`, `compareSet`, `inCompare`, `isFull`, `limit` (3), `toggle`, `remove`, `clear`, `replace`, and `persistenceStatus`, under the key `fantasy-compare-v1`.

`useLocalStorageString` is not itself bound to a key, so callers pass the key. A same-tab write through the `src/lib/browserStorage.ts` helpers notifies subscribers itself, and the three stores above also call `emitBrowserStorageChange` from that file after each write. Cross-tab changes arrive through the window `storage` event.

### Draft tracker state

`useDraftState` (`src/app/fantasy-football/draft-tracker/hooks/useDraftState.ts`) owns the draft assistant state machine (room settings, exact starting lineup, picks, teams, undo/redo, team names, export). It persists per-season under `fantasy-draft-tracker-v3-<season>` (e.g. `fantasy-draft-tracker-v3-2026`). A current-season v2 draft is migrated with the default one-QB lineup, while the legacy unversioned key `fantasy-draft-tracker` is deleted on load. Both redraft (`useDraftState`) and best ball (`use-best-ball-draft.ts`) draft trackers save synchronously, subscribe to cross-tab storage changes, and use revision tracking to reject stale external overwrites while preserving unsaved picks with a warning.

The best ball room saves under `fantasy-best-ball-draft-v1-<season>-<contestId>`. The redraft room also keeps per-turn recommendation telemetry under `fantasy-draft-telemetry-v2-<draftId>` (`useDraftTelemetry`, beside `useDraftState`) and named league presets under `fantasy-draft-presets-v1` (`src/lib/draftPresets.ts`, read and written by `DraftSetup`), and its pick clock (`useDraftTimer`) keeps no saved state. The mock draft saves its room under `fantasy-mock-draft-v1-<season>` through `src/app/fantasy-football/mock-draft/hooks/useMockDraftState.ts`.

### Trade calculator state

`useFantasyTradeCalculator` (`src/hooks/useFantasyTradeCalculator.ts`) owns the two ordered player-ID lists for `/fantasy-football/trade-calculator`. It persists per season and scoring format under `fantasy-trade-calculator-v1-<season>-<scoring>`, caps each side at six players, prevents a player from appearing twice, and reacts to same-tab and cross-tab changes through the shared browser-storage helpers. Scoring, team count, roster size, and lineup preset live in the URL, so changing scoring selects a separate saved trade without copying a calculated result across models.

---

## MBA Role Tracker State

### `useMBAJobs`

Owns job fetch state against `/api/mba-jobs`, plus browser-local persistence for seen job IDs (`mba_seen_job_ids_v1`) and watched companies (`mba_watched_companies_v2`).

### `useMBAApplications`

Owns browser-local application status tracking layered onto the same surface (key `mba_applications_v1`), tracking stages (`saved`, `applied`, `interviewing`, `offer`, `rejected`, `archived`), priorities (`low`, `medium`, `high`), fit readings (`MBAFitAssessment`, an integer score from 0 to 100 with a rationale), and interview rounds (`MBAInterviewRound`, with a label, a date, an outcome of `scheduled`, `done`, `passed`, or `failed`, and notes). When `npm run dev` started the server, it also syncs localStorage with `private/job-search/pipeline.json` through `/api/job-search` (pull on focus and every 30 s, push after a local edit, newer `updatedAt` wins) and exposes that as `privateSync`, which is `null` in production and in a dev server started any other way.

### `useMBAJobCandidates`

Owns sourced role candidates review and triage state (`MBAJobCandidate`, whose `triage` is an `MBACandidateTriage` of `sourced`, `reviewed`, or `dismissed`) in `src/hooks/useMBAApplications.ts`. It keeps no localStorage copy. When `npm run dev` started the server, it reads and writes `private/job-search/candidates.json` via `/api/job-search`, and it reports `enabled: false` in production and in a dev server started any other way. See `docs/JOB_SEARCH_PRIVATE_DATA.md`.

---

## Personal Surface State

These hooks follow the same browser-local pattern (localStorage, no account) and subscribe to browser storage events to merge edits against the latest validated save, eliminating multi-tab data loss:

- `useTravelPlanner` keeps trips, day-by-day itineraries, and journal entries for `/travel` (key `travel_planner_trips_v1`)
- `useWineCellar` keeps the bottle inventory for `/wine-cellar` (key `wine_cellar_entries_v1`)
- `useBlackjackProgress` keeps graded decisions, hand results, and the chosen table for `/blackjack-trainer` (key `blackjack_trainer_progress_v1`)
- `useMuseumLog` keeps the visit log for `/museum-log` (key `museum_log_user_state_v1`)
- `useBudgetPlanner` keeps the monthly budgets for `/fintech-tools/budget-planner` and computes the active month's summary (key `budget_planner_months_v1`)
- `useRentVsBuy` keeps the inputs for `/fintech-tools/rent-vs-buy` (key `rent_vs_buy_input_v1`)

`/recipe-finder` keeps its meal plan through the generic `useBrowserRecord` and its pantry through `useLocalStorageString` directly, and `/food-map` keeps a saved flag, a visited flag, and a note per place through `useBrowserRecord` under `food-map-records-v1`.

The recipe finder's keys are `recipe-finder-plan-v1` for the meal plan and `recipe-finder:pantry:v1` for the pantry, and `useBrowserRecord` also keeps the decision lab's saved bets under `decision-lab-bets-v1`, the enablement assistant's teams under `enablement-teams-v1`, and the Bay Area transit commute under `bay-area-transit-commute-v1`. Three routes keep browser state through `useLocalStorageString` or the `src/lib/browserStorage.ts` helpers directly, with no hook of their own, which are `/travel-deals` (`travel-deals:v1`), `/fantasy-formula-1` (one lineup per season under `fantasy-formula-1-lineup-v1-<season>`), and `/arcade` (its high score, `arcade-reactor-hiscore-v1`).

The site-wide easter eggs keep three more. `Catalog97EasterEggs` counts footer stamps under `c97-stamps-v1`, the 1997 guestbook keeps up to 12 entries under `site-1997-guestbook-v1`, and `VisitLedger` keeps the receipt's visit list in this tab's session storage under `site-visit-receipt-v1`.

---

## General UI State

### `useDebounce`

Used in search-like UIs where input throttling matters:

- search controls
- investment symbol search
- similar interactive input flows

### `useTablistKeyboard`

Returns an `onKeyDown` handler for roving tablist keyboard navigation (ArrowLeft/Right wrap, Home/End jump, Enter/Space activate). Used by the investments research tabs (`ResearchWorkspace`), the football `SegmentedTabs` on the Premier League, La Liga, MLB, NBA, and NFL pages, and the view tabs on golf, Earthquake Pulse, the World Cup, and SpaceX Mission Control. The portfolio and writing archive stopped using it on 2026-08-05, when those routes moved to Catalog 97.

---

## Practical Guidance

- for route ownership, check the page entry before assuming a hook is active
- for investments, the live state path starts with `InvestmentsClient`
- for fantasy football, verify the consuming page and API route before expanding hook docs
- for dashboard route-state behavior, check the colocated `*-state.ts` helper next to the route client, which is `*-state.core.ts` on La Liga, MLB, NBA, and NFL
