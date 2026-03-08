# API Routes — AI Context Reference

> Every `/api/*` endpoint with methods, parameters, response shapes, auth, and data sources.

---

## Route Inventory

| Endpoint | Methods | Auth | Rate Limited | Data Source |
|----------|---------|------|-------------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth | No | Env vars |
| `/api/fantasy-data` | GET, POST, DELETE | No | Yes (10/min) | NFLverse API |
| `/api/fantasy-pros-session` | GET, POST | FantasyPros creds | Yes (10/min) | FantasyPros (auth) |
| `/api/fantasy-pros-free` | GET | No | No | FantasyPros (public) |
| `/api/data-manager` | GET, POST, DELETE | No | No | In-memory store |
| `/api/data-metadata` | GET | No | No | File timestamps |
| `/api/sample-data` | GET, HEAD | No | No | Static sample data |
| `/api/scheduled-update` | GET, POST | CRON_SECRET | Yes (30/min) | FantasyPros (auth) |
| `/api/scrape` | GET | No | No | Web fetch |
| `/api/investments/data/[symbol]` | GET | No | No | Static JSON files |
| `/api/investments/quotes` | GET | No | No | Proxy → `/api/stocks` |
| `/api/stocks` | GET | No | No | Yahoo Finance v8 |
| `/api/search` | GET | No | No | Hardcoded content |
| `/api/rss` | GET | No | No | Hardcoded posts |

---

## Fantasy Football APIs

### GET `/api/fantasy-data`
Primary fantasy data endpoint. Fetches from NFLverse/DynastyProcess (open-source, no API key).

**Parameters:**
| Param | Type | Default | Values |
|-------|------|---------|--------|
| `position` | query | required | QB, RB, WR, TE, K, DST, FLEX, OVERALL |
| `scoring` | query | PPR | PPR, HALF_PPR, STANDARD |
| `all` | query | false | true = fetch all positions |
| `refresh` | query | false | true = bypass cache |

**Response:**
```json
{
  "success": true,
  "players": [{ "player_id", "player_name", "team", "position", "rank_ecr", "rank_ave", "rank_std", "tier" }],
  "metadata": { "source", "timestamp", "playerCount" },
  "summary": { "position", "scoringFormat", "totalPlayers" },
  "options": { "positions": [], "scoringFormats": [] }
}
```

**Cache:** `max-age=300, stale-while-revalidate=3600`

**POST actions:** `clear-cache`, `cache-stats`, `test-config`
**DELETE:** Clears all cached data.

### POST `/api/fantasy-pros-session`
Authenticated FantasyPros scraping via session login.

**Body:**
```json
{
  "username?": "string (or use FANTASYPROS_USERNAME env)",
  "password?": "string (or use FANTASYPROS_PASSWORD env)",
  "position?": "QB|RB|WR|TE|K|DST|FLEX|OVERALL",
  "week?": "number",
  "scoringFormat": "ppr|half-ppr|standard"
}
```

**Response:** `{ success, players[], position, week, source: "fantasypros-session" }`

**Side effects:** Stores data in in-memory data manager AND persistent file storage.

**GET `?test=true`:** Returns supported positions, current week, usage instructions.

### GET `/api/fantasy-pros-free` (DEPRECATED)
Free-tier FantasyPros access. Use `/api/fantasy-data` instead.

**Parameters:** `position?`, `scoringFormat?` (default: ppr)

### POST `/api/scheduled-update`
Cron-triggered update for all positions and scoring formats.

**Auth:** `Authorization: Bearer {CRON_SECRET}` header required.

**Process:**
1. Validates CRON_SECRET
2. For each position (QB, RB, WR, TE, K, DST, FLEX, OVERALL) × each scoring format (PPR, HALF_PPR, STANDARD): fetch → store → persist
3. Generates overall rankings with value weighting
4. Writes to persistent file storage

**Response:**
```json
{
  "success": true,
  "timestamp": "ISO string",
  "positions": { "QB": { "count": 32 }, "RB": { "count": 80 }, ... },
  "errors": [],
  "executionTimeMs": 12500,
  "overallRankings": { "ppr": 200, "half": 200, "std": 200 }
}
```

**GET:** Returns `{ status: "ready", currentWeek, nextUpdateTime, environment }` (also requires CRON_SECRET).

---

## Data Management APIs

### `/api/data-manager`
In-memory storage for fantasy data (per-process, not persistent across restarts).

**GET:** `?position=QB&dataset=current&scoringFormat=ppr&compare=true`
**POST body:** `{ position, players[], action: "set"|"append"|"clear", dataset?, source?, scoringFormat? }`
**DELETE:** `?position=QB&dataset=current`

**Storage structure:**
```
dataStore: {
  "current":                    { QB, RB, WR, TE, K, DST, FLEX, OVERALL },
  "free-ranking-ppr":           { ... },
  "free-ranking-half-ppr":      { ... },
  "fantasypros-session-ppr":    { ... },
  "fantasypros-session-half-ppr": { ... },
  "fantasypros-session-standard": { ... }
}
```

