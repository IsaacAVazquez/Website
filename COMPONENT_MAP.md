# Component Map - Isaac Vazquez Digital Platform

**Last Updated:** October 29, 2025
**Framework:** React 19 / Next.js 15
**Component Count:** 60+ components

---

## Table of Contents

- [Component Architecture](#component-architecture)
- [Core Layout Components](#core-layout-components)
- [UI Component Library](#ui-component-library)
- [Fantasy Football Components](#fantasy-football-components)
- [Navigation Components](#navigation-components)
- [Content Components](#content-components)
- [Marketing & Engagement](#marketing--engagement)
- [SEO & Metadata Components](#seo--metadata-components)
- [Component Patterns & Best Practices](#component-patterns--best-practices)

---

## Component Architecture

### Component Organization

```
src/components/
├── ui/                         # Core reusable UI components (14 components)
├── fantasy-football/           # Fantasy sports specific components
├── navigation/                 # Navigation and routing components
├── blog/                       # Blog and content components
├── newsletter/                 # Newsletter subscription components
├── testimonials/               # Testimonial display components
├── search/                     # Search interface components
├── local-seo/                  # Local SEO and location components (8 components)
├── lazy/                       # Lazy-loaded component wrappers
└── [root level]                # Page-specific and shared components (20+ components)
```

### Component Categories

| Category | Count | Purpose |
|----------|-------|---------|
| Core UI | 14 | Reusable interface elements (buttons, cards, typography) |
| Fantasy Football | 15+ | Sports analytics, charts, player data |
| Navigation | 4 | Navigation systems and breadcrumbs |
| Content | 8 | Blog, writing, testimonials |
| Marketing | 3 | Newsletter, CTAs, engagement |
| SEO | 10 | Local SEO, structured data, metadata |
| Layout | 6 | Page layouts, containers, conditional rendering |

---

## Core Layout Components

### Primary Layout Components

| Component | File | Purpose | Props |
|-----------|------|---------|-------|
| `ConditionalLayout` | `src/components/ConditionalLayout.tsx` | Dynamic route-based layout manager | `children: ReactNode` |
| `TerminalHero` | `src/components/TerminalHero.tsx` | Home page terminal interface with typing effects | None |
| `Container` | `src/components/Container.tsx` | Responsive container with max-width constraints | `children, className` |
| `BackgroundEffects` | `src/components/BackgroundEffects.tsx` | Animated background particles and grid | None |
| `Circles` | `src/components/Circles.tsx` | Floating circle animations for backgrounds | None |
| `Footer` | `src/components/Footer.tsx` | Site-wide footer with social links | None |
| `Header` | `src/components/Header.tsx` | Page header component | `title, description` |

### Layout Features

**ConditionalLayout Logic:**
- Home page (`/`) → Full-screen TerminalHero, no chrome
- Fantasy Football → Full-width specialized layout
- Other pages → Standard layout with FloatingNav and Footer

**TerminalHero Features:**
- Animated terminal commands with realistic typing
- Split-screen layout (terminal left, hero content right)
- Particle effects and grid backgrounds
- Responsive mobile adaptations
- Cyberpunk aesthetic with glowing effects

---

## UI Component Library

### Core UI Components

| Component | File | Purpose | Variants |
|-----------|------|---------|----------|
| `GlassCard` | `src/components/ui/GlassCard.tsx` | Glassmorphism container with 5-tier elevation | `elevation: 1-5`, `interactive`, `cursorGlow`, `noiseTexture` |
| `MorphButton` | `src/components/ui/MorphButton.tsx` | Animated cyberpunk button | `variant: primary, secondary, ghost`, `size: sm, md, lg` |
| `Badge` | `src/components/ui/Badge.tsx` | Cyberpunk-styled label/tag | `variant: default, success, warning, error` |
| `Heading` | `src/components/ui/Heading.tsx` | Typography component for headings | `level: 1-6`, `className` |
| `Paragraph` | `src/components/ui/Paragraph.tsx` | Styled paragraph with theme integration | `className` |
| `FloatingNav` | `src/components/ui/FloatingNav.tsx` | Persistent navigation overlay | `navItems: NavItem[]` |
| `CommandPalette` | `src/components/ui/CommandPalette.tsx` | Spotlight-style command interface (⌘K) | None |

### GlassCard Elevation System

```typescript
Elevation Tiers:
├── Level 1: Subtle (2px blur, 5% opacity)
├── Level 2: Light (4px blur, 10% opacity)
├── Level 3: Medium (8px blur, 15% opacity)  ← Default
├── Level 4: Strong (12px blur, 20% opacity)
└── Level 5: Intense (16px blur, 25% opacity)

Additional Props:
- interactive: Adds hover lift effect
- cursorGlow: Tracks cursor with spotlight glow
- noiseTexture: Adds subtle grain texture
```

### Advanced UI Components

| Component | File | Purpose |
|-----------|------|---------|
| `OptimizedImage` | `src/components/ui/OptimizedImage.tsx` | Performance-optimized image loader |
| `LazyPlayerImage` | `src/components/ui/LazyPlayerImage.tsx` | Lazy-loaded player headshots with fallback |
| `VirtualizedPlayerList` | `src/components/ui/VirtualizedPlayerList.tsx` | Performance-optimized player list rendering |
| `QADashboard` | `src/components/ui/QADashboard.tsx` | Interactive metrics display (legacy) |
| `PersonalMetrics` | `src/components/ui/PersonalMetrics.tsx` | Personal achievement metrics |
| `SkillsRadar` | `src/components/ui/SkillsRadar.tsx` | Radar chart for skills visualization |
| `SystemInfo` | `src/components/ui/SystemInfo.tsx` | Terminal-style system information |
| `RelatedContent` | `src/components/ui/RelatedContent.tsx` | Related content suggestions |
| `JourneyTimeline` | `src/components/ui/JourneyTimeline.tsx` | Career journey timeline |

---

## Fantasy Football Components

### Core Fantasy Components

| Component | File | Purpose |
|-----------|------|---------|
| `FantasyFootballLandingContent` | `src/components/FantasyFootballLandingContent.tsx` | Main fantasy football hub interface |
| `DraftTiersContent` | `src/components/DraftTiersContent.tsx` | Tier content management and display |
| `PositionSelector` | `src/components/PositionSelector.tsx` | Fantasy position filtering interface |
| `EnhancedPlayerCard` | `src/components/EnhancedPlayerCard.tsx` | Comprehensive player information display |
| `FantasyContentGrid` | `src/components/FantasyContentGrid.tsx` | Grid layout for fantasy content |

### Tier Chart Components

| Component | File | Purpose | Technology |
|-----------|------|---------|------------|
| `DraftTierChart` | `src/components/DraftTierChart.tsx` | Advanced tier visualization | D3.js, SVG |
| `TierChart` | `src/components/TierChart.tsx` | Interactive tier charts with real-time updates | D3.js |
| `TierChartEnhanced` | `src/components/TierChartEnhanced.tsx` | Enhanced visualization with ML insights | D3.js, Canvas |
| `LightweightTierChart` | `src/components/LightweightTierChart.tsx` | Performance-optimized for mobile | SVG |
| `TierDisplay` | `src/components/TierDisplay.tsx` | Tier grouping display component | React |
| `TierLegend` | `src/components/TierLegend.tsx` | Chart legend for tier colors | React |

**Tier Chart Features:**
- Machine learning-powered tier grouping
- K-means clustering visualization
- Gaussian mixture model overlays
- Interactive tooltips with player stats
- Responsive design for mobile/desktop
- Real-time data updates
- Export to PNG functionality

### Data Visualization Components

| Component | File | Purpose |
|-----------|------|---------|
| `DataComparison` | `src/components/DataComparison.tsx` | Compare player data across sources |
| `DataFreshnessIndicator` | `src/components/DataFreshnessIndicator.tsx` | Show data update timestamps |
| `ExpertConsensusIndicator` | `src/components/ExpertConsensusIndicator.tsx` | Expert consensus visualization |
| `UpdateDataButton` | `src/components/UpdateDataButton.tsx` | Manual data refresh trigger |

### Draft Tracker System

**Location:** Draft tracker components are referenced but files not found in scan
**Expected Components:**
- `DraftBoard` - Main interactive draft board interface
- `DraftControls` - Draft management and control panel
- `DraftHistory` - Draft history tracking and analytics
- `DraftSetup` - Draft configuration wizard
- `PlayerDraftCard` - Individual player draft cards

**Note:** These components may be in development or lazily loaded. Check `src/app/fantasy-football/draft-tracker/` for implementation.

---

## Navigation Components

### Navigation System

| Component | File | Purpose |
|-----------|------|---------|
| `FloatingNav` | `src/components/ui/FloatingNav.tsx` | Persistent overlay navigation with fantasy integration |
| `CommandPalette` | `src/components/ui/CommandPalette.tsx` | Keyboard-driven command interface (⌘K) |
| `Breadcrumbs` | `src/components/navigation/Breadcrumbs.tsx` | Contextual breadcrumb navigation |

### FloatingNav Features

```typescript
Features:
├── Sticky positioning across all pages
├── Desktop: Fixed top navigation bar
├── Mobile: Floating action button
├── Glassmorphism styling
├── Active route highlighting
├── Fantasy Football sub-menu integration
├── Smooth scroll animations
└── Accessibility (ARIA labels, keyboard navigation)
```

### CommandPalette Features

```typescript
Features:
├── Keyboard shortcut activation (⌘K / Ctrl+K)
├── Fuzzy search across all content
├── Quick navigation to any page
├── Recent pages history
├── Player search integration
├── Keyboard-only navigation (↑↓ arrows, Enter)
└── ESC to close
```

---

## Content Components

### Blog & Writing Components

| Component | File | Purpose |
|-----------|------|---------|
| `BlogFilter` | `src/components/blog/BlogFilter.tsx` | Blog post filtering and categorization |
| `Prose` | `src/components/Prose.tsx` | Styled prose container for MDX content |
| `Highlight` | `src/components/Highlight.tsx` | Text highlighting component |

### Portfolio Components

| Component | File | Purpose |
|-----------|------|---------|
| `ProjectsContent` | `src/components/ProjectsContent.tsx` | Project showcase with bento layout |
| `ProjectDetailModal` | `src/components/ProjectDetailModal.tsx` | Project detail modal/overlay |
| `About` | `src/components/About.tsx` | About page content and personal story |
| `ContactContent` | `src/components/ContactContent.tsx` | Contact form and information |
| `ProductManagerJourney` | `src/components/ProductManagerJourney.tsx` | PM journey visualization |

### Test & Development Components

| Component | File | Purpose |
|-----------|------|---------|
| `TestFlexImplementation` | `src/components/TestFlexImplementation.tsx` | Test component for flex layouts |
| `LazyQADashboard` | `src/components/LazyQADashboard.tsx` | Lazy-loaded QA dashboard |

---

## Marketing & Engagement

### Newsletter Components

| Component | File | Purpose |
|-----------|------|---------|
| `NewsletterCTA` | `src/components/newsletter/NewsletterCTA.tsx` | Newsletter call-to-action cards |
| `NewsletterSignup` | `src/components/newsletter/NewsletterSignup.tsx` | Newsletter subscription forms |

**Features:**
- Email validation
- API integration (`/api/newsletter/subscribe`)
- Success/error states
- Cyberpunk styling
- Mobile responsive

### Testimonial Components

| Component | File | Purpose |
|-----------|------|---------|
| `TestimonialCard` | `src/components/testimonials/TestimonialCard.tsx` | Individual testimonial display |
| `TestimonialsSection` | `src/components/testimonials/TestimonialsSection.tsx` | Testimonials grid/carousel |

---

## SEO & Metadata Components

### Core SEO Components

| Component | File | Purpose |
|-----------|------|---------|
| `StructuredData` | `src/components/StructuredData.tsx` | JSON-LD structured data injection |
| `Analytics` | `src/components/Analytics.tsx` | Analytics tracking component |
| `Providers` | `src/components/Providers.tsx` | Global providers wrapper |

### Local SEO Components

**Location:** `src/components/local-seo/`

| Component | File | Purpose |
|-----------|------|---------|
| `LocalSEOProvider` | `src/components/local-seo/LocalSEOProvider.tsx` | Local SEO context provider |
| `LocalSEOSchemas` | `src/components/local-seo/LocalSEOSchemas.tsx` | Local business schema markup |
| `NAPDisplay` | `src/components/local-seo/NAPDisplay.tsx` | Name, Address, Phone display |
| `LocationSelector` | `src/components/local-seo/LocationSelector.tsx` | Multi-location selector |
| `LocationSpecificContent` | `src/components/local-seo/LocationSpecificContent.tsx` | Location-based content |
| `GeoTargeting` | `src/components/local-seo/GeoTargeting.tsx` | Geographic targeting logic |
| `GoogleBusinessIntegration` | `src/components/local-seo/GoogleBusinessIntegration.tsx` | Google Business Profile integration |
| `LocalReviews` | `src/components/local-seo/LocalReviews.tsx` | Local review display |

---

## Search Components

### Search Interface

| Component | File | Purpose |
|-----------|------|---------|
| `SearchInterface` | `src/components/search/SearchInterface.tsx` | Main search UI with input and controls |
| `SearchFilters` | `src/components/search/SearchFilters.tsx` | Search filtering and categorization |
| `SearchResults` | `src/components/search/SearchResults.tsx` | Search result display with relevance |

**Search Features:**
- Real-time search across all content
- Player database search
- Blog post search
- Category filtering
- Debounced input
- Keyboard navigation
- Highlighted matches

---

## Component Patterns & Best Practices

### Common Props Interface

```typescript
// Standard component props pattern
interface ComponentProps {
  className?: string;           // Optional Tailwind classes
  children?: ReactNode;         // Child components
  variant?: 'default' | ...;   // Component variants
  size?: 'sm' | 'md' | 'lg';   // Size options
  onClick?: () => void;         // Event handlers
  'aria-label'?: string;        // Accessibility
}
```

### Component Variants

Most components support variants for different contexts:

```typescript
Button Variants:
├── primary    - Electric blue, main actions
├── secondary  - Matrix green, secondary actions
├── ghost      - Transparent, subtle interactions
└── danger     - Error red, destructive actions

Card Elevation:
├── 1 - Subtle elevation (subtle elements)
├── 2 - Light elevation (content cards)
├── 3 - Medium elevation (feature cards) ← Default
├── 4 - Strong elevation (modals, overlays)
└── 5 - Intense elevation (critical elements)

Badge Variants:
├── default  - Neutral gray
├── success  - Matrix green
├── warning  - Warning amber
└── error    - Error red
```

### Animation Patterns

Components use **Framer Motion** for animations:

```typescript
Common Animation Patterns:
├── Entrance Animations
│   ├── fadeIn: opacity 0 → 1
│   ├── slideUp: y: 20 → 0
│   └── scale: scale 0.95 → 1
│
├── Hover Effects
│   ├── lift: y: 0 → -5px
│   ├── glow: box-shadow intensity increase
│   └── scale: scale 1 → 1.05
│
├── Stagger Animations
│   └── List items: 0.1s delay between children
│
└── Spring Physics
    └── Default: { stiffness: 100, damping: 15 }
```

### Accessibility Standards

All components follow WCAG 2.1 Level AA:

```typescript
Accessibility Checklist:
✓ ARIA labels on interactive elements
✓ Keyboard navigation support
✓ Focus visible states
✓ Color contrast ratio ≥ 4.5:1
✓ Screen reader announcements
✓ Reduced motion support (@media prefers-reduced-motion)
✓ Semantic HTML elements
✓ Alt text on images
```

### Performance Optimization

```typescript
Performance Patterns:
├── Lazy Loading
│   ├── Dynamic imports for heavy components
│   ├── Image lazy loading with Next.js Image
│   └── Code splitting by route
│
├── Memoization
│   ├── React.memo for expensive renders
│   ├── useMemo for computed values
│   └── useCallback for event handlers
│
├── Virtualization
│   └── VirtualizedPlayerList for long lists
│
└── Caching
    ├── Player image cache
    ├── API response cache
    └── Component render cache
```

### Styling Conventions

```typescript
Styling Approach:
├── Tailwind Utility Classes (primary)
│   └── Mobile-first responsive design
│
├── CSS Custom Properties (theme)
│   ├── --electric-blue
│   ├── --matrix-green
│   └── [30+ theme variables]
│
├── Framer Motion (animations)
│   └── Declarative animation API
│
└── CSS Modules (when needed)
    └── Component-specific styles
```

---

## Lazy Loading Components

### Lazy-Loaded Wrappers

| Component | File | Loads |
|-----------|------|-------|
| `LazyFantasyComponents` | `src/components/lazy/LazyFantasyComponents.tsx` | Heavy fantasy components on demand |
| `LazyQADashboard` | `src/components/LazyQADashboard.tsx` | QA dashboard visualization |

**Usage:**
```typescript
import { LazyTierChart } from '@/components/lazy/LazyFantasyComponents';

// Component loads when needed, with loading fallback
<Suspense fallback={<LoadingSpinner />}>
  <LazyTierChart position="QB" />
</Suspense>
```

---

## Quick Reference

### Most Used Components

| Component | Use Case | Import |
|-----------|----------|--------|
| `GlassCard` | Any container with glassmorphism | `@/components/ui/GlassCard` |
| `Heading` | Page/section headings | `@/components/ui/Heading` |
| `MorphButton` | CTAs and actions | `@/components/ui/MorphButton` |
| `FloatingNav` | Navigation overlay | `@/components/ui/FloatingNav` |
| `DraftTierChart` | Player tier visualization | `@/components/DraftTierChart` |
| `EnhancedPlayerCard` | Player information | `@/components/EnhancedPlayerCard` |

### Component Development Workflow

1. **Create component** in appropriate directory
2. **Define TypeScript interface** for props
3. **Add Framer Motion** animations if interactive
4. **Implement accessibility** (ARIA, keyboard nav)
5. **Add variants** for different contexts
6. **Optimize performance** (memo, lazy loading)
7. **Test responsiveness** (mobile, tablet, desktop)
8. **Document usage** in component file

### Testing Components

```bash
# Component appears in browser
npm run dev

# Check for accessibility issues
npm run lint

# Build test
npm run build
```

---

**For routing information, see:** `WEBSITE_MAP.md`
**For data management, see:** `DATA_ARCHITECTURE_MAP.md`
**For styling system, see:** `docs/STYLING_SYSTEM.md`
