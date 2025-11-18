# Isaac Vazquez Portfolio & Fantasy Football Platform - Comprehensive Application Overview

## Project Summary
Isaac Vazquez's professional portfolio website with integrated **Fantasy Football Draft Tools**. The platform combines professional portfolio features with advanced fantasy football ranking and draft analysis tools, featuring a warm, modern aesthetic with sunset and golden colors, clean typography, and accessible design optimized for both desktop and mobile experiences.

**Live Site:** https://isaacavazquez.com
**Owner:** Isaac Vazquez (Technical Product Manager & UC Berkeley Haas MBA Candidate)
**Primary Purpose:** Professional Portfolio + Fantasy Football Tools
**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Framer Motion, D3.js, SQLite

---

## Application Architecture Overview

### **Dual-Purpose Platform**

This is a hybrid application serving two distinct purposes:

#### **1. Professional Portfolio**
- Modern hero section with professional headshot
- Project showcase with warm card styling
- Professional resume with download capability
- Contact page with social links
- About page with tabbed navigation (Overview/Journey)
- Blog system with MDX support
- Consulting services page

#### **2. Fantasy Football Tools**
- Position-specific tier rankings (QB, RB, WR, TE, K, DST, FLEX)
- Draft tiers visualization with D3.js charts
- Player comparison and consensus analytics
- Draft tracker with real-time analytics
- Data integration from FantasyPros
- Automated data pipeline with caching system
- Player image database and optimization

---

## Architecture & Technical Stack

### Framework & Core Technologies
- **Next.js 15** with App Router architecture
- **TypeScript** for comprehensive type safety
- **Tailwind CSS v4** for styling with custom warm modern theme
- **Framer Motion** for animations and micro-interactions
- **React 19** with modern hooks and patterns
- **D3.js** for data visualization (fantasy football charts)
- **SQLite (better-sqlite3)** for local data persistence

### Key Dependencies
#### Core UI & Animation
- `@tabler/icons-react` (v3.34.1) - Primary icon system
- `lucide-react` (v0.539.0) - Additional icon library
- `react-icons` (v5.5.0) - Supplementary icons
- `framer-motion` (v12.23.12) - Animations and transitions
- `tailwind-merge` (v3.3.1) - Dynamic class merging
- `@tailwindcss/typography` (v0.5.16) - Rich text styling
- `clsx` (v2.1.1) - Conditional class names

#### Data Visualization & Analytics
- `d3` (v7.9.0) - Fantasy football tier charts and visualizations
- `better-sqlite3` (v12.2.0) - Local database for player data
- `@types/d3` (v7.4.3) - TypeScript definitions for D3

#### Content & SEO
- `next-sitemap` (v4.2.3) - SEO sitemap generation
- `gray-matter` (v2.0.1) - MDX/Markdown processing
- `remark` (v15.0.1) - Content processing pipeline
- `remark-gfm` (v4.0.1) - GitHub-flavored markdown
- `remark-html` (v16.0.1) - HTML rendering

#### Authentication & Performance
- `next-auth` (v4.24.11) - Authentication system (admin features)
- `web-vitals` (v5.1.0) - Performance monitoring and analytics

### Build & Deployment
- **Build Command:** `npm run build`
- **Dev Server:** `npm run dev`
- **Deployment:** Netlify (primary platform)
- **SEO:** Automatic sitemap generation, structured data, OpenGraph metadata
- **Bundle Analysis:** `npm run analyze` - Webpack bundle analyzer integration
- **Bundle Size:** Optimized with advanced code splitting strategies

---

## Design System: Warm Modern Professional Theme

### Color Palette
```css
/* Warm Modern Colors */
--color-primary: #FF6B35      /* Sunset Orange - primary actions, headings */
--color-secondary: #F7B32B    /* Golden Yellow - secondary actions, accents */
--color-accent: #FF8E53       /* Coral - hover states, highlights */
--color-tertiary: #6BCF7F     /* Fresh Green - tertiary actions */
--color-warning: #FFB020      /* Warm Amber - attention items */
--color-error: #FF5757        /* Warm Red - error states */

/* Warm Neutrals */
--neutral-50: #FFFCF7         /* Warm cream - backgrounds */
--neutral-100-950: ...        /* Full neutral scale */
--neutral-700: #4A3426        /* Dark warm brown - primary text */
--neutral-800: #2D1B12        /* Very dark warm brown - dark mode */
--neutral-900: #1C1410        /* Deepest warm brown */

/* Semantic Colors */
--text-primary: var(--neutral-700)
--text-secondary: var(--neutral-600)
--surface-primary: rgba(255, 252, 247, 0.95)
--surface-secondary: rgba(255, 248, 240, 0.9)
--surface-elevated: rgba(255, 255, 255, 0.98)
--surface-overlay: rgba(0, 0, 0, 0.5)
--border-primary: rgba(255, 228, 214, 0.5)

/* Legacy Cyberpunk Colors (backward compatibility) */
--electric-blue: #00D9FF
--matrix-green: #00FF41
--neon-purple: #B026FF
--cyber-teal: #00F5FF
```

### Typography Hierarchy
- **Headings:** Inter (clean, modern, professional) + Orbitron (legacy accent font)
- **Body Text:** Inter (optimal readability)
- **Display Text:** Oversized Inter for hero sections (text-display-xl/xxl)
- **Code:** JetBrains Mono (monospace, technical)
- **Font Variables:**
  - `--font-inter` - Primary sans-serif
  - `--font-orbitron` - Accent/heading font (legacy)
  - `--font-jetbrains-mono` - Monospace

