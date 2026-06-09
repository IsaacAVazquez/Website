# Fantasy Football Platform Setup

Current overview of the fantasy-football surface, its routes, and the generated snapshot workflow behind it.

**Last updated:** 2026-06-08

---

## Live Routes

Primary fantasy routes:

- `/fantasy-football`
- `/fantasy-football/draft-tracker`

Redirect-only legacy fantasy routes:

- `/fantasy-football/rb-tiers` -> `/fantasy-football?position=rb&scoring=ppr`
- `/fantasy-football/tiers/[position]` -> the canonical fantasy board with query parameters

Supporting API:

- `/api/fantasy-data`

There are no live `/api/fantasy-pros-*`, `/api/data-manager`, `/api/data-metadata`, `/api/sample-data`, `/api/scheduled-update`, or `/api/scrape` routes in the current app tree.

---

## How The Data Layer Works

The fantasy platform is generated snapshot first.

Current pieces include:

- `scripts/buildFantasyPositionData.ts`
  - fetches and normalizes position-level source data
  - writes `src/data/fantasyPositionData.generated.ts`
- `scripts/buildFantasySnapshots.ts`
  - builds the published scoring-format snapshots
  - writes `src/data/fantasySnapshotRevision.generated.ts`
  - writes `public/data/fantasy/ppr.json`
  - writes `public/data/fantasy/half_ppr.json`
  - writes `public/data/fantasy/standard.json`
- `src/app/fantasy-football/fantasy-football-client.tsx`
  - client rankings and tiers UI
- `src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx`
  - local-storage-backed draft assistant
- `src/app/api/fantasy-data/route.ts`
  - rate-limited server fallback over the generated public snapshots
- `src/lib/fantasySnapshotServer.ts`
  - reads generated public snapshot files for the API route
- `src/lib/fantasy.ts`
  - shared normalization, scoring, and fantasy response helpers
- `src/components/fantasy/TierBreakdown.tsx`
  - tier view used by the rankings UI

The public app and API route read checked-in generated artifacts. Scheduled refreshes happen through `.github/workflows/update-fantasy.yml`, which runs `npm run update:fantasy` and commits changed snapshot artifacts.

---

## Local Setup

Base fantasy pages can render without operational secrets.

Run the app:

```bash
npm install
npm run dev
```

Rebuild the current fantasy snapshots:

```bash
npm run update:fantasy
```

---

## Common Workflows

### Refresh published fantasy snapshots

```bash
npm run update:fantasy
```

This command runs:

1. `tsx scripts/buildFantasyPositionData.ts`
2. `tsx scripts/buildFantasySnapshots.ts`

Commit the generated artifacts when they change.

### Check the public fantasy API

```bash
curl "http://localhost:3000/api/fantasy-data?position=RB&scoring=PPR"
```

Fetch all positions for a scoring format:

```bash
curl "http://localhost:3000/api/fantasy-data?scoring=PPR&all=true"
```

---

## Persistence Notes

- Public ranking data is persisted as checked-in JSON under `public/data/fantasy/`.
- Generated TypeScript metadata is persisted under `src/data/`.
- Draft tracker state is browser-local.
- `public/fantasy/rb_current.json` remains as a legacy artifact, but the live RB tier route redirects to the canonical fantasy board.

Do not assume the current fantasy platform is database-backed or has a live FantasyPros API surface.
