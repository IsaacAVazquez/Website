# Data Pipeline — AI Context

Current high-level data flow reference.

**Last updated:** 2026-03-17

---

## Portfolio And Route Data

- project metadata comes from `src/constants/caseStudies.ts`
- navigation data comes from `src/constants/navlinks.tsx`
- most marketing/portfolio pages are statically described and metadata-driven

---

## Writing Pipeline

Source:

- `content/blog/*.mdx`

Loader:

- `src/lib/blog.ts`

Flow:

1. read frontmatter with `gray-matter`
2. parse markdown with `remark`, `remark-gfm`, and `remark-html`
3. build the writing index and individual article pages

---

## Investments Pipeline

The live investments experience uses a curated snapshot model.

Main pieces:

- route shell: `src/app/investments/investments-client.tsx`
- local portfolio state: `src/hooks/useInvestments.ts`
- research section fetching: `src/hooks/useStockData.ts`
- API routes:
  - `/api/investments/index`
  - `/api/investments/quotes`
  - `/api/investments/data/[symbol]`
  - `/api/stocks`

Update path:

- `npm run update:investments`
- runs the Python fetch script and snapshot build pipeline

---

## Fantasy Football Pipeline

The fantasy stack mixes:

- API-backed ranking fetches
- sample-data fallbacks
- scheduled refresh endpoints
- SQLite persistence and helper libraries

The exact ingestion flow is broader than this quick reference, so verify the current implementation in:

- `src/app/api/fantasy-data/route.ts`
- `src/app/api/fantasy-pros-session/route.ts`
- `src/app/api/data-manager/route.ts`
- `src/lib/`
- `scripts/updateFantasyRBTiers.ts`

---

## Search Pipeline

Current search is intentionally limited:

- `/api/search` returns a small hardcoded/static content set
- `/search` consumes that route

Do not describe this as a full dynamic content index.

---

## Seasonal Analysis Pipeline

March Madness is split between:

- route metadata and structured data in the server page
- interactive state and content in the client route files
- companion article content in `content/blog/2026-march-madness-bracket-analysis.mdx`

---

## Rule Of Thumb

When updating docs:

- treat `content/blog/` as the source for writing content
- treat `src/constants/*` as the source for static portfolio data
- treat `src/app/api/**` as the source for live API data paths
- treat older plan docs as historical unless they are explicitly refreshed
