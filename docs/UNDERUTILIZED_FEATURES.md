# Underutilized Features Audit

Last updated: 2026-03-04

A comprehensive audit of features that are built but hidden, half-finished, or completely dead. Organized by severity to guide cleanup and completion decisions.

---

## 1. Fully Built but Hidden (no navigation path)

These features are complete and functional but unreachable through normal browsing.

### `/writing` — 16 Published Articles, Zero Discoverability

- **What exists:** Full writing/blog platform at `/writing` with 16 published articles in `content/blog/`. Individual article pages at `/writing/[slug]` render correctly with full markdown processing via `remark`/`remark-gfm`/`remark-html`.
- **The problem:** No link to `/writing` exists anywhere — not in the main navigation (`src/constants/navlinks.tsx`), not in the footer, not on the homepage.
- **Compounding issue:** The `WritingPreview` component on the homepage is silently broken. It calls the search API (`/api/search`) to fetch blog content, but `getAllSearchableContent()` in the search route returns only 5 hardcoded entries with zero blog posts indexed. The component renders nothing.
- **Impact:** 16 pieces of original content are invisible to all visitors and search engines (no internal links = poor crawlability).

### `/search` — Complete UI, Not Linked

- **What exists:** Full search interface at `/search` with `SearchInterface`, `SearchResults`, and `SearchFilters` components.
- **The problem:** The search page is not linked from anywhere in the UI. The search API backing it (`/api/search`) only returns 5 hardcoded results — it never indexes the 16 blog posts or other dynamic content.
- **Impact:** A complete feature gathering dust.

### `/fantasy-football/draft-tracker` — Built but Not Linked

- **What exists:** A working draft tracker page with `DraftTierChart` visualization.
- **The problem:** The fantasy football landing page (`/fantasy-football`) doesn't link to it. Users can only reach it by knowing the URL.

### `/fantasy-football/tiers/[position]` — 8 SEO Pages, No UI Links

- **What exists:** Individual tier ranking pages for QB, RB, WR, TE, K, DST, and Flex positions. These are proper SEO landing pages with position-specific content.
- **The problem:** The fantasy football UI doesn't link to these pages. They exist for search engine traffic but are invisible to users browsing the site.

### 3 of 5 Portfolio Case Studies — Unreachable

- **What exists:** 5 case studies defined in `src/constants/caseStudies.ts`. Each has a detail page at `/portfolio/[slug]`.
- **The problem:** The `/portfolio` page only renders entries with `featured: true`. Only 2 of the 5 case studies are marked as featured, making the other 3 detail pages unreachable through normal browsing.

---

## 2. Intentionally Private (working as designed)

These are hidden on purpose. Documented here for completeness.

### `/investments` — Stock Research & Portfolio Tracker

- **Status:** Fully functional. Includes `PortfolioTracker`, `StockResearch` (multi-panel: DCF, Fundamentals, Growth, Valuation, News, Transcripts, Industry, Profitability), `AllocationChart`, and more.
- **Intentionally hidden:** Has `noindex` meta tag, excluded from sitemap, not in navigation. This is a personal tool.
- **Limitation:** The research tab is limited to ~10 pre-fetched tickers stored as static JSON in `public/data/investments/`. Searching for arbitrary tickers fails unless data has been pre-fetched via `npm run update:investments`.
- **Separate roadmap:** See `docs/FEATURE_ROADMAP.md` for planned investments enhancements.

### `/admin` — Fantasy Data Manager

- **Status:** NextAuth-protected admin dashboard. Provides fantasy data management controls and an analytics sub-page.
- **Note:** The data import handlers in the admin UI are stubs — they all redirect to the unified API endpoint. The analytics dashboard shows hardcoded fake data (see "Half-Built" section below).

---

## 3. Half-Built / Non-Functional in Production

These features appear to work locally but break in production or serve fake data.

### Analytics System — Ephemeral Storage

- **What exists:** Client-side analytics collection works (`src/lib/analytics.ts`). Events are sent to `/api/analytics/` which stores them in in-memory arrays.
- **The problem:** On Netlify (serverless), every cold start wipes the in-memory store. Analytics data is never persisted. The admin analytics dashboard at `/admin/analytics` doesn't even read from this API — it displays hardcoded fake data.
- **What would fix it:** Either integrate with GA4 (the `NEXT_PUBLIC_GA_ID` env var path already exists in the codebase) or add a persistent store.

