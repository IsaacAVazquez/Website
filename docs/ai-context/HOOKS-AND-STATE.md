# Hooks & State — AI Context

Current hook inventory and state ownership.

**Last updated:** 2026-03-17

---

## Hook Inventory

| Hook | File | Main Use |
|------|------|----------|
| `useDebounce` | `src/hooks/useDebounce.ts` | Debounced inputs |
| `useAllFantasyData` | `src/hooks/useAllFantasyData.ts` | Fantasy multi-position data |
| `useOverallFantasyData` | `src/hooks/useOverallFantasyData.ts` | Overall fantasy rankings |
| `useUnifiedFantasyData` | `src/hooks/useUnifiedFantasyData.ts` | Fantasy route data layer |
| `useInvestments` | `src/hooks/useInvestments.ts` | Portfolio holdings + quote enrichment |
| `useStockData` | `src/hooks/useStockData.ts` | Per-symbol research section data |
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

### `usePlayerImageCache`

Context-based helper for cached player images on fantasy surfaces.

---

## General UI State

### `useDebounce`

Used in search-like UIs where input throttling matters:

- search controls
- investment symbol search
- similar interactive input flows

---

## Practical Guidance

- for route ownership, check the page entry before assuming a hook is active
- for investments, the live state path starts with `InvestmentsClient`
- for fantasy football, verify the consuming page and API route before expanding hook docs
