# Component Reusability Audit

**Date:** 2026-06-10
**Scope:** `src/components/**` (127 files), all dashboard/tool client components under `src/app/**`, and formatting utilities in `src/lib/**`.
**Method:** Import-graph analysis (grep for consumers of every shared component), per-route pattern sampling across 28 dashboard/tool routes, and verification greps for every duplicated-utility claim. Counts cited below were confirmed directly against the codebase.

---

## Executive summary

The design system core is healthy: `src/components/football/*`, `StructuredData`, `RouteErrorBoundary`, `RouteLoadingState`, `WarmCard`, `ModernButton`, and `ServerIcons` are genuinely reused and well-layered. The problems are concentrated in three places:

1. **A dead-code cluster of ~15 components** rooted in the pre-V3 page implementations (`ProjectsContent`, `About`, `ModernHero`, etc.). Nothing live imports them, but they keep an entire chain of `ui/` primitives (`Badge`, `MetricCallout`, `SectionIntro`, `Paragraph`, `JourneyTimeline`, `OptimizedImage`) alive with exactly one dead consumer each.
2. **Cross-route duplication in the dashboards.** 18+ routes hand-roll the same query-param view-state sync hook (~30–50 lines each), 23+ hand-roll the same `aria-pressed` pill toggle bar, and at least 10 small formatters (`formatGeneratedAt`, `formatFixed`, `formatRecord`, …) are re-implemented per route despite `src/lib/date-formatters.ts` already existing.
3. **The five V3 page shells** (360–853 lines each) repeat the same masthead/kicker/stat-strip scaffolding with per-page CSS modules and use none of the shared editorial components.

None of this blocks shipping, but the duplication tax is real: every new dashboard copies ~100+ lines of boilerplate, and behavior fixes (e.g., to the view-state sync) must be applied in up to 18 places.

---

## 1. What is working (the real design-system core)

| Component | Consumers | Notes |
|---|---|---|
| `StructuredData` | ~35 | On nearly every route. |
| `ServerIcons` | ~25 | Icon barrel; heavily used. |
| `WarmCard` (ui) | ~18 | Primary card wrapper for portfolio + investments. |
| `RouteErrorBoundary` / `RouteLoadingState` | 14 each | Used by `error.tsx` / `loading.tsx` per route, as documented in CLAUDE.md. |
| `ModernButton` (ui) | ~10 | Primary CTA button. |
| `football/*` (StatCard, MetricCard, InfoChip, EmptyPanel, SurfaceCard, FixtureCard, FixtureGroupSection, LeaderList, TeamResultPill, CrestAvatar) | 6–10 each | Cleanly composed (EmptyPanel wraps SurfaceCard; FixtureGroupSection wraps FixtureCard). Reused well beyond football: NBA, NFL, MLB, Formula 1, World Cup, tech-startup-tracker, github-trending-pulse, ai-dev-tools, frontier-models. |
| `editorial/*` (EditorialPillButton, StatusPanel, InlineSectionLead, UtilityStrip, insetPanelStyle) | 3 routes | Used by mba-jobs, news-pulse, and recipe-finder clients. Alive, but underused (see §4). |
| `src/lib/fantasyUtils.ts` | 5 files | Model citizen: one utility module shared by rankings, tiers, and all three draft-tracker components. |

The card family is **not** duplicative despite appearances: `WarmCard` (page-level container), `SurfaceCard` (dashboard container), `StatCard` (headline metric), `MetricCard` (table/list metric), and `InfoChip` (label pill) serve distinct layers. Same for the theme-toggle trio (`ThemeToggle` + `DeferredThemeToggle` + `ThemeToggleFallback`), which is the correct SSR-deferral pattern, not redundancy.

---

## 2. Dead code: the pre-V3 cluster

The V3 migration (`HomePageV3`, `AboutV3`, `ContactV3`, `PortfolioV3`, `WritingArchiveV3`) replaced the old page components but never deleted them. Verified zero live imports for all of the following.

**Orphaned roots (zero imports anywhere):**

- `src/components/ProjectsContent.tsx` (~750 lines — CLAUDE.md already notes it is no longer the `/portfolio` implementation)
- `src/components/About.tsx`
- `src/components/ModernHero.tsx`
- `src/components/WritingPreview.tsx`
- `src/components/ThinkingPreview.tsx`
- `src/components/ContactSection.tsx`

**Transitively dead** — their only non-test consumers are the orphans above:

- `src/components/ProjectDetailModal.tsx` (rendered only inside `ProjectsContent.tsx:702`)
- `src/components/ui/Badge.tsx` (only `ProjectDetailModal`)
- `src/components/ui/MetricCallout.tsx` (only `ProjectDetailModal`)
- `src/components/ui/OptimizedImage.tsx` (`ProjectImage` only used by `ProjectDetailModal`)
- `src/components/ui/JourneyTimeline.tsx` (only the orphaned `About.tsx`)
- `src/components/ui/SectionIntro.tsx` (only `ContactSection` + `ThinkingPreview`)
- `src/components/ui/Paragraph.tsx` (only `SectionIntro` + tests)