### Animation Patterns
- **Warm Shadows:** Subtle orange/golden glow effects (shadow-warm-lg, shadow-warm-xl)
- **Hover Lift:** Gentle elevation on interactive elements (-translate-y-1)
- **Fade In:** Smooth entrance animations with Framer Motion
- **Physics-based:** Spring animations with custom timing (cubic-bezier(0.34, 1.56, 0.64, 1))
- **Reduced Motion:** Full support for accessibility preferences
- **Micro-interactions:** float, pulse-slow, gradient-shift, skeleton-loading
- **Custom Animations:** slide-in-up, shake, spinner-rotate

---

## Application Structure

### Complete Page Routing & Content

#### **Portfolio Pages**
```
/ (Home)                    - ModernHero with oversized typography and headshot
/about                      - Personal story with tabbed navigation (Overview/Journey)
/projects                   - Project showcase with warm card styling
/resume                     - Professional resume with download capability
/contact                    - Contact information and social links
/consulting                 - Consulting services and offerings
```

#### **Fantasy Football Pages**
```
/fantasy-football           - Fantasy football landing page and overview
/fantasy-football/tiers/[position] - Position-specific tier rankings (qb, rb, wr, te, k, dst, flex)
/fantasy-football/draft-tracker - Live draft tracking and analytics
```

#### **Content & Community Pages**
```
/blog                       - Blog listing with MDX support
/blog/[slug]                - Individual blog posts
/writing                    - Writing portfolio and articles
/writing/[slug]             - Individual writing pieces
/notes                      - Notes and quick thoughts
/newsletter                 - Newsletter subscription
/testimonials               - Client and colleague testimonials
/faq                        - Frequently asked questions
```

#### **Admin & Utility Pages**
```
/admin                      - Admin dashboard (authenticated)
/admin/analytics            - Analytics and metrics dashboard
/search                     - Global search functionality
```

#### **SEO & Structured Data**
```
/sitemap.xml                - Auto-generated sitemap
/sitemap-local.xml          - Local business structured data
/robots.txt                 - Search engine directives
/manifest.json              - PWA manifest
```

### Navigation System
- **FloatingNav:** Persistent navigation overlay with active route highlighting
- **CommandPalette:** Keyboard shortcut navigation (⌘K) with quick page access
- **Mobile Navigation:** Touch-friendly floating navigation
- **Skip Links:** Accessibility-first navigation
- **Footer:** Social links and site information

### URL Redirects & Aliases
The application includes comprehensive URL redirects for SEO and user experience:
- `/portfolio`, `/work` → `/projects`
- `/ff`, `/rankings` → `/fantasy-football`
- `/qb`, `/rb`, `/wr`, `/te` → Position-specific tier pages
- `/cv` → `/resume`
- `/get-in-touch`, `/hire-me` → `/contact`
- `/blog/posts/:slug`, `/articles/:slug` → `/blog/:slug`

---

## API Architecture

### Core Application APIs
```
/api/analytics/
├── events                  - Event tracking and user analytics
└── web-vitals              - Performance monitoring and Core Web Vitals

/api/auth/
└── [...nextauth]           - NextAuth authentication endpoints

/api/fantasy-football/
├── fantasy-data            - Fantasy football player data
├── fantasy-pros            - FantasyPros API integration
├── fantasy-pros-free       - Free tier FantasyPros data
├── fantasy-pros-session    - Session-based FantasyPros scraping
└── player-images-mapping   - Player image database

/api/data-management/
├── data-manager            - Data CRUD operations
├── data-metadata           - Data freshness and metadata
├── data-pipeline           - Automated data sync pipeline
├── sample-data             - Sample/mock data for development
└── scheduled-update        - Scheduled data refresh

/api/content/
├── newsletter/subscribe    - Newsletter subscription
├── search                  - Global search functionality
├── rss                     - RSS feed generation
└── scrape                  - Web scraping utilities
```