### GET `/api/data-metadata`
Returns data freshness info per position.

**Parameters:** `position?`
**Response:** `{ success, metadata: { lastUpdated, oldestUpdate, source, format, version } }`
**Cache:** `max-age=1800, stale-while-revalidate=86400`

### GET `/api/sample-data`
Serves fallback sample data with pagination.

**Parameters:** `position?`, `page` (default: 1), `limit` (default: 100)
**Response:** `{ success, data[], pagination: { page, limit, total, totalPages, hasNext, hasPrev }, metadata }`
**Cache:** In-memory (1 hour).

---

## Investment APIs

### GET `/api/investments/data/[symbol]`
Serves pre-built investment research data from `public/data/investments/{symbol}/`.

**Parameters:** `section` (required)

**Valid sections:**
`price`, `fundamentals`, `profitability`, `margins`, `growth`, `income_statement`, `balance_sheet`, `cash_flow`, `wacc`, `beta`, `industry`, `revenue_segments`, `officers`, `transcripts`, `news`, `dcf`, `info`, `transcript_YYYY_Q`

**Response varies by section.** Examples:
- **fundamentals:** `{ ttmEps, ttmPe, marketCap, psRatio, pbRatio, pegRatio }`
- **dcf:** `{ fairValue, currentPrice, upside, recommendation: "Buy"|"Hold"|"Sell" }`
- **industry:** Comparison metrics (P/E, P/S, ROE, margins) stock vs industry avg
- **transcripts:** `[{ fiscalYear, fiscalQuarter, date }]`
- **news:** `[{ uuid, title, publisher, reportDate, link, type }]`

**Cache:** `max-age=3600, stale-while-revalidate=86400`
**Errors:** 400 (missing section), 404 (symbol not found), 503 (data not fetched)

### GET `/api/investments/quotes`
Thin proxy to `/api/stocks`. Keeps investments layer decoupled.

**Parameters:** `symbols` (comma-separated, e.g., "AAPL,MSFT")
**Timeout:** 12 seconds. Returns 502 on timeout.

### GET `/api/stocks`
Fetches real-time quotes from Yahoo Finance v8 chart API.

**Parameters:** `symbols` (required, comma-separated)
**Response:**
```json
{
  "quotes": [{
    "symbol": "AAPL",
    "price": 178.50,
    "change": 2.30,
    "changePercent": 1.31,
    "dayHigh": 179.00,
    "dayLow": 176.00,
    "open": 176.50,
    "previousClose": 176.20,
    "volume": 52000000,
    "marketCap": 2800000000000,
    "name": "Apple Inc.",
    "error?": "string if this symbol failed"
  }],
  "rateLimited": false,
  "allFailed": false,
  "timestamp": "ISO string"
}
```

**Uses `Promise.allSettled`** — returns partial results even if some symbols fail. 8s timeout per symbol.

---

## Utility APIs

### GET `/api/search`
Full-text search across static content.

**Parameters:** `q` (query), `type?` ("project"|"page"|"all"), `category?`, `limit?` (default: 50)

**Relevance scoring:** Title exact match (+100), title word (+50), excerpt (+20), category (+15), tag (+10), content word (+2 each), recency bonus (+5).

**Cache:** `max-age=3600, stale-while-revalidate=86400`

### GET `/api/rss`
XML RSS 2.0 feed. Content-Type: `application/xml`. Currently serves 3 hardcoded posts.

### GET `/api/scrape`
Web scraping utility. Parameters: `url` (required), `position?`. Parses HTML for player rankings using multiple strategies (embedded JSON, HTML tables, regex).

---

## Rate Limiting

**File:** `src/lib/rateLimit.ts`

| Limiter | Requests | Window | Used By |
|---------|----------|--------|---------|
| `apiRateLimiter` | 30 | 1 minute | `/api/scheduled-update` |
| `authRateLimiter` | 5 | 15 minutes | Auth endpoints |
| `fantasyRateLimiter` | 10 | 1 minute | `/api/fantasy-data`, `/api/fantasy-pros-session` |

**Client identification:** `${IP}:${UserAgent}` (IP from `x-forwarded-for` or `x-real-ip`).

**429 response:**
```json
{ "error": "Too many requests", "message": "Rate limit exceeded.", "retryAfter": 45 }
```
Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.

---

## Authentication

**File:** `src/lib/auth.ts`

- Provider: Credentials (username/password from `ADMIN_USERNAME`, `ADMIN_PASSWORD` env vars)
- Session strategy: JWT, max age 30 days
- Protected routes: `/admin`, `/admin/analytics`
- Sign-in/error page: `/admin`

---

## Security Middleware

**File:** `src/middleware.ts`

Applied to all routes except `/_next/static`, `/_next/image`, `/favicon.ico`, `/api/*`.

Headers set: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.

CSP includes `connect-src https://api.fantasypros.com` for FantasyPros API calls.
