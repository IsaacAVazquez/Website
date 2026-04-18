# Pages — AI Context

Fast route reference for the current app.

**Last updated:** 2026-04-10

---

## Live Route Inventory

| Route | File | Render Pattern |
|------|------|----------------|
| `/` | `src/app/page.tsx` | Server page composing client sections |
| `/about` | `src/app/about/page.tsx` | Server page -> `About` client component |
| `/portfolio` | `src/app/portfolio/page.tsx` | Server page rendering cards directly |
| `/portfolio/[slug]` | `src/app/portfolio/[slug]/page.tsx` | Server detail page |
| `/resume` | `src/app/resume/page.tsx` | Server page -> client resume UI |
| `/contact` | `src/app/contact/page.tsx` | Server page -> `ContactContent` |
| `/accessibility` | `src/app/accessibility/page.tsx` | Server page |
| `/writing` | `src/app/writing/page.tsx` | Async server page |
| `/writing/[slug]` | `src/app/writing/[slug]/page.tsx` | Async server page |
| `/investments` | `src/app/investments/page.tsx` | Server page -> `InvestmentsClient` |
| `/formula-1` | `src/app/formula-1/page.tsx` | Server page -> `Formula1Client` |
| `/premier-league` | `src/app/premier-league/page.tsx` | Server page -> `PremierLeagueClient` |
| `/la-liga` | `src/app/la-liga/page.tsx` | Server page -> `LaLigaClient` |
| `/march-madness-2026` | `src/app/march-madness-2026/page.tsx` | Async server page -> `MarchMadnessClient` |
| `/news-pulse` | `src/app/news-pulse/page.tsx` | Server page -> `NewsPulseClient` |
| `/spacex-mission-control` | `src/app/spacex-mission-control/page.tsx` | Server page -> SpaceX client dashboard |
| `/polling-aggregator` | `src/app/polling-aggregator/page.tsx` | Async server page -> `PollingAggregatorClient` |
| `/fintech-tools/budget-planner` | `src/app/fintech-tools/budget-planner/page.tsx` | Server page -> budget planner client |
| `/fintech-tools/interchange-iq` | `src/app/fintech-tools/interchange-iq/page.tsx` | Server page -> `InterchangeIQClient` |
| `/fantasy-football` | `src/app/fantasy-football/page.tsx` | Server page -> fantasy client UI |
| `/fantasy-football/tiers/[position]` | `src/app/fantasy-football/tiers/[position]/page.tsx` | Redirect page to the canonical fantasy board |
| `/fantasy-football/rb-tiers` | `src/app/fantasy-football/rb-tiers/page.tsx` | Redirect page to the canonical RB board |
| `/fantasy-football/draft-tracker` | `src/app/fantasy-football/draft-tracker/page.tsx` | Server page |
| `/search` | `src/app/search/page.tsx` | Search UI page |
| `/admin` | `src/app/admin/page.tsx` | Auth-aware admin page |

There is no live `/admin/analytics` route in the current app tree.

---

## Shared Layout Facts

- `src/app/layout.tsx` renders fonts, providers, skip link, and `StaticHeader`
- `ConditionalLayout` wraps page content and footer
- self-shell routes:
  - `/about`
  - `/contact`
  - `/fantasy-football`
  - `/fantasy-football/draft-tracker`
  - `/fintech-tools/budget-planner`
  - `/formula-1`
  - `/investments`
  - `/la-liga`
  - `/premier-league`
  - `/march-madness-2026`
  - `/news-pulse`
  - `/polling-aggregator`
  - `/portfolio`
  - `/portfolio/[slug]`
  - `/resume`
  - `/spacex-mission-control`
  - `/writing`
  - `/writing/[slug]`

Semantics:

- `ConditionalLayout` owns the only `main` landmark for self-shell routes
- route files inside that shell should not render another `main`
- portfolio-shell routes should render one page-level `h1`

Footer behavior:

- compact footer on `/` and `/contact`
- full footer on most other pages

---

## Route-Specific Notes

### `/portfolio`

- uses ordered helpers from `caseStudiesData`
- renders the full non-`comingSoon` project index directly from the route
- cards should make role, problem space, and impact scannable before click-through
- do not document `ProjectsContent.tsx` as the primary live implementation

### `/writing`

- backed by `content/blog/`
- `Writing` is promoted in the main nav
- route should still be discoverable from portfolio-shell CTAs and cross-links

### `/resume`

- uses the shared shell now and should not drift into a disconnected visual language
- keep the content resume-first even when refreshing the presentation

### `/investments`

- route metadata presents it as a public investment research platform
- client shell lives in `src/app/investments/investments-client.tsx`

### `/march-madness-2026`

- server entry provides metadata, breadcrumb/article/FAQ/sports structured data
- client route supports deep-linked state through query params

### `/premier-league`

- server entry provides metadata plus breadcrumb and sports-application structured data
- client route supports deep-linked `overview`, `fixtures`, and `team` views through query params

### `/formula-1`

- server entry provides metadata plus breadcrumb and software-application structured data
- client route supports deep-linked `overview`, `drivers`, `constructors`, and `calendar` views through query params

### `/la-liga`

- server entry provides metadata plus breadcrumb and sports-application structured data
- client route supports deep-linked `overview`, `fixtures`, `europe`, `relegation`, and club views through query params

### Standalone data tools

- `/news-pulse` is a live route backed by `/api/news-pulse`
- `/spacex-mission-control` is a live route backed by `/api/spacex/*`
- `/polling-aggregator` is a live route backed by `src/data/pollingSnapshot.ts`
- `/fintech-tools/budget-planner` and `/fintech-tools/interchange-iq` are live fintech tool routes

### `/search`

- search UI exists, but its backing API is limited and mostly hardcoded

---

## Redirect Rules

Canonical routes:

- `/portfolio`, not `/projects`
- `/writing`, not `/blog`

See `REDIRECTS-AND-NAVIGATION.md` for the redirect table.
