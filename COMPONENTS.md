# Component Reference

Current component map for the live application.

**Last updated:** 2026-04-14

---

## Component Groups

### Root shell and shared surfaces

| Component | File | Role |
|----------|------|------|
| `StaticHeader` | `src/components/StaticHeader.tsx` | Global sticky navigation |
| `ConditionalLayout` | `src/components/ConditionalLayout.tsx` | Route-aware content wrapper and footer selection |
| `Footer` | `src/components/Footer.tsx` | Full or compact footer |
| `Providers` | `src/components/Providers.tsx` | Theme provider wrapper |
| `ThemeProvider` | `src/components/ThemeProvider.tsx` | `next-themes` wrapper |

### Homepage and portfolio

| Component | File | Role |
|----------|------|------|
| `ModernHero` | `src/components/ModernHero.tsx` | Homepage hero |
| `FeaturedWorkSection` | `src/components/FeaturedWorkSection.tsx` | Homepage featured projects |
| `ThinkingPreview` | `src/components/ThinkingPreview.tsx` | Homepage product-thinking section |
| `ContactSection` | `src/components/ContactSection.tsx` | Homepage closing contact section |
| `About` | `src/components/About.tsx` | About page tabbed content |
| `ContactContent` | `src/components/ContactContent.tsx` | Contact page content |
| `ProjectDetailModal` | `src/components/ProjectDetailModal.tsx` | Legacy project modal used by non-primary flows |

### Writing and structured data

| Component | File | Role |
|----------|------|------|
| `StructuredData` | `src/components/StructuredData.tsx` | JSON-LD injection |
| `AIStructuredData` | `src/components/AIStructuredData.tsx` | AI-oriented structured data helper |
| `AuthorBio` | `src/components/ui/AuthorBio.tsx` | Article author card |

### Fantasy football

Representative live components:

- `FantasyFootballLandingContent`
- `TierDisplay`
- `TierChartEnhanced`
- `RBTiersChart`
- `PositionSelector`
- `EnhancedPlayerCard`
- `DataFreshnessIndicator`

These are used across `/fantasy-football/*` routes.

### Investments

The investments surface is split between a client shell and specialized panels.

Main components:

- `StockResearch`
- `PortfolioTracker`
- `PortfolioSummary`
- `StockCard`
- `AddStockForm`
- `AllocationChart`
- `PortfolioPerformanceChart`
- `ResearchOverview`
- `ResearchSummaryStrip`
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

### Football dashboards

Shared components for both `/premier-league` and `/la-liga` dashboards. All live in `src/components/football/`.

| Component | File | Role |
|----------|------|------|
| `FixtureCard` | `src/components/football/FixtureCard.tsx` | Single fixture result or upcoming match card |
| `FixtureGroupSection` | `src/components/football/FixtureGroupSection.tsx` | Grouped fixture list by matchday or date |
| `LeaderList` | `src/components/football/LeaderList.tsx` | Scorers and assists leaderboard |
| `StatCard` | `src/components/football/StatCard.tsx` | Single stat display with label and value |
| `MetricCard` | `src/components/football/MetricCard.tsx` | Metric highlight card with optional trend |
| `InfoChip` | `src/components/football/InfoChip.tsx` | Inline label chip for league/competition context |
| `CrestAvatar` | `src/components/football/CrestAvatar.tsx` | Team crest image with fallback initials |
| `TeamResultPill` | `src/components/football/TeamResultPill.tsx` | Win/draw/loss pill for form strips |
| `SurfaceCard` | `src/components/football/SurfaceCard.tsx` | Consistent card surface wrapper |
| `EmptyPanel` | `src/components/football/EmptyPanel.tsx` | Empty-state placeholder panel |

### Standalone data tools

| Area | Primary files | Role |
|------|---------------|------|
| News Pulse | `src/app/news-pulse/*`, `src/lib/news-pulse-utils.ts` | News dashboard route and API-backed article summaries |
| SpaceX Mission Control | `src/components/spacex/*`, `src/app/spacex-mission-control/*` | SpaceX launch dashboard, mission cards, detail panels, patch and vehicle visuals |
| Polling Aggregator | `src/app/polling-aggregator/*`, `src/data/pollingSnapshot.ts` | Snapshot-backed polling dashboard and deep-linkable route state |
| Budget Planner | `src/app/fintech-tools/budget-planner/*`, `src/hooks/useBudgetPlanner.ts` | Client-side budget planning tool |
| Interchange IQ | `src/app/fintech-tools/interchange-iq/*` | Client-side interchange fee analyzer |
| MBA Role Tracker | `src/app/mba-internship-notifications/*`, `src/constants/mba-companies.ts`, `src/lib/mba-job-matching.ts`, `src/types/mba-jobs.ts` | Client shell (`MBAJobsClient`) plus deep-link state helper (`mba-jobs-state.ts`) backed by `/api/mba-jobs`; uses `src/app/api/mba-jobs/email` for Resend digests |

---

## UI Primitives

Core UI primitives live under `src/components/ui/`.

Most reused primitives:

- `WarmCard`
- `ModernButton`
- `Heading`
- `Paragraph`
- `Badge`
- `JourneyTimeline`
- `ThemeToggle`
- `SectionIntro`
- `ServerIcons`
- `button.tsx`
- `dropdown-menu.tsx`

Editorial shared components also live under `src/components/editorial/`; use them when working in the current `--home-*` visual system.

Styling guidance for these lives in `STYLING.md`.

---

## Current Live Ownership

### `/portfolio`

`src/app/portfolio/page.tsx` renders the project grid directly.
`ProjectsContent.tsx` is not the primary live implementation for this route.

### Homepage

The homepage uses:

- `ModernHero`
- `FeaturedWorkSection`
- `ThinkingPreview`
- `ContactSection`

`WritingPreview.tsx` still exists in the repo but is not part of the current homepage.

### `/investments`

`src/app/investments/investments-client.tsx` is the top-level shell and lazy-loads:

- `PortfolioTracker`
- `StockResearch`

### `/march-madness-2026`

The page uses a server entry plus client UI:

- `src/app/march-madness-2026/page.tsx`
- `src/app/march-madness-2026/march-madness-client.tsx`

### Football dashboards

The page-level clients are:

- `src/app/premier-league/premier-league-client.tsx`
- `src/app/la-liga/la-liga-client.tsx`

Route state helpers live next to each client and have unit coverage for invalid params and deep links.

---

## Legacy Or Unwired Components

These files still exist, but should not be described as the primary live path without confirming current usage:

- `src/components/ProjectsContent.tsx`
- `src/components/WritingPreview.tsx`

They remain useful as historical or alternate implementation context.

---

## Testing Coverage

Current component-oriented tests include:

- `src/components/__tests__/StaticHeader.test.tsx`
- `src/components/__tests__/Footer.test.tsx`
- `src/components/__tests__/ConditionalLayout.test.tsx`
- tests under `src/components/ui/__tests__/`
- investments component tests under `src/components/investments/__tests__/`

See `TESTING.md` for the broader strategy.
