# SEO & Metadata — AI Context

Current metadata and structured-data reference.

**Last updated:** 2026-07-08

---

## Metadata Pattern

Most pages use helpers from `src/lib/seo.ts`, especially:

- `constructMetadata(...)`
- breadcrumb helpers

Dynamic routes use `generateMetadata(...)` where needed.

---

## Current Notable Metadata Surfaces

### Homepage

- central metadata lives in `src/app/metadata.ts`
- emphasizes product management, projects, and analytics-heavy work

### Investments

- `/investments` is positioned as a public investment research platform
- includes `SoftwareApplication` structured data

### March Madness

- `/march-madness-2026` includes:
  - canonical metadata
  - route-specific OG image
  - `Article`
  - `FAQPage`
  - `SportsApplication`
  - `BreadcrumbList`

### Football dashboards

- `/premier-league` uses snapshot-date metadata plus breadcrumb and sports-application structured data
- `/la-liga` uses route metadata plus breadcrumb and sports-application structured data

### Standalone data tools

- `/news-pulse`, `/spacex-mission-control`, `/polling-aggregator`, `/fintech-tools/budget-planner`, and `/fintech-tools/interchange-iq` include route metadata and structured data

### Writing

- writing index emits breadcrumb and per-post article structured data
- article pages generate route-specific metadata from post frontmatter
- portfolio index emits an ItemList; non-redirect case-study pages emit breadcrumb plus CreativeWork structured data

---

## Structured Data Helpers

Main components:

- `src/components/StructuredData.tsx`
- `src/components/AIStructuredData.tsx`

Use them for:

- breadcrumbs
- articles
- profile/about surfaces
- software application surfaces
- FAQ pages
- sports analysis routes

---

## Sitemap

`next-sitemap.config.js` drives sitemap generation, but it delegates to helpers in `src/lib/sitemap.js` (required at the top of the config). `src/lib/sitemap.js` owns the per-route `lastmod` logic — a static `STATIC_ROUTE_LASTMOD` map plus per-dashboard `read*Lastmod()` readers that pull dates from the committed snapshots. Update both files together when changing sitemap behavior.

Notable routes to verify in generated sitemap output:

- `/`
- `/portfolio`
- `/about`
- `/resume`
- `/investments`
- `/march-madness-2026`
- `/premier-league`
- `/la-liga`
- `/news-pulse`
- `/spacex-mission-control`
- `/polling-aggregator`
- `/fintech-tools/budget-planner`
- `/fintech-tools/interchange-iq`
- `/contact`
- `/writing`
- fantasy football routes
- discovered writing posts from `content/blog/`

---

## Search And Discoverability Caveat

Search-related docs should be explicit that:

- `/writing` is crawlable and fully documented through metadata and sitemap
- `/api/search` is still limited and mostly hardcoded

Do not imply that the search API is the foundation of discoverability across the whole site.

---

## Robots And Canonicals

- canonical routes prefer `/portfolio` over `/projects`
- canonical routes prefer `/writing` over `/blog`
- Netlify and Next config handle redirect support for legacy URLs

Check `next.config.mjs`, `next-sitemap.config.js`, `src/lib/sitemap.js`, and route metadata exports before updating this doc.
