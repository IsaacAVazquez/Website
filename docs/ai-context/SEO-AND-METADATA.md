# SEO & Metadata — AI Context

Current metadata and structured-data reference.

**Last updated:** 2026-11-02

---

## Metadata Pattern

Most pages use helpers from `src/lib/seo.ts`, especially:

- `constructMetadata(...)`
- breadcrumb helpers

Dynamic routes use `generateMetadata(...)` where needed. `/about` calls `generateAIOptimizedMetadata(...)`, a compatibility wrapper that passes its fields through to `constructMetadata`.

A route folder with its own `opengraph-image.tsx` passes that card to `constructMetadata` as `image`, and every other page falls back to the root card at `/opengraph-image`.

---

## Current Notable Metadata Surfaces

### Homepage

- central metadata lives in `src/app/metadata.ts`
- the title and description name the Berkeley Haas MBA, the move into product, six years in campaign data and QA, and the summer 2026 Juno growth internship
- the page renders `Person` and `WebSite` structured data

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

### Sports dashboards

- `/premier-league` uses snapshot-date metadata plus breadcrumb and sports-application structured data
- `/la-liga` uses snapshot-date metadata plus breadcrumb and sports-application structured data
- `/world-cup-2026`, `/nfl`, `/nba`, `/mlb`, `/formula-1`, `/fantasy-formula-1`, `/golf`, `/score-pools`, `/fantasy-football`, and `/fantasy-football/best-ball` carry the same breadcrumb and sports-application pair
- the other fantasy football pages pair the breadcrumb with the plain `SoftwareApplication` preset
- the sports-application schema is `StructuredData`'s `SportsApplication` preset, which prints a `SoftwareApplication` whose `applicationCategory` defaults to `SportsApplication`

### Standalone data tools

- `/news-pulse`, `/spacex-mission-control`, `/polling-aggregator`, `/fintech-tools/budget-planner`, and `/fintech-tools/interchange-iq` include route metadata and structured data

### Writing

- the writing index emits a `BreadcrumbList` and an `ItemList` with one entry per published post
- article pages generate route-specific metadata from post frontmatter, with a per-post Open Graph card at `/writing/<slug>/opengraph-image`, plus `Breadcrumb` and `Article` structured data
- `/writing/topics/[topic]` builds its metadata from `BLOG_TOPIC_PAGES` in `src/lib/blog-config.ts` and emits a `BreadcrumbList` and an `ItemList` of the topic's posts
- the portfolio index emits a `BreadcrumbList` and an `ItemList` of its lead projects (`WORK_LEAD_COUNT`); `/portfolio/[slug]` is a redirect stub that permanent-redirects each case study to its live tool (404 otherwise), so no case study page renders metadata or structured data

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
- datasets (`Dataset` on `/frontier-models`, `/earthquake-pulse`, `/github-trending-pulse`, and `/agent-build-index`)
- collection pages (`ItemList` on `/dashboards`, `/portfolio`, `/writing`, and the writing topic pages)
- plain information pages (`WebPage` on `/accessibility`, `/privacy`, `/now`, `/changelog`, `/arcade`, `/score-pools/tracker`, and `/score-pools/settings`)
- the contact page (`ContactPage` on `/contact`)

---

## Sitemap

`scripts/generatePublicSitemap.mjs` (run by `npm run generate:sitemap`, by `postbuild`, and by the snapshot commit helper `scripts/ci/commit-and-push-snapshot.sh`) writes `public/sitemap.xml` from `PUBLIC_SITEMAP_ENTRIES` in `src/lib/sitemap.js`. There is no `next-sitemap.config.js`. `src/lib/sitemap.js` builds the route list by walking every `src/app/**/page.tsx` and dropping pages that mark themselves noindex or only redirect, then adds the writing topic pages, the published posts, and any case study without a `link` (none as of 2026-11-02). It owns the per-route `lastmod` logic, which is a static `STATIC_ROUTE_LASTMOD` map plus per-dashboard `read*Lastmod()` readers that pull dates from the committed snapshots, and it sets each entry's `priority` and `changefreq` from `PRIMARY_ROUTES`, `SECTION_HUB_ROUTES`, and `CHANGEFREQ_BY_ROUTE`. Update both files together when changing sitemap behavior.

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
- writing topic pages from `BLOG_TOPIC_PAGES`
- discovered writing posts from `content/blog/`

---

## Search And Discoverability Caveat

Search-related docs should be explicit that:

- `/writing` is crawlable and fully documented through metadata and sitemap
- `/api/search` is still limited. It matches substrings and tags across the published posts' text, the case studies, and a hand-written list of the other pages and their search keywords, and it indexes no dashboard data

Do not imply that the search API is the foundation of discoverability across the whole site.

---

## Robots And Canonicals

- canonical routes prefer `/portfolio` over `/projects` and `/work`
- canonical routes prefer `/writing` over `/blog`
- `next.config.mjs` holds the legacy URL redirects, and `netlify.toml` and `public/` carry no redirect rules of their own
- `public/robots.txt` is maintained by hand. The search and answer crawlers and Google-Extended get the same rules as `*`, the model-training crawlers are blocked from everything, and `src/lib/__tests__/crawler-policy.test.ts` checks both.
- `public/llms.txt` is maintained by hand and linked from the root layout. `public/llms-full.txt` is generated by `npm run build:llms` (`scripts/buildLlmsFull.mjs`) during `postbuild`, and the generated copy is committed.
- `npm run submit:indexnow` posts every URL in `public/sitemap.xml` to IndexNow, and no workflow runs it

Check `next.config.mjs`, `public/robots.txt`, `scripts/generatePublicSitemap.mjs`, `src/lib/sitemap.js`, and route metadata exports before updating this doc.