### Data Pipeline Architecture
The fantasy football features use a sophisticated data pipeline:
1. **Data Sources:** FantasyPros API, web scraping, manual data entry
2. **Caching Layer:** Unified cache system with TTL and freshness tracking
3. **Database:** SQLite for player data, rankings, and historical analysis
4. **File System:** JSON data files for static player mappings and images
5. **Validation:** Comprehensive data validation with error handling
6. **Updates:** Scheduled and on-demand data refresh capabilities
/api/fantasy-data           - Fantasy football data from NFLverse/DynastyProcess (active)
/api/analytics/events       - Event tracking and user analytics (planned)
/api/analytics/web-vitals   - Performance monitoring and Core Web Vitals
/api/newsletter/subscribe   - Newsletter subscription (planned)
/api/search                 - Global search functionality (planned)
```

**Fantasy Football Data API:**
- **Source:** NFLverse/DynastyProcess GitHub repositories (open-source, no API keys required)
- **Data:** Expert consensus rankings, weekly projections, player statistics
- **Caching:** 15-minute in-memory cache for optimal performance
- **Formats:** PPR, Half-PPR, Standard scoring
- **Positions:** QB, RB, WR, TE, K, DST, OVERALL
- **Documentation:** See `NFLVERSE_INTEGRATION.md` for details

**Note:** Most content is static and pre-rendered for optimal performance. Fantasy data is fetched on-demand from public GitHub repositories.

---

## Component Architecture

### Core Layout Components
- **`ConditionalLayout`** (`src/components/ConditionalLayout.tsx`) - Dynamic route and layout management
- **`ModernHero`** (`src/components/ModernHero.tsx`) - Home page hero with oversized typography
- **`Header`** (`src/components/Header.tsx`) - Page header component
- **`Footer`** (`src/components/Footer.tsx`) - Footer with social links
- **`BackgroundEffects`** (`src/components/BackgroundEffects.tsx`) - Animated background elements
- **`Circles`** (`src/components/Circles.tsx`) - Decorative circle animations

### UI Component Library (`src/components/ui/`)
- **`WarmCard`** - Main container with warm theme, hover effects, multiple padding options
- **`ModernButton`** - Button with 4 variants (primary, secondary, outline, ghost)
- **`Badge`** - Warm-styled labels and tags
- **`Heading`** - Typography component with hierarchy (h1-h6)
- **`Paragraph`** - Body text component with theme integration
- **`FloatingNav`** - Persistent navigation overlay with active route highlighting
- **`CommandPalette`** - Keyboard-driven command interface (⌘K)
- **`SkipToContent`** - Accessibility skip link component
- **`OptimizedImage`** - Image optimization wrapper with Next.js Image
- **`JourneyTimeline`** - Career timeline visualization component

### Portfolio-Specific Components
- **`About`** (`src/components/About.tsx`) - About page with tabbed navigation
- **`ProductManagerJourney`** (`src/components/ProductManagerJourney.tsx`) - Career journey timeline
- **`ProjectsContent`** (`src/components/ProjectsContent.tsx`) - Project showcase
- **`ProjectDetailModal`** (`src/components/ProjectDetailModal.tsx`) - Project detail modal
- **`ContactContent`** (`src/components/ContactContent.tsx`) - Contact page layout
- **`ConsultingContent`** (`src/components/ConsultingContent.tsx`) - Consulting services display

### Fantasy Football Components
- **`FantasyFootballLandingContent`** - Fantasy football homepage
- **`FantasyContentGrid`** - Grid layout for fantasy content
- **`DraftTiersContent`** - Draft tiers overview and comparison
- **`DraftTierChart`** - D3-based tier visualization
- **`TierChart`** - Legacy tier chart component
- **`TierChartEnhanced`** - Enhanced tier visualization with animations
- **`LightweightTierChart`** - Optimized tier chart for performance
- **`TierDisplay`** - Tier grouping display component
- **`TierLegend`** - Tier color legend and explanation
- **`EnhancedPlayerCard`** - Detailed player information card
- **`DataComparison`** - Side-by-side data comparison
- **`DataFreshnessIndicator`** - Shows data update status
- **`ExpertConsensusIndicator`** - Expert agreement visualization
- **`PositionSelector`** - Position filter dropdown
- **`UpdateDataButton`** - Manual data refresh trigger

### Advanced UI Components
- **`SkillsRadar`** (`src/components/ui/SkillsRadar.tsx`) - D3 radar chart for skills visualization
- **`PersonalMetrics`** (`src/components/ui/PersonalMetrics.tsx`) - Animated metrics display
- **`QADashboard`** (`src/components/ui/QADashboard.tsx`) - Quality assurance dashboard
- **`LazyQADashboard`** - Lazy-loaded QA dashboard
- **`WebVitalsDashboard`** (`src/components/ui/WebVitalsDashboard.tsx`) - Performance metrics
- **`SystemInfo`** (`src/components/ui/SystemInfo.tsx`) - System information display
- **`VirtualizedPlayerList`** (`src/components/ui/VirtualizedPlayerList.tsx`) - Virtualized player list for performance
- **`LazyPlayerImage`** (`src/components/ui/LazyPlayerImage.tsx`) - Optimized player image loading
- **`RelatedContent`** (`src/components/ui/RelatedContent.tsx`) - Related content suggestions

### Content Components
- **Blog Components** (`src/components/blog/`) - Blog-specific components
- **Newsletter Components** (`src/components/newsletter/`) - Newsletter subscription
- **Search Components** (`src/components/search/`) - Search functionality
- **Testimonials Components** (`src/components/testimonials/`) - Testimonial display
- **FAQ Components** (`src/components/FAQ/`) - FAQ accordion and display
- **Local SEO Components** (`src/components/local-seo/`) - Local business markup

### Utility Components
- **`Analytics`** (`src/components/Analytics.tsx`) - Analytics tracking wrapper
- **`Providers`** (`src/components/Providers.tsx`) - React context providers
- **`Container`** (`src/components/Container.tsx`) - Layout container
- **`Prose`** (`src/components/Prose.tsx`) - Typography wrapper for content
- **`Highlight`** (`src/components/Highlight.tsx`) - Text highlighting
- **`StructuredData`** (`src/components/StructuredData.tsx`) - JSON-LD structured data

---

## Data Management System

### Static Content Management
```
src/constants/
├── personal.ts             - Personal information, career data, metrics, achievements
├── navlinks.tsx            - Navigation configuration and routing
├── socials.tsx             - Social media links
└── testimonials.ts         - Client testimonials data
```

### Fantasy Football Data Files (`src/data/`)
```
src/data/
├── player-database.json           - Complete player database (1.6MB)
├── player-images.json             - Player headshot URLs
├── fantasy-player-mappings.json   - Player name normalization (1.4MB)
├── player-matching-results.json   - Player matching algorithms (5.6MB)
├── player-team-updates.json       - Team roster changes

Position-Specific Data:
├── qbData.ts                      - Quarterback rankings (34KB)
├── rbData.ts                      - Running back rankings (69KB)
├── wrData.ts                      - Wide receiver rankings (101KB)
├── teData.ts                      - Tight end rankings (54KB)
├── kData.ts                       - Kicker rankings (17KB)
├── dstData.ts                     - Defense/special teams (12KB)
├── flexData.ts                    - FLEX position rankings (181KB)
├── overallData.ts                 - Overall rankings (197KB)
├── overallDataPPR.ts              - PPR scoring rankings (141KB)
└── overallDataStandard.ts         - Standard scoring rankings (141KB)
```

### Utility Libraries (`src/lib/`)
```
Core Utilities:
├── utils.ts                       - General utility functions
├── seo.ts                         - SEO metadata generation
├── performance.ts                 - Performance monitoring
├── analytics.ts                   - Analytics tracking
├── auth.ts                        - Authentication utilities
├── logger.ts                      - Logging system
└── rateLimit.ts                   - API rate limiting

