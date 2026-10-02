# Snapshot-Driven Dashboards

How the site's data dashboards work. This is the single most-repeated
architecture in the repo — 15+ public surfaces share it — so it gets one
reference instead of being re-explained per route.

**Last updated:** 2026-09-21

The short version is that most dashboards call no external API at request time.
The exceptions are the earthquake summary route, the bay-area-transit summary
route, and the bay-area-transit station route, which pass `preferLive: true` to
their accessors and keep the committed snapshot as the fallback. A
local script fetches data, transforms it, and writes a committed snapshot file. A
GitHub Action re-runs that script on a schedule and commits the refreshed
snapshot. The app reads the committed file. This keeps pages fast, keeps runtime
free of third-party rate limits and outages, and makes every data change a
reviewable diff.

---

## The five moving parts

For a dashboard `x`:

| Part | Path | Role |
|------|------|------|
| **Seed snapshot** | `src/data/<x>Snapshot.ts` | Committed `export const <x>Snapshot: <Type> = {…}`. Ships with a seed (empty or hand-authored) so the page works before the first refresh. |
| **Builder** | `scripts/build<X>Snapshot.ts` (often via a `src/lib/<x>Data.ts` fetch/transform) | Fetches the upstream source, shapes it, writes the snapshot file. Run by `npm run update:<x>`. |
| **GitHub Action** | `.github/workflows/update-<x>.yml` | Runs the builder on a schedule (+ manual dispatch) and commits the snapshot only when it changes, via the shared `scripts/ci/commit-and-push-snapshot.sh`. |
| **Accessors** | `src/lib/<x>Snapshot.ts` | Pure read helpers the app and API routes call (`get<X>Summary()`, per-entity getters, id validation, empty-state factories). |
| **API route(s)** | optional, usually a per-entity detail route such as `src/app/api/<x>/teams/[teamId]/route.ts` | Thin handlers that return accessor output for data the client fetches on selection. Most pages call the accessor directly in the server component, so only bay-area-transit, earthquake-pulse, and spacex have a `summary` route. |

The route page (`src/app/<x>/page.tsx`) is a server shell — metadata + structured
data — that hands the snapshot to a client component for deep-linkable `?view=` /
`?team=` / `?station=` / `?player=` state.

---

## The fallback contract (important)

A failed or empty refresh must **keep the previous snapshot**, never wipe it. The
shared helper is `scripts/snapshotFallback.ts`:

```ts
export function readGeneratedSnapshot<T>(filePath: string, exportName: string): T | null
```

It reads the already-generated `export const <name> = {…};` literal back out of
the `.ts` file and `JSON.parse`s it. It returns `null` for a missing file or a
hand-authored seed that isn't in generated shape, so the caller can surface the
original fetch error instead of masking it behind data that may not exist.

Builders use it like this (from `scripts/buildGolfSnapshot.ts`):

```ts
try {
  snapshot = await buildGolfSnapshotData();
} catch (error) {
  const existing = readGeneratedSnapshot<GolfSnapshot>(outPath, "golfSnapshot");
  if (hasContents(existing)) {
    console.warn("Golf refresh failed; keeping the existing snapshot.", error);
    return;                       // keep last-good data
  }
  throw error;                    // no good data to fall back to → fail loudly
}
```

Builders also **write atomically** (`writeFileAtomic`: write `.tmp`, then
`renameSync`) so the snapshot is never observed half-written.

A builder that fans out across **many independent upstream calls** (e.g.
`buildGitHubTrendingSnapshot.ts` hits the GitHub Search API once per tracked
language/topic) wraps each call in `withRetry` (`src/lib/fetchRetry.ts`) so a
transient blip on one segment doesn't discard the whole refresh. It tolerates a
few segments failing outright — skipping them and writing the rest fresh — but
aborts (keeping the previous snapshot) once `MAX_FAILED_SEGMENTS` is exceeded,
so a broad outage never gets written as a gutted snapshot. The two football
builders (`buildPremierLeagueSnapshot.ts`, `updateLaLigaSnapshot.ts`) both honor
the contract identically: a thrown fetch **or** a successful-but-empty standings
response falls back to the committed snapshot.

