# Components — AI Context Reference

> Every component with file path, props, server/client designation, and composition patterns.

---

## Component Inventory (64 components)

| Category | Count |
|----------|-------|
| UI Primitives (`ui/`) | 16 |
| Layout & Page Components | 19 |
| Investments (`investments/`) | 24 |
| Search (`search/`) | 2 |
| Navigation (`navigation/`) | 1 |
| Draft Tracker (fantasy football) | 4 |

**80% are client components** (`"use client"`). Server components are primarily containers, structured data, and typography primitives.

---

## UI Primitives (`src/components/ui/`)

### WarmCard
**File:** `src/components/ui/WarmCard.tsx` — Server component
```typescript
interface WarmCardProps {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  hover?: boolean;
  ariaLabel?: string;
  ariaDescription?: string;
  className?: string;
  onClick?: () => void;
}
```
Primary container component. CSS variable-based styling. `React.memo` optimized.
**Used by:** Portfolio page, Writing page, Fantasy tiers, Investments panels, most card layouts.

### ModernButton
**File:** `src/components/ui/ModernButton.tsx` — Client component
```typescript
// Polymorphic: renders <button> or <Link> based on href prop
interface ModernButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  href?: string;  // renders as Link when provided
  children: ReactNode;
}
```
`React.memo` optimized. All sizes enforce `min-h-[44px]` touch target.
**Used by:** Footer CTAs, Fantasy landing, Contact page, Resume download, Investments forms.

### button.tsx (Radix/shadcn primitive)
**File:** `src/components/ui/button.tsx` — Server component
CVA-based button with `React.forwardRef`. Supports `asChild` via Radix Slot.
**Used by:** Dropdown menus, admin UI.

### dropdown-menu.tsx
**File:** `src/components/ui/dropdown-menu.tsx` — Client component
Full Radix UI dropdown menu system. Exports 14 sub-components (Menu, Trigger, Content, Item, CheckboxItem, RadioItem, Label, Separator, Shortcut, Group, Portal, Sub, SubContent, SubTrigger). All use `React.forwardRef`.
**Used by:** ThemeToggle.

### Badge
**File:** `src/components/ui/Badge.tsx` — Server component
Variants: `default`, `secondary`, `destructive`, `outline`. CVA-based.

### Heading
**File:** `src/components/ui/Heading.tsx` — Server component
```typescript
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;  // renders h1-h6
  children: ReactNode;
  className?: string;
}
```
Dynamic heading tag with fluid font sizes via `clamp()`.
**Used by:** All pages for section headings.

### Paragraph
**File:** `src/components/ui/Paragraph.tsx` — Server component
```typescript
interface ParagraphProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}
```
**Used by:** Writing page, About page, landing sections.

### ThemeToggle
**File:** `src/components/ui/ThemeToggle.tsx` — Client component
Dropdown menu for Light/Dark/System theme selection. Uses `next-themes` `useTheme()`.
**Used by:** StaticHeader (desktop + mobile).

### OptimizedImage
**File:** `src/components/ui/OptimizedImage.tsx` — Client component
```typescript
interface OptimizedImageProps {
  src: string; alt: string;
  width?: number; height?: number;
  priority?: boolean; className?: string;
}
```
Next.js Image wrapper with Intersection Observer lazy loading + Framer Motion fade-in.
**Used by:** AuthorBio, project screenshots.

### MetricCallout
**File:** `src/components/ui/MetricCallout.tsx` — Client component
```typescript
interface MetricCalloutProps {
  label: string;
  value: number | string;
  unit?: string;
  change?: { value: number; isImprovement: boolean };
  variant?: "primary" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
}
```
Count-up animation with `setInterval`. Framer Motion `useInView` + `useReducedMotion`.
**Used by:** Home page hero stats, About page metrics.

### LazyPlayerImage
**File:** `src/components/ui/LazyPlayerImage.tsx` — Client component
`React.memo` with custom comparison. Singleton `ImagePreloader` class for batch loading. Intersection Observer for viewport detection.
**Used by:** Fantasy football player cards, tier displays.