Fantasy Football Libraries:
├── fantasyProsAPI.ts              - FantasyPros API client
├── fantasyProsAlternative.ts      - Alternative data sources
├── fantasyProsSession.ts          - Session-based scraping
├── unifiedFantasyProsAPI.ts       - Unified API interface
├── database.ts                    - SQLite database interface
├── dataCache.ts                   - Caching layer
├── unifiedCache.ts                - Unified caching system
├── dataManager.ts                 - Data CRUD operations
├── dataValidator.ts               - Data validation
├── dataImport.ts                  - Data import utilities
├── dataLoader.ts                  - Data loading
├── dataFileWriter.ts              - File system operations
├── playerImageService.ts          - Player image management
├── playerImageScraper.ts          - Image scraping

Tier Calculation & Analytics:
├── tierCalculator.ts              - Basic tier calculations
├── optimizedTierCalculator.ts     - Performance-optimized tiers
├── unifiedTierCalculator.ts       - Unified tier system
├── tierGrouping.ts                - Tier grouping logic
├── tierImageGenerator.ts          - Tier visualization images
├── clustering.ts                  - K-means clustering
├── gaussianMixture.ts             - Gaussian mixture models
├── overallValueCalculator.ts      - Overall player value
├── overallDataGenerator.ts        - Overall rankings generation
├── scoringFormatUtils.ts          - PPR/Standard/Half-PPR utilities

Content & SEO:
├── blog.ts                        - Blog post processing
├── faqData.ts                     - FAQ data management
├── localSEO.ts                    - Local business SEO
├── localSitemap.ts                - Local sitemap generation
└── webScraper.ts                  - Web scraping utilities

Performance Optimization:
├── lazyD3.ts                      - Lazy D3 loading
├── lazySampleData.ts              - Lazy sample data loading
└── sampleDataService.ts           - Sample data management
```

### Custom Hooks (`src/hooks/`)
```
src/hooks/
├── useDebounce.ts                 - Input debouncing utility
├── useLazyLoad.ts                 - Lazy loading for performance
├── useNavigation.ts               - Navigation state management
├── useScrollAnimation.ts          - Scroll-based animations
├── useTypingAnimation.ts          - Typing effect animations

Fantasy Football Hooks:
├── useFantasyData.ts              - Fantasy data fetching
├── useAllFantasyData.ts           - All positions data
├── useOverallFantasyData.ts       - Overall rankings
├── useUnifiedFantasyData.ts       - Unified data interface
└── usePlayerImageCache.tsx        - Player image caching

