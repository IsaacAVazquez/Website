# Pages — AI Context

Fast route reference for the current app.

**Last updated:** 2026-04-03

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
| `/premier-league` | `src/app/premier-league/page.tsx` | Server page -> `PremierLeagueClient` |
| `/march-madness-2026` | `src/app/march-madness-2026/page.tsx` | Async server page -> `MarchMadnessClient` |
| `/fantasy-football` | `src/app/fantasy-football/page.tsx` | Server page -> fantasy client UI |
| `/fantasy-football/tiers/[position]` | `src/app/fantasy-football/tiers/[position]/page.tsx` | Async server page |
| `/fantasy-football/rb-tiers` | `src/app/fantasy-football/rb-tiers/page.tsx` | Server page |
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
  - `/investments`
  - `/premier-league`
  - `/march-madness-2026`
  - `/portfolio`
  - `/portfolio/[slug]`
  - `/resume`
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

### `/search`

- search UI exists, but its backing API is limited and mostly hardcoded

---

## Redirect Rules

Canonical routes:

- `/portfolio`, not `/projects`
- `/writing`, not `/blog`

See `REDIRECTS-AND-NAVIGATION.md` for the redirect table.
