# Data Pipeline — AI Context Reference

> How data flows from external sources through processing, caching, and storage to components.

---

## Fantasy Football Data Flow

```
FantasyPros API ─┐
                 ├─→ UnifiedFantasyProsAPI ─→ Tier Calculator ─→ UnifiedCache (server) ─→ API Routes ─→ Hooks ─→ Components
FantasyPros Session ┤                                                                          ↕
FantasyPros Free ───┘                                              SQLite DB ←──── DataManager    DataCache (client)
                                                                      ↑
Sample Data (fallback) ─────────────────────────────────────────────────┘
```

### Data Sources (Fallback Chain)

Sources are tried in order. If one fails, the next is used automatically.

| Priority | Source | File | Auth Required | Notes |
|----------|--------|------|---------------|-------|
| 1 | FantasyPros Official API | `src/lib/fantasyProsAPI.ts` | `FANTASYPROS_API_KEY` | Endpoint: `https://api.fantasypros.com/public/v2/json/nfl` |
| 2 | FantasyPros Session Scraping | `src/lib/fantasyProsSession.ts` | `FANTASYPROS_USERNAME` + `FANTASYPROS_PASSWORD` | Two-step auth: CSRF token → POST credentials. Scrapes HTML cheatsheets. |
| 3 | FantasyPros Free | `src/lib/fantasyProsAlternative.ts` | None | Public endpoints, lower reliability |
| 4 | Sample Data | Embedded in API routes | None | Static fallback data by position |

### Unified API Gateway

**File:** `src/lib/unifiedFantasyProsAPI.ts`

Routes requests through the fallback chain with built-in caching.

```typescript
// Key methods
fetchPlayersData(position: Position, scoringFormat: ScoringFormat, options?) → Player[]
fetchAllPositions(scoringFormat: ScoringFormat) → Record<Position, Player[]>  // parallel fetch
fetchOverallRankings(scoringFormat: ScoringFormat) → Player[]  // weighted cross-position
fetchEnhancedPlayerData() → EnhancedPlayer[]  // players + projections + auction values
```

- 15-minute in-memory request cache (prevents duplicate API calls)
- 10s default timeout per request
- Concurrent position fetching via `Promise.all` for all 6 positions

### Player Data Shape

```typescript
interface Player {
  player_id: string;
  player_name: string;
  team: string;
  position: Position;  // 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST' | 'FLEX' | 'OVERALL'
  rank_ecr: number;    // expert consensus rank
  rank_ave: number;    // average rank
  rank_std: number;    // standard deviation
  tier: number;
  bye_week?: number;
  injury_status?: string;
  expert_ranks?: number[];  // individual expert rankings
}
```

---

## Tier Calculation

**Primary file:** `src/lib/unifiedTierCalculator.ts`

Three algorithms with fallback chain:

### 1. Gaussian Mixture Model (Primary)
**File:** `src/lib/gaussianMixture.ts`

- EM algorithm: Expectation step (responsibilities) → Maximization step (parameter updates)
- Clusters players into 6 tiers based on rank distribution
- 10-minute cache per unique player set

### 2. Value-Drop Method (Fallback 1)
**File:** `src/lib/clustering.ts`

```
value = 100 / √rank × position_multiplier × scoring_multiplier
```
Finds largest value drops between consecutive players → tier breaks at biggest drops.

### 3. Rank Gap Method (Fallback 2)
New tier when player rank gap > 3 positions. Simplest, always works.

### Tier Output

10 tier labels: Elite → RB1/WR1 → ... → Bench. Cyberpunk-themed colors:
```
Tier 1: Red    | Tier 2: Amber  | Tier 3: Green
Tier 4: Cyan   | Tier 5: Purple | Tier 6+: Slate
```

Each tier includes: `minRank`, `maxRank`, `avgRank`, `avgValue`.

---

## Overall Rankings (Cross-Position)

**File:** `src/lib/overallValueCalculator.ts`

Solves the problem where K1 and DST1 rank too highly in combined rankings.

**Position weights (fantasy relevance):**
```
RB: 1.35  |  WR: 1.25  |  TE: 1.1  |  QB: 1.0  |  K: 0.12  |  DST: 0.18
```

**Scoring format adjustments:**
- PPR: WRs +30%, RBs +15%, TEs +20%
- Half-PPR: RBs +25%, WRs +20%
- Standard: RBs +40%, WRs +10%

---

## Caching Architecture

### Server-Side: Unified Cache
**File:** `src/lib/unifiedCache.ts`

| Setting | Value |
|---------|-------|
| Storage | In-memory `Map` |
| Max entries | 1,000 |
| Default TTL | 15 minutes |
| Eviction | LRU when full |
| Auto-prune | Every 5 minutes (expired entries) |

Cache key pattern: `players:{position}:{scoringFormat}`, `tiers:{position}:{scoringFormat}:{algorithm}`

### Client-Side: Data Cache
**File:** `src/lib/dataCache.ts`

| State | Age | Behavior |
|-------|-----|----------|
| FRESH | < 30 minutes | Use directly |
| STALE | 30 min – 2 hours | Use with warning, refetch in background |
| EXPIRED | > 2 hours | Must refetch |
| MISSING | N/A | Fetch required |

