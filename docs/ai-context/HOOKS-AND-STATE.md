# Hooks & State Management — AI Context Reference

> Every custom hook with signatures, return types, caching strategy, and consumer components.

---

## Hook Inventory

| Hook | File | Purpose | Client? |
|------|------|---------|---------|
| `useDebounce` | `src/hooks/useDebounce.ts` | Debounce any value | No |
| `useAllFantasyData` | `src/hooks/useAllFantasyData.ts` | All positions fantasy data | No |
| `useOverallFantasyData` | `src/hooks/useOverallFantasyData.ts` | Cross-position overall rankings | No |
| `useUnifiedFantasyData` | `src/hooks/useUnifiedFantasyData.ts` | Unified API with tier calculation | No |
| `useInvestments` | `src/hooks/useInvestments.ts` | Portfolio CRUD + live quotes | Yes |
| `useStockData` | `src/hooks/useStockData.ts` | Single stock section data | Yes |
| `usePlayerImageCache` | `src/hooks/usePlayerImageCache.tsx` | Player headshot caching (Context) | Yes |

---

## useDebounce

**File:** `src/hooks/useDebounce.ts`

```typescript
function useDebounce<T>(value: T, delay: number): T
```

Simple debounce. Returns `value` after `delay` ms of inactivity. Used for search input filtering.

**State:** `debouncedValue: T`
**Side effects:** `setTimeout` / `clearTimeout`
**Consumers:** `SearchInterface`, `StockSearch`, `AddStockForm`

---

## useAllFantasyData

**File:** `src/hooks/useAllFantasyData.ts`

```typescript
function useAllFantasyData(options: {
  scoringFormat: ScoringFormat;
  autoRefresh?: boolean;        // default: true
  refreshInterval?: number;     // default: 10 minutes
}): {
  players: Player[];
  isLoading: boolean;
  error: string | null;
  dataSource: 'cache' | 'api' | 'sample';
  cacheStatus: CacheStatus;     // 'fresh' | 'stale' | 'missing'
  lastUpdated: string;
  refresh: () => Promise<void>; // force refresh
  clearCache: () => void;
  getCacheInfo: () => { status, message, color };
}
```

**Data flow:** Cache check → API (`/api/fantasy-data?position=X&scoring=Y`) → Sample data fallback. Fetches all 6 positions (QB, RB, WR, TE, K, DST) sequentially, sorts by `averageRank`.

**Key features:**
- Request deduplication via `activeRequests` Map
- Cache-first strategy using `dataCache` (client localStorage)
- Auto-refresh interval with `setTimeout` (checks if any position needs refresh)
- Ref-based scoring format tracking to prevent infinite loops

**Consumers:** Fantasy tier charts, draft tracker

---

## useOverallFantasyData

**File:** `src/hooks/useOverallFantasyData.ts`

```typescript
function useOverallFantasyData(options: {
  scoringFormat: ScoringFormat;
  autoRefresh?: boolean;
  refreshInterval?: number;
}): {
  players: Player[];
  isLoading: boolean;
  error: string | null;
  dataSource: 'cache' | 'api' | 'sample';
  cacheStatus: CacheStatus;
  lastUpdated: string;
  refresh: () => Promise<void>;
  clearCache: () => void;
  getCacheInfo: () => { status, message, color };
}
```

**Data flow:** Dynamic import of pre-built overall data files based on scoring format:
- PPR → `@/data/overallDataPPR`
- STD → `@/data/overallDataStandard`
- HALF → `@/data/overallData`

Falls back to API (`/api/fantasy-data?position=OVERALL`) then sample data. Same interface as `useAllFantasyData`.

**Consumers:** Overall rankings page

---

## useUnifiedFantasyData

**File:** `src/hooks/useUnifiedFantasyData.ts`

```typescript
function useUnifiedFantasyData(options: {
  position?: Position;
  scoringFormat: ScoringFormat;
  autoRefresh?: boolean;
  refreshInterval?: number;
  withTiers?: boolean;
  preferredMethod?: 'api' | 'free' | 'session' | 'auto';
  enhancedData?: boolean;
}): {
  players: Player[];
  tierData: TierData | null;      // { position, players, tierBreaks, totalTiers, algorithm, metadata }
  isLoading: boolean;
  error: string | null;
  dataSource: string;
  lastUpdated: string;
  executionTime: number;
  cacheHit: boolean;
  refresh: () => Promise<void>;
  clearCache: () => void;
  positionStats: Record<string, number>;
}
```

**Most flexible hook.** Supports tier calculation, method selection, and enhanced data mode.

**TierData shape:**
```typescript
interface TierData {
  position: Position;
  scoringFormat: ScoringFormat;
  players: Player[];
  tierBreaks: number[];
  totalTiers: number;
  algorithm: string;
  metadata: { timestamp, dataSource, playerCount, executionTimeMs, cacheHit };
}
```

**Consumers:** Fantasy football landing page, position tier pages

