# API Routes — AI Context

Current API route map.

**Last updated:** 2026-06-10

---

## Live Route Inventory

| Endpoint | Methods | Purpose |
|---------|---------|---------|
| `/api/auth/[...nextauth]` | GET, POST | Admin auth |
| `/api/bay-area-transit/stations/[stationId]` | GET | Snapshot-backed BART per-station departure board |
| `/api/bay-area-transit/summary` | GET | Snapshot-backed BART lines, advisories, and system status |
| `/api/fantasy-data` | GET | Snapshot-backed fantasy data route reading `public/data/fantasy/*.json` |
| `/api/golf/players/[playerId]` | GET | Snapshot-backed golf player detail payload |
| `/api/golf/summary` | GET | Snapshot-backed golf dashboard summary |
| `/api/investments/data/[symbol]` | GET | Section-based investment research payloads |
| `/api/investments/index` | GET | Curated investments index/availability |
| `/api/investments/quotes` | GET | Quote proxy for the investments UI |
| `/api/la-liga/summary` | GET | Snapshot-backed league table, fixtures, and club options for `/la-liga` |
| `/api/la-liga/teams/[teamId]` | GET | Snapshot-backed team drilldown payload for `/la-liga` |
| `/api/mba-jobs` | GET | Live MBA-role aggregator across Greenhouse/Lever/Ashby/direct-HTML boards for `/mba-internship-notifications` |
| `/api/mba-jobs/email` | POST | Sends grouped digest of supplied jobs via Resend |
| `/api/mlb/summary` | GET | Snapshot-backed MLB standings, fixtures, and leaders |
| `/api/mlb/teams/[teamId]` | GET | Snapshot-backed MLB team drilldown payload |
| `/api/nba/summary` | GET | Snapshot-backed NBA standings, scoreboard, and leaders |
| `/api/nba/teams/[teamId]` | GET | Snapshot-backed NBA team drilldown payload |
| `/api/news-pulse` | GET | News Pulse article summaries |
| `/api/nfl/summary` | GET | Snapshot-backed NFL standings, schedule, and leaders |
| `/api/nfl/teams/[teamId]` | GET | Snapshot-backed NFL team drilldown payload |
| `/api/premier-league/summary` | GET | Snapshot-backed league table, fixtures, and club options for `/premier-league` |
| `/api/premier-league/teams/[teamId]` | GET | Snapshot-backed team drilldown payload for `/premier-league` |
| `/api/rss` | GET | RSS feed |
| `/api/search` | GET | Limited search |
| `/api/spacex/launches` | GET | SpaceX launch list payload |
| `/api/spacex/launches/[id]` | GET | SpaceX launch detail payload |
| `/api/spacex/summary` | GET | SpaceX Mission Control summary payload |
| `/api/stocks` | GET | Quote source for investments flows |
| `/api/world-cup/summary` | GET | Snapshot-backed World Cup groups, knockout rounds, fixtures, and scorers |
| `/api/world-cup/teams/[teamId]` | GET | Snapshot-backed World Cup team drilldown payload |

---

## Important Accuracy Notes

- there is no generic `/api/investments` catch-all route in the live app
- `/api/search` is not a full dynamic site index
- `/api/rss` is still a small writing feed route
- `/api/premier-league/*` and `/api/la-liga/*` read committed snapshots, not `football-data.org` directly at runtime
- `/api/mlb/*`, `/api/nba/*`, `/api/nfl/*`, `/api/golf/*`, `/api/world-cup/*`, and `/api/bay-area-transit/*` also read committed snapshots at runtime
- `/api/fantasy-data` reads generated static snapshots; there are no live `/api/fantasy-pros-*`, `/api/data-manager`, `/api/data-metadata`, `/api/sample-data`, or `/api/scheduled-update` routes
- `/api/mba-jobs` fetches live from public job boards at request time with a 30-minute `s-maxage` and 8s per-target timeout; `/api/mba-jobs/email` requires `RESEND_API_KEY` and `MBA_DIGEST_ALLOWED_RECIPIENTS`
- auth is still NextAuth credentials-based

---

## Investments Detail

Current investment routes:

### `/api/investments/index`

- provides the published curated ticker universe / index-style data for the investments surface

### `/api/investments/quotes`

- batches symbol quote requests for the client portfolio experience
- keeps the investments layer decoupled from direct stock-route usage in the UI

### `/api/investments/data/[symbol]`

- serves per-symbol research sections
- supports the curated research UI

### `/api/stocks`

- provides quote data used by the investments experience

---

## Search Detail

`/api/search` currently returns results from a small static/hardcoded content set.

That means:

- good for simple UI demos and current navigation/search flows
- not comprehensive for all writing or project content
- should be described as limited until the route is expanded

---

## Auth Detail

`/api/auth/[...nextauth]` is configured from `src/lib/auth.ts`.

- credentials provider
- admin login uses env vars
- sign-in and error page both point at `/admin`

---

## Verify Against Code

Use `find src/app/api -name 'route.ts'` when updating this file.