Content Hooks:
└── useBlogPost.ts                 - Blog post data fetching
```

### TypeScript Types (`src/types/`)
```
src/types/
├── index.ts                       - Core type definitions
│   ├── Player                     - Player data structure
│   ├── Position                   - Position enum
│   ├── ScoringFormat              - PPR/Standard/Half-PPR
│   ├── TierGroup                  - Tier grouping
│   ├── ChartDimensions            - D3 chart dimensions
│   ├── ClusteringOptions          - K-means options
│   ├── DraftSettings              - Draft configuration
│   ├── DraftPick                  - Draft pick data
│   ├── TeamRoster                 - Team composition
│   ├── DraftState                 - Draft tracker state
│   └── DraftAnalytics             - Draft analysis metrics
└── navlink.tsx                    - Navigation link types
```

---

## Features & Functionality

### ModernHero Component
**File:** `src/components/ModernHero.tsx`
- Oversized display typography with warm gradient text
- Professional headshot with optimized Next.js Image
- Grid layout responsive across all breakpoints
- Framer Motion animations with reduced motion support
- Warm mesh gradient background
- Call-to-action buttons (Resume, Get In Touch)

### Fantasy Football Features

#### **Tier Rankings System**
- Position-specific tier visualizations using D3.js
- Automatic tier calculation using statistical clustering (K-means, Gaussian Mixture Models)
- Expert consensus indicators showing agreement levels
- Standard deviation analysis for player volatility
- Color-coded tier groupings for quick visual scanning
- Interactive charts with hover states and player details

#### **Draft Analysis Tools**
- Real-time draft tracker with pick-by-pick analytics
- Team roster composition tracking
- Value-based drafting recommendations
- Reach/steal identification (ADP comparison)
- Position run analysis
- Team strength/weakness assessment
- Draft grades and analytics

#### **Data Management**
- Automated data refresh pipeline
- Data freshness indicators with last-update timestamps
- Manual refresh capability for on-demand updates
- Multi-source data integration (FantasyPros, custom sources)
- Data validation and error handling
- Caching with TTL for performance

#### **Player Information**
- Comprehensive player cards with projections
- Detailed statistics and expert rankings
- Player images with lazy loading optimization
- Team affiliations and bye weeks
- Upside/downside analysis
- Expert consensus levels

### Component Features

#### **WarmCard System**
- Multiple padding options (none, sm, md, lg, xl)
- Optional hover lift effect
- Warm peachy borders and golden shadows
- Accessibility-friendly with ARIA labels
- Dark mode support with warm color palette

#### **ModernButton Variants**
- **Primary:** Sunset orange with warm shadow
- **Secondary:** Golden yellow for secondary actions
- **Outline:** Bordered style for tertiary actions
- **Ghost:** Minimal style for subtle interactions
- Touch-friendly (44px minimum tap target)
- Reduced motion support

#### **JourneyTimeline Component**
- Career timeline visualization
- Company logos and position details
- Tech stack badges for each role
- Warm styling throughout
- Responsive layout

### Animation Framework
- **Framer Motion** for smooth, physics-based animations
- Fade-in entrance animations for page content
- Hover lift effects on interactive elements
- Staggered animations with delays
- Full reduced motion support for accessibility
- Spring-based transitions with custom timing functions
- Custom keyframe animations (float, gradient-shift, skeleton-loading, slide-in-up, shake, spinner-rotate)

### SEO & Performance Optimization
**Files:** `src/lib/seo.ts`, `src/lib/performance.ts`
- Comprehensive metadata generation
- Structured data (JSON-LD) for rich snippets
- OpenGraph and Twitter card optimization
- Automatic sitemap generation (general + local business)
- Next.js Image optimization (AVIF, WebP)
- Core Web Vitals monitoring
- Advanced webpack bundle splitting:
  - Separate chunks for UI components, icons, Framer Motion
  - Content features chunk (blog, newsletter)
  - Vendor chunking strategy
  - Tree shaking and dead code elimination
- Console removal in production
- Package import optimization (@tabler/icons-react, lucide-react, framer-motion)

---

## Development Guidelines

### Code Organization
```
Website/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── page.tsx            # Home page (ModernHero)
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── globals.css         # Global styles and CSS variables
│   │   ├── about/              # About page
│   │   ├── projects/           # Projects showcase
│   │   ├── resume/             # Resume page
│   │   ├── contact/            # Contact page
│   │   ├── consulting/         # Consulting services
│   │   ├── blog/               # Blog with MDX support
│   │   ├── writing/            # Writing portfolio
│   │   ├── notes/              # Notes section
│   │   ├── fantasy-football/   # Fantasy football landing
│   │   ├── admin/              # Admin dashboard (authenticated)
│   │   ├── newsletter/         # Newsletter subscription
│   │   ├── testimonials/       # Testimonials page
│   │   ├── faq/                # FAQ page
│   │   ├── search/             # Search functionality
│   │   └── api/                # API routes
│   ├── components/             # Reusable React components
│   │   ├── ui/                 # Core UI component library
│   │   ├── blog/               # Blog-specific components
│   │   ├── newsletter/         # Newsletter components
│   │   ├── search/             # Search components
│   │   ├── testimonials/       # Testimonial components
│   │   ├── FAQ/                # FAQ components
│   │   ├── navigation/         # Navigation components
│   │   ├── local-seo/          # SEO components
│   │   └── lazy/               # Lazy-loaded components
│   ├── constants/              # Static data and configuration
│   ├── data/                   # Fantasy football data files
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions and helpers
│   ├── types/                  # TypeScript type definitions
│   └── middleware.ts           # Next.js middleware
├── public/                     # Static assets
│   ├── images/                 # Image assets
│   ├── project-screenshots/    # Project portfolio images
│   ├── Isaac_Vazquez_Resume.pdf
│   ├── favicon.png
│   ├── manifest.json
│   ├── robots.txt
│   └── sitemap.xml
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.js            # ESLint configuration
├── postcss.config.js           # PostCSS configuration
├── next-sitemap.config.js      # Sitemap generation
├── netlify.toml                # Netlify deployment
└── package.json                # Dependencies and scripts
```

### Component Patterns
- **Consistent Props Interface:** All components use comprehensive TypeScript interfaces
- **Accessibility First:** ARIA labels, focus management, keyboard navigation
- **Responsive Design:** Mobile-first approach with breakpoint consistency
- **Theme Integration:** All components use CSS custom properties from globals.css
- **Performance Optimization:** Lazy loading, code splitting, virtualization, memoization
- **Error Boundaries:** Graceful error handling in components
- **Server/Client Components:** Clear separation with 'use client' directives

### Styling Conventions
- **Tailwind Classes:** Utility-first with warm modern theme extensions
- **CSS Custom Properties:** Defined in `src/app/globals.css` at `:root`
  - Color variables (--color-primary, --color-secondary, etc.)
  - Spacing scale (--space-xs through --space-4xl)
  - Font sizes (--text-xs through --text-display-xxl)
  - Shadow utilities (--shadow-warm-lg, --shadow-warm-xl, --shadow-subtle)
  - Surface colors (--surface-primary, --surface-secondary, etc.)
- **Component Variants:** Consistent sizing, color, and state variations
- **Animation Classes:** Reusable animation utilities with reduced motion support
- **Dark Mode:** Class-based dark mode with warm color adaptations

### Performance Considerations
- **Image Optimization:**
  - Next.js Image component with AVIF/WebP formats
  - Device sizes: [640, 750, 828, 1080, 1200, 1920, 2048]
  - Image sizes: [16, 32, 48, 64, 96, 128, 256, 384]
  - 30-day cache TTL
  - Lazy loading with blur placeholders
- **Font Loading:** Variable fonts (Inter, Orbitron, JetBrains Mono) with swap strategy
- **Code Splitting:**
  - Route-based splitting with App Router
  - Component-level splitting with React.lazy()
  - Advanced webpack chunk optimization
- **Bundle Optimization:** Tree shaking, dead code elimination, minification
- **Static Generation:** Pre-rendering for portfolio pages
- **Data Caching:** Multi-layer caching with unified cache system
- **Virtualization:** VirtualizedPlayerList for large datasets
- **Lazy Loading:** lazyD3, LazyQADashboard, LazyPlayerImage components

### TypeScript Guidelines
- **Strict Mode Enabled:** Full TypeScript strict mode (currently with build errors ignored)
- **Type Definitions:** Comprehensive types in `src/types/index.ts`
- **Interface First:** Prefer interfaces over types for object shapes
- **Explicit Return Types:** Document function signatures
- **No Implicit Any:** Avoid implicit any (when strict mode fully enforced)

---

## Configuration Files

### Core Configuration
- **`next.config.mjs`** - Next.js configuration
  - URL redirects (portfolio, fantasy football, legacy URLs)
  - Image optimization (AVIF, WebP, remote patterns)
  - Webpack customization (bundle splitting, externals)
  - Experimental features (package import optimization, scroll restoration)
  - Build-time linting/TypeScript bypass (temporary)
  - Console removal in production
  - Bundle analyzer integration

- **`tailwind.config.ts`** - Tailwind CSS configuration
  - Custom warm modern theme colors
  - Font family definitions
  - Extended spacing scale
  - Custom animations and keyframes
  - Box shadow utilities
  - Typography plugin
  - Color variable generation

- **`tsconfig.json`** - TypeScript configuration
  - Strict mode enabled
  - Path aliases configured
  - Next.js plugin integration

- **`eslint.config.js`** - ESLint configuration
  - Next.js recommended rules
  - React refresh plugin

- **`postcss.config.js`** - PostCSS configuration
  - Tailwind CSS v4 support
  - Autoprefixer

- **`next-sitemap.config.js`** - Sitemap generation
  - Automatic sitemap creation
  - URL priority settings
  - Change frequency configuration

### Deployment Configuration
- **`netlify.toml`** - Netlify deployment configuration
  - Build commands and settings
  - Environment variables
  - Redirect rules
- **`netlify.toml`** - Netlify deployment configuration (primary)
- **Environment Variables:** Minimal environment configuration
  - **No API keys required** for fantasy football data (uses open-source NFLverse data)
  - Optional analytics and monitoring services

### Environment & Build
- **Development:** `npm run dev` (http://localhost:3000)
- **Production Build:** `npm run build` + `npm run start`
- **Post-Build:** `npm run postbuild` (sitemap generation)
- **Linting:** `npm run lint` (currently bypassed in build)
- **Bundle Analysis:** `npm run analyze` or `ANALYZE=true npm run build`

---

## Navigation Structure

### Complete Navigation System
```typescript
// Primary navigation (src/constants/navlinks.tsx)
[
  { href: "/", label: "Home", icon: IconHome },
  { href: "/about", label: "About", icon: IconUser },
  { href: "/projects", label: "Projects", icon: IconBriefcase },
  { href: "/resume", label: "Resume", icon: IconFileText },
  { href: "/contact", label: "Contact", icon: IconMail }
]

