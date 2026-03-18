# Component Reference

Current component map for the live application.

**Last updated:** 2026-03-17

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