### JourneyTimeline
**File:** `src/components/ui/JourneyTimeline.tsx` — Client component
Vertical career timeline with company logos, gradient backgrounds, tech stack tags.
**Used by:** About page (Journey tab).

### PageSummary
**File:** `src/components/ui/PageSummary.tsx` — Client component
Page intro section with title, TLDR, and optional context. Variants: `default`, `compact`, `featured`.

### ExpertSignal
**File:** `src/components/ui/ExpertSignal.tsx` — Client component
Expert credential badge. Types: `credential`, `achievement`, `expertise`, `education`, `experience`, `award`. Includes `ExpertSignalGroup` sub-component for grouping.

### AuthorBio
**File:** `src/components/ui/AuthorBio.tsx` — Client component
Author profile card with schema.org Person microdata. Variants: `full`, `compact`, `inline`.
**Used by:** Writing/blog post pages.

### VirtualizedPlayerList
**File:** `src/components/ui/VirtualizedPlayerList.tsx` — Client component
```typescript
interface VirtualizedPlayerListProps {
  players: Player[];
  onSelect?: (playerId: string) => void;
  height?: number;
  itemHeight?: number;
  selectedId?: string;
}
```
Virtual scrolling with visible range calculation. `React.memo` with custom comparison. Position-based color coding.
**Used by:** Fantasy football draft tracker, large player lists.

---

## Layout & Page Components (`src/components/`)

### ModernHero
**File:** `src/components/ModernHero.tsx` — Client component
Home page hero with staggered Framer Motion animations. Respects `prefers-reduced-motion`.
**Used by:** Home page (`src/app/page.tsx`).

### StaticHeader
**File:** `src/components/StaticHeader.tsx` — Client component
Sticky header with scroll shadow detection. Desktop nav + mobile hamburger overlay. Active link detection handles `/projects` → `/portfolio` redirect. 44px touch targets.
**Used by:** Root layout via `ConditionalLayout`.

### Footer
**File:** `src/components/Footer.tsx` — Client component
Social links (LinkedIn, GitHub), CTAs (Contact, Resume), copyright, accessibility link.
**Used by:** Root layout via `ConditionalLayout`.

### About
**File:** `src/components/About.tsx` — Client component
Tabbed interface (Overview/Journey) with keyboard arrow-key navigation. `AnimatePresence` for tab transitions.
**Used by:** About page.

### ConditionalLayout
**File:** `src/components/ConditionalLayout.tsx` — Client component
Route-based layout switching: full-width for home `/`, constrained `max-w-4xl` for all other routes. Always renders Footer.
**Used by:** Root layout.

### Providers
**File:** `src/components/Providers.tsx` — Client component
Wraps `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`.
**Used by:** Root layout.

### ThemeProvider
**File:** `src/components/ThemeProvider.tsx` — Client component
Thin wrapper around `next-themes` `NextThemesProvider`.

### StructuredData
**File:** `src/components/StructuredData.tsx` — Server component
Renders JSON-LD `<script>` tags. Supports 13+ schema.org types (Person, WebSite, Article, SoftwareApplication, BreadcrumbList, SportsApplication, FAQPage, etc.).
**Used by:** Root layout, Writing pages, Portfolio pages.

### AIStructuredData
**File:** `src/components/AIStructuredData.tsx` — Server component
AI-optimized JSON-LD structured data. Injected in root layout.

### FeaturedWorkSection
**File:** `src/components/FeaturedWorkSection.tsx` — Client component
Featured projects grid from `caseStudiesData`. Framer Motion staggered animations.
**Used by:** Home page.

### ProjectsContent
**File:** `src/components/ProjectsContent.tsx` — Client component
Bento grid layout with 5 projects. Lazy-loads `ProjectDetailModal` via `React.lazy` + `Suspense`.

### ProjectDetailModal
**File:** `src/components/ProjectDetailModal.tsx` — Client component
Full-screen modal with `AnimatePresence` enter/exit animations. Shows problem/process/result.

### ContactContent
**File:** `src/components/ContactContent.tsx` — Client component
Contact page layout with heading, description, action buttons.

### ContactSection
**File:** `src/components/ContactSection.tsx` — Client component
3-column contact method cards (email, LinkedIn, GitHub).