// Fantasy football navigation
- /fantasy-football (landing)
- /fantasy-football/tiers/qb (quarterback)
- /fantasy-football/tiers/rb (running back)
- /fantasy-football/tiers/wr (wide receiver)
- /fantasy-football/tiers/te (tight end)
- /fantasy-football/tiers/k (kicker)
- /fantasy-football/tiers/dst (defense/ST)
- /fantasy-football/tiers/flex (flex position)
- /fantasy-football/draft-tracker (draft tool)
```

### Social Links & Professional Presence
```typescript
// src/constants/socials.tsx
- LinkedIn: https://linkedin.com/in/isaac-vazquez
- GitHub: https://github.com/isaacavazquez
- Email: isaacavazquez95@gmail.com
- Website: https://isaacavazquez.com
```

---

## Database Schema & Data Models

### SQLite Database (better-sqlite3)
**File:** `src/lib/database.ts`

The application uses SQLite for local data persistence:
- **Player Data:** Core player information, teams, positions
- **Rankings:** Expert rankings and consensus data
- **Projections:** Statistical projections by position
- **Historical Data:** Past performance and trends
- **Cache Metadata:** Data freshness and update tracking

### Data Validation
**File:** `src/lib/dataValidator.ts`
- Player data structure validation
- Required field checking
- Type validation
- Range validation for numerical data
- Duplicate detection
- Data integrity checks

---

## Fantasy Football Data Pipeline

### Data Sources
1. **FantasyPros API** (primary)
   - Expert consensus rankings
   - ADP (Average Draft Position)
   - Projections and analysis

2. **Web Scraping** (fallback)
   - Session-based scraping
   - Rate-limited requests
   - Alternative data sources

3. **Static Data Files**
   - Player mappings and normalization
   - Team rosters and updates
   - Player images and headshots

### Caching Strategy
**Files:** `src/lib/dataCache.ts`, `src/lib/unifiedCache.ts`
- **Multi-layer Cache:** Memory → File System → Database
- **TTL Management:** Configurable time-to-live per data type
- **Freshness Tracking:** Last update timestamps
- **Invalidation:** Manual and automatic cache clearing
- **Performance:** Sub-millisecond cache hits

### Tier Calculation Algorithms
**Files:** `src/lib/tierCalculator.ts`, `src/lib/optimizedTierCalculator.ts`, `src/lib/unifiedTierCalculator.ts`

Multiple tier calculation methods:
1. **K-Means Clustering** (`clustering.ts`)
   - Configurable number of clusters
   - Iterative centroid optimization
   - Convergence tolerance settings

2. **Gaussian Mixture Models** (`gaussianMixture.ts`)
   - Probabilistic tier assignments
   - Standard deviation analysis
   - Statistical significance testing

3. **Manual Tier Grouping** (`tierGrouping.ts`)
   - Expert-defined breakpoints
   - Position-specific logic
   - Custom tier labels

---

## Authentication & Authorization

### NextAuth Integration
**File:** `src/lib/auth.ts`
- Admin authentication for dashboard access
- Protected API routes
- Session management
- Authorization middleware

**Protected Routes:**
- `/admin` - Admin dashboard
- `/admin/analytics` - Analytics overview
- `/api/data-manager` - Data management endpoints
- `/api/scheduled-update` - Automated update triggers

---

## Recent Major Changes & Evolution

### Current State (November 2025)
- **Hybrid Platform:** Dual-purpose portfolio + fantasy football tools
- **Warm Modern Design:** Sunset/golden color palette with professional aesthetic
- **Advanced Fantasy Features:** Tier rankings, draft tracker, player analytics
- **Data Infrastructure:** SQLite database, caching layer, automated pipelines
- **Component Library:** Extensive UI component system with WarmCard/ModernButton
- **Performance Optimization:** Advanced code splitting, lazy loading, virtualization
- **SEO Enhancement:** Comprehensive metadata, structured data, sitemap generation

### Technical Infrastructure
- **Dependencies Retained:** D3.js (v7.9.0), SQLite (better-sqlite3 v12.2.0), NextAuth (v4.24.11)
- **Simplified Architecture:** Static-first for portfolio, dynamic for fantasy features
- **Enhanced Animations:** Full Framer Motion integration (v12.23.12)
### Warm Modern Redesign (January 2025)
- **Complete Theme Overhaul:** Cyberpunk → Warm modern professional aesthetic
- **Fantasy Football Data Migration:** Transitioned from FantasyPros API to NFLverse/DynastyProcess open-source data
- **Component Modernization:** GlassCard → WarmCard, MorphButton → ModernButton
- **Typography Simplification:** Orbitron → Inter throughout for consistency
- **Color System:** Neon cyberpunk → Warm sunset/golden palette
- **Accessibility Enhancement:** WCAG AA+ compliance with 7.5:1+ contrast ratios
- **Performance Optimization:** 60% bundle size reduction

### Technical Infrastructure (v3.0.0)
- **Fantasy Football Data Source:** Now uses NFLverse/DynastyProcess open-source data (no API keys required)
- **Removed Dependencies:** FantasyPros API integration, D3.js (replaced with lighter charting), SQLite, NextAuth
- **Simplified Architecture:** Static-first approach with minimal APIs
- **Enhanced Animations:** Full Framer Motion integration with reduced motion support
- **Touch Optimization:** 44px minimum tap targets throughout
- **Image Optimization:** AVIF/WebP with responsive sizing, lazy loading

### Component Architecture
- **ModernHero:** Oversized typography with professional headshot
- **WarmCard:** Warm-themed container with hover effects
- **ModernButton:** 4 variants optimized for warm palette
- **JourneyTimeline:** Career visualization component
- **Fantasy Components:** 15+ specialized fantasy football components
- **Responsive Layout:** Mobile-first with consistent spacing

---

## Known Issues & Technical Debt

### Build Configuration
- **TypeScript Strict Mode:** Build errors currently bypassed with `ignoreBuildErrors: true`
- **ESLint:** Linting bypassed during builds with `ignoreDuringBuilds: true`
- **Action Items:**
  - Resolve remaining TypeScript type errors
  - Re-enable strict type checking
  - Fix ESLint warnings and errors
  - Remove build bypasses

### Performance Optimizations Needed
- Bundle size reduction opportunities
- Further code splitting for fantasy features
- Image optimization improvements
- Cache invalidation refinement

### Accessibility Improvements
- WCAG AAA compliance audit needed
- Keyboard navigation enhancements
- Screen reader optimization
- Focus management improvements

---

## Future Development Roadmap

### Content Enhancements
- **Blog System Expansion:** More MDX features, syntax highlighting, table of contents
- **Case Studies:** Deep dives into major projects and product work
- **Video Content:** Project demos and product walkthroughs
- **Interactive Prototypes:** Embedded product prototypes

### Fantasy Football Features
- **Live Scoring:** Real-time game day scoring
- **Weekly Projections:** Week-by-week player projections
- **Trade Analyzer:** Trade evaluation tools
- **Waiver Wire Assistant:** Waiver wire recommendations
- **Playoff Projections:** Playoff probability calculator
- **Mock Draft Simulator:** Practice draft tool

### Interactive Features
- **Skills Visualization:** Interactive skills radar (SkillsRadar component exists)
- **Project Filtering:** Advanced filtering and categorization
- **Search Enhancement:** Full-text search with algolia/meilisearch
- **Dark Mode Toggle:** Manual theme switching (dark mode CSS already implemented)

### Technical Enhancements
- **Type Safety:** Resolve all TypeScript errors, enable strict mode
- **Testing:** Unit tests, integration tests, E2E tests
- **CI/CD:** Automated testing and deployment pipeline
- **Monitoring:** Error tracking (Sentry), performance monitoring (Vercel Analytics)
- **A/B Testing:** Experimentation framework

### Performance Optimization
- **Bundle Size:** Target <100kB First Load JS
- **Lighthouse Score:** Achieve 95+ across all metrics
- **Core Web Vitals:** Optimize LCP, FID, CLS
- **Database Optimization:** Query performance, indexing

---

## Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Analyze bundle size
npm run analyze
```

