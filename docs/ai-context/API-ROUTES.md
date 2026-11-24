# API routes (AI context)

Current API route map.

**Last updated:** 2026-11-24

---

## Live route inventory

| Endpoint | Methods | Purpose |
|---------|---------|---------|
| `/api/data-revisions` | GET | Uncached (`no-store`) revision and freshness ledger used to verify production publication |
| `/api/bay-area-transit/stations/[stationId]` | GET | BART per-station departure board, refreshed at request time with the committed snapshot as fallback |
| `/api/bay-area-transit/summary` | GET | BART lines and stations, plus advisories, elevator status, and the count of trains tracked, with the last three read from BART at request time and the committed snapshot as fallback |
| `/api/earthquake-pulse/summary` | GET | USGS earthquake summary with embedded detail payloads, refreshed at request time with the committed snapshot as fallback |
| `/api/fantasy-data` | GET | Snapshot-backed redraft rankings read from `public/data/fantasy/{ppr,half_ppr,standard}.json`, one file per scoring format |
| `/api/formula-1/meetings/[meetingId]` | GET | Snapshot-backed Formula 1 meeting detail payload |
| `/api/golf/players/[playerId]` | GET | Snapshot-backed golf player detail payload |
| `/api/investments/quotes` | GET | Finnhub quote proxy for the investments UI, limited to 25 symbols a request and to the curated symbols in `public/data/investments/index.json` |
| `/api/la-liga/teams/[teamId]` | GET | Snapshot-backed team drilldown payload for `/la-liga` |
| `/api/mba-jobs` | GET | Live MBA-role aggregator across Greenhouse/Lever/Ashby/SmartRecruiters/direct-HTML boards for `/mba-internship-notifications` |
| `/api/job-search` | GET, PUT | Development only, and only for a server started with `npm run dev` and a request from this machine. Reads and writes `private/job-search/pipeline.json` or `candidates.json` (`?file=`) with a revision taken from a SHA-256 of the file's bytes, so the local tracker and the job-search skills share one file. A PUT with an out-of-date revision gets 409 and the current file, and one that cannot take the shared write lock gets 503. Returns 404 in any other environment |
| `/api/newsletter/subscribe` | POST | Creates an opted-in Resend contact from the public newsletter form with JSON object shape validation |
| `/api/mlb/teams/[teamId]` | GET | Snapshot-backed MLB team drilldown payload |
| `/api/nba/teams/[teamId]` | GET | Snapshot-backed NBA team drilldown payload |
| `/api/news-pulse` | GET | News Pulse headlines read at request time from the RSS feeds listed in `src/lib/news-pulse-sources.ts`, with a good answer held for five minutes in the server process and a failed feed falling back to its last good headlines. The payload also carries `history`, up to seven days of when each headline was first and last seen and the titles it has carried, kept in the `news-pulse/history` blob beside the last good feeds in `news-pulse/feeds` |
| `/api/nfl/teams/[teamId]` | GET | Snapshot-backed NFL team drilldown payload |
| `/api/premier-league/teams/[teamId]` | GET | Snapshot-backed team drilldown payload for `/premier-league` |
| `/api/rss` | GET | RSS feed |
| `/api/search` | GET | Limited search |
| `/api/spacex/launches` | GET | SpaceX launch list payload |
| `/api/spacex/launches/[id]` | GET | SpaceX launch detail payload |
| `/api/spacex/summary` | GET | SpaceX Mission Control summary payload |
| `/api/world-cup/teams/[teamId]` | GET | Snapshot-backed World Cup team drilldown payload |

---

## Important accuracy notes

- there is no generic `/api/investments` catch-all route in the live app
- `/api/search` is not a full dynamic site index
- `/api/rss` is a static feed of every published post, built once per deploy
- `/api/premier-league/*` and `/api/la-liga/*` read committed snapshots, not `football-data.org` directly at runtime
- `/api/mlb/*`, `/api/nba/*`, `/api/nfl/*`, `/api/golf/*`, `/api/world-cup/*`, and `/api/formula-1/*` also read committed snapshots at runtime
- `/api/earthquake-pulse/summary` and the two `/api/bay-area-transit/*` routes pass `preferLive: true`, so they fetch the upstream source at request time and fall back to the committed snapshot
- `/api/spacex/summary` and `/api/spacex/launches` read the committed SpaceX snapshot and call Launch Library at request time only when that snapshot lacks the data they serve, and `/api/spacex/launches/[id]` reads the snapshot alone
- the league, Formula 1, golf, and World Cup `/summary` routes and `/api/investments/index` were removed on 2026-08-11; those pages read their summaries on the server, so only the drilldown routes remain. `/api/frontier-models/summary`, `/api/score-pools/summary`, and `/api/score-pools/leagues/[key]` went in the same commit, and `/api/stocks` and `/api/investments/data/[symbol]` were removed on 2026-10-02
- `/api/fantasy-data` reads generated static snapshots; there are no live `/api/fantasy-pros-*`, `/api/data-manager`, `/api/data-metadata`, `/api/sample-data`, or `/api/scheduled-update` routes
- `/api/mba-jobs` fetches live from public job boards across 59 tracked companies in `src/constants/mba-companies.ts` (48 actively fetched, 11 manual) at request time with a 30-minute `s-maxage` and 8s per-target timeout; the email digest route (`/api/mba-jobs/email`) was removed in PR #629, merged on 2026-10-21
- there is no auth route; `/api/auth/[...nextauth]` was removed on 2026-10-02

---

## Investments detail

Current investment routes:

### `/api/investments/quotes`

- batches symbol quote requests for the client portfolio experience (`src/hooks/useInvestments.ts`) and answers single-symbol live prices for `src/hooks/useLiveQuote.ts`
- prices only the curated symbols in `public/data/investments/index.json`, with 7 requests a minute per IP, five Finnhub requests at a time, and a six-second budget per request

---

## Search detail

`/api/search` ranks substring and tag matches over the full text of every published post, the case studies in `src/constants/caseStudies.ts`, and a short hand-written table of pages with no case study.

That means:

- good for simple UI demos and current navigation/search flows
- guards against prototype property resolution (e.g. `constructor`) via `Object.hasOwn`
- covers only part of each case study (title, description, role, tools, metrics, and overview summary) and none of the dashboards' data, so it is not a full site index
- pins a hand-written answer to the top of an unfiltered search for a few exact queries, listed under "Hidden search answers" in `docs/EASTER_EGGS.md`
- should be described as limited until the route is expanded

---

## Verify against code

Use `find src/app/api -name 'route.ts'` when updating this file.
