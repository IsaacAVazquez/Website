> [!IMPORTANT]
> Historical reference only. This file captures an older feature audit and is not a current source of truth by itself. Use `AGENT.md`, `README.md`, `PAGES.md`, `COMPONENTS.md`, `ARCHITECTURE.md`, `API.md`, and `docs/README.md` for current documentation.

# Underutilized Features Audit

Last updated: 2026-03-05

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

- **Status:** Fully functional. Includes `PortfolioTracker`, `StockResearch` (multi-panel: DCF, Fundamentals, Growth, Valuation, News, Industry, Profitability), `AllocationChart`, and more.
- **Intentionally hidden:** Has `noindex` meta tag, excluded from sitemap, not in navigation. This is a personal tool.
- **Limitation:** The research tab is limited to ~10 pre-fetched tickers stored as static JSON in `public/data/investments/`. Searching for arbitrary tickers fails unless data has been pre-fetched via `npm run update:investments`.
- **Separate roadmap:** See `docs/FEATURE_ROADMAP.md` for planned investments enhancements.

### `/admin` — Fantasy Data Manager

- **Status:** NextAuth-protected admin dashboard. Provides fantasy data management controls (CSV upload, URL import, text parsing, web scraping, FantasyPros login, and free rankings fetch).

---

## 3. Half-Built / Non-Functional in Production

These features appear to work locally but break in production or serve fake data.

### RSS Feed (`/api/rss`) — Hardcoded Stale Content

- **What exists:** An RSS endpoint at `/api/rss` that returns valid XML.
- **The problem:** It serves 3 hardcoded posts from January 2025. It never calls `blog.ts` to get actual posts from the `content/blog/` directory. The RSS feed is also not linked from any page or included in `<head>` metadata.

### Search API — Hardcoded Results

- **What exists:** `/api/search` with `getAllSearchableContent()` function.
- **The problem:** Returns exactly 5 hardcoded entries. Does not index the 16 blog posts in `content/blog/`, portfolio case studies, or any other dynamic content. The search UI at `/search` is only as good as this backing API.

---

## 4. Dead Code

All dead code has been removed. No items remain in this category.

---

## Summary Table

| Category | Count | Action Needed |
|---|---|---|
| Built but hidden | 5 features | Add navigation links |
| Intentionally private | 2 features | None (working as designed) |
| Half-built / broken in prod | 2 features | Fix or remove |
| Dead code | 0 | ✅ All removed |
