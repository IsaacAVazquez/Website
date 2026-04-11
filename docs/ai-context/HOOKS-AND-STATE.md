# Hooks & State — AI Context

Current hook inventory and state ownership.

**Last updated:** 2026-04-10

---

## Hook Inventory

| Hook | File | Main Use |
|------|------|----------|
| `useDebounce` | `src/hooks/useDebounce.ts` | Debounced inputs |
| `useAllFantasyData` | `src/hooks/useAllFantasyData.ts` | Fantasy multi-position data |
| `useOverallFantasyData` | `src/hooks/useOverallFantasyData.ts` | Overall fantasy rankings |
| `useUnifiedFantasyData` | `src/hooks/useUnifiedFantasyData.ts` | Fantasy route data layer |
| `useFantasySnapshot` | `src/hooks/useFantasySnapshot.ts` | Published fantasy snapshot loading |
| `useInvestments` | `src/hooks/useInvestments.ts` | Portfolio holdings + quote enrichment |
| `useLiveQuote` | `src/hooks/useLiveQuote.ts` | Current quote fetch state |
| `useStockData` | `src/hooks/useStockData.ts` | Per-symbol research section data |
| `useBudgetPlanner` | `src/hooks/useBudgetPlanner.ts` | Budget planner state and calculations |
| `usePlayerImageCache` | `src/hooks/usePlayerImageCache.tsx` | Fantasy image caching context |

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

---

## Fantasy Football State

### `useUnifiedFantasyData`

Primary hook for the fantasy product surface.

Used for:

- rankings
- tier data
- loading/error state
- refresh behavior

### `useAllFantasyData` and `useOverallFantasyData`

Supplementary fantasy hooks used by specific ranking or aggregated flows.

### `useFantasySnapshot`

Loads the published fantasy snapshot JSON used by the public rankings and draft tracker surfaces.

### `usePlayerImageCache`

Context-based helper for cached player images on fantasy surfaces.

---

## General UI State

### `useDebounce`

Used in search-like UIs where input throttling matters:

- search controls
- investment symbol search
- similar interactive input flows

### `useBudgetPlanner`

Owns the client-side state and calculations for `/fintech-tools/budget-planner`.

---

## Practical Guidance

- for route ownership, check the page entry before assuming a hook is active
- for investments, the live state path starts with `InvestmentsClient`
- for fantasy football, verify the consuming page and API route before expanding hook docs
- for dashboard route-state behavior, check the colocated `*-state.ts` helper next to the route client
