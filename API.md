# API Reference

Current API route inventory for the app.

**Last updated:** 2026-03-17

---

## Route Inventory

### Auth

| Route | Methods | Notes |
|------|---------|-------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth credential auth for `/admin` |

### Fantasy football

| Route | Methods | Notes |
|------|---------|-------|
| `/api/fantasy-data` | GET | Main fantasy data route |
| `/api/fantasy-pros-free` | GET | Public/free fantasy data path |
| `/api/fantasy-pros-session` | GET, POST | Session-backed FantasyPros flow |
| `/api/data-manager` | GET, POST | Fantasy data management utilities |
| `/api/data-metadata` | GET | Freshness and metadata |
| `/api/sample-data` | GET | Fallback sample data |
| `/api/scheduled-update` | POST | Scheduled refresh route |

### Investments

| Route | Methods | Notes |
|------|---------|-------|
| `/api/investments/index` | GET | Curated research index / availability info |
| `/api/investments/quotes` | GET | Quote proxy for investments UI |
| `/api/investments/data/[symbol]` | GET | Section-based curated research payloads |
| `/api/stocks` | GET | Quote source used by investments flows |

### Content and utilities

| Route | Methods | Notes |
|------|---------|-------|
| `/api/rss` | GET | RSS feed |
| `/api/search` | GET | Limited search endpoint; not full-site search |
| `/api/scrape` | GET, POST | Utility scraping endpoint |

---

## Important API Notes

### Search limitations

`/api/search` is currently a small, mostly hardcoded index. It should be documented honestly:

- useful for the existing UI
- not comprehensive
- not a reliable source of truth for all writing or project content

### Investments routes

The current investments implementation is **not** a single generic `/api/investments` endpoint.

The live pattern is:

- `/api/investments/index`
- `/api/investments/quotes`
- `/api/investments/data/[symbol]`

### Admin auth

Admin access is backed by NextAuth credentials configured in:

- `src/lib/auth.ts`
- `/api/auth/[...nextauth]`

---

## Common Response Shapes

There is no single strict global response contract across every route, but most handlers return JSON objects with some combination of:

```ts
{
  success?: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}
```

Route-specific payloads vary and should be checked in the route file itself before making assumptions.

---

## Source Files

Use these as the actual source of truth:

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/fantasy-data/route.ts`
- `src/app/api/fantasy-pros-free/route.ts`
- `src/app/api/fantasy-pros-session/route.ts`
- `src/app/api/data-manager/route.ts`
- `src/app/api/data-metadata/route.ts`
- `src/app/api/sample-data/route.ts`
- `src/app/api/scheduled-update/route.ts`
- `src/app/api/investments/index/route.ts`
- `src/app/api/investments/quotes/route.ts`
- `src/app/api/investments/data/[symbol]/route.ts`
- `src/app/api/stocks/route.ts`
- `src/app/api/rss/route.ts`
- `src/app/api/search/route.ts`
- `src/app/api/scrape/route.ts`

---

## Related Docs

- `ARCHITECTURE.md`
- `DEVELOPMENT.md`
- `docs/ai-context/API-ROUTES.md`
- `docs/ai-context/DATA-PIPELINE.md`