### Common Development Tasks

#### Adding a New Page
1. Create page component in `src/app/[page-name]/page.tsx`
2. Add route to navigation in `src/constants/navlinks.tsx` (if needed)
3. Update sitemap configuration in `next-sitemap.config.js`
4. Add metadata for SEO in page component

#### Creating a New Component
1. Create component file in appropriate directory (`src/components/` or `src/components/ui/`)
2. Define TypeScript interface for props
3. Implement accessibility features (ARIA labels, keyboard navigation)
4. Add responsive design (mobile-first)
5. Test with reduced motion preferences
6. Document usage and props

#### Working with Fantasy Data
1. **Data Refresh:** Use `/api/data-manager` endpoints
2. **Cache Management:** Leverage unified cache system in `src/lib/unifiedCache.ts`
3. **Player Images:** Update mappings in `src/data/player-images.json`
4. **Tier Calculations:** Modify algorithms in `src/lib/tierCalculator.ts`
5. **Validation:** Update schemas in `src/lib/dataValidator.ts`

#### Styling Guidelines
1. Use Tailwind utility classes first
2. Reference CSS custom properties from `globals.css`
3. Implement warm color palette (primary, secondary, accent)
4. Ensure 44px minimum touch targets
5. Test with dark mode class
6. Add reduced motion variants

---

## Testing Strategy

