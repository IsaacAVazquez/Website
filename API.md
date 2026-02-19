# API Reference

The site exposes several Next.js App Router API routes (located in `src/app/api`). They power internal dashboards, automation hooks, and public data endpoints. This document highlights the important ones and how to exercise them locally.

## Base URL

- **Local**: `http://localhost:3000/api/*`
- **Production**: `https://isaacavazquez.com/api/*`

All routes return JSON (unless otherwise noted) and are server-only; there is no separate Express/Koa app.

## Fantasy Data

| Route | Description | Notes |
| --- | --- | --- |
| `/api/fantasy-data` | Aggregated fantasy rankings used across `/fantasy-football/*`. | Reads from `fantasy-data.db` or sample files in `src/data/`. |
| `/api/fantasy-pros` + `/fantasy-pros-free` | Proxy endpoints for FantasyPros data pulls. | Keys loaded from `.env.local`; used by automation scripts. |
| `/api/data-pipeline`, `/api/scheduled-update`, `/api/scrape` | Hooks invoked by cron/Netlify background jobs. | Documented in `docs/AUTOMATION_SCRIPTS.md`. |

## Portfolio + Content Utilities

| Route | Description |
| --- | --- |
| `/api/search` | Content + project search index for the floating search UI. |
| `/api/newsletter` | Newsletter signup proxy (handles spam protection + reCAPTCHA). |
| `/api/rss` | Generates the RSS/Atom feed for writing updates. |
| `/api/analytics` | Collects lightweight analytics events (page + CTA interactions). |

## Data/Metadata Helpers

| Route | Description |
| --- | --- |
| `/api/player-images-mapping` | Returns the canonical map of player IDs → image URLs. |
| `/api/data-manager` / `/api/data-metadata` | Surfaces the current ingestion status, timestamps, and job IDs. |
| `/api/sample-data` | Provides seed data for demos/tests when the database is unavailable. |

## Testing the APIs

```bash
# Example: fetch fantasy rankings locally
curl http://localhost:3000/api/fantasy-data | jq '.players | length'

# Trigger the scheduled update (in dev)
curl -X POST http://localhost:3000/api/scheduled-update
```

## Security

- Sensitive API routes check for secrets (`X-API-KEY`, Service Tokens) before mutating data.
- Store credentials in `.env.local` (see `GETTING-STARTED.md`). Production secrets live in Netlify environment variables.
- See `docs/SECURITY.md` for broader hardening guidance.

Need data model details? Review `docs/DATABASE_SCHEMA.md`. For cron + automation usage, open `docs/FANTASY_PLATFORM_SETUP.md` and `docs/AUTOMATION_SCRIPTS.md`.
