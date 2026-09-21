# Redirects & Navigation — AI Context

Current nav model, redirect table, and shell notes.

**Last updated:** 2026-09-21

---

## Global Navigation

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

The same file exports `isCatalog97Route`, an exact-match test against those seven hrefs.

---

## Header and footer behavior

`src/components/catalog97/Catalog97Header.tsx` renders the header on every route. It maps `catalog97NavLinks`, marks a link active only when the pathname equals its href, opens site search on Cmd/Ctrl+K or `/`, and carries the theme toggle.

`src/components/ConditionalLayout.tsx` has two branches. The seven routes above pass through untouched because their page components render `Catalog97Shell` themselves. Every other route, `/admin` included, is wrapped in `src/components/catalog97/Catalog97ToolShell.tsx`. Both paths get the same header, the only page-level `main`, and the espresso footer from `Catalog97Shell`.

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
- `/portfolio/performance-intelligence` -> `/writing/proactive-performance-intelligence`
- `/portfolio/pricing-strategy-initiative` -> `/writing/pricing-strategy-initiative`
- `/portfolio/digital-acquisition-strategy` -> `/writing/digital-acquisition-strategy`

### Contact and resume aliases

- `/get-in-touch` -> `/contact`
- `/hire-me` -> `/contact`
- `/cv` -> `/resume`
- `/resume.pdf` -> `/Isaac_Vazquez_Resume.pdf`

### Changelog and feed aliases

- `/release-notes` -> `/changelog`
- `/rss`, `/feed`, `/feed.xml`, `/rss.xml` -> `/api/rss`

### Fantasy shortcuts

- `/ff`
- `/rankings`
- `/qb`
- `/rb`
- `/wr`
- `/te`
- typo-correction routes for fantasy-football

---

## Important Accuracy Notes

- `/portfolio` is the canonical projects route
- `/writing` is the canonical writing route
- `Work` is the public-facing nav label even though the route stays `/portfolio`
- `Writing` is again a promoted global-nav item
- `/formula-1`, `/fantasy-formula-1`, `/premier-league`, `/la-liga`, `/mlb`, `/nba`, `/nfl`, `/golf`, `/world-cup-2026`, `/earthquake-pulse`, `/bay-area-transit`, `/tech-startup-tracker`, `/github-trending-pulse`, `/ai-dev-tools`, `/frontier-models`, `/decision-lab`, `/food-map`, `/recipe-finder`, `/wine-cellar`, `/travel`, `/news-pulse`, `/spacex-mission-control`, `/polling-aggregator`, `/mba-internship-notifications`, `/museum-log`, `/now`, `/changelog`, and `/fintech-tools/*` are live routes but not promoted in the global header
