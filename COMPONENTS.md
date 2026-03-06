# Component Library Documentation

Complete component library reference for Isaac Vazquez's portfolio and fantasy football analytics platform.

**Last Updated:** March 2026
**Component Count:** 50+ components

---

## Table of Contents

- [Component Overview](#component-overview)
- [UI Library (src/components/ui/)](#ui-library)
- [Layout Components](#layout-components)
- [Portfolio Components](#portfolio-components)
- [Fantasy Football Components](#fantasy-football-components)
- [Investments Components](#investments-components)
- [Navigation Components](#navigation-components)
- [Search Components](#search-components)
- [Usage Guidelines](#usage-guidelines)

---

## Component Overview

### Directory Structure

```
src/components/
├── ui/                          # Design system primitives
│   ├── WarmCard.tsx
│   ├── ModernButton.tsx
│   ├── button.tsx               # Radix/shadcn-style button primitive
│   ├── dropdown-menu.tsx        # Radix/shadcn-style dropdown
│   ├── Heading.tsx
│   ├── Paragraph.tsx
│   ├── Badge.tsx
│   ├── JourneyTimeline.tsx
│   ├── OptimizedImage.tsx
│   ├── ThemeToggle.tsx
│   ├── MetricCallout.tsx
│   ├── PageSummary.tsx
│   ├── ExpertSignal.tsx
│   ├── AuthorBio.tsx
│   ├── LazyPlayerImage.tsx
│   └── QADashboard.tsx
│
├── investments/                 # Investments page components
│   ├── PortfolioTracker.tsx
│   ├── StockResearch.tsx
│   ├── StockCard.tsx
│   ├── StockSearch.tsx
│   ├── AddStockForm.tsx
│   ├── PortfolioSummary.tsx
│   ├── AllocationChart.tsx
│   ├── DCFPanel.tsx
│   ├── FundamentalsPanel.tsx
│   ├── GrowthPanel.tsx
│   ├── ValuationRatiosPanel.tsx
│   ├── NewsPanel.tsx
│   ├── TranscriptsPanel.tsx
│   ├── IndustryPanel.tsx
│   └── ProfitabilityPanel.tsx
│
├── navigation/                  # Navigation utilities
│   ├── Breadcrumbs.tsx
│   └── LazyFantasyComponents.tsx
│
├── search/                      # Search interface
│   ├── SearchInterface.tsx
│   ├── SearchResults.tsx
│   └── SearchFilters.tsx
│
├── lazy/                        # Lazy-loaded wrappers
│
├── ConditionalLayout.tsx        # Route-based layout switcher
├── ModernHero.tsx               # Home page hero
├── About.tsx                    # About page component
├── ContactContent.tsx           # Contact page content
├── ProjectsContent.tsx          # Portfolio showcase
├── FeaturedWorkSection.tsx      # Featured projects on home
├── ProjectDetailModal.tsx       # Project detail overlay
├── WritingPreview.tsx           # Writing/blog preview
├── ThinkingPreview.tsx          # Thinking/notes preview
├── Footer.tsx                   # Site footer
├── Analytics.tsx                # Analytics tracking wrapper
├── StructuredData.tsx           # Standard JSON-LD
├── AIStructuredData.tsx         # AI-specific JSON-LD
├── ThemeProvider.tsx            # Dark/light mode context
└── Providers.tsx                # React context wrapper
```

---

## UI Library

### WarmCard

Primary container component.

**Location:** `src/components/ui/WarmCard.tsx`

```typescript
interface WarmCardProps {
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
```

**Usage:**
```tsx
<WarmCard padding="lg" hover={true}>
  <h2>Card Title</h2>
  <p>Card content</p>
</WarmCard>
```

**Padding scale:**
- `xs` → 12px, `sm` → 16px, `md` → 24px, `lg` → 32px, `xl` → 48px

---

### ModernButton

Button component with 4 variants.

**Location:** `src/components/ui/ModernButton.tsx`

```typescript
interface ModernButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<ModernButton variant="primary" size="lg">
  Get Started
</ModernButton>

<ModernButton variant="outline" size="md">
  Learn More
</ModernButton>
```

---

### button.tsx

Radix/shadcn-style button primitive using `class-variance-authority`.

**Location:** `src/components/ui/button.tsx`

Lower-level button primitive for composable use cases, separate from `ModernButton`.

---

### dropdown-menu.tsx

Radix/shadcn-style dropdown menu using `@radix-ui/react-dropdown-menu`.

**Location:** `src/components/ui/dropdown-menu.tsx`

---

### Heading

Typography component for consistent heading hierarchy.

**Location:** `src/components/ui/Heading.tsx`

```typescript
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}
```

```tsx
<Heading level={1}>Page Title</Heading>
<Heading level={2} className="text-[var(--color-primary)]">Section</Heading>
```

---

### Badge

Label and tag component.

**Location:** `src/components/ui/Badge.tsx`

```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
}
```

```tsx
<Badge>TypeScript</Badge>
<Badge variant="success">Completed</Badge>
```

---

### JourneyTimeline

Career timeline visualization.

**Location:** `src/components/ui/JourneyTimeline.tsx`

Displays career history with company logos, roles, dates, and tech stack tags. Data sourced from `src/constants/personal.ts`.

```tsx
<JourneyTimeline />
```

---

### OptimizedImage

Next.js `Image` wrapper with consistent defaults.

**Location:** `src/components/ui/OptimizedImage.tsx`

Always use this (or Next.js `Image` directly) instead of `<img>` tags.

---

### ThemeToggle

Dark/light mode toggle button.

**Location:** `src/components/ui/ThemeToggle.tsx`

Integrates with `next-themes` and the `.dark` class on `<html>`.

---

### LazyPlayerImage

Lazy-loaded player headshot image for fantasy football components.

**Location:** `src/components/ui/LazyPlayerImage.tsx`

Handles fallback gracefully when player images are unavailable.

---

## Layout Components

### ConditionalLayout

Route-based layout switcher.

**Location:** `src/components/ConditionalLayout.tsx`

Applies different layout chrome based on current route. Currently uses `StaticHeader` as the default header in the root layout.

---

### ModernHero

Home page hero section.

**Location:** `src/components/ModernHero.tsx`

- Professional headshot with Next.js `Image`
- Introduction text and CTAs
- Framer Motion animations
- `prefers-reduced-motion` support

```tsx
// Used directly in src/app/page.tsx
<ModernHero />
```

---

### Footer

Site-wide footer.

**Location:** `src/components/Footer.tsx`

Social links (LinkedIn, GitHub, Email) and copyright.

---

### ThemeProvider

Dark/light mode context provider.

**Location:** `src/components/ThemeProvider.tsx`

Wraps the app via `next-themes`. Dark mode uses `.dark` class on `<html>`.

---

### Providers

Aggregated React context provider wrapper.

**Location:** `src/components/Providers.tsx`

Used in root layout to wrap all context providers.

---

### AIStructuredData

AI-specific JSON-LD structured data injected in the root layout.

**Location:** `src/components/AIStructuredData.tsx`

Helps AI systems (search, LLMs) better understand the site's content.

---

## Portfolio Components

### About

About page with tabbed navigation.

**Location:** `src/components/About.tsx`

Tabs: Overview (skills, background) and Journey (career timeline via `JourneyTimeline`).

---

### FeaturedWorkSection

Featured projects section displayed on the home page.

**Location:** `src/components/FeaturedWorkSection.tsx`

---

### ProjectsContent

Portfolio project showcase grid.

**Location:** `src/components/ProjectsContent.tsx`

```tsx
// Used in /portfolio page
<ProjectsContent />
```

---

### ProjectDetailModal

Project detail modal overlay.

**Location:** `src/components/ProjectDetailModal.tsx`

---

### ContactContent

Contact page layout with CTAs and info cards.

**Location:** `src/components/ContactContent.tsx`

---

### WritingPreview / ThinkingPreview

Preview components for writing and notes content.

**Locations:** `src/components/WritingPreview.tsx`, `src/components/ThinkingPreview.tsx`

---

## Fantasy Football Components

### FantasyFootballLandingContent

Main fantasy football landing page component.

**Location:** Rendered from `src/app/fantasy-football/fantasy-football-client.tsx`

---

### TierChart / TierChartEnhanced

D3-powered tier visualization charts.

Both render SVG-based scatter plots grouping players by tier. `TierChartEnhanced` adds additional visual polish.

---

### LightweightTierChart

Performance-optimized tier chart for lower-end devices.

---

### RBTiersChart

RB-specific tier chart, used on `/fantasy-football/rb-tiers`.

---

### DraftTierChart

Draft tracking visualization used in `/fantasy-football/draft-tracker`.

---

### EnhancedPlayerCard

Player card displaying name, team, rank, projected points, and tier badge.

---

### PositionSelector

Tab navigation for switching between QB, RB, WR, TE, K, DST, Flex positions.

---

### DataFreshnessIndicator

Shows when fantasy data was last updated and its source.

---

### ExpertConsensusIndicator

Displays expert consensus signals for player rankings.

---

### UpdateDataButton

Triggers a data refresh from FantasyPros via `/api/scheduled-update`.

---

### VirtualizedPlayerList

Virtualized list for rendering large player datasets without performance degradation.

---

## Investments Components

All located in `src/components/investments/`.

| Component | Purpose |
|-----------|---------|
| `PortfolioTracker` | Portfolio overview and holdings |
| `StockResearch` | Multi-panel research interface |
| `StockCard` | Individual stock display |
| `StockSearch` | Search for stocks to add |
| `AddStockForm` | Form to add a stock to the portfolio |
| `PortfolioSummary` | Aggregated portfolio stats |
| `AllocationChart` | Portfolio allocation visualization |
| `DCFPanel` | Discounted cash flow analysis |
| `FundamentalsPanel` | Company fundamentals |
| `GrowthPanel` | Revenue/earnings growth metrics |
| `ValuationRatiosPanel` | P/E, P/B, EV/EBITDA, etc. |
| `NewsPanel` | Recent news for a stock |
| `TranscriptsPanel` | Earnings call transcripts |
| `IndustryPanel` | Industry comparison data |
| `ProfitabilityPanel` | Margin and profitability metrics |

---

## Navigation Components

### Breadcrumbs

**Location:** `src/components/navigation/Breadcrumbs.tsx`

Breadcrumb navigation for deep pages like `/portfolio/[slug]` and `/writing/[slug]`.

---

### LazyFantasyComponents

**Location:** `src/components/navigation/LazyFantasyComponents.tsx`

Lazy-loading wrappers for heavy fantasy football components using `React.lazy()`.

---

## Search Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SearchInterface` | `src/components/search/SearchInterface.tsx` | Main search UI |
| `SearchResults` | `src/components/search/SearchResults.tsx` | Results list |
| `SearchFilters` | `src/components/search/SearchFilters.tsx` | Filter controls |

---

## Usage Guidelines

### Color Conventions

Always use CSS custom properties — never hardcode hex values in components:

```tsx
// Correct
<div className="text-[var(--text-primary)] bg-[var(--surface-primary)]">

// Incorrect — hardcoded hex
<div className="text-[#0F172A] bg-white">
```

Key CSS variables:
- `--color-primary`: `#2563EB` (Blue 600, light mode)
- `--text-primary`: `#0F172A` (Slate 900)
- `--text-secondary`: `#475569` (Slate 600)
- `--surface-primary`: `#FFFFFF`
- `--border-primary`: `#E2E8F0`

### Accessibility Requirements

All interactive components must have:
- ARIA labels on icon-only buttons
- Minimum 44px touch targets (`min-h-touch`, `min-w-touch`)
- Keyboard navigation support
- Visible focus indicators

```tsx
// Correct
<ModernButton aria-label="Download resume PDF" onClick={handleDownload}>
  <IconDownload />
</ModernButton>
```

### Dark Mode

All components must work in both light and dark mode. Dark mode is activated via the `.dark` class on `<html>`. Use Tailwind's `dark:` prefix:

```tsx
<div className="bg-white dark:bg-[var(--surface-elevated)] text-[var(--text-primary)]">
```

### Performance

- Wrap heavy components (D3 charts, player images) in `React.lazy()` — see `src/components/lazy/`
- Use `React.memo` for expensive renders in fantasy football tier lists
- Use `LazyPlayerImage` for all player headshots

### Images

Always use `OptimizedImage` or Next.js `Image`:

```tsx
import Image from "next/image";
// or
import { OptimizedImage } from "@/components/ui/OptimizedImage";
```

Never use `<img>` tags directly.

### Check ui/ Before Creating New Primitives

Before creating a new UI component, check `src/components/ui/` — the required primitive likely already exists.

---

## Related Documentation

- **[STYLING.md](./STYLING.md)** - Design system and CSS conventions
- **[PAGES.md](./PAGES.md)** - Page routing and structure
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture

---

*Last Updated: March 2026*
