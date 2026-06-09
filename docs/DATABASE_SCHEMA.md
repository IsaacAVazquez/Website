# Database Schema

Historical reference for the removed SQLite-backed fantasy football data layer.

**Last updated:** 2026-06-08

---

## Status

There is no live `src/lib/database.ts` file in the current app tree, and the public fantasy football platform is no longer documented as a SQLite-backed system.

Current fantasy data flow:

- `npm run update:fantasy`
- `scripts/buildFantasyPositionData.ts`
- `scripts/buildFantasySnapshots.ts`
- `src/data/fantasyPositionData.generated.ts`
- `src/data/fantasySnapshotRevision.generated.ts`
- `public/data/fantasy/{ppr,half_ppr,standard}.json`
- `/api/fantasy-data`, which reads the generated public snapshots through `src/lib/fantasySnapshotServer.ts`

Draft tracker state is browser-local. The live app does not expose `/api/data-manager`, `/api/data-metadata`, `/api/sample-data`, or `/api/scheduled-update`.

---

## Historical Context

Older docs referenced a SQLite schema with `datasets`, `players`, `cache_metadata`, and `data_quality_logs` tables. Those notes are retained only as historical context and should not guide current implementation work.

Use `docs/FANTASY_PLATFORM_SETUP.md`, `API.md`, and `docs/ai-context/DATA-PIPELINE.md` for the current fantasy workflow.