### RSS Feed (`/api/rss`) — Hardcoded Stale Content

- **What exists:** An RSS endpoint at `/api/rss` that returns valid XML.
- **The problem:** It serves 3 hardcoded posts from January 2025. It never calls `blog.ts` to get actual posts from the `content/blog/` directory. The RSS feed is also not linked from any page or included in `<head>` metadata.

### Local SEO System — Placeholder Data

- **What exists:** `src/lib/localSEO.ts`, `src/lib/localSitemap.ts`, structured data routes at `/sitemap-local.xml` and `/local-business.json`.
- **The problem:** Contains fake phone numbers, a placeholder Google Maps API key, and a "QA consulting" business persona that doesn't match the site's current positioning as a product management portfolio.
- **Impact:** If search engines index this, it could create confusing or incorrect business listings.

### Search API — Hardcoded Results

- **What exists:** `/api/search` with `getAllSearchableContent()` function.
- **The problem:** Returns exactly 5 hardcoded entries. Does not index the 16 blog posts in `content/blog/`, portfolio case studies, or any other dynamic content. The search UI at `/search` is only as good as this backing API.

---

## 4. Dead Code

Code that is never executed, has been superseded, or serves no purpose.

### Components

| File | Lines | Status |
|---|---|---|
| `src/components/QADashboard.tsx` | ~282 | Never imported anywhere. References a QA consulting persona that doesn't exist on the site. |
| `src/components/TierChart.tsx` | — | Original D3 tier chart. Superseded by `LightweightTierChart`. The lazy loader in `src/components/lazy/` already redirects to the lightweight version. |
| `src/components/DraftTierChart.tsx` | — | Exported from the lazy loader but never consumed by any page or component. |

### Routes

| File | Status |
|---|---|
| `src/app/blog/[slug]/page.tsx` | Contains only a `notFound()` call. The redirect in `next.config.mjs` handles `/blog/[slug]` → `/writing/[slug]` before this route is ever hit. This file is a redundant safety net. |

### API Routes

| File | Status |
|---|---|
| `/api/fantasy-pros/route.ts` | Marked `@deprecated` in source. Only referenced by the admin validate function. Superseded by the unified FantasyPros API. |

### Libraries

| File | Status |
|---|---|
| `src/lib/webScraper.ts` | Original prototype web scraper. Superseded by `fantasyProsAPI.ts`. Still imported by `dataManager.ts` but the import path is likely unused at runtime. |

### Content

| Path | Status |
|---|---|
| `content/writing/` | Contains 16 markdown files that are exact duplicates of the 16 files in `content/blog/`. Nothing in the application reads from `content/writing/` — all blog processing in `src/lib/blog.ts` reads from `content/blog/`. |

### Scripts

| Path | Status |
|---|---|
| `scripts/*.js` (62 files) | One-off player image scraping utilities from a completed image acquisition campaign. Includes scrapers for ESPN, NFL, Yahoo, Sleeper, etc. The campaign is over and these are no longer needed. |
| `scripts/image-validation-report.json` | Stale artifact from the image scraping campaign. |
| `scripts/players-to-rescrape.json` | Stale artifact from the image scraping campaign. |

### Documentation Inaccuracy

- The **accessibility page** (`/accessibility`) documents a `Cmd+K` command palette for keyboard navigation. No such command palette exists in the codebase. The `CommandPalette` component was never built.

---

## Summary Table

| Category | Count | Action Needed |
|---|---|---|
| Built but hidden | 5 features | Add navigation links |
| Intentionally private | 2 features | None (working as designed) |
| Half-built / broken in prod | 4 features | Fix or remove |
| Dead components | 3 | Delete |
| Dead routes | 1 | Delete |
| Dead API routes | 1 | Delete |
| Dead libraries | 1 | Delete |
| Duplicate content | 1 directory | Delete |
| Orphaned scripts | 62+ files | Delete |
| Doc inaccuracies | 1 | Fix |
