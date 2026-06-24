# Snapshot-Driven Dashboards

How the site's data dashboards work. This is the single most-repeated
architecture in the repo — 15+ public surfaces share it — so it gets one
reference instead of being re-explained per route.

**Last updated:** 2026-06-16

The short version: **no dashboard calls an external API at request time.** A
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
| **GitHub Action** | `.github/workflows/update-<x>.yml` | Runs the builder on a schedule (+ manual dispatch) and commits the snapshot only when it changes. |
| **Accessors** | `src/lib/<x>Snapshot.ts` | Pure read helpers the app and API routes call (`get<X>Summary()`, per-entity getters, id validation, empty-state factories). |
| **API route(s)** | `src/app/api/<x>/summary/route.ts` (+ optional `[id]`) | Thin handlers that return accessor output. They read the committed snapshot, never the upstream source. |

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
language/topic) wraps each call in `withRetry` (`scripts/fetchRetry.ts`) so a
transient blip on one segment doesn't discard the whole refresh. It tolerates a
few segments failing outright — skipping them and writing the rest fresh — but
aborts (keeping the previous snapshot) once `MAX_FAILED_SEGMENTS` is exceeded,
so a broad outage never gets written as a gutted snapshot. The two football
builders (`buildPremierLeagueSnapshot.ts`, `updateLaLigaSnapshot.ts`) both honor
the contract identically: a thrown fetch **or** a successful-but-empty standings
response falls back to the committed snapshot.

---

## Worked example: `/golf` (the simplest one)

1. **Source:** ESPN's public golf leaderboard endpoint, no token.
2. **Builder:** `scripts/buildGolfSnapshot.ts` calls `buildGolfSnapshotData()`
   from `src/lib/golfData.ts`, JSON-stringifies the result into
   `src/data/golfSnapshot.ts`, with the `readGeneratedSnapshot` fallback above.
3. **Action:** `.github/workflows/update-golf.yml` runs daily at 08:40 UTC and
   commits `src/data/golfSnapshot.ts` when it changes.
4. **Accessors:** `src/lib/golfSnapshot.ts` exposes `getGolfSummary()`,
   `getGolfPlayerSnapshot(id)`, `createEmptyGolfSummary()`, and id validation.
5. **API:** `/api/golf/summary` and `/api/golf/players/[playerId]`.

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
| `/premier-league` | `src/data/premierLeagueSnapshot.ts` | `buildPremierLeagueSnapshot.ts` · `update:premier-league` / `update:football` | `update-premier-league.yml` | football-data.org (token) | daily 06:15 UTC, Aug–May |
| `/la-liga` | `src/data/laLigaSnapshot.ts` | `updateLaLigaSnapshot.ts` · `update:la-liga` / `update:football` | `update-la-liga.yml` | football-data.org (token) | daily 06:30 UTC, Aug–May |
| `/nfl` | `src/data/nflSnapshot.ts` | `updateNflSnapshot.ts` · `update:nfl` | `update-nfl.yml` | NFLverse CSVs | Tue 10:35 UTC, Sep–Feb |
| `/mlb` | `src/data/mlbSnapshot.ts` | `updateMlbSnapshot.ts` · `update:mlb` | `update-mlb.yml` | MLB Stats API | daily 10:05 UTC, Apr–Oct |
| `/nba` | `src/data/nbaSnapshot.ts` | `updateNbaSnapshot.ts` · `update:nba` | `update-nba.yml` | ESPN NBA | daily 10:20 UTC, mid-Oct–Jun |
| `/golf` | `src/data/golfSnapshot.ts` | `buildGolfSnapshot.ts` · `update:golf` | `update-golf.yml` | ESPN golf | daily 08:40 UTC |
| `/formula-1`, `/fantasy-formula-1` | `src/data/formula1Snapshot.ts` | `buildFormula1Snapshot.ts` · `update:formula-1` | `update-formula-1.yml` | OpenF1 | daily 08:10 UTC |
| `/world-cup-2026` | `src/data/worldCupSnapshot.ts` | `buildWorldCupSnapshot.ts` · `update:world-cup` | `update-world-cup.yml` | ESPN `soccer/fifa.world` | every 6h, Jun–Jul |
| `/bay-area-transit` | `src/data/bayAreaTransitSnapshot.ts` | `buildBayAreaTransitSnapshot.ts` · `update:bay-area-transit` | `update-bay-area-transit.yml` | BART public API (demo key) | every 6h, year-round |
| `/earthquake-pulse` | `src/data/earthquakeSnapshot.ts` | `buildEarthquakeSnapshot.ts` · `update:earthquake` | `update-earthquake.yml` | USGS GeoJSON feeds | hourly (min 20) |
| `/github-trending-pulse` | `src/data/githubTrendingSnapshot.ts` | `buildGitHubTrendingSnapshot.ts` · `update:github-trending` | `update-github-trending.yml` | GitHub Search API | daily 07:45 UTC |
| `/spacex-mission-control` | `src/data/spacexSnapshot.generated.json` (+ image manifest) | `buildSpaceXSnapshot.ts` · `update:spacex` | `update-spacex.yml` | Launch Library / SpaceDevs | daily 09:25 + 21:25 UTC |
| `/tech-startup-tracker` | `src/data/techStartupSnapshot.ts` | `buildTechStartupSnapshot.ts` · `update:tech-startups` | none (curated) | hand-maintained seed | manual |
| `/frontier-models` | `src/data/frontierModelsSnapshot.ts` | `buildFrontierModelsSnapshot.ts` · `update:frontier-models` | none (curated) | `scripts/data/frontierModels.source.ts` | manual |

**Curated surfaces** (`tech-startup-tracker`, `frontier-models`) have no Action
because there's no live source to poll — figures are approximate, tagged with an
`asOf` date and a `verified: false` flag, and disclosed on-page. Refresh by
editing the seed and re-running the builder.

**Related but not this pattern:**
- `/polling-aggregator` reads a committed `src/data/pollingSnapshot.ts` with **no
  builder or Action** — a static curated snapshot.
- `/news-pulse` is **API-backed at request time** (`/api/news-pulse` →
  `src/lib/news-pulse-utils.ts`), not a build-time snapshot.

For the operational view (command → artifact → schedule in one table) see
`docs/DATA_UPDATE_OPERATIONS.md`.

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
7. **API** — `src/app/api/<x>/summary/route.ts` (+ `[id]` if there's a detail
   panel; return `400` for malformed ids, `404` for unknown).
8. **Route** — `src/app/<x>/page.tsx` server shell + client component with
   deep-linkable state; add `src/app/<x>/error.tsx` **and** `src/app/<x>/loading.tsx`
   (curated/unverified data also needs `verified: false` + `asOf` + an on-page disclosure card).
9. **Action** — `.github/workflows/update-<x>.yml` on a sensible cron + manual
   dispatch, committing the snapshot only when it changes.
10. **Docs** — add a row to the table above and to
    `docs/DATA_UPDATE_OPERATIONS.md`; register in `AGENTS.md` Automation Surfaces.

Reuse the shared football components in `src/components/football/` (FixtureCard,
LeaderList, StatCard, CrestAvatar, …) wherever the surface is a league/standings
view — the soccer, NBA, NFL, MLB, and World Cup dashboards all do.