### WritingPreview
**File:** `src/components/WritingPreview.tsx` — Client component
Fetches recent posts from `/api/search` via `useEffect`.

### ThinkingPreview
**File:** `src/components/ThinkingPreview.tsx` — Client component
4-pillar grid: Discovery, Data-Driven, Strategy, Execution.

### FantasyFootballLandingContent
**File:** `src/components/FantasyFootballLandingContent.tsx` — Client component
FF landing page hero with stats, offerings grid, technical excellence section.

### TierDisplay
**File:** `src/components/TierDisplay.tsx` — Client component
Renders tier groups with player cards. Core component for fantasy football tier pages.

### FantasyContentGrid
**File:** `src/components/FantasyContentGrid.tsx` — Client component
Blog grid with category/tag filtering. `useMemo` for filtering, `AnimatePresence` for animations.

### UpdateDataButton
**File:** `src/components/UpdateDataButton.tsx` — Client component
Triggers `/api/fantasy-pros-session` POST. Status states: idle/success/error.

### PositionSelector
**File:** `src/components/PositionSelector.tsx` — Client component
Position + scoring format selector buttons. `React.memo` with custom comparison.

### DataComparison
**File:** `src/components/DataComparison.tsx` — Client component
Fixed right-side panel comparing player data across datasets.

---

## Investment Components (`src/components/investments/`)

### PortfolioTracker
**File:** `src/components/investments/PortfolioTracker.tsx` — Client component
```typescript
interface PortfolioTrackerProps { onResearch: (symbol: string) => void }
```
Main portfolio view. Composes: `useInvestments` hook → `PortfolioSummary` + `StockCard` grid + `AllocationChart` + `PortfolioPerformanceChart`.

### StockResearch
**File:** `src/components/investments/StockResearch.tsx` — Client component
Multi-panel research interface with 9 tabs: Fundamentals, Financials, Valuation, Profitability, Growth, Industry, Transcripts, DCF, News, plus Comparison tab and Price Chart.

### StockCard
**File:** `src/components/investments/StockCard.tsx` — Client component
Individual stock card with sparkline, price, gain/loss, allocation bar, edit/delete actions. Inline edit form.

### StockSearch
**File:** `src/components/investments/StockSearch.tsx` — Client component
Search input with `useDebounce(200ms)` and suggestions dropdown.

### AddStockForm
**File:** `src/components/investments/AddStockForm.tsx` — Client component
Expandable form for adding stock positions (symbol, shares, cost, date).

### PortfolioSummary
**File:** `src/components/investments/PortfolioSummary.tsx` — Client component
Total value, gain/loss, day change metrics. Framer Motion animations with loading skeleton.

### AllocationChart
**File:** `src/components/investments/AllocationChart.tsx` — Client component
D3 donut chart with hover arc expansion, tooltip, and legend bars.

### PortfolioPerformanceChart
**File:** `src/components/investments/PortfolioPerformanceChart.tsx` — Client component
D3 line chart + volume chart with time-range selector (1W/1M/3M/6M/1Y/All). `ResizeObserver` responsive.

### Sparkline
**File:** `src/components/investments/Sparkline.tsx` — Client component
D3 mini sparkline (line + area fill). Color-coded green/red based on trend.

### Research Panels (9 panels)
All follow the same pattern: `{ symbol: string }` props, use `useStockData<T>()` hook, render in `<WarmCard>`, show `<ErrorState>` on failure.

| Component | File | Data Section | Visualization |
|-----------|------|-------------|---------------|
| `FundamentalsPanel` | `investments/FundamentalsPanel.tsx` | `info`, `fundamentals`, `wacc`, `beta` | Metric grid |
| `FinancialStatementsPanel` | `investments/FinancialStatementsPanel.tsx` | `income_statement`, `balance_sheet`, `cash_flow` | Tabbed tables |
| `ValuationRatiosPanel` | `investments/ValuationRatiosPanel.tsx` | `industry` | Stock vs industry comparison |
| `ProfitabilityPanel` | `investments/ProfitabilityPanel.tsx` | `profitability`, `margins` | Metric bars |
| `GrowthPanel` | `investments/GrowthPanel.tsx` | `growth` | D3 bar chart |
| `IndustryPanel` | `investments/IndustryPanel.tsx` | `industry` | Comparison table |
| `TranscriptsPanel` | `investments/TranscriptsPanel.tsx` | `transcripts`, `transcript_YYYY_Q` | List + viewer |
| `DCFPanel` | `investments/DCFPanel.tsx` | `dcf`, `wacc` | Fair value display |
| `NewsPanel` | `investments/NewsPanel.tsx` | `news` | News feed |

