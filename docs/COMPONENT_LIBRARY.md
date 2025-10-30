# Component Library Documentation

## Overview
Comprehensive documentation for the UI component library and design system used in the Isaac Vazquez Digital Platform, covering both portfolio and fantasy football analytics components.

## 📋 Table of Contents

- [Design System](#design-system)
- [Core UI Components](#core-ui-components)
- [Fantasy Football Components](#fantasy-football-components)
- [Layout & Navigation](#layout--navigation)
- [Form & Input Components](#form--input-components)
- [Animation & Effects](#animation--effects)
- [Usage Guidelines](#usage-guidelines)
- [Accessibility Features](#accessibility-features)

## 🎨 Design System

### Cyberpunk Professional Theme
The design system balances futuristic cyberpunk aesthetics with professional usability, creating a unique dual-purpose platform experience.

**Core Principles:**
- **Electric Aesthetics** - Neon blue and matrix green color palette
- **Glassmorphism** - Transparent, blurred surfaces with depth
- **Terminal Interfaces** - Command-line inspired interactions
- **Data Visualization** - Advanced charts and analytics displays
- **Accessibility First** - WCAG 2.1 AA compliance throughout

### Color System
```css
/* Primary Cyberpunk Colors */
:root {
  --electric-blue: #00F5FF;    /* Primary accent, headings, links */
  --matrix-green: #39FF14;     /* Secondary accent, success states */
  --warning-amber: #FFB800;    /* Warnings and attention items */
  --error-red: #FF073A;        /* Errors and critical states */
  --neon-purple: #BF00FF;      /* Tertiary accent, special effects */
  --cyber-teal: #00FFBF;       /* Additional accent color */
  
  /* Terminal Interface */
  --terminal-bg: #0A0A0B;      /* Dark backgrounds, cards */
  --terminal-border: #1A1A1B;  /* Subtle borders */
  --terminal-text: #00FF00;    /* Terminal-style text */
  --terminal-cursor: #00F5FF;  /* Cursor and active states */
}
```

### Typography System
```css
/* Font Families */
--font-orbitron: 'Orbitron', monospace;      /* Cyberpunk headings */
--font-inter: 'Inter', sans-serif;           /* Professional body text */
--font-jetbrains: 'JetBrains Mono', monospace; /* Code and terminal */

/* Responsive Type Scale */
--text-xs: 0.75rem;    /* 12px - Small labels, captions */
--text-sm: 0.875rem;   /* 14px - Body text, form inputs */
--text-base: 1rem;     /* 16px - Primary body text */
--text-lg: 1.125rem;   /* 18px - Subheadings */
--text-xl: 1.25rem;    /* 20px - Section headings */
--text-2xl: 1.5rem;    /* 24px - Page headings */
--text-3xl: 1.875rem;  /* 30px - Hero headings */
--text-4xl: 2.25rem;   /* 36px - Display headings */
```

## 🧩 Core UI Components

### Badge Component
Versatile badge component with multiple variants, sizes, and optional link functionality.

```typescript
interface BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline" | "matrix" | "electric";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  href?: string; // Optional link functionality
  glow?: boolean; // Optional glow effect
  className?: string;
}
```

**Usage Examples:**
```tsx
// Basic badge
<Badge variant="electric">PPR</Badge>

// Link badge with animation
<Badge href="/draft-tiers" variant="matrix" glow>
  View Tiers
</Badge>

// Large badge with custom styling
<Badge variant="outline" size="lg" className="mb-4">
  Elite Tier
</Badge>
```

**Variants:**
- `default` - Electric blue background
- `secondary` - Neutral with border
- `destructive` - Red error state
- `outline` - Transparent with border
- `matrix` - Matrix green theme
- `electric` - Electric blue theme

### GlassCard Component
Container component with glassmorphism effects and elevation system.

```typescript
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  elevation?: 1 | 2 | 3 | 4 | 5;
  glow?: boolean;
  hover?: boolean;
}
```

**Usage:**
```tsx
<GlassCard elevation={3} glow hover>
  <h3>Fantasy Player Stats</h3>
  <p>Advanced analytics and tier information</p>
</GlassCard>
```

### MorphButton Component
Animated button with cyberpunk styling and physics-based interactions.

```typescript
interface MorphButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'terminal' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  href?: string; // Optional link functionality
  disabled?: boolean;
}
```

**Usage:**
```tsx
<MorphButton variant="primary" size="lg" glow>
  Update Player Data
</MorphButton>

<MorphButton href="/admin" variant="terminal">
  Admin Panel
</MorphButton>
```

### Heading Component
Typography component with consistent styling and cyberpunk theme.

```typescript
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'terminal';
  className?: string;
}
```

**Usage:**
```tsx
<Heading level={1} variant="gradient">
  Fantasy Football Analytics
</Heading>

<Heading level={3} variant="terminal">
  > system_status: operational
</Heading>
```

### OptimizedImage Component
High-performance image component with lazy loading and optimization.

```typescript
interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}
```

## 🏈 Fantasy Football Components

### DraftTierChart Component
Advanced tier visualization with D3.js integration and machine learning insights.

```typescript
interface DraftTierChartProps {
  position: string;
  scoringFormat: 'ppr' | 'half-ppr' | 'standard';
  data: PlayerData[];
  interactive?: boolean;
  showConfidence?: boolean;
}
```

**Features:**
- Machine learning-powered tier calculations
- Interactive player selection
- Confidence intervals and statistical analysis
- Responsive design for mobile and desktop

### EnhancedPlayerCard Component
Comprehensive player information display with advanced statistics.

```typescript
interface EnhancedPlayerCardProps {
  player: Player;
  showAdvancedStats?: boolean;
  interactive?: boolean;
  onSelect?: (player: Player) => void;
}
```

**Features:**
- Player headshot with fallback handling
- Advanced fantasy statistics
- Tier information and rankings
- Interactive selection capabilities

### PositionSelector Component
Fantasy position filtering interface with multi-select capabilities.

```typescript
interface PositionSelectorProps {
  selectedPositions: string[];
  onPositionChange: (positions: string[]) => void;
  availablePositions?: string[];
  allowMultiple?: boolean;
}
```

### TierChartEnhanced Component
Enhanced tier chart with advanced analytics and comparison features.

```typescript
interface TierChartEnhancedProps {
  data: TierData[];
  position: string;
  scoringFormat: string;
  showComparisons?: boolean;
  highlightTiers?: number[];
}
```

## 🧭 Layout & Navigation

### ConditionalLayout Component
Dynamic layout system that adapts based on route and content type.

```typescript
interface ConditionalLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
  fullScreen?: boolean;
}
```

**Features:**
- Route-based layout decisions
- Fantasy football specialized layouts
- Mobile-responsive navigation
- Terminal hero layout for home page

### FloatingNav Component
Persistent navigation overlay with fantasy football integration.

```typescript
interface FloatingNavProps {
  currentPath: string;
  navItems: NavItem[];
  showFantasyLinks?: boolean;
}
```

### CommandPalette Component
Spotlight-style command interface with global search capabilities.

```typescript
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, data?: any) => void;
}
```

**Features:**
- Keyboard shortcuts (⌘K)
- Global search across content and players
- Quick navigation to fantasy football tools
- Recent actions and suggestions

### Breadcrumbs Component
Contextual navigation breadcrumbs with fantasy football awareness.

```typescript
interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showFantasyContext?: boolean;
}
```

## 📝 Form & Input Components

### SearchInterface Component
Advanced search interface with filtering and categorization.

```typescript
interface SearchInterfaceProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
  categories?: string[];
  showFilters?: boolean;
}
```

### SearchFilters Component
Search filtering and categorization controls.

```typescript
interface SearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  availableCategories: string[];
}
```

## ✨ Animation & Effects

### BackgroundEffects Component
Animated background particles and grid effects.

```typescript
interface BackgroundEffectsProps {
  variant?: 'particles' | 'grid' | 'terminal' | 'none';
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
}
```

### LazyPlayerImage Component
Optimized player image loading with caching and fallbacks.

```typescript
interface LazyPlayerImageProps {
  playerId: string;
  playerName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: 'initials' | 'placeholder' | 'generic';
}
```

**Features:**
- Intelligent caching system
- Multiple fallback strategies
- Lazy loading with intersection observer
- Automatic quality assessment

### VirtualizedPlayerList Component
High-performance player list with virtualization for large datasets.

```typescript
interface VirtualizedPlayerListProps {
  players: Player[];
  itemHeight: number;
  renderPlayer: (player: Player, index: number) => React.ReactNode;
  onPlayerSelect?: (player: Player) => void;
}
```

## 📊 Data Visualization Components

### TierDisplay Component
Clean tier information display with statistical insights.

### TierLegend Component
Interactive legend for tier charts with explanations.

### DataFreshnessIndicator Component
Shows data freshness and last update information.

```typescript
interface DataFreshnessIndicatorProps {
  lastUpdated: Date;
  source: string;
  autoRefresh?: boolean;
}
```

### ExpertConsensusIndicator Component
Displays expert consensus confidence and analysis.

## 📱 Responsive Design Guidelines

### Breakpoint System
```css
/* Tailwind CSS breakpoints used throughout */
sm: '640px',   /* Mobile landscape and up */
md: '768px',   /* Tablet and up */
lg: '1024px',  /* Desktop and up */
xl: '1280px',  /* Large desktop and up */
2xl: '1536px'  /* Extra large desktop and up */
```

### Mobile-First Approach
All components are designed mobile-first with progressive enhancement:
- Touch-friendly interactions (minimum 44px tap targets)
- Simplified layouts for mobile fantasy football usage
- Optimized tier charts for small screens
- Swipe gestures for navigation

## ♿ Accessibility Features

### WCAG 2.1 AA Compliance
- **Keyboard Navigation:** Full keyboard support for all interactive elements
- **Screen Reader Support:** Comprehensive ARIA labels and descriptions
- **Color Contrast:** Meets or exceeds 4.5:1 ratio requirements
- **Focus Management:** Clear focus indicators and logical tab order
- **Motion Preferences:** Respects `prefers-reduced-motion` settings

### Fantasy Football Specific Accessibility
- **Player Data Tables:** Proper table headers and sorting announcements
- **Tier Charts:** Alternative text descriptions for visual data
- **Interactive Charts:** Keyboard navigation for D3.js visualizations
- **Mobile Usage:** Optimized for fantasy draft situations

## 🛠️ Development Guidelines

### Component Creation Checklist
- [ ] TypeScript interfaces defined
- [ ] Responsive design implemented
- [ ] Accessibility features added
- [ ] Error boundaries handled
- [ ] Loading states included
- [ ] Animation performance optimized
- [ ] Documentation updated

### Testing Approach
```bash
# Component testing
npm run test:components

# Visual regression testing
npm run test:visual

# Accessibility testing
npm run test:a11y
```

### Performance Considerations
- **Bundle Size:** Components are tree-shakeable
- **Lazy Loading:** Heavy components are dynamically imported
- **Memoization:** Expensive calculations are memoized
- **Virtual Scrolling:** Used for large data sets

## 📚 Related Documentation

- **[FANTASY_PLATFORM_SETUP.md](./FANTASY_PLATFORM_SETUP.md)** - Platform configuration
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Data model documentation
- **[API.md](./API.md)** - API endpoint documentation
- **[PERFORMANCE.md](./PERFORMANCE.md)** - Performance optimization guide

---

*This component library documentation reflects the comprehensive dual-purpose platform architecture. Components are designed for both professional portfolio presentation and advanced fantasy football analytics, maintaining consistency while serving distinct use cases.*