# API Reference

Current API route inventory for the app.

**Last updated:** 2026-06-19

---

## Route Inventory

### Auth

| Route | Methods | Notes |
|------|---------|-------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth credential auth for `/admin` |

### Fantasy football

| Route | Methods | Notes |
|------|---------|-------|
| `/api/fantasy-data` | GET | Snapshot-backed fantasy data route reading `public/data/fantasy/*.json` |

### Investments

| Route | Methods | Notes |
|------|---------|-------|
| `/api/investments/index` | GET | Curated research index / availability info |
| `/api/investments/quotes` | GET | Quote proxy for investments UI |
| `/api/investments/data/[symbol]` | GET | Section-based curated research payloads |
| `/api/stocks` | GET | Quote source used by investments flows |

### Sports dashboards

| Route | Methods | Notes |
|------|---------|-------|
| `/api/golf/summary` | GET | Golf dashboard summary payload from the committed golf snapshot |
| `/api/golf/players/[playerId]` | GET | Golf player detail payload from the committed golf snapshot |
| `/api/premier-league/summary` | GET | Snapshot-backed league table, fixtures, and club options for the Premier League tool |
| `/api/premier-league/teams/[teamId]` | GET | Snapshot-backed Premier League club drilldown payload |
| `/api/la-liga/summary` | GET | Snapshot-backed league table, fixtures, and club options for the La Liga tool |
| `/api/la-liga/teams/[teamId]` | GET | Snapshot-backed La Liga club drilldown payload |
| `/api/mlb/summary` | GET | Snapshot-backed MLB standings, fixtures, and leaders payload |
| `/api/mlb/teams/[teamId]` | GET | Snapshot-backed MLB team drilldown payload |
| `/api/nba/summary` | GET | Snapshot-backed NBA standings, scoreboard, and leaders payload |
| `/api/nba/teams/[teamId]` | GET | Snapshot-backed NBA team drilldown payload |
| `/api/nfl/summary` | GET | Snapshot-backed NFL standings, schedule, and leaders payload |
| `/api/nfl/teams/[teamId]` | GET | Snapshot-backed NFL team drilldown payload |
| `/api/world-cup/summary` | GET | Snapshot-backed 2026 FIFA World Cup groups, knockout rounds, fixtures, and scorers |
| `/api/world-cup/teams/[teamId]` | GET | Snapshot-backed World Cup team drilldown payload, keyed by lowercased team slug |

### Civic / transit / geo

| Route | Methods | Notes |
|------|---------|-------|
| `/api/bay-area-transit/summary` | GET | Snapshot-backed BART lines, advisories, and system status |
| `/api/bay-area-transit/stations/[stationId]` | GET | Snapshot-backed per-station departure board, keyed by lowercased BART abbreviation |
| `/api/earthquake-pulse/summary` | GET | Snapshot-backed USGS earthquake feed summary (detail payloads embedded; no per-event route) |

### MBA internship notifications

| Route | Methods | Notes |
|------|---------|-------|
| `/api/mba-jobs` | GET | Aggregates MBA-relevant postings across Greenhouse, Lever, Ashby, SmartRecruiters, and direct-HTML job boards (plus optional Adzuna external leads). `src/constants/mba-companies.ts` tracks 39 companies, ~28 actively fetched (the `manual` entries are catalogued, not live-fetched); filters via `src/lib/mba-job-matching.ts`; accepts optional `?companies=` filter |
| `/api/mba-jobs/email` | POST | Sends a grouped digest of supplied `{ jobs, to }` via Resend; requires `RESEND_API_KEY` and `MBA_DIGEST_ALLOWED_RECIPIENTS` |

### Content and utilities

| Route | Methods | Notes |
|------|---------|-------|
| `/api/news-pulse` | GET | News Pulse article summary data |
| `/api/spacex/summary` | GET | SpaceX Mission Control summary payload |
| `/api/spacex/launches` | GET | SpaceX launch list payload |
| `/api/spacex/launches/[id]` | GET | SpaceX launch detail payload |
| `/api/rss` | GET | RSS feed |
| `/api/search` | GET | Limited search endpoint; not comprehensive site search |

---

## Important API Notes

### Search limitations

`/api/search` is currently a small, mostly hardcoded index. It should be documented honestly:

- useful for the existing UI
- not comprehensive
- not a reliable source of truth for all writing or project content

### Investments routes

The current investments implementation is **not** a single generic `/api/investments` endpoint.

The live pattern is:

- `/api/investments/index`
- `/api/investments/quotes`
- `/api/investments/data/[symbol]`

Sports dashboard routes are separate from the investments surface:

- `/api/premier-league/summary`
- `/api/premier-league/teams/[teamId]`
- `/api/la-liga/summary`
- `/api/la-liga/teams/[teamId]`
- `/api/mlb/summary`
- `/api/mlb/teams/[teamId]`
- `/api/nba/summary`
- `/api/nba/teams/[teamId]`
- `/api/nfl/summary`
- `/api/nfl/teams/[teamId]`
- `/api/golf/summary`
- `/api/golf/players/[playerId]`
- `/api/world-cup/summary`
- `/api/world-cup/teams/[teamId]`
- `/api/bay-area-transit/summary`
- `/api/bay-area-transit/stations/[stationId]`
- `/api/earthquake-pulse/summary`

### Fantasy data

The live fantasy API surface is intentionally narrow:

- `/api/fantasy-data` reads the generated static snapshots in `public/data/fantasy/`
- scheduled fantasy refreshes happen through `.github/workflows/update-fantasy.yml`
- there are no live `/api/fantasy-pros-*`, `/api/data-manager`, `/api/data-metadata`, `/api/sample-data`, or `/api/scheduled-update` routes in the current app tree

### Admin auth

Admin access is backed by NextAuth credentials configured in:

- `src/lib/auth.ts`
- `/api/auth/[...nextauth]`

---

## Common Response Shapes

There is no single strict global response contract across every route, but most handlers return JSON objects with some combination of:

```ts
{
  success?: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}
```

Route-specific payloads vary and should be checked in the route file itself before making assumptions.

---

## Source Files

Use these as the actual source of truth:

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/fantasy-data/route.ts`
- `src/app/api/investments/index/route.ts`
- `src/app/api/investments/quotes/route.ts`
- `src/app/api/investments/data/[symbol]/route.ts`
- `src/app/api/golf/summary/route.ts`
- `src/app/api/golf/players/[playerId]/route.ts`
- `src/app/api/premier-league/summary/route.ts`
- `src/app/api/premier-league/teams/[teamId]/route.ts`
- `src/app/api/la-liga/summary/route.ts`
- `src/app/api/la-liga/teams/[teamId]/route.ts`
- `src/app/api/mlb/summary/route.ts`
- `src/app/api/mlb/teams/[teamId]/route.ts`
- `src/app/api/nba/summary/route.ts`
- `src/app/api/nba/teams/[teamId]/route.ts`
- `src/app/api/nfl/summary/route.ts`
- `src/app/api/nfl/teams/[teamId]/route.ts`
- `src/app/api/world-cup/summary/route.ts`
- `src/app/api/world-cup/teams/[teamId]/route.ts`
- `src/app/api/bay-area-transit/summary/route.ts`
- `src/app/api/bay-area-transit/stations/[stationId]/route.ts`
- `src/app/api/earthquake-pulse/summary/route.ts`
- `src/app/api/news-pulse/route.ts`
- `src/app/api/spacex/summary/route.ts`
- `src/app/api/spacex/launches/route.ts`
- `src/app/api/spacex/launches/[id]/route.ts`
- `src/app/api/stocks/route.ts`
- `src/app/api/mba-jobs/route.ts`
- `src/app/api/mba-jobs/email/route.ts`
- `src/app/api/rss/route.ts`
- `src/app/api/search/route.ts`

---

## Related Docs

- `ARCHITECTURE.md`
- `DEVELOPMENT.md`
- `docs/ai-context/API-ROUTES.md`
- `docs/ai-context/DATA-PIPELINE.md`
