# API Reference

Current API route inventory for the app.

**Last updated:** 2026-11-02

---

## Route Inventory

### System and freshness ledger

| Route | Methods | Notes |
|------|---------|-------|
| `/api/data-revisions` | GET | Uncached (`no-store`) revision and freshness ledger used to verify production publication |

### Fantasy football

| Route | Methods | Notes |
|------|---------|-------|
| `/api/fantasy-data` | GET | Snapshot-backed redraft rankings read from `public/data/fantasy/{ppr,half_ppr,standard}.json`. Optional `?scoring=` (`ppr`, `half_ppr`, or `standard`, plus aliases such as `half` and `std`; default `ppr`), `?position=` (`overall`, `qb`, `rb`, `wr`, `te`, `flex`, `k`, or `dst`; default `overall`), and `?all=true` for the whole snapshot (`false` is the default), with a 400 for any other value. 10 requests a minute per IP and user agent |

### Investments

| Route | Methods | Notes |
|------|---------|-------|
| `/api/investments/quotes` | GET | Finnhub quote proxy for the investments UI. `?symbols=` takes up to 25 comma-separated symbols, and only symbols listed in `public/data/investments/index.json` are priced. 7 requests a minute per IP. A response with every quote filled caches for 30 seconds, and one with a failed or unlisted symbol is `no-store` |

### Sports dashboards

| Route | Methods | Notes |
|------|---------|-------|
| `/api/golf/players/[playerId]` | GET | Golf player detail payload from the committed golf snapshot |
| `/api/formula-1/meetings/[meetingId]` | GET | Formula 1 meeting detail payload from the committed Formula 1 snapshot |
| `/api/premier-league/teams/[teamId]` | GET | Snapshot-backed Premier League club drilldown payload |
| `/api/la-liga/teams/[teamId]` | GET | Snapshot-backed La Liga club drilldown payload |
| `/api/mlb/teams/[teamId]` | GET | Snapshot-backed MLB team drilldown payload |
| `/api/nba/teams/[teamId]` | GET | Snapshot-backed NBA team drilldown payload |
| `/api/nfl/teams/[teamId]` | GET | Snapshot-backed NFL team drilldown payload |
| `/api/world-cup/teams/[teamId]` | GET | Snapshot-backed World Cup team drilldown payload, keyed by lowercased team slug |

### Civic / transit / geo

| Route | Methods | Notes |
|------|---------|-------|
| `/api/bay-area-transit/summary` | GET | BART catalog plus request-time advisories, elevator status, and the count of trains in the departures feed, with snapshot fallback. The departure boards themselves come from the station route |
| `/api/bay-area-transit/stations/[stationId]` | GET | Request-time station board with snapshot fallback, keyed by lowercased BART abbreviation |
| `/api/earthquake-pulse/summary` | GET | Request-time USGS earthquake summary with checked-in last-good fallback |

### MBA internship notifications and job search

| Route | Methods | Notes |
|------|---------|-------|
| `/api/mba-jobs` | GET | Aggregates MBA-relevant and tech PM postings across Greenhouse, Lever, Ashby, SmartRecruiters, and direct-HTML job boards (plus optional Adzuna external leads). `src/constants/mba-companies.ts` tracks 59 companies, 48 actively fetched (37 Greenhouse, 7 Ashby, 2 SmartRecruiters, 1 Lever, 1 direct-HTML; 11 manual catalog entries); filters via `src/lib/mba-job-matching.ts`; accepts optional `?companies=` (an unknown id returns 400) and `?external=on` (Adzuna leads, which need `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`); 30 requests a minute per IP, and a fresh success caches for 30 minutes at the CDN while a stale or failed answer is `no-store` |
| `/api/job-search` | GET, PUT | Development only, and only for a server started with `npm run dev` and a request from this machine (404 otherwise, including production). Reads and writes `private/job-search/pipeline.json` or `candidates.json` (`?file=`) with a content-hash revision, 409 conflict detection, and a 503 when another writer holds the shared write lock, enabling bidirectional sync between the local tracker and job search skills |

### Content and utilities

| Route | Methods | Notes |
|------|---------|-------|
| `/api/newsletter/subscribe` | POST | Validates public email signup and JSON object shape, creating an opted-in Resend contact with `RESEND_CONTACTS_API_KEY` (legacy fallback to `RESEND_API_KEY`), optionally inside `RESEND_NEWSLETTER_SEGMENT_ID` |
| `/api/news-pulse` | GET | News Pulse article summary data and bounded public headline observation history |
| `/api/spacex/summary` | GET | SpaceX Mission Control summary payload |
| `/api/spacex/launches` | GET | SpaceX launch list payload. Optional `?status=` (`upcoming` or `past`; default `upcoming`) and `?limit=` from 1 to 100 |
| `/api/spacex/launches/[id]` | GET | SpaceX launch detail payload |
| `/api/rss` | GET | RSS 2.0 feed of every published post, built once per deploy (`force-static`) |
| `/api/search` | GET | Limited search endpoint, not a full site search. Takes `?q=`, `?type=` (`project`, `post`, or `page`), `?category=`, and `?limit=` (1 to 100, default 50) |

---

## Important API Notes

### Search limitations

`/api/search` indexes the full text of every published blog post, the case studies in `src/constants/caseStudies.ts` (categorized through `toolCategories.ts`), and a short table of pages with no case study. A few exact queries also pin a hand-written answer to the top of an unfiltered search, listed under "Hidden search answers" in `docs/EASTER_EGGS.md`. It should be documented honestly:

- useful for the existing UI
- guards against prototype property resolution (e.g. `constructor` query returns no corrupted answer) via `Object.hasOwn`
- not a full site index, since it covers only part of each case study (title, description, role, tools, metrics, and overview summary) and none of the dashboards' data, so it is not a reliable source of truth for project content

### Investments routes

The current investments implementation is **not** a single generic `/api/investments` endpoint.

The live pattern is:

- `/api/investments/quotes`

The research index and the per-symbol snapshots have no API route. The investments page reads the index from `public/data/investments/` on the server, and the browser fetches `/data/investments/index.json` and `/data/investments/<SYMBOL>/snapshot.json` as static files.

The sports, transit, and earthquake routes are separate from the investments surface:

- `/api/premier-league/teams/[teamId]`
- `/api/la-liga/teams/[teamId]`
- `/api/mlb/teams/[teamId]`
- `/api/nba/teams/[teamId]`
- `/api/nfl/teams/[teamId]`
- `/api/golf/players/[playerId]`
- `/api/formula-1/meetings/[meetingId]`
- `/api/world-cup/teams/[teamId]`
- `/api/bay-area-transit/summary`
- `/api/bay-area-transit/stations/[stationId]`
- `/api/earthquake-pulse/summary`

### Fantasy data

The live fantasy API surface is intentionally narrow:

- `/api/fantasy-data` reads the three redraft snapshots in `public/data/fantasy/` (`ppr.json`, `half_ppr.json`, and `standard.json`). The best ball and weekly boards in the same folder have no API route, and the browser fetches `/data/fantasy/best-ball.json` and `/data/fantasy/weekly.json` as static files
- scheduled fantasy refreshes happen through `.github/workflows/update-fantasy.yml`
- there are no live `/api/fantasy-pros-*`, `/api/data-manager`, `/api/data-metadata`, `/api/sample-data`, or `/api/scheduled-update` routes in the current app tree

## Common Response Shapes

There is no single strict global response contract across every route. Most routes return their payload as the top-level JSON object, and only `/api/fantasy-data` and `/api/newsletter/subscribe` wrap a success in a `success` flag. The fields that recur across those wrappers and the error responses are:

```ts
{
  success?: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}
```

Most failures carry an `error` string. `/api/mba-jobs` and `/api/news-pulse` report source failures in an `errors` array instead, and the newsletter route answers with `{ success: false, message }`. Route-specific payloads vary and should be checked in the route file itself before making assumptions.

The snapshot-backed routes, meaning `/api/fantasy-data` and the team, golf, Formula 1, SpaceX, Bay Area transit, and earthquake routes, build their headers with `createSnapshotResponseHeaders` in `src/lib/snapshotResponse.ts`. A success carries `Cache-Control` with a durable `Netlify-CDN-Cache-Control` companion, `ETag`, `X-Data-Revision`, `X-Data-Source`, and `X-Data-Status`, plus `Last-Modified` and `X-Data-Source-As-Of` when the source time is known. The id-keyed drilldowns return 400 for a malformed id and 404 for a well-formed id the snapshot does not hold, and they send every error `no-store` so the CDN never keeps a failure. `/api/fantasy-data`, `/api/investments/quotes`, `/api/mba-jobs`, `/api/spacex/launches`, and `/api/search` also send `Netlify-Vary: query`, because Netlify's cache key for a route handler leaves out the query string unless a response asks for it.

The four rate-limited routes are `/api/fantasy-data`, `/api/investments/quotes`, `/api/mba-jobs`, and `/api/newsletter/subscribe`, which allows five attempts an hour per IP. Each one counts requests in its own server process's memory and answers a request over the limit with 429, `Retry-After` and `X-RateLimit-*` headers, and a `{ error, message, retryAfter }` body.

---

## Source Files

Use these as the actual source of truth:

- `src/app/api/data-revisions/route.ts`
- `src/app/api/fantasy-data/route.ts`
- `src/app/api/investments/quotes/route.ts`
- `src/app/api/golf/players/[playerId]/route.ts`
- `src/app/api/formula-1/meetings/[meetingId]/route.ts`
- `src/app/api/premier-league/teams/[teamId]/route.ts`
- `src/app/api/la-liga/teams/[teamId]/route.ts`
- `src/app/api/mlb/teams/[teamId]/route.ts`
- `src/app/api/nba/teams/[teamId]/route.ts`
- `src/app/api/nfl/teams/[teamId]/route.ts`
- `src/app/api/world-cup/teams/[teamId]/route.ts`
- `src/lib/teamRoute.ts` (`createTeamRouteHandler`, the shared handler behind the six team routes)
- `src/app/api/bay-area-transit/summary/route.ts`
- `src/app/api/bay-area-transit/stations/[stationId]/route.ts`
- `src/app/api/earthquake-pulse/summary/route.ts`
- `src/app/api/newsletter/subscribe/route.ts`
- `src/app/api/news-pulse/route.ts`
- `src/app/api/spacex/summary/route.ts`
- `src/app/api/spacex/launches/route.ts`
- `src/app/api/spacex/launches/[id]/route.ts`
- `src/app/api/mba-jobs/route.ts`
- `src/app/api/job-search/route.ts`
- `src/app/api/rss/route.ts`
- `src/app/api/search/route.ts`

---

## Related Docs

- `ARCHITECTURE.md`
- `DEVELOPMENT.md`
- `docs/ai-context/API-ROUTES.md`
- `docs/ai-context/DATA-PIPELINE.md`