**Orphaned with zero imports of any kind:**

- `src/components/ui/ExpertSignal.tsx` (~178 lines)
- `src/components/ui/LazyPlayerImage.tsx` (~272 lines, includes an unused ImagePreloader singleton)
- `src/components/ui/PageSummary.tsx` (~140 lines)

Altogether this is roughly 15 files / ~2,500+ lines of unreachable component code, plus their tests. Deleting the cluster shrinks `ui/` to its actually-used core and stops these components from showing up in future audits, searches, and refactors.

> Caveat before deleting: `AuthorBio` (1 import, `writing/[slug]`) and `dropdown-menu` (2 imports) are *live* single-use components — keep them.

---

## 3. Cross-route duplication in dashboards

28 dashboard/tool routes were sampled. Average client size is ~950 lines; eight exceed 1,200 lines (`mba-jobs-client.tsx` is 2,762; `museum-log-client.tsx` is 1,775). The big files are big mostly because they inline patterns that every other dashboard also inlines.

### 3.1 Query-param view-state sync hook — ~18 routes

Every deep-linkable dashboard repeats the same `useRouter` + `useSearchParams` + `normalizeState` + `useEffect`/`router.replace({ scroll: false })` block (e.g., `src/app/nfl/nfl-client.tsx:120–204`, with near-identical copies in nba, mlb, la-liga, premier-league, golf, formula-1, world-cup-2026, bay-area-transit, polling-aggregator, tech-startup-tracker, …). That is 30–50 lines × 18 routes of behaviorally identical code, and any fix (scroll behavior, transition handling, param normalization edge cases) must be made 18 times.

**Extract:** `src/hooks/useQueryParamState.ts` — generic `useQueryParamState<T>(route, normalize, buildHref)`. Highest-ROI single extraction in the codebase.

### 3.2 View-toggle pill bar — ~23 routes

The `VIEW_OPTIONS.map(...)` button row with `aria-pressed`, `min-h-[44px]`, rounded-full pills (e.g., `nfl-client.tsx:463–475`) is hand-rolled in 23 routes, in both button-driven and link-driven variants. `EditorialPillButton` already exists and covers part of this.

**Extract:** `<ViewToggle>` component (button + link variants) that pairs naturally with `useQueryParamState`.

### 3.3 Re-implemented formatters — verified locations

`src/lib/date-formatters.ts` already exports `formatUpdatedAt`, `formatDateTime`, `formatShortDate`, `formatFullDate` — but route clients keep re-rolling them:

| Function | Duplicate implementations (verified) |
|---|---|
| `formatGeneratedAt` | `frontier-models-client.tsx:53`, `ai-dev-tools-client.tsx:82`, `golf-client.tsx:109`, `bay-area-transit-client.tsx:63`, `premier-league-client.tsx:139` |
| `formatUpdatedAt` | `lib/date-formatters.ts:58`, `lib/fantasyUtils.ts:6`, `fantasy-formula-1-client.tsx:66`, `formula-1-client.tsx:92` |
| `formatFixed` | `mlb-client.tsx:75`, `la-liga-client.tsx:1053`, `premier-league-client.tsx:51` |
| `formatRecord` | `mlb-client.tsx:84`, `nfl-client.tsx:1273` |
| `formatGamesBack` | `mlb-client.tsx:79`, `nba-client.tsx:899` |
| `formatCurrency` | `lib/investmentFormatting.ts:13`, `lib/retirement/format.ts:5`, `wine-cellar-client.tsx:96`, `budget-planner-client.tsx:35` |
| `formatPercent` | `lib/investmentFormatting.ts:29`, `lib/retirement/format.ts:22`, `investments/ResearchOverview.tsx:61`, `investments/ResearchAssetHeader.tsx:76` and `:113`, `recipe-finder-client.tsx:91` |

The `formatCurrency`/`formatPercent` pairs in `investmentFormatting.ts` vs `retirement/format.ts` have **conflicting signatures** (different default fraction digits; percent input scaling differs: raw percent vs 0–1 fraction). Both are live within the same investments surface — a latent bug source. Pick one canonical module, make scaling explicit in the name (`formatPercentFromFraction` vs `formatPercentValue`), and migrate.

### 3.4 Other repeated patterns (lower priority)

- **Sticky sidebar `<aside>`** with `lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto` — ~15 routes. A `<StickyAside>` wrapper or a `.tool-sticky-aside` class would do.
- **Standings-table styling** (`border-separate border-spacing-y-2` + identical thead classes) — ~10 routes. Candidate `<DataTable>`/`<StandingsTable>` if/when a behavior change is needed; cosmetic-only for now.
- **Hand-rolled stat tiles** in golf, fantasy-formula-1, march-madness, bay-area-transit, and the lifestyle tools, visually equivalent to `StatCard`/`MetricCard`. The components live under `components/football/` which discourages adoption by non-sports routes — see §5.
- **Local one-off duplicates:** `march-madness-client.tsx:83` defines its own private `SectionIntro` component unrelated to `ui/SectionIntro`.

---

## 4. Area-specific findings

### Investments (`src/components/investments/*`, ~30 files)