---

## The shared commit/push step (every Action)

All 17 `update-*.yml` workflows route their git commit + push through one shared
helper, `scripts/ci/commit-and-push-snapshot.sh`, instead of inlining their own
git plumbing:

```yaml
- run: |
    bash scripts/ci/commit-and-push-snapshot.sh \
      "chore: refresh golf snapshot [automated] [skip ci]" \
      src/data/golfSnapshot.ts
```

Usage is `commit-and-push-snapshot.sh <commit-message> <pathspec...>`. The script:

1. Sets the `github-actions[bot]` git identity.
2. Stages the given pathspecs and **exits 0 cleanly on a no-op refresh** — if
   `git diff --cached --quiet` finds nothing staged, there's no commit to make.
3. Commits, then pushes to `HEAD:main` with a **retry loop** (default 8 attempts,
   override via `SNAPSHOT_PUSH_ATTEMPTS`). On each push rejection it
   `git fetch origin main` and `git rebase --autostash origin/main`, then retries
   with capped exponential backoff (`attempt² × 2`, capped at 30s) plus `RANDOM`
   jitter.

The retry loop exists because `main` moves constantly. Many snapshot bots
(the football leagues every four hours, transit, and the rest) push to the same branch and collide.
A refresh commit only touches its own snapshot files, so a rebase never truly
conflicts; the failure mode is just losing the race repeatedly. The script bails
(exit 1) only on a **genuine rebase conflict** (it aborts the rebase) or after
exhausting all attempts. Tests in
`.github/workflows/__tests__/snapshot-workflows.test.ts` and
`update-investments.test.ts` assert every workflow uses it.

---

## Worked example: `/golf` (the simplest one)

1. **Source:** ESPN's public golf leaderboard endpoint, no token.
2. **Builder:** `scripts/buildGolfSnapshot.ts` calls `buildGolfSnapshotData()`
   from `src/lib/golfData.ts`, JSON-stringifies the result into
   `src/data/golfSnapshot.ts`, with the `readGeneratedSnapshot` fallback above.
3. **Action:** `.github/workflows/update-golf.yml` runs every three hours Thursday
   through Sunday and daily at 08:40 UTC Monday through Wednesday, and
   commits `src/data/golfSnapshot.ts` when it changes, via
   `scripts/ci/commit-and-push-snapshot.sh`.
4. **Accessors:** `src/lib/golfSnapshot.ts` exposes `getGolfSummary()`,
   `getGolfPlayerSnapshot(id)`, `createEmptyGolfSummary()`, and id validation.
5. **API:** `/api/golf/players/[playerId]` only. The page calls `getGolfSummary()`
   directly, so there is no summary route.

### Sub-resource pattern (id-keyed detail)

Dashboards with a detail panel add an `[id]` accessor + route. Golf shows the id
discipline that keeps handlers honest — **shape-check before membership** so the
route can distinguish a malformed id (`400`) from a valid-shape unknown id
(`404`):

```ts
const GOLF_PLAYER_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/i;
isGolfPlayerIdShape(id)   // → 400 when false (bad input)
isValidGolfPlayerId(id)   // shape AND id in golfSnapshot.playerSnapshots → else 404
```

The same idea keys other detail surfaces by a **lowercased identifier**: NBA/NFL/
MLB/soccer `/teams/[teamId]` by team abbr, bay-area-transit `/stations/[stationId]`
by BART abbr, world-cup `/teams/[teamId]` by team slug.

---

## All snapshot surfaces

| Route(s) | Snapshot | Builder / `npm run` | Workflow | Upstream source | Cadence |
|---|---|---|---|---|---|
| `/premier-league` | `src/data/premierLeagueSnapshot.ts` | `buildPremierLeagueSnapshot.ts` · `update:premier-league` / `update:football` | `update-premier-league.yml` | football-data.org (token, build time only) | every 4h, Aug–May |
| `/la-liga` | `src/data/laLigaSnapshot.ts` | `updateLaLigaSnapshot.ts` · `update:la-liga` / `update:football` | `update-la-liga.yml` | football-data.org (token, build time only) | every 4h, Aug–May |
| `/nfl` | `src/data/nflSnapshot.ts` | `updateNflSnapshot.ts` · `update:nfl` | `update-nfl.yml` | NFLverse CSVs | daily 10:35 UTC, Sep–Feb |
| `/mlb` | `src/data/mlbSnapshot.ts` | `updateMlbSnapshot.ts` · `update:mlb` | `update-mlb.yml` | MLB Stats API | every 4h, Mar 20–Nov 6 |
| `/nba` | `src/data/nbaSnapshot.ts` | `updateNbaSnapshot.ts` · `update:nba` | `update-nba.yml` | ESPN NBA | every 4h, mid-Oct–Jun |
| `/golf` | `src/data/golfSnapshot.ts` | `buildGolfSnapshot.ts` · `update:golf` | `update-golf.yml` | ESPN golf | every 3h Thu–Sun, daily 08:40 UTC Mon–Wed |
| `/formula-1`, `/fantasy-formula-1` | `src/data/formula1Snapshot.ts` | `buildFormula1Snapshot.ts` · `update:formula-1` | `update-formula-1.yml` | OpenF1 | every 3h Thu–Sun, daily 08:10 UTC Mon–Wed |
| `/world-cup-2026` | `src/data/worldCupSnapshot.ts` | `buildWorldCupSnapshot.ts` · `update:world-cup` | `update-world-cup.yml` | ESPN `soccer/fifa.world` | no schedule, manual dispatch only (the tournament ended) |
| `/score-pools` (+ `/tracker`, `/settings`) | `src/data/scorePoolsSnapshot.ts` | `buildScorePoolsSnapshot.ts` · `update:score-pools` | `update-score-pools.yml` | The Odds API + API-Football + manual/CSV | every 6h, and the run skips the refresh with a notice until both provider keys are set |
| `/bay-area-transit` | `src/data/bayAreaTransitSnapshot.ts` | `buildBayAreaTransitSnapshot.ts` · `update:bay-area-transit` | `update-bay-area-transit.yml` | BART public API (demo key) | every 6h, year-round |
| `/earthquake-pulse` | `src/data/earthquakeSnapshot.ts` | `buildEarthquakeSnapshot.ts` · `update:earthquake` | `update-earthquake.yml` | USGS GeoJSON feeds | daily 06:20 UTC (fallback seed; the API serves live USGS at request time) |
| `/github-trending-pulse` | `src/data/githubTrendingSnapshot.ts` | `buildGitHubTrendingSnapshot.ts` · `update:github-trending` | `update-github-trending.yml` | GitHub Search API | daily 07:45 UTC |
| `/spacex-mission-control` | `src/data/spacexSnapshot.generated.json` (+ image manifest) | `buildSpaceXSnapshot.ts` · `update:spacex` | `update-spacex.yml` | Launch Library / SpaceDevs | daily 09:25 + 21:25 UTC |
| `/tech-startup-tracker` | `src/data/techStartupSnapshot.ts` | `buildTechStartupSnapshot.ts` · `update:tech-startups` | none (curated) | hand-maintained seed | manual |
| `/frontier-models` | `src/data/frontierModelsSnapshot.ts` (seed) + `dashboard-snapshots` blob | `buildFrontierModelsSnapshot.ts` · `update:frontier-models` (seed) | `netlify/functions/refresh-frontier-models.ts` (scheduled function, not an Action) | curated seed + models.dev/OpenRouter fact check | seed manual; facts daily 07:30 UTC |

**Curated surfaces** (`tech-startup-tracker`, `frontier-models`) have no Action
because there's no live source to poll — figures are approximate, tagged with an
`asOf` date and a `verified: false` flag, and disclosed on-page. Refresh by
editing the seed and re-running the builder. Frontier-models additionally runs
the blob-backed fact check described below; the curated seed and editorial
notes remain the source of truth for what is listed.

---

## The blob-backed refresh lane (pilot: frontier-models)

The git-commit pipeline above couples data freshness to deploys: every refresh
is a bot commit, and production only advances when `publish-data.yml` builds and
deploys the site. For surfaces whose data can refresh without review, there is a
second lane that skips both:

1. A **Netlify scheduled function** (`netlify/functions/refresh-frontier-models.ts`,
   in-code `config.schedule`, 30s execution cap) fetches the upstream sources.
2. It writes the refreshed snapshot to the **`dashboard-snapshots` Netlify
   Blobs store** via `src/lib/snapshotBlobStore.ts` (strong consistency,
   `{ savedAt, value }` envelope). Reads are fail-soft and return `null`
   off-Netlify, on any store error, and after a 3 second timeout. **Writes
   throw**, so a broken refresh is a failed function run in the Netlify logs.
   The store is reachable when the runtime sets `NETLIFY_BLOBS_CONTEXT`. The
   `NETLIFY` variable exists during builds only, and gating on it kept this
   lane closed in production, which was serving the committed seeds on
   2026-09-27.
3. The accessor (`src/lib/frontierModelsSnapshot.ts`) reads **blob first with
   the committed seed as fallback**, behind a short in-memory TTL. A blob is
   served only when it is inside its max age, was saved after the committed
   seed was generated, and passes a shape check, so a dead refresh function, a
   seed that was edited since, and a blob from the other side of a schema
   change all fall back to the seed. Local dev and tests always serve the seed.

Nothing purges a CDN cache here. The pages that read these blobs are served
`private, no-store` and set no cache tags, so the purge the lane used to call
removed nothing, and `netlify/functions/purge-cache.ts` was deleted with it.

The committed seed keeps every property the git lane had (reviewable diffs,
local dev, cold-start data); the blob only carries the freshness. Failure at
any step leaves the previous blob or the seed serving.

For frontier-models specifically the refresh is a **fact check, not a rewrite**:
the curated catalog decides which models are listed and every editorial note,
while models.dev + OpenRouter (both keyless) refresh pricing, context windows,
output limits, and cutoffs. Matching is exact-normalized-name per provider,
never fuzzy (the fantasy ADP rule), and each model carries a `liveCheck`
outcome (`confirmed` / `updated` / `curated-only`) surfaced in the on-page
disclosure line. A catalog is a secondary source, and on 2026-09-28 both
catalogs stated DeepSeek's prices differently from DeepSeek's own pricing page.
A model can list facts in `pinnedFacts`, and the check leaves those at their
curated value.

**Related but not this pattern:**
- `/polling-aggregator` is the **second blob-lane surface**: the shared
  VoteHub fetch/transform lives in `src/lib/pollingData.ts`, a Netlify
  scheduled function (`netlify/functions/refresh-polling.ts`, every 6h)
  writes the `polling` blob, the page reads blob-first via
  `src/lib/pollingSnapshot.ts`, and `update-polling.yml` refreshes the
  committed seed daily as the fallback. Freshness is measured from when the
  refresh ran. VoteHub can go weeks without a new poll, so the page prints the
  newest poll date for each series and the age of the newest poll fails nothing.
- `/news-pulse` is **API-backed at request time** (`/api/news-pulse` →
  `src/lib/news-pulse-utils.ts`), not a build-time snapshot.

For the operational view (command → artifact → schedule in one table) see
`docs/DATA_UPDATE_OPERATIONS.md`.

---

## Edge caching for dashboard pages

A dashboard page that reads `searchParams` renders on every request, even when its data only changes with a deploy. `next.config.mjs` holds a list, `cdnCachedPages`, of the pages whose HTML depends on the deploy and the query string and nothing else, and it sends two headers on each one. `Netlify-CDN-Cache-Control` lets Netlify's CDN keep a copy for six hours, which is the interval of the scheduled production deploy, and `Netlify-Vary: query` makes the whole query string part of the cache key. Browsers still receive `private, no-store`, so only the CDN caches.

A page belongs on the list only if nothing in its server render reads the clock, a random number, live data, or Netlify Blobs. A countdown or an age label is fine when it is computed in an effect or read through `useClientNow()`, since the server HTML then carries no time. `src/lib/__tests__/edge-cache-policy.test.ts` spells out the list and the nine pages that stay off it, so adding a page means editing that test too.

One consequence to know about. Twenty of the 23 pages have a `loading.tsx`, so a page that throws after its loading screen has gone out still answers 200 with its error screen, and the CDN would keep that copy until the next deploy or a purge through `netlify/functions/purge-cache.ts`. `/food-map`, `/museum-log`, and `/search` have no `loading.tsx`, so a throw there answers 500. The two headers go out with every status. On the deploy preview for this change, on 2026-09-28, a 404 under them was not stored, and I have not seen what Netlify does with a 500.

What the preview showed for a cached page is a copy kept for the six hours the header asks for. The first request renders the page and stores it, a later request to an edge node that has no copy is answered from Netlify's durable cache, and a request to an edge node that has one is answered from that node. On `/mlb` those took 0.72 s, 0.21 to 0.41 s, and 0.04 s, against 0.36 to 0.57 s for the same page rendered on every request in production, eight requests each from one machine.

---

## Per-route error boundaries

Every snapshot dashboard **must** ship a per-route `error.tsx` (re-exporting the shared
`RouteErrorBoundary` with a bespoke `surfaceName`) **and** a `loading.tsx`
(`RouteLoadingState`), so a render failure shows an editorial, route-specific fallback
instead of the global catch-all, and the first paint isn't blank:

```tsx
// src/app/<x>/error.tsx
"use client";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
export default function Error(props) {
  return <RouteErrorBoundary {...props} surfaceName="Golf" />;
}
```

> The 2026-06 design audit found 8 routes missing `error.tsx` (polling-aggregator,
> github-trending-pulse, fantasy-football, fantasy-football/draft-tracker, frontier-models,
> march-madness-2026, golf, mba-internship-notifications) — see `docs/DESIGN_AUDIT_2026-06.md`
> P0-1. Treat this section as a hard requirement, not a nicety.

**Curated/unverified surfaces** must additionally carry `verified: false` + an `asOf` date in
the snapshot type **and** render an on-page disclosure card (mirror `tech-startup-tracker`).
`/frontier-models` shipped without these (audit P0-3) — don't repeat that.

---

## Adding a new dashboard (checklist)

1. **Types** — `src/types/<x>.ts` (snapshot + summary + detail shapes).
2. **Seed** — `src/data/<x>Snapshot.ts` with an empty/seed `export const`.
3. **Fetch/transform** — `src/lib/<x>Data.ts` (`build<X>SnapshotData()`).
4. **Builder** — `scripts/build<X>Snapshot.ts`: call the fetcher, write
   atomically, fall back via `readGeneratedSnapshot` on failure.
5. **Script** — add `"update:<x>": "tsx scripts/build<X>Snapshot.ts"` to
   `package.json`.
6. **Accessors** — `src/lib/<x>Snapshot.ts` (`get<X>Summary()`, id validation,
   empty-state factory).
7. **API** — only if the client fetches on selection, as a detail route such as
   `src/app/api/<x>/teams/[teamId]/route.ts` (return `400` for malformed ids,
   `404` for unknown). The page reads the summary through the accessor directly.
8. **Route** — `src/app/<x>/page.tsx` server shell + client component with
   deep-linkable state; add `src/app/<x>/error.tsx` **and** `src/app/<x>/loading.tsx`
   (curated/unverified data also needs `verified: false` + `asOf` + an on-page disclosure card).
9. **Action** — `.github/workflows/update-<x>.yml` on a sensible cron + manual
   dispatch, committing the snapshot only when it changes via the shared
   `scripts/ci/commit-and-push-snapshot.sh`.
10. **Docs** — add a row to the table above and to
    `docs/DATA_UPDATE_OPERATIONS.md`; register in `AGENTS.md` Automation Surfaces.
11. Edge cache. If the page's server render reads no clock, random number, live
    data, or Blobs, add its path to `cdnCachedPages` in `next.config.mjs` and to
    `src/lib/__tests__/edge-cache-policy.test.ts`.

Reuse the shared football components in `src/components/football/` (FixtureCard,
LeaderList, StatCard, CrestAvatar, …) wherever the surface is a league/standings
view — the soccer, NBA, NFL, MLB, and World Cup dashboards all do.
