# API Reference

All API routes are Next.js App Router handlers located in `src/app/api/`. They are server-only (no separate Express/Koa app), return JSON, and follow a consistent response format.

**Last Updated:** March 2026

## Base URLs

- **Local:** `http://localhost:3000/api/*`
- **Production:** `https://isaacavazquez.com/api/*`

## Response Format

```typescript
interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

**HTTP status codes:** `200` Success · `400` Bad Request · `401` Unauthorized · `429` Rate Limited · `500` Server Error

---

## Fantasy Football APIs

| Route | Method | Description |
|-------|--------|-------------|
| `/api/fantasy-data/` | GET | Aggregated player rankings for all positions. Reads from `fantasy-data.db` (SQLite) or sample files in `src/data/`. |
| `/api/fantasy-pros/` | GET/POST | Proxy for FantasyPros authenticated data pulls. Requires `FANTASYPROS_USERNAME` / `FANTASYPROS_PASSWORD` env vars. |
| `/api/fantasy-pros-free/` | GET | FantasyPros free-tier data (no auth required). |
| `/api/fantasy-pros-session/` | GET/POST | Manages FantasyPros login session state for scraping. |
| `/api/data-manager/` | GET/POST | Data management operations (clear cache, force refresh). |
| `/api/data-metadata/` | GET | Returns ingestion status, timestamps, and data freshness info. |
| `/api/sample-data/` | GET | Seed data for demos/tests when the database is unavailable. |
| `/api/scheduled-update/` | POST | Cron/Netlify trigger for automated daily data refresh. Requires `CRON_SECRET` header. |

### Quick Examples

```bash
# Fetch fantasy rankings
curl http://localhost:3000/api/fantasy-data | jq '.players | length'

# Trigger a scheduled update manually
curl -X POST http://localhost:3000/api/scheduled-update \
  -H "x-cron-secret: $CRON_SECRET"

# Check data freshness
curl http://localhost:3000/api/data-metadata | jq '.lastUpdated'
```

---

## Portfolio & Content APIs

| Route | Method | Description |
|-------|--------|-------------|
| `/api/search/` | GET | Full-text search across portfolio content, projects, and writing. |
| `/api/rss/` | GET | RSS/Atom feed for writing updates. |
| `/api/analytics/` | POST | Collects lightweight analytics events (page views, CTA clicks, web vitals). |
| `/api/scrape/` | GET/POST | Web scraping utilities. |

---

## Financial APIs

| Route | Method | Description |
|-------|--------|-------------|
| `/api/investments/` | GET | Investment/stock portfolio data. |
| `/api/stocks/` | GET | Individual stock data (backed by Yahoo Finance via `src/lib/yahooFinance.ts`). |

---

## Authentication

| Route | Description |
|-------|-------------|
| `/api/auth/` | NextAuth.js endpoints (`/api/auth/signin`, `/api/auth/session`, etc.). Protects `/admin` routes. |

---

## Security

- Mutation routes (scheduled-update, data-manager) check for `x-cron-secret` or service tokens before executing.
- Store credentials in `.env.local` for local development. Production secrets are in the Netlify dashboard.
- All routes are rate-limited via `src/lib/rateLimit.ts`.
- See [`docs/SECURITY.md`](./docs/SECURITY.md) for full hardening guidance.

---

## Related Documentation

- **[docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** – SQLite schema and data models
- **[docs/FANTASY_PLATFORM_SETUP.md](./docs/FANTASY_PLATFORM_SETUP.md)** – Fantasy platform setup
- **[docs/AUTOMATION_SCRIPTS.md](./docs/AUTOMATION_SCRIPTS.md)** – Cron and automation details
- **[docs/ENVIRONMENT_CONFIGURATION.md](./docs/ENVIRONMENT_CONFIGURATION.md)** – All environment variables
