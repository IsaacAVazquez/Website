# Redirects and navigation (AI context)

Current nav model, redirect table, and shell notes.

**Last updated:** 2026-11-24

---

## Global navigation

Defined in `src/constants/catalog97Nav.ts` as `catalog97NavLinks`.

Current header items:

| Label | href |
|------|------|
| Home | `/` |
| Work | `/portfolio` |
| Writing | `/writing` |
| Dashboards | `/dashboards` |
| About | `/about` |
| Résumé | `/resume` |
| Contact | `/contact` |

The same file exports `isCatalog97Route`, an exact-match test against those seven hrefs. It also exports `DASHBOARD_ROUTES` and `isDashboardRoute`, the live tool routes that `/dashboards` lists (`src/constants/__tests__/project-routes-complete.test.ts` fails when that list drifts from the case studies' links), and `WIDE_TOOL_ROUTES`, the dense tools whose shells print on the wide column.

---

## Header and footer behavior

`src/components/catalog97/Catalog97Header.tsx` renders the header on every route. It maps `catalog97NavLinks` and gives the link whose href equals the pathname `aria-current="page"`. Since 2026-10-02 it also gives a link `aria-current="true"` when the pathname sits below its href (`/writing/<slug>` under Writing, for instance), and gives Dashboards that mark on every route `isDashboardRoute` matches, so a tool page reads as part of the Dashboards section. It opens site search on Cmd/Ctrl+K or `/`, and carries the theme toggle.

`src/components/ConditionalLayout.tsx` has two branches. The seven routes above pass through untouched because their page components render `Catalog97Shell` themselves. Every other route is wrapped in `src/components/catalog97/Catalog97ToolShell.tsx`, which takes `wide` from `WIDE_TOOL_ROUTES` and a build-note link from `projectBuildNoteLinks`. Both paths get the same header, the only page-level `main`, and the espresso footer from `Catalog97Shell`.

The footer prints three link groups from `Catalog97Shell.tsx`. Pages holds Work, Writing, and Dashboards, Elsewhere holds GitHub, LinkedIn, and Résumé, and Site holds Now, Changelog, Accessibility, and Privacy. Its colophon also links `/back-room/receipt` (Print receipt) and `/back-room/registration` (the printer registration mark), two of the easter egg pages in `docs/EASTER_EGGS.md`.

The eight fantasy football routes print a second nav under the header. `src/app/fantasy-football/layout.tsx` renders `src/components/fantasy/FantasyProductBar.tsx`, a `nav` labelled Fantasy football that links all eight routes in three groups (the redraft tools, the best ball pair, and the in-season pair) and gives the link whose href equals the pathname `aria-current="page"`.

The earlier `StaticHeader.tsx`, `Footer.tsx` (with its `full` and `compact` variants), and `src/constants/navlinks.tsx` were deleted on 2026-09-16. See the "Routes, Navigation, and Shell" section of the root `CLAUDE.md` and the route map in `AGENTS.md`.

---

## Redirects

Defined in `next.config.mjs`.

### Portfolio and writing

- `/projects` -> `/portfolio`
- `/work` -> `/portfolio`
- `/projects/:path*` -> `/portfolio/:path*`
- `/blog` -> `/writing`
- `/blog/:slug` -> `/writing/:slug`
- `/blog/posts/:slug` -> `/writing/:slug`
- `/blog/:path+` -> `/writing` (any deeper old blog path, such as a dated archive or category)
- `/articles/:slug` -> `/writing/:slug`

### Investments

- `/portfolio/investment-analytics-platform` -> `/investments`

### Retired portfolio case studies -> writing

Old `/portfolio/<slug>` case-study URLs now redirect to their writing posts:

- `/portfolio/textout-platform` -> `/writing/textout-platform`
- `/portfolio/runningmate-platform` -> `/writing/runningmate-platform-launch`
- `/portfolio/civic-engagement-platform-scale` -> `/writing/scaling-civic-engagement-platform`
- `/portfolio/campaign-analytics-dashboard` -> `/writing/campaign-self-service-analytics`
- `/portfolio/qa-automation-framework` -> `/writing/qa-automation-daily-deploys`
- `/portfolio/pulse-dashboards` -> `/writing/building-the-pulse-dashboard-family`
- `/portfolio/performance-intelligence` -> `/writing/proactive-performance-intelligence`
- `/portfolio/pricing-strategy-initiative` -> `/writing/pricing-strategy-initiative`
- `/portfolio/digital-acquisition-strategy` -> `/writing/digital-acquisition-strategy`

These live in `retiredPortfolioDestinations` in `next.config.mjs`, which also redirects `/projects/<slug>` for each of these slugs (and for `investment-analytics-platform`) straight to the destination, ahead of the `/projects/:path*` wildcard, so an old link takes one hop. Every other `/portfolio/<slug>` that names a case study reaches `src/app/portfolio/[slug]/page.tsx`, which is only a redirect stub. It permanent-redirects the slug to that case study's live tool and returns a 404 for any slug it does not know, and no case study template renders there any more.

### Fintech tools index

- `/fintech-tools` -> `/dashboards` (temporary, since the fintech tools have no index page of their own)

### Contact and resume aliases

- `/get-in-touch` -> `/contact`
- `/hire-me` -> `/contact`
- `/cv` -> `/resume`
- `/resume.pdf` -> `/Isaac_Vazquez_Resume.pdf`

### Changelog and feed aliases

- `/release-notes` -> `/changelog`
- `/rss`, `/feed`, `/feed.xml`, `/rss.xml` -> `/api/rss`

### Fantasy shortcuts

- `/ff` and `/rankings` -> `/fantasy-football`
- `/qb`, `/rb`, `/wr`, and `/te` -> `/fantasy-football?position=<pos>&scoring=ppr`
- `/fantasy-football/rb-tiers` -> `/fantasy-football?position=rb&scoring=ppr` (permanent)
- `/fantasy-football/tiers/:position` -> `/fantasy-football?position=:position&scoring=ppr` (permanent; the retired tier pages)
- typo corrections: `/fantsy-football/:path*` and `/fantasy-footbal/:path*` -> `/fantasy-football/:path*`, and `/quatrerback` -> `/fantasy-football?position=qb&scoring=ppr`

Every fantasy shortcut and typo redirect is temporary except the two retired tier paths.

---

## Important accuracy notes

- `/portfolio` is the canonical projects route
- `/writing` is the canonical writing route
- `Work` is the public-facing nav label even though the route stays `/portfolio`
- `Writing` is again a promoted global-nav item
- `/investments`, `/investments/before-you-buy`, `/march-madness-2026`, `/fantasy-football/*`, `/formula-1`, `/fantasy-formula-1`, `/premier-league`, `/la-liga`, `/mlb`, `/nba`, `/nfl`, `/golf`, `/world-cup-2026`, `/earthquake-pulse`, `/bay-area-transit`, `/tech-startup-tracker`, `/github-trending-pulse`, `/agent-build-index`, `/ai-dev-tools`, `/frontier-models`, `/decision-lab`, `/enablement-assistant`, `/food-map`, `/recipe-finder`, `/wine-cellar`, `/travel`, `/travel-deals`, `/score-pools`, `/arcade`, `/news-pulse`, `/spacex-mission-control`, `/polling-aggregator`, `/mba-internship-notifications`, `/museum-log`, `/now`, `/changelog`, and `/fintech-tools/*` are live routes but not promoted in the global header. The ones listed in `DASHBOARD_ROUTES`, and the pages below them, still mark Dashboards as the current section through `isDashboardRoute`
- `/search`, `/accessibility`, `/privacy`, the `/back-room/*` easter egg pages, and the `/teapot` route handler are also live and off the header; the footer links Accessibility, Privacy, and two back-room pages, and the header's Search button opens the search panel
