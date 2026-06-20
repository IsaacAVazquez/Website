# Hooks & State — AI Context

Current hook inventory and state ownership.

**Last updated:** 2026-06-19

---

## Hook Inventory

| Hook | File | Main Use |
|------|------|----------|
| `useBudgetPlanner` | `src/hooks/useBudgetPlanner.ts` | Budget planner state and calculations |
| `useCompareTray` | `src/hooks/useCompareTray.ts` | Browser-local fantasy compare selection (up to 3 player ids), shared across the rankings board and draft assistant |
| `useDebounce` | `src/hooks/useDebounce.ts` | Debounced inputs |
| `useFantasySnapshot` | `src/hooks/useFantasySnapshot.ts` | Published fantasy snapshot loading |
| `useInvestments` | `src/hooks/useInvestments.ts` | Portfolio holdings + quote enrichment |
| `useLiveQuote` | `src/hooks/useLiveQuote.ts` | Current quote fetch state |
| `useLocalStorageString` | `src/hooks/useLocalStorageString.ts` | Low-level reactive single-key localStorage reader (`useSyncExternalStore`) shared by the fantasy queue/notes/compare hooks |
| `useMBAApplications` | `src/hooks/useMBAApplications.ts` | Browser-local application tracking for the MBA role tracker |
| `useMBAJobs` | `src/hooks/useMBAJobs.ts` | MBA job fetch state plus seen-job and watched-company persistence |
| `useMuseumLog` | `src/hooks/useMuseumLog.ts` | Browser-local museum visit state for `/museum-log` |
| `usePlayerNotes` | `src/hooks/usePlayerNotes.ts` | Browser-local fantasy per-player private notes (max 280 chars), shared across the rankings board and draft assistant |
| `usePlayerQueue` | `src/hooks/usePlayerQueue.ts` | Browser-local fantasy player queue / watchlist of player ids, shared across the rankings board and draft assistant |
| `useRetirementPlan` | `src/hooks/useRetirementPlan.ts` | Browser-local retirement plan inputs (localStorage key `retirement_plan`) |
| `useStockData` | `src/hooks/useStockData.ts` | Per-symbol research section data |
| `useTablistKeyboard` | `src/hooks/useTablistKeyboard.ts` | Roving keyboard navigation for horizontal tablists (WCAG 2.1) |
| `useTravelPlanner` | `src/hooks/useTravelPlanner.ts` | Browser-local trip, itinerary, and journal state for `/travel` |
| `useWineCellar` | `src/hooks/useWineCellar.ts` | Browser-local wine cellar state for `/wine-cellar` |

Hooks that no longer exist (do not reference as live): `useAllFantasyData`, `useOverallFantasyData`, `useUnifiedFantasyData`, `usePlayerImageCache`.

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

### `useStockData`

Owns:

- per-symbol research section fetches
- loading/error state
- short-lived caching
- section refetch logic

Used by the investments research panels.

### `useLiveQuote`

Owns current quote loading for UI that needs live quote enrichment separate from curated historical snapshot data.

### `useRetirementPlan`

Owns the browser-local retirement plan inputs consumed by `src/components/investments/retirement/*`. Mirrors the `useInvestments` localStorage pattern; the pure projection engine lives in `src/lib/retirement/` and is framework-free.

---

## Fantasy Football State

### `useFantasySnapshot`

The single client-side entry point for fantasy data. Loads the published snapshot JSON from `public/data/fantasy/` (cache-busted by `src/data/fantasySnapshotRevision.generated.ts`) and serves the rankings, tier, and draft-tracker surfaces. Not localStorage-backed.

### Shared cross-surface browser stores

The rankings board (`/fantasy-football`) and the draft assistant (`/fantasy-football/draft-tracker`) share three browser-local stores, all keyed by stable player ids so an action on one surface flags the player on the other. The hooks wire React state via `useLocalStorageString` (a generic `useSyncExternalStore` reader), with pure parse/serialize and key constants in `src/lib/fantasyLocal.ts`:

- `usePlayerQueue` — single watchlist of player ids (My Queue sidebar card, star toggles). Exposes `queue`, `isQueued`, `toggle`, `remove`, `reorder`, `clear`. Key `fantasy-player-queue-v1`.
- `usePlayerNotes` — short private notes keyed by player id (max 280 chars), edited in the `PlayerDetailDrawer` and folded into the draft assistant's CSV/recap exports. Exposes `getNote`, `hasNote`, `setNote`, `notedIds`, `maxLength`. Key `fantasy-player-notes-v1`.
- `useCompareTray` — compare selection of up to 3 player ids powering the docked `CompareTray` and `CompareModal`. Exposes `compareIds`, `inCompare`, `isFull`, `limit` (3), `toggle`, `remove`, `clear`. Key `fantasy-compare-v1`.

`useLocalStorageString` is not itself bound to a key — callers pass the key. Same-tab writes notify subscribers via an explicit `emitLocalStoreChange` call; cross-tab changes arrive through the window `storage` event.

### List density preference

The rankings client also keeps a List-view Comfortable/Compact density preference under key `fantasy-board-density`. It is implemented inline in `src/app/fantasy-football/fantasy-football-client.tsx` (its own `useSyncExternalStore` glue, not a separate hook file).

### Draft tracker state

`useDraftState` (`src/app/fantasy-football/draft-tracker/hooks/useDraftState.ts`) owns the draft assistant state machine (room settings, picks, teams, undo/redo, team names, export). It persists per-season under `fantasy-draft-tracker-v2-<season>` (e.g. `fantasy-draft-tracker-v2-2026`); the legacy unversioned key `fantasy-draft-tracker` is deleted (not migrated) on load.

---

## MBA Role Tracker State

### `useMBAJobs`

Owns job fetch state against `/api/mba-jobs`, plus browser-local persistence for seen job IDs and watched companies.

### `useMBAApplications`

Owns browser-local application status tracking layered onto the same surface.

---

## Personal Surface State

These hooks follow the same browser-local pattern (localStorage, no account):

- `useTravelPlanner` — trips, day-by-day itineraries, and journal entries for `/travel`
- `useWineCellar` — bottle inventory state for `/wine-cellar`
- `useMuseumLog` — visit log state for `/museum-log` (key `museum_log_user_state_v1`)
- `useBudgetPlanner` — client-side state and calculations for `/fintech-tools/budget-planner`

---

## General UI State

### `useDebounce`

Used in search-like UIs where input throttling matters:

- search controls
- investment symbol search
- similar interactive input flows

### `useTablistKeyboard`

Returns an `onKeyDown` handler for roving tablist keyboard navigation (ArrowLeft/Right wrap, Home/End jump, Enter/Space activate). Used by portfolio, writing archive, and investments research tab UIs.

---

## Practical Guidance

- for route ownership, check the page entry before assuming a hook is active
- for investments, the live state path starts with `InvestmentsClient`
- for fantasy football, verify the consuming page and API route before expanding hook docs
- for dashboard route-state behavior, check the colocated `*-state.ts` helper next to the route client
