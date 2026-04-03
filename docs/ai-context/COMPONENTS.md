# Components — AI Context

Current component ownership reference.

**Last updated:** 2026-04-03

---

## Shared Shell

| Component | File | Notes |
|----------|------|------|
| `StaticHeader` | `src/components/StaticHeader.tsx` | Current global nav |
| `ConditionalLayout` | `src/components/ConditionalLayout.tsx` | Route wrapper + footer variant logic |
| `Footer` | `src/components/Footer.tsx` | `full` and `compact` variants |
| `Providers` | `src/components/Providers.tsx` | Root provider wrapper |
| `ThemeProvider` | `src/components/ThemeProvider.tsx` | Theme context |

---

## Portfolio And Homepage

| Component | Role |
|----------|------|
| `ModernHero` | Homepage hero |
| `FeaturedWorkSection` | Homepage featured projects |
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

---

## Fantasy Football

Representative live components:

- `FantasyFootballLandingContent`
- `TierDisplay`
- `TierChartEnhanced`
- `RBTiersChart`
- `PositionSelector`
- `EnhancedPlayerCard`
- `DataFreshnessIndicator`

These work with the fantasy hooks and API routes described elsewhere in `docs/ai-context`.

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
