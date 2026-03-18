# SEO & Metadata — AI Context

Current metadata and structured-data reference.

**Last updated:** 2026-03-17

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

### Writing

- writing index emits breadcrumb and per-post article structured data
- article pages generate route-specific metadata from post frontmatter

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

`next-sitemap.config.js` is the source of truth for sitemap generation.

Notable currently included routes:

- `/`
- `/portfolio`
- `/about`
- `/resume`
- `/investments`
- `/march-madness-2026`
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

Check `next.config.mjs`, `next-sitemap.config.js`, and route metadata exports before updating this doc.