### Current State
- **Unit Tests:** Not currently implemented
- **Integration Tests:** Not currently implemented
- **E2E Tests:** Not currently implemented
- **Manual Testing:** Primary testing method

### Recommended Testing Stack
- **Jest** - Unit testing framework
- **React Testing Library** - Component testing
- **Playwright** or **Cypress** - E2E testing
- **MSW (Mock Service Worker)** - API mocking
- **Testing Library User Event** - User interaction simulation

---

## Deployment & CI/CD

### Netlify Deployment
**File:** `netlify.toml`
- **Primary Platform:** Netlify
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Environment Variables:** Configure in Netlify dashboard
- **Deploy Previews:** Enabled for pull requests
- **Continuous Deployment:** Enabled for main branch

### Environment Variables
```env
# NextAuth
NEXTAUTH_URL=https://isaacavazquez.com
NEXTAUTH_SECRET=<secret>

# FantasyPros API (if using paid tier)
FANTASYPROS_API_KEY=<api_key>

# Analytics (optional)
NEXT_PUBLIC_GA_ID=<google_analytics_id>
```

### Build Optimization
- **Static Generation:** Portfolio pages pre-rendered
- **ISR (Incremental Static Regeneration):** Fantasy data pages with revalidation
- **Edge Functions:** Potential use for API routes (Netlify Edge Functions)

---

## Monitoring & Analytics

### Performance Monitoring
**File:** `src/lib/performance.ts`
- Core Web Vitals tracking (LCP, FID, CLS)
- Custom performance metrics
- `/api/analytics/web-vitals` endpoint for data collection

### User Analytics
**File:** `src/lib/analytics.ts`
- Event tracking system
- Page view analytics
- User interaction metrics
- `/api/analytics/events` endpoint

### Error Tracking
- **Current:** Console logging (removed in production)
- **Recommended:** Sentry or similar error tracking service

---

## Contact & Ownership

**Isaac Vazquez**
Technical Product Manager & UC Berkeley Haas MBA Candidate

**Contact Information:**
- **Email:** isaacavazquez95@gmail.com
- **LinkedIn:** https://linkedin.com/in/isaac-vazquez
- **Website:** https://isaacavazquez.com
- **GitHub:** https://github.com/isaacavazquez

**Development Context:** This platform showcases Isaac's professional journey as a Technical Product Manager while demonstrating technical capabilities through the fantasy football tools. The warm, modern design reflects his approach to product development: user-friendly, accessible, and data-driven. The clean architecture and attention to detail demonstrate his technical background and commitment to quality.

**Platform Mission:** A professional portfolio that effectively communicates Isaac's product management expertise, technical capabilities, and business acumen to potential employers, collaborators, and clients—while providing valuable fantasy football tools to the community. Built with modern web technologies and optimized for performance, accessibility, and user experience.

---

## AI Assistant Guidelines

### When Working on This Codebase

#### **Understanding the Dual Purpose**
- This is BOTH a portfolio AND a fantasy football platform
- Changes should consider impact on both use cases
- Maintain professional aesthetic for portfolio features
- Ensure data accuracy and performance for fantasy features

#### **Code Quality Standards**
- Follow existing TypeScript patterns and interfaces
- Maintain accessibility standards (WCAG AA minimum)
- Ensure responsive design (mobile-first)
- Add proper error handling and validation
- Document complex logic with comments
- Use semantic HTML and ARIA labels

#### **Styling Conventions**
- Use warm color palette (primary: #FF6B35, secondary: #F7B32B)
- Reference CSS custom properties from globals.css
- Maintain 44px minimum touch targets
- Test with dark mode
- Support reduced motion preferences
- Use Tailwind utility classes consistently

#### **Performance Considerations**
- Lazy load heavy components (D3 charts, large datasets)
- Implement virtualization for long lists
- Optimize images with Next.js Image component
- Use React.memo for expensive renders
- Leverage the unified caching system
- Monitor bundle size impact

#### **Data Management**
- Use unified cache system for fantasy data
- Validate all data with dataValidator.ts
- Update player mappings when adding new players
- Refresh tier calculations after data updates
- Handle API rate limits and errors gracefully
- Maintain data freshness indicators

#### **Testing Checklist**
- Test on mobile and desktop viewports
- Verify keyboard navigation works
- Check screen reader compatibility
- Test with reduced motion enabled
- Verify dark mode appearance
- Test with slow network conditions

#### **Common Pitfalls to Avoid**
- Don't bypass TypeScript errors without fixing root cause
- Don't add heavy dependencies without justification
- Don't skip accessibility features
- Don't hardcode values that should be configurable
- Don't ignore caching opportunities
- Don't forget to update TypeScript types

#### **Commit Message Format**
```
<type>: <description>

Types: feat, fix, refactor, style, docs, test, chore, perf
Examples:
- feat: add weekly projections to player cards
- fix: resolve tier calculation clustering edge case
- refactor: optimize player image loading performance
- style: update button hover states for warm theme
- docs: update CLAUDE.md with new fantasy features
```

---

## Version History

**Current Version:** 0.1.0
**Last Updated:** November 2025
**Documentation Version:** 2.0

### Changelog
- **v2.0 (November 2025):** Comprehensive rewrite reflecting actual codebase state
  - Documented dual portfolio + fantasy football purpose
  - Added complete API architecture
  - Detailed fantasy football data pipeline
  - Comprehensive component inventory
  - Build configuration and optimization details
  - Known issues and technical debt section

- **v1.0 (January 2025):** Initial CLAUDE.md creation
  - Portfolio-focused documentation
  - Warm modern theme introduction
  - Basic component architecture

---

**Note:** This documentation reflects the actual state of the codebase as of November 2025. The platform successfully combines professional portfolio features with advanced fantasy football tools, demonstrating both technical expertise and practical utility.