---

## useInvestments

**File:** `src/hooks/useInvestments.ts` (client component)

```typescript
function useInvestments(): {
  holdings: PortfolioHolding[];
  enhancedHoldings: EnhancedHolding[];  // holdings + live price data
  summary: PortfolioSummary;            // totals, gain/loss, day change
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  snapshots: PortfolioSnapshot[];       // daily portfolio history
  addHolding: (holding: PortfolioHolding) => void;
  updateHolding: (symbol: string, updates: Partial<PortfolioHolding>) => void;
  removeHolding: (symbol: string) => void;
  refetch: () => void;
}
```

**Storage:** `localStorage` with keys `portfolio_holdings` and `portfolio_snapshots`.

**Data flow:**
1. Hydrate holdings from localStorage on mount
2. Fetch live quotes via `/api/investments/quotes?symbols=...` (with retry up to 2x)
3. Build `EnhancedHolding[]` (current price, gain/loss, allocation %)
4. Record daily snapshot (one per day, max 365)

**CRUD operations:** `addHolding` merges duplicate symbols (weighted-average cost, sum shares). All mutations persist to localStorage immediately.

**EnhancedHolding adds:** `currentPrice`, `currentValue`, `totalCost`, `gainLoss`, `gainLossPercent`, `dayChange`, `dayChangePercent`, `allocationPercent`, `name`, `isLoading`, `error`.

**Consumers:** `PortfolioTracker`, `PortfolioSummary`, `AllocationChart`, `PortfolioPerformanceChart`

---

## useStockData

**File:** `src/hooks/useStockData.ts` (client component)

```typescript
function useStockData<T>(
  symbol: string | null,
  section: InvestmentSection | string
): {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isNotFetched: boolean;  // true if 404/503 (data not yet fetched by update script)
  lastUpdated: number | null;
  refetch: () => void;
}
```

**Generic hook** — type parameter `T` matches the section's response shape.

**Caching:**
- In-memory Map cache: `${symbol}:${section}` → `{ data, timestamp }`
- TTL: 5 minutes
- Request deduplication via `inflight` Map

**Retry:** Up to 2 retries with exponential backoff (1s, 2s). Only retries 5xx errors, not 4xx.

**Consumers:** All `StockResearch` panels — `DCFPanel`, `FundamentalsPanel`, `GrowthPanel`, `ValuationRatiosPanel`, `ProfitabilityPanel`, `NewsPanel`, `IndustryPanel`, `FinancialStatementsPanel`, `PriceChartPanel`

---

## usePlayerImageCache (Context Provider)

**File:** `src/hooks/usePlayerImageCache.tsx` (client component)

Provides a React Context for player headshot images with caching.

```typescript
// Context value
interface ImageCacheContextValue {
  getPlayerImage: (player: Player) => Promise<string | null>;
  preloadImages: (players: Player[]) => Promise<void>;
  getCachedImage: (playerKey: string) => string | null;
  clearCache: () => void;
  isLoading: (playerKey: string) => boolean;
  cacheStats: { size: number; hitRate: number; memoryUsage: number };
}
```

**Provider:** `<PlayerImageCacheProvider>` wraps fantasy football pages.

**Cache config:**
- Max entries: 200
- Max age: 24 hours
- Storage: `localStorage` key `player-image-cache`
- Preload batch size: 3 concurrent
- Memory limit: 25MB

**Position priority for preloading:** QB > RB > WR > TE > K > DST

**Consumers:** `LazyPlayerImage`, `EnhancedPlayerCard`, fantasy football components

---

## Context Providers

### Providers (`src/components/Providers.tsx`)
Root-level provider wrapping `<ThemeProvider>`. Applied in `src/app/layout.tsx`.

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

### ThemeProvider (`src/components/ThemeProvider.tsx`)
Thin wrapper around `next-themes`'s `NextThemesProvider`. Client component.

### AdminProviders (`src/app/admin/AdminProviders.tsx`)
Wraps admin routes with NextAuth `<SessionProvider>`. Applied in `src/app/admin/layout.tsx`.

---

## State Architecture Summary

```
Global (Context):
├── ThemeProvider (next-themes) — dark/light mode
└── PlayerImageCacheProvider — headshot caching

Per-Page State (Hooks):
├── Fantasy Football
│   ├── useAllFantasyData — all positions, cache-first
│   ├── useOverallFantasyData — cross-position rankings
│   └── useUnifiedFantasyData — flexible with tier calc
├── Investments
│   ├── useInvestments — portfolio CRUD + live quotes
│   └── useStockData<T> — per-section research data
└── Utility
    └── useDebounce — input debouncing

Admin:
└── SessionProvider (NextAuth) — JWT session
```

**No global state management library** (no Redux, Zustand, etc.). All state is either:
1. React Context (theme, image cache, auth session)
2. Per-component via hooks (data fetching + local state)
3. Browser localStorage (portfolio holdings, data cache, image cache)
