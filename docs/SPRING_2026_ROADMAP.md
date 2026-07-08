# Spring 2026 Roadmap

Last updated: 2026-06-23

A cross-site roadmap of new features and fixes for the next batch of work.
Each item is grounded in a verified codebase sweep — the repo currently has
**zero `TODO`/`FIXME`/`HACK` markers**, so this list is built from real gaps,
not stale comments. Supersedes the investments-only `docs/FEATURE_ROADMAP.md`
(2026-04-05 snapshot, kept for history).

Format follows the prior roadmap: each item carries a `Status` + `Effort`
line, a short description, and the files it touches. Effort is rough:
Tiny (< 1 hr), Small (2–3 hrs), Medium (3–6 hrs), High (1+ day).

---

## Priority 1 — Fixes & Hardening

Low-effort gaps with clear, correct fixes. Do these first.

### P1-A: Error boundaries for `/golf` and `/polling-aggregator`
**Status:** Not started | **Effort:** Tiny (< 1 hr)
These are the only two snapshot-reading dashboard routes missing an
`error.tsx`. Every other data dashboard (`/nba`, `/nfl`, `/mlb`, `/formula-1`,
`/world-cup-2026`, etc.) wraps its surface in the shared editorial fallback.
Add the same boundary by re-exporting `RouteErrorBoundary` with a `surfaceName`.
- **Pattern to reuse:** `src/components/RouteErrorBoundary.tsx` and any existing
  `src/app/<route>/error.tsx`
- **Files:** new `src/app/golf/error.tsx`, new `src/app/polling-aggregator/error.tsx`

### P1-B: Standalone typecheck gate in CI
**Status:** Not started | **Effort:** Small (2–3 hrs)
`next.config.mjs` sets `typescript.ignoreBuildErrors: true` (line 182), so type
regressions can ship without failing the build. Add a separate `tsc --noEmit`
npm script and run it in CI — without flipping the build flag, so deploys stay
unblocked while type drift is still caught.
- **Files:** `package.json` (new `typecheck` script), `.github/workflows/*` (new step)

### P1-C: Accessibility page date drift
**Status:** Not started | **Effort:** Tiny (< 1 hr)
The `/accessibility` page shows an "Updated" date that conflicts with its
authored date. Reconcile to a single accurate date.
- **Files:** `src/app/accessibility/page.tsx`

### P1-D: Content image alt-text audit
**Status:** Not started | **Effort:** Small–Medium (3–5 hrs)
Audit alt text on content and case-study images for SEO + accessibility.
Fill gaps and replace generic/empty values with descriptive text.
- **Files:** content images and the components that render them (portfolio cards,
  writing surface, case studies)

---

## Priority 2 — Discoverability & SEO

Surfaces that already exist but aren't reachable or indexed.

### P2-A: Surface the draft tracker
**Status:** Not started | **Effort:** Small (2–3 hrs)
`/fantasy-football/draft-tracker` is built but not linked from the
`/fantasy-football` landing page, so it's effectively orphaned. Add in-page
navigation to it. (The `/fantasy-football/tiers/[position]` and `/rb-tiers`
routes are redirect-only shims to the main fantasy page, not standalone pages.)
- **Files:** `src/app/fantasy-football/fantasy-football-client.tsx`

### P2-B: Wire up the RSS feed
**Status:** Not started | **Effort:** Tiny (< 1 hr)
`/api/rss` now serves real blog posts but isn't referenced in `<head>` or linked
from any page. Add the `<link rel="alternate" type="application/rss+xml">` tag
and a footer link.
- **Files:** `src/app/layout.tsx`, `src/components/Footer.tsx`

### P2-C: Resolve hidden case studies
**Status:** Not started | **Effort:** Small (2–3 hrs)
Three of five entries in `src/constants/caseStudies.ts` are unreachable — only
two are `featured: true` on `/portfolio`. Decide per case study: feature it,
give it a route, or prune it.
- **Files:** `src/constants/caseStudies.ts`, `src/app/portfolio/page.tsx`

---

## Priority 3 — New Features