- The five research panels (`DCFPanel`, `GrowthPanel`, `IndustryPanel`, `ProfitabilityPanel`, `ValuationRatiosPanel`) share identical scaffolding: header + description, `animate-pulse` skeleton, `<ErrorState>`, then data inside `WarmCard`. Extracting a `<ResearchPanelShell>` would remove the boilerplate from all five and make the next panel ~trivial.
- Three of those panels define a local `fmt()` helper (`DCFPanel.tsx:13`, `ProfitabilityPanel.tsx:12`, `ValuationRatiosPanel.tsx:22`); `ResearchOverview`/`ResearchAssetHeader` define three more local `formatPercent` variants. All belong in `lib/investmentFormatting.ts`.
- `animations.ts` is fine as a local module (2 consumers); not worth promoting until a third surface needs it.

### V3 page shells (`HomePageV3` 563, `AboutV3` 631, `ContactV3` 360, `PortfolioV3` 853, `WritingArchiveV3` 553 lines)

All five repeat the masthead pattern — `*-masthead` section, kicker row (`Dept. NN` + title + volume/status), `h1`, stat strip — each against its own CSS module, with no shared markup or shared module. A `<PageMasthead>` component (or at minimum a shared CSS module for masthead/kicker/stat-strip) would consolidate the most-duplicated markup on the highest-traffic pages. None of the five imports anything from `components/editorial/`, even where `StatusPanel`/`InlineSectionLead` fit.

### Editorial (`src/components/editorial/*`)

All four components are live (mba-jobs, news-pulse, recipe-finder) — but only on three routes, while 20+ other routes hand-roll pill buttons and section leads. This is the natural home for the extractions in §3.2 and §3.4 rather than a new directory.

### SpaceX (`src/components/spacex/*`)

Self-contained and clean. `formatters.ts` overlaps conceptually with `investmentFormatting.ts` (`formatCurrencyCompact`) but the domains don't share call sites; leave as-is unless a shared `lib/format.ts` emerges from §3.3.

### Search (`src/components/search/*`)

Clean split: `SearchInterface.client.tsx` is a proper SSR boundary wrapper; `SearchFilters`/`SearchResults` properly extracted. No action.

---

## 5. Recommendations, ranked

| # | Action | Effort | Payoff |
|---|---|---|---|
| 1 | Delete the pre-V3 dead-code cluster (§2): 6 orphaned roots + 9 transitively dead/unused `ui/` files and their tests | S | ~2,500 lines gone; `ui/` becomes an honest inventory |
| 2 | Extract `useQueryParamState` hook and migrate the sports dashboards first (nfl/nba/mlb/la-liga/premier-league/golf share an essentially identical block) | M | Removes ~30–50 lines × 18 routes; single place to fix deep-link behavior |
| 3 | Consolidate formatters: move route-local `formatGeneratedAt`/`formatFixed`/`formatRecord`/`formatGamesBack` into `lib/date-formatters.ts` + a new `lib/format.ts`; reconcile the `investmentFormatting` vs `retirement/format` signature conflict | M | Kills the largest verified duplication table (§3.3) and a latent percent-scaling bug source |
| 4 | Add `<ViewToggle>` to `components/editorial/` and adopt it alongside #2 during dashboard touches | M | 23 routes hand-roll this today |
| 5 | Extract `<ResearchPanelShell>` for the five investments panels | S | Five files share identical scaffolding |
| 6 | Extract `<PageMasthead>` (or a shared CSS module) for the five V3 shells | M | Highest-traffic pages stop triplicating masthead markup |
| 7 | Rename/relocate `components/football/` → `components/dashboard/` (keep a re-export barrel for compatibility) so non-sports routes stop hand-rolling `StatCard`/`MetricCard` equivalents | S | Removes the naming barrier behind the 17-route adoption gap |
| 8 | Update `COMPONENTS.md` with the card-layer guide (WarmCard vs SurfaceCard vs StatCard vs MetricCard vs InfoChip) | S | Prevents the next accidental near-duplicate |

Recommended sequencing: #1 is pure deletion and safe to do immediately. #2 + #4 pair naturally and should be piloted on one sports dashboard before fan-out. #3 can proceed independently. #5–#8 are opportunistic.

---

## Appendix: route inventory snapshot

Client-component sizes at audit time (lines): mba-internship-notifications 2,762 · museum-log 1,775 · nfl 1,314 · formula-1 1,248 · golf 1,185 · march-madness 1,180 · news-pulse 1,151 · bay-area-transit 1,127 · nba 1,108 · fantasy-formula-1 1,078 · la-liga 1,055 · premier-league 1,009 · mlb 1,000 · wine-cellar 989 · world-cup 925 · food-map 912 · interchange-iq 869 · polling-aggregator 857 · decision-lab 801 · budget-planner 793 · fantasy-football 789 · recipe-finder 786 · tech-startup-tracker 785 · github-trending-pulse 758 · spacex-mission-control 666 · ai-dev-tools 625 · frontier-models 366.

Shared-component adoption: 11 of 28 dashboard routes use `components/football/*`; 17 hand-roll equivalent UI.