Storage: Browser `localStorage`.

---

## SQLite Database

**File:** `src/lib/database.ts`
**Database file:** `fantasy-data.db` (project root)

### Schema

**`datasets` table** — Tracks each data fetch session:
```sql
id TEXT PRIMARY KEY,          -- UUID
position TEXT, scoring_format TEXT, source TEXT,
week INTEGER, year INTEGER, player_count INTEGER,
created_at TEXT, is_active INTEGER  -- only active datasets are queried
```

**`players` table** — Individual player records:
```sql
dataset_id TEXT (FK → datasets.id),
player_id TEXT, name TEXT, team TEXT, position TEXT,
average_rank REAL, projected_points REAL, tier INTEGER,
expert_ranks TEXT (JSON array), bye_week INTEGER, injury_status TEXT
```
Indexes on: `dataset_id`, `position`, `tier`, `average_rank`.

**`cache_metadata` table** — Data freshness tracking:
```sql
key TEXT PRIMARY KEY, expires_at TEXT, created_at TEXT,
hit_count INTEGER, last_accessed TEXT
```

**`data_quality_logs` table** — Audit trail:
```sql
dataset_id TEXT, event_type TEXT,  -- 'fetch_success' | 'fetch_error' | 'validation_error'
message TEXT, details TEXT (JSON), created_at TEXT
```

### Key Operations
- `storePlayers()` — Transactional batch insert; deactivates old datasets first
- `getPlayers(position, scoringFormat)` — Queries active dataset only
- `cleanupOldData()` — Deletes datasets > 7 days old
- `getStats()` — Database size, row counts, dataset history

---

## Data Manager

**File:** `src/lib/dataManager.ts`

In-memory bridge for data import/export:

```typescript
importFromCSV(file, position)      // Upload CSV rankings
importFromURL(url, position)       // Fetch CSV from URL
parseRankingsText(text, position)  // Parse pasted rankings
exportToCSV() / exportToTypeScript()
updatePlayer(id, updates)          // Modify individual player
getData(position)                  // Retrieve current data
```

---

## Update Mechanisms

### Manual Script
```bash
npm run update:fantasy-rb
```
**File:** `scripts/updateFantasyRBTiers.ts`

Fetches RB rankings → calculates 8 tiers by rank ranges → writes to `public/fantasy/rb_current.json`.

### Automated Cron
**Endpoint:** `POST /api/scheduled-update`
**Auth:** `Authorization: Bearer {CRON_SECRET}`

Process:
1. Verify CRON_SECRET
2. Get current NFL week
3. For each position × each scoring format: fetch → store → persist
4. Generate overall rankings with value weighting
5. Write all formats to static JSON files

---

## Investment Data Pipeline

**File:** `src/lib/yahooFinance.ts`

### Yahoo Finance Authentication Flow

```
1. Get crumb token (three strategies tried in order):
   - Direct: GET https://query1.finance.yahoo.com/v1/test/getcrumb
   - Via finance.yahoo.com: Get cookie → use with getcrumb
   - Via fc.yahoo.com: Get cookie → use with getcrumb
2. Cache crumb for 30 minutes
3. Append crumb to all API requests as query param
4. Set Cookie + User-Agent headers
```

**Rate limiting:** Exponential backoff up to 5 minutes on 429 responses. 2-minute wait on auth failure.

### Investment API Routes

| Endpoint | Purpose |
|----------|---------|
| `/api/investments/quotes` | Current stock quotes (batch) |
| `/api/investments/data/[symbol]` | Detailed stock data: DCF, fundamentals, news, financials |

### Investment Update Script
```bash
npm run update:investments
# Runs: .venv/bin/python3 scripts/fetch_investments_data.py
```

---

## Hooks That Consume Data

| Hook | File | Data Source | Used By |
|------|------|-------------|---------|
| `useAllFantasyData` | `src/hooks/useAllFantasyData.ts` | `/api/fantasy-data` | Tier charts, draft tracker |
| `useOverallFantasyData` | `src/hooks/useOverallFantasyData.ts` | `/api/fantasy-data?position=OVERALL` | Overall rankings page |
| `useUnifiedFantasyData` | `src/hooks/useUnifiedFantasyData.ts` | Unified API wrapper | Fantasy landing page |
| `useInvestments` | `src/hooks/useInvestments.ts` | `/api/investments/*` | PortfolioTracker |
| `useStockData` | `src/hooks/useStockData.ts` | `/api/investments/data/[symbol]` | StockResearch panels |

---

## Key Architectural Patterns

1. **4-level fallback chain** — Data is always available, even if all live sources fail
2. **Dual-layer caching** — Server (15min in-memory) + Client (30min localStorage)
3. **Position scarcity weighting** — Prevents K/DST inflation in overall rankings
4. **Three-algorithm tier calculation** — GMM → Value-Drop → Rank Gap fallback
5. **Transactional dataset versioning** — Old data deactivated, new data activated atomically
6. **Concurrent fetching** — All 6 positions fetched in parallel via Promise.all
