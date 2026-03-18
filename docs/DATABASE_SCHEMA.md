# Database Schema

Current reference for the SQLite-backed part of the fantasy football data layer.

**Last updated:** 2026-03-17

---

## Scope

This file documents `src/lib/database.ts`.

Important nuance:

- the repo does have a SQLite database manager
- not every fantasy route reads directly from SQLite
- some operational flows also use in-memory stores and file outputs

So this is a schema reference for one part of the fantasy system, not a full description of every runtime data path.

---

## Database File

- default path: `./fantasy-data.db`
- server-only dependency: `better-sqlite3`
- WAL mode can be enabled through the database manager configuration

---

## Tables

### `datasets`

Tracks each imported or generated dataset.

Key fields:

- `id`
- `name`
- `position`
- `scoring_format`
- `source`
- `week`
- `year`
- `player_count`
- `created_at`
- `updated_at`
- `is_active`

### `players`

Stores player rows associated with a dataset.

Key fields:

- `dataset_id`
- `player_id`
- `name`
- `team`
- `position`
- `average_rank`
- `projected_points`
- `standard_deviation`
- `tier`
- `min_rank`
- `max_rank`
- `expert_ranks`
- `bye_week`
- `injury_status`
- `opponent`
- timestamps

### `cache_metadata`

Tracks freshness and cache access metadata.

Key fields:

- `key`
- `expires_at`
- `created_at`
- `hit_count`
- `last_accessed`

### `data_quality_logs`

Tracks fetch and validation events.

Key fields:

- `dataset_id`
- `event_type`
- `message`
- `details`
- `created_at`

---

## Indexes

Current indexes optimize:

- dataset lookup by position and scoring format
- active dataset filtering
- player lookup by dataset, position, tier, and average rank
- cache expiry scans
- data quality log filtering by dataset, event type, and timestamp

See `src/lib/database.ts` for the exact `CREATE INDEX` statements.

---

## Related Systems

The broader fantasy data flow also involves:

- `src/app/api/fantasy-data/route.ts`
- `src/app/api/data-manager/route.ts`
- `src/lib/dataFileWriter.ts`
- `docs/FANTASY_PLATFORM_SETUP.md`

Do not assume SQLite is the only persistence layer in the repo.
