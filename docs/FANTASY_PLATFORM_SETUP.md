# Fantasy Football Platform Setup

Current overview of the fantasy-football surface, its routes, and the mixed data workflows behind it.

**Last updated:** 2026-03-17

---

## Live Routes

Primary fantasy routes:

- `/fantasy-football`
- `/fantasy-football/rb-tiers`
- `/fantasy-football/draft-tracker`
- `/fantasy-football/tiers/[position]`

Supporting APIs:

- `/api/fantasy-data`
- `/api/data-manager`
- `/api/fantasy-pros-session`
- `/api/fantasy-pros-free`
- `/api/scheduled-update`
- `/api/scrape`

---

## How The Data Layer Works

The fantasy platform is not a single-source system.

Current pieces include:

- `src/app/api/fantasy-data/route.ts`
  - public-facing fantasy data endpoint
  - built around nflverse-style data access and caching
- `src/lib/database.ts`
  - SQLite-backed helper for dataset and player storage
- `src/app/api/data-manager/route.ts`
  - operational in-memory store with file-persistence helpers
- `netlify/functions/scheduled-fantasy-update.ts`
  - scheduled updater that calls `/api/scheduled-update`
- `src/lib/playerImageService.ts`
  - checked-in player image mapping for visual surfaces

Some public fantasy views depend on checked-in assets and generated files. Some operational refreshes still use FantasyPros-backed flows.

---

## Local Setup

Base fantasy pages can render without every operational secret.

For fuller local coverage:

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-me
ADMIN_USERNAME=replace-me
ADMIN_PASSWORD=replace-me
CRON_SECRET=replace-me
FANTASYPROS_USERNAME=replace-me
FANTASYPROS_PASSWORD=replace-me
```

---

## Common Workflows

### Refresh RB tiers

```bash
npm run update:fantasy-rb
```

### Check the public fantasy API

```bash
curl "http://localhost:3000/api/fantasy-data?position=RB&scoring=PPR"
```

### Check scheduled update readiness

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/scheduled-update"
```

---

## Persistence Notes

- SQLite schema reference: `docs/DATABASE_SCHEMA.md`
- scheduled refresh details: `docs/CRON_SETUP.md`
- player image mapping reference: `docs/PLAYER_IMAGES_SETUP.md`

Do not assume the fantasy platform is fully database-backed or fully static. The current implementation is mixed by route and workflow.