### P3-A: Investments Watchlist
**Status:** Not started | **Effort:** Small (2–3 hrs)
*(Carried from the April roadmap — still not started.)* A third top-level tab
alongside My Portfolio and Research that tracks symbols without shares/cost —
current price, daily change, and a quick-research button. localStorage-backed,
reusing existing quote-fetching and `StockSearch` infrastructure.
- **Files:** new `src/components/investments/Watchlist.tsx`, edit `investments-client.tsx`

### P3-B: Portfolio performance chart over time
**Status:** Not started | **Effort:** Medium (4–6 hrs)
*(Carried from the April roadmap.)* Reconstruct historical daily portfolio value
(shares × historical close) and render a D3 line chart with 1M/3M/6M/1Y/All
range buttons; annotate buy/sell events as dots.
- **Data available:** `data/investments-raw/{symbol}/price.json`
- **Files:** new `src/components/investments/PortfolioChartPanel.tsx`, edit `investments-client.tsx`

### P3-C: `loading.tsx` for client-heavy routes
**Status:** Not started | **Effort:** Small per route
The snapshot dashboards stream with a `loading.tsx`, but several client-heavy
routes don't: `/fantasy-football`, `/decision-lab`, the personal-interest tools
(`/travel`, `/wine-cellar`, `/museum-log`, `/recipe-finder`, `/food-map`), the
fintech tools, and `/mba-internship-notifications`. Add skeleton loading states
to match the established pattern.
- **Files:** new `loading.tsx` under each route folder

---

## Priority 4 — Data Integrity & Code Health

### P4-A: Re-pin retirement capital-market assumptions
**Status:** Not started | **Effort:** Medium (3–5 hrs)
`src/lib/retirement/capitalMarketAssumptions.ts` ships `CMA_VERIFIED = false`
(line 44) with illustrative figures. Re-pin the return/volatility numbers to a
dated primary source and flip the flag to `true`. The UI already discloses the
unverified state, so this removes the disclaimer's "unverified" branch honestly.
- **Files:** `src/lib/retirement/capitalMarketAssumptions.ts`

### P4-B: Tech-startup dataset verification pass
**Status:** Not started | **Effort:** Medium (3–4 hrs)
`src/data/techStartupSnapshot.ts` carries `verified: false`. Refresh the seed
funding/valuation figures and `asOf` against current public reporting via the
editorial source in `scripts/buildTechStartupSnapshot.ts`.
- **Files:** `scripts/buildTechStartupSnapshot.ts` (seed/AS_OF), regenerated `src/data/techStartupSnapshot.ts`

### P4-C: Code-split remaining heavy client components
**Status:** Not started | **Effort:** Medium (3–4 hrs)
The MBA tracker already lazy-loads its heavy modals via `next/dynamic`. Apply
the same pattern to the museum-log and NFL components that still load eagerly.
- **Files:** `src/app/museum-log/*`, `src/app/nfl/*` and their modal components

### P4-D: Component unit tests for primary surfaces
**Status:** Not started | **Effort:** High (1+ day)
The highest-traffic surfaces — `HomePageV3`, `PortfolioV3`, `AboutV3` — have no
component-level tests. Add coverage following the existing `react-dom/client` /
Testing Library mix described in `TESTING.md`.
- **Files:** new tests under `src/components/__tests__/` (or co-located)

### P4-E: Decide the fate of `ProjectsContent.tsx`
**Status:** Not started | **Effort:** Small (2–3 hrs)
`ProjectsContent.tsx` (~710 lines) is no longer the primary `/portfolio`
implementation — the route page renders cards directly — and it's now only
referenced by tests. Prune it (and its tests) or document why it's retained.
- **Files:** `src/components/ProjectsContent.tsx` and its tests

---

## Notes

- This is an internal planning doc; the user-facing voice rules in
  `WRITING_VOICE.md` do not apply here.
- Items marked *carried* originated in `docs/FEATURE_ROADMAP.md` and remain open.
- When picking up an item, confirm the current state against the code first —
  per `docs/README.md`, code wins over docs.
