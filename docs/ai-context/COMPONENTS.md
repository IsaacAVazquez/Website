# Components — AI Context

Current component ownership reference.

**Last updated:** 2026-06-10

---

## Shared Shell

| Component | File | Notes |
|----------|------|------|
| `StaticHeader` | `src/components/StaticHeader.tsx` | Current global nav |
| `ConditionalLayout` | `src/components/ConditionalLayout.tsx` | Route wrapper + footer variant logic |
| `Footer` | `src/components/Footer.tsx` | `full` and `compact` variants |
| `Providers` | `src/components/Providers.tsx` | Root provider wrapper |
| `ThemeProvider` | `src/components/ThemeProvider.tsx` | Theme context |
| `RouteErrorBoundary` | `src/components/RouteErrorBoundary.tsx` | Shared error fallback re-exported by per-route `error.tsx` files |

---

## Portfolio And Homepage

| Component | Role |
|----------|------|
| `ModernHero` | Homepage hero |
| `FeaturedWorkSection` | Homepage featured projects |
| `PortfolioProjectCard` | Shared project card for homepage and `/portfolio` |
| `ThinkingPreview` | Homepage product-thinking section |
| `ContactSection` | Homepage CTA section |
| `About` | About page tab UI |
| `ContactContent` | Contact page |
| `SectionIntro` | Shared page/section intro; set `headingLevel` explicitly when used below the route `h1` |

Legacy/unwired caution:

- `ProjectsContent.tsx` still exists, but `/portfolio` does not currently render through it
- `WritingPreview.tsx` still exists, but it is not part of the current homepage shell

---

## Writing And SEO

| Component | Role |
|----------|------|
| `StructuredData` | JSON-LD helper |
| `AIStructuredData` | AI-oriented structured data helper |
| `AuthorBio` | Writing article author block |

---

## Investments

Primary investments components:

- `PortfolioTracker`
- `StockResearch`
- `PortfolioSummary`
- `StockCard`
- `AddStockForm`
- `AllocationChart`
- `PortfolioPerformanceChart`
- `ResearchSummaryStrip`
- `ResearchOverview`
- `ComparisonTab`
- `PriceChartPanel`
- `DCFPanel`
- `FundamentalsPanel`
- `FinancialStatementsPanel`
- `GrowthPanel`
- `ValuationRatiosPanel`
- `ProfitabilityPanel`
- `IndustryPanel`
- `NewsPanel`

Top-level ownership:

- `src/app/investments/investments-client.tsx` is the route shell
- it lazy-loads `PortfolioTracker` and `StockResearch`
- retirement planner UI lives in `src/components/investments/retirement/` on top of the pure engine in `src/lib/retirement/`

---

## Football Dashboards

Shared components for `/premier-league`, `/la-liga`, `/mlb`, `/nba`, `/nfl`, and `/world-cup-2026` live in `src/components/football/`:

- `FixtureCard`
- `FixtureGroupSection`
- `LeaderList`
- `StatCard`
- `MetricCard`
- `InfoChip`
- `CrestAvatar`
- `TeamResultPill`
- `SurfaceCard`
- `EmptyPanel`

Page-level clients live at `src/app/premier-league/premier-league-client.tsx` and `src/app/la-liga/la-liga-client.tsx`.

---

## Standalone Data Tools

- `src/app/news-pulse/*` plus `src/lib/news-pulse-utils.ts`
- `src/components/spacex/*` plus `src/app/spacex-mission-control/*`
- `src/app/mlb/*`, `src/app/nba/*`, `src/app/nfl/*`, and `src/components/football/*`
- `src/app/golf/*` plus `src/data/golfSnapshot.ts`
- `src/app/world-cup-2026/*` plus `src/data/worldCupSnapshot.ts`
- `src/app/bay-area-transit/*` plus `src/data/bayAreaTransitSnapshot.ts`
- `src/app/earthquake-pulse/*` plus `src/data/earthquakeSnapshot.ts`
- `src/app/tech-startup-tracker/*` plus `src/data/techStartupSnapshot.ts`
- `src/app/travel/*` plus `src/hooks/useTravelPlanner.ts`
- `src/app/polling-aggregator/*` plus `src/data/pollingSnapshot.ts`
- `src/app/fintech-tools/budget-planner/*` plus `src/hooks/useBudgetPlanner.ts`
- `src/app/fintech-tools/interchange-iq/*`

---

## Fantasy Football

Representative live components:

- `src/app/fantasy-football/fantasy-football-client.tsx`
- `src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx`
- `src/app/fantasy-football/draft-tracker/components/DraftBoard.tsx`
- `src/app/fantasy-football/draft-tracker/components/DraftSetup.tsx`
- `src/components/fantasy/TierBreakdown.tsx`

These work with the generated fantasy snapshots and `/api/fantasy-data` route described elsewhere in `docs/ai-context`.

---

## UI Primitives

Current primitives worth reusing first:

- `WarmCard`
- `ModernButton`
- `Heading`
- `Paragraph`
- `Badge`
- `JourneyTimeline`
- `SectionIntro`
- `ThemeToggle`
- `ServerIcons`
- `button.tsx`
- `dropdown-menu.tsx`

Shared primitive rules:

- `ConditionalLayout` owns the only `main` for self-shell routes
- `SectionIntro` should be treated as semantic, not decorative; pass `headingLevel={1}` only for the page-level heading
- shared shell primitives should not use `transition-all`

---

## Practical Rule

When docs and code disagree about component ownership, verify the route entry file first. The current route file is the best indicator of which component path is live.