### PriceChartPanel
**File:** `src/components/investments/PriceChartPanel.tsx` — Client component
D3 price history + volume dual chart. Range selector (1M/3M/6M/1Y). Hover tooltip with hairline.

### ComparisonTab
**File:** `src/components/investments/ComparisonTab.tsx` — Client component
Stock A vs B comparison. 12 `useStockData` calls. Composes `ComparisonRadarChart` + 4 `ComparisonMetricTable` instances.

### ComparisonRadarChart
**File:** `src/components/investments/ComparisonRadarChart.tsx` — Client component
D3 radar/spider chart comparing 5 dimensions. Polygon fills with opacity.

### ComparisonMetricTable
**File:** `src/components/investments/ComparisonMetricTable.tsx` — Client component
Side-by-side metric table with winner highlighting.

### DataFreshnessIndicator
**File:** `src/components/investments/DataFreshnessIndicator.tsx` — Client component
Relative time display (e.g., "5m ago") with color-coded freshness (green < 1h, blue < 24h, amber < 3d, red >= 3d).

### ErrorState
**File:** `src/components/investments/ErrorState.tsx` — Client component
Error or "not in database" state with optional retry button.

---

## Search Components (`src/components/search/`)

### SearchInterface
**File:** `src/components/search/SearchInterface.tsx` — Client component
Search input + filter selectors + results. Uses `useDebounce` + `/api/search`.

### SearchResults
**File:** `src/components/search/SearchResults.tsx` — Client component
Results grid with loading state, no-results state, and `SearchResultCard` sub-component with query highlighting.

---

## Navigation (`src/components/navigation/`)

### Breadcrumbs
**File:** `src/components/navigation/Breadcrumbs.tsx` — Client component
Auto-generates from pathname. Blog slug → title mapping. Emits BreadcrumbList JSON-LD inline.
See `REDIRECTS-AND-NAVIGATION.md`.

---

## Draft Tracker Components (`src/app/fantasy-football/draft-tracker/components/`)

| Component | Type | Purpose |
|-----------|------|---------|
| `DraftBoard` | Client | Main draft board grid |
| `DraftSetup` | Client | Draft configuration (teams, format) |
| `DraftHistory` | Client | History of draft picks |
| `DraftControls` | Client | Draft action buttons |
| `PlayerDraftCard` | Client | Individual player card in draft |

---

## Key Architectural Patterns

### React.memo Optimization
Used on: `WarmCard`, `ModernButton`, `VirtualizedPlayerList`, `LazyPlayerImage`, `PositionSelector`.
Pattern: Custom comparison function to prevent unnecessary re-renders.

### D3.js Visualizations (6 components)
`AllocationChart`, `PortfolioPerformanceChart`, `GrowthPanel`, `PriceChartPanel`, `ComparisonRadarChart`, `Sparkline`.
Pattern: `useRef` for SVG container, `useEffect` for D3 rendering, cleanup on unmount.

### Framer Motion Animations
Pattern: `containerVariants` with `staggerChildren` + `itemVariants`. Always check `useReducedMotion()`.

### Research Panel Pattern
All investment research panels follow: `{ symbol: string }` → `useStockData<T>(symbol, section)` → `<WarmCard>` → `<ErrorState>` fallback.

### Component Composition
```
Root Layout
├── Providers (ThemeProvider)
├── ConditionalLayout
│   ├── StaticHeader
│   ├── Page Content
│   └── Footer
└── StructuredData, AIStructuredData, Analytics
```

### Check Before Creating New Components
Always check `src/components/ui/` first. Existing primitives: `WarmCard` (cards), `ModernButton` (buttons), `Heading`/`Paragraph` (typography), `Badge` (labels), `OptimizedImage` (images).
