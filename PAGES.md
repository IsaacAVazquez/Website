# Page Architecture

Current route inventory and page ownership for the live app.

**Framework:** Next.js 16 App Router
**Last updated:** 2026-04-14

---

## Route Inventory

### Core portfolio routes

| Route | File | Notes |
|------|------|-------|
| `/` | `src/app/page.tsx` | Composes hero, featured projects, product-thinking preview, and homepage contact section |
| `/about` | `src/app/about/page.tsx` | Renders `About` tabbed client UI |
| `/portfolio` | `src/app/portfolio/page.tsx` | Renders project cards directly from route code |
| `/portfolio/[slug]` | `src/app/portfolio/[slug]/page.tsx` | Project detail page |
| `/resume` | `src/app/resume/page.tsx` | Resume route with client-rendered resume shell |
| `/contact` | `src/app/contact/page.tsx` | Contact page using `ContactContent` |
| `/accessibility` | `src/app/accessibility/page.tsx` | Accessibility statement |

### Writing

| Route | File | Notes |
|------|------|-------|
| `/writing` | `src/app/writing/page.tsx` | Lists posts from `content/blog/` |
| `/writing/[slug]` | `src/app/writing/[slug]/page.tsx` | Server-rendered article page |

### Investments, sports, and standalone data tools

| Route | File | Notes |
|------|------|-------|
| `/investments` | `src/app/investments/page.tsx` | Public investment research platform |
| `/march-madness-2026` | `src/app/march-madness-2026/page.tsx` | Metadata-driven bracket analysis with client UI |
| `/premier-league` | `src/app/premier-league/page.tsx` | Snapshot-backed Premier League dashboard |
| `/la-liga` | `src/app/la-liga/page.tsx` | Snapshot-backed La Liga dashboard |
| `/news-pulse` | `src/app/news-pulse/page.tsx` | News Pulse dashboard |
| `/spacex-mission-control` | `src/app/spacex-mission-control/page.tsx` | SpaceX Mission Control dashboard |
| `/polling-aggregator` | `src/app/polling-aggregator/page.tsx` | Snapshot-backed political polling dashboard |
| `/fintech-tools/budget-planner` | `src/app/fintech-tools/budget-planner/page.tsx` | Budget planner tool |
| `/fintech-tools/interchange-iq` | `src/app/fintech-tools/interchange-iq/page.tsx` | Interchange fee analyzer |
| `/mba-internship-notifications` | `src/app/mba-internship-notifications/page.tsx` | Live MBA role tracker polling 32 tech companies for internships and full-time business roles |

### Fantasy football

| Route | File | Notes |
|------|------|-------|
| `/fantasy-football` | `src/app/fantasy-football/page.tsx` | Fantasy football landing page |
| `/fantasy-football/tiers/[position]` | `src/app/fantasy-football/tiers/[position]/page.tsx` | Redirects to the canonical fantasy board with query parameters |
| `/fantasy-football/rb-tiers` | `src/app/fantasy-football/rb-tiers/page.tsx` | Redirects to the canonical RB board with query parameters |
| `/fantasy-football/draft-tracker` | `src/app/fantasy-football/draft-tracker/page.tsx` | Draft tracker |

### Utility/admin

| Route | File | Notes |
|------|------|-------|
| `/search` | `src/app/search/page.tsx` | Search UI backed by limited `/api/search` |
| `/admin` | `src/app/admin/page.tsx` | Credentials-based admin screen |

---

## Redirects And Canonical Paths

Do not create these as real app routes:

- `/projects` -> `/portfolio`
- `/work` -> `/portfolio`
- `/blog` -> `/writing`
- `/blog/:slug` -> `/writing/:slug`

Fantasy shortcut and typo redirects also live in `next.config.mjs`.

---

## Shell Behavior

### Global shell

- `src/app/layout.tsx` renders the shared fonts, providers, skip link, and header
- `src/components/ConditionalLayout.tsx` wraps all page content and chooses layout behavior
- `src/components/Footer.tsx` is always rendered, but not always in the same variant

### Self-shell routes

These routes manage more of their own spacing and width:

- `/about`
- `/contact`
- `/fantasy-football`
- `/fantasy-football/draft-tracker`
- `/fintech-tools/budget-planner`
- `/investments`
- `/la-liga`
- `/premier-league`
- `/march-madness-2026`
- `/mba-internship-notifications`
- `/news-pulse`
- `/polling-aggregator`
- `/portfolio`
- `/portfolio/[slug]`
- `/writing`
- `/writing/[slug]`
- `/resume`
- `/spacex-mission-control`

### Footer variants

- `/` and `/contact` use the compact footer
- most other routes use the full `Thanks for taking a look.` footer

---

## Important Page Notes

- `/portfolio` no longer relies on `ProjectsContent.tsx`; that component is legacy/unwired for the main route
- `Writing` is a live route and a top-level nav item
- `/march-madness-2026` is a first-class route and should be documented anywhere route inventories or SEO coverage are described
- `/premier-league` and `/la-liga` are live off-nav sports data dashboards with self-managed shells
- `/news-pulse`, `/spacex-mission-control`, `/polling-aggregator`, `/mba-internship-notifications`, and `/fintech-tools/*` are live standalone tool surfaces even though they are not promoted in the global header
- `/search` exists, but its data quality is limited by the current hardcoded search API
- there is no live `/admin/analytics` page in the current app tree

---

## Metadata Pattern

Most routes use helpers from `src/lib/seo.ts`:

- `constructMetadata(...)` for static pages
- `generateMetadata(...)` for slug or query-driven routes

Structured data is added route-by-route with `StructuredData` and `AIStructuredData`.
