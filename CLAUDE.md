# Isaac Vazquez Portfolio - Comprehensive Application Overview

## Deep Reference Docs

Detailed AI context documentation lives in `docs/ai-context/`. Consult these for in-depth coverage:

| Doc | Path | Covers |
|-----|------|--------|
| Components | `docs/ai-context/COMPONENTS.md` | 64 components: props, server/client, composition patterns |
| Styling | `docs/ai-context/STYLING.md` | CSS variables, dark mode, animations, Tailwind mapping |
| API Routes | `docs/ai-context/API-ROUTES.md` | 14 endpoints: methods, params, auth, rate limiting |
| Data Pipeline | `docs/ai-context/DATA-PIPELINE.md` | Fantasy & investment data flows, caching, SQLite schema |
| Pages | `docs/ai-context/PAGES.md` | 17 pages + layouts: rendering, data deps, metadata |
| Hooks & State | `docs/ai-context/HOOKS-AND-STATE.md` | 7 hooks + 3 context providers with full signatures |
| Redirects & Nav | `docs/ai-context/REDIRECTS-AND-NAVIGATION.md` | 20+ redirects, breadcrumbs, URL conventions |
| SEO & Metadata | `docs/ai-context/SEO-AND-METADATA.md` | Metadata generation, structured data, AI SEO, sitemap |
| Config | `docs/ai-context/CONFIG.md` | 9 config files: settings, gotchas, interdependencies |

---

## Project Summary
Isaac Vazquez's professional website serving a **dual purpose**: a professional portfolio showcasing his product management career AND a fantasy football analytics platform with live tier rankings.

**Live Site:** https://isaacavazquez.com
**Owner:** Isaac Vazquez (Technical Product Manager & UC Berkeley Haas MBA Candidate)
**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Framer Motion, D3.js, SQLite (better-sqlite3)

---

## Application Architecture Overview

This is a **dual-purpose platform**:

1. **Professional Portfolio** – Hero section, projects, resume, about, contact, consulting, blog, writing
2. **Fantasy Football Analytics** – Live tier rankings (QB/RB/WR/TE/K/DST/Flex), draft tracker, data pipeline, player image system, automated data fetching from FantasyPros

---

## Architecture & Technical Stack

### Framework & Core Technologies
- **Next.js 16** with App Router architecture (Turbopack enabled by default)
- **TypeScript** with strict mode (currently `ignoreBuildErrors: true` in build config)
- **Tailwind CSS v4** with PostCSS plugin (`@tailwindcss/postcss`)
- **Framer Motion** (v12.23.12) for animations
- **D3.js** (v7.9.0) for data visualization (fantasy football tier charts)
- **React 19** with modern hooks and patterns
- **SQLite** (better-sqlite3) for fantasy football data persistence
- **NextAuth** (v4.24.11) for admin authentication

### Key Dependencies

#### Core UI & Animation
- `@tabler/icons-react` – Primary icon system
- `lucide-react` – Additional icon library
- `react-icons` – Supplementary icons
- `framer-motion` – Animations and transitions
- `tailwind-merge` – Dynamic class merging
- `tailwindcss-animate` – Tailwind animation utilities
- `@tailwindcss/typography` – Rich text styling
- `clsx` – Conditional class names
- `class-variance-authority` – Component variant management
- `next-themes` – Theme management (dark/light mode)
- `@radix-ui/react-dropdown-menu` – Accessible dropdown primitives
- `@radix-ui/react-slot` – Composable slot primitives

#### Data & Fantasy Football
- `d3` – Chart rendering for tier visualizations
- `better-sqlite3` – Local SQLite database for fantasy data (server-only)
- `next-auth` – Admin authentication

#### Content & SEO
- `next-sitemap` – SEO sitemap generation
- `gray-matter` – MDX/Markdown frontmatter parsing
- `remark`, `remark-gfm`, `remark-html` – Content processing pipeline
- `web-vitals` – Performance monitoring

#### Testing
- `jest` + `jest-environment-jsdom` – Unit testing
- `@testing-library/react` – Component testing
- `@playwright/test` – End-to-end testing
- `msw` – API mocking for tests

### Build & Deployment
- **Build Command:** `npm run build` (then `npm run postbuild` auto-runs sitemap)
- **Dev Server:** `npm run dev` (note: `--webpack` flag is baked into the dev script; Turbopack is the Next.js 16 default but webpack is forced here)
- **Deployment:** Netlify with `@netlify/plugin-nextjs`
- **Bundle Analysis:** `npm run analyze` or `ANALYZE=true npm run build`
- **Test Commands:** `npm test`, `npm run test:coverage`, `npm run test:e2e`
- **Fantasy Data Update:** `npm run update:fantasy-rb`
- **Investments Update:** `npm run update:investments` (Python script via `.venv`)

---

## Design System: Modern Professional Theme

### Color Palette (actual CSS variables from `globals.css`)
```css
/* Light Mode */
--color-primary: #2563EB        /* Blue 600 - Primary brand blue */
--color-secondary: #1D4ED8      /* Blue 700 - Darker blue */
--color-accent: #3B82F6         /* Blue 500 - Lighter accent */
--color-success: #059669        /* Emerald 600 */
--color-warning: #D97706        /* Amber 600 */
--color-error: #DC2626          /* Red 600 */

/* Dark Mode (overrides) */
--color-primary: #3B82F6        /* Blue 500 - Brighter for dark bg */
--color-secondary: #60A5FA      /* Blue 400 */
--color-accent: #93C5FD         /* Blue 300 */

/* Neutral Scale (Slate) */
--neutral-50: #F8FAFC   --neutral-100: #F1F5F9
--neutral-200: #E2E8F0  --neutral-300: #CBD5E1
--neutral-400: #94A3B8  --neutral-500: #64748B
--neutral-600: #475569  --neutral-700: #334155
--neutral-800: #1E293B  --neutral-900: #0F172A
--neutral-950: #020617

/* Surfaces */
--surface-primary: #FFFFFF
--surface-secondary: #F8FAFC
--surface-elevated: #FFFFFF

/* Semantic Text */
--text-primary: #0F172A         /* Slate 900 */
--text-secondary: #475569       /* Slate 600 */
--text-tertiary: #64748B        /* Slate 500 */

/* Borders */
--border-primary: #E2E8F0       /* Slate 200 */
--border-accent: rgba(37, 99, 235, 0.3)
```

### Typography
- **Primary:** Inter (via `--font-inter`, variable font)
- **Monospace:** JetBrains Mono (via `--font-jetbrains-mono`)
- **Fluid type scale:** All font sizes use `clamp()` for responsive scaling
  - `--text-xs` through `--text-6xl` (defined in CSS, mapped to Tailwind)

### Animation Patterns
- Framer Motion physics-based animations (spring: `cubic-bezier(0.34, 1.56, 0.64, 1)`)
- Custom Tailwind keyframes: `skeleton-loading`, `slide-in-up`, `shake`, `spinner-rotate`
- Transition easing: `--easing-spring`, `--easing-smooth`
- Full `prefers-reduced-motion` support in `globals.css`
- Dark mode via `.dark` class (class-based)

---

## Application Structure

### Complete Page Routing

#### **Portfolio Pages**
```
/                           - Home (ModernHero component)
/about                      - About page with tabbed navigation (Overview/Journey)
/portfolio                  - Project showcase page at src/app/portfolio/
/portfolio/[slug]           - Individual project detail
/resume                     - Professional resume with download
/contact                    - Contact page with social links
/accessibility              - Accessibility statement
```

#### **Fantasy Football Platform**
```
/fantasy-football                       - Main landing page
/fantasy-football/tiers/[position]      - Position tier pages (qb/rb/wr/te/k/dst/flex)
/fantasy-football/rb-tiers              - RB-specific tier page
/fantasy-football/draft-tracker         - Draft tracking tool
```

#### **Content Pages**
```
/blog                       - Redirects to /writing (next.config.mjs)
/blog/[slug]                - Redirects to /writing/[slug]
/writing                    - Writing portfolio (real page)
/writing/[slug]             - Individual writing pieces
/search                     - Global search
```

#### **Financial Pages**
```
/investments                - Investment tracking (stock research, portfolio)
```

#### **Admin & Utility**
```
/admin                      - Admin dashboard (next-auth protected)
/admin/analytics            - Analytics dashboard
```

#### **SEO & PWA**
```
/sitemap.xml                - Auto-generated sitemap
/sitemap-local.xml          - Local business structured data
/robots.txt                 - Search engine directives (custom, not generated)
/manifest.json              - PWA manifest
```

### URL Redirects (from `next.config.mjs`)
```
/projects       → /portfolio   (permanent - old URL)
/work           → /portfolio   (permanent)
/projects/:path → /portfolio/:path (permanent)
/ff             → /fantasy-football (temporary)
/rankings       → /fantasy-football (temporary)
/qb             → /fantasy-football/tiers/qb (temporary)
/rb             → /fantasy-football/tiers/rb (temporary)
/wr             → /fantasy-football/tiers/wr (temporary)
/te             → /fantasy-football/tiers/te (temporary)
/fantsy-football/:path → /fantasy-football/:path (typo redirect)
/fantasy-footbal/:path → /fantasy-football/:path (typo redirect)
/quatrerback    → /fantasy-football/tiers/qb (typo redirect)
/blog           → /writing (permanent)
/blog/:slug     → /writing/:slug (permanent)
/blog/posts/:slug → /writing/:slug (permanent)
/articles/:slug   → /writing/:slug (permanent)
/cv             → /resume (permanent)
/resume.pdf     → /Isaac_Vazquez_Resume.pdf (permanent)
/get-in-touch   → /contact (permanent)
/hire-me        → /contact (permanent)
```

### Navigation (from `src/constants/navlinks.tsx`)
```typescript
[
  { href: "/",         label: "Home",     icon: IconHome },
  { href: "/about",    label: "About",    icon: IconUser },
  { href: "/projects", label: "Projects", icon: IconBriefcase },  // redirects to /portfolio
  { href: "/resume",   label: "Resume",   icon: IconFileText },
  { href: "/contact",  label: "Contact",  icon: IconMail },
]
```

---

## API Architecture

### Fantasy Football APIs
```
/api/fantasy-data/          - Core fantasy player data
/api/fantasy-pros/          - FantasyPros authenticated scraping
/api/fantasy-pros-free/     - FantasyPros free tier data
/api/fantasy-pros-session/  - Session management for scraping
/api/data-manager/          - Data management operations
/api/data-metadata/         - Data freshness and metadata
/api/sample-data/           - Sample/fallback data serving
/api/scheduled-update/      - Cron-triggered data updates
```

### Portfolio & Financial APIs
```
/api/analytics/             - Event tracking and web vitals
/api/investments/           - Investment/stock data (investments page)
/api/search/                - Full-text search
/api/rss/                   - RSS feed
/api/scrape/                - Web scraping utilities
/api/stocks/                - Stock data
/api/auth/                  - NextAuth endpoints
```

---

## Component Architecture

### Core Layout Components
- **`ConditionalLayout`** (`src/components/ConditionalLayout.tsx`) – Route-based layout switching
- **`ModernHero`** (`src/components/ModernHero.tsx`) – Home page hero section
- **`StaticHeader`** – Page header (current default in root layout)
- **`Footer`** – Footer with social links
- **`About`** – About page with tabbed navigation
- **`ContactSection`** – Modular contact section
- **`AIStructuredData`** – AI-specific JSON-LD structured data (injected in root layout)
- **`ThemeProvider`** – Theme context provider (dark/light)
- **`Providers`** – React context providers wrapper

### Portfolio-Specific Components
- **`FeaturedWorkSection`** – Featured projects section on home
- **`ProjectsContent`** – Project showcase grid
- **`ProjectDetailModal`** – Project detail modal overlay
- **`ContactContent`** – Contact page layout
- **`WritingPreview`** – Writing/blog preview component
- **`ThinkingPreview`** – Thinking/notes preview component

### Fantasy Football Components
- **`FantasyFootballLandingContent`** – Main FF landing page
- **`FantasyContentGrid`** – Grid layout for FF content
- **`TierChart`** / **`TierChartEnhanced`** – D3-powered tier visualization
- **`LightweightTierChart`** – Performance-optimized tier chart
- **`RBTiersChart`** – RB-specific tier chart
- **`DraftTierChart`** – Draft tracker visualization
- **`EnhancedPlayerCard`** – Player card with stats
- **`PositionSelector`** – Position tab navigation
- **`TierDisplay`** / **`TierLegend`** – Tier display helpers
- **`DataFreshnessIndicator`** – Shows data age/freshness
- **`DataComparison`** – Side-by-side data comparison
- **`ExpertConsensusIndicator`** – Expert consensus signal display
- **`UpdateDataButton`** – Trigger data refresh
- **`VirtualizedPlayerList`** – Virtualized list for large player datasets

### Investments Components (`src/components/investments/`)
- **`PortfolioTracker`** – Portfolio overview and tracking
- **`StockResearch`** – Multi-panel stock research interface
- **`StockCard`** – Individual stock display card
- **`StockSearch`** – Stock search interface
- **`AddStockForm`** – Add stock to portfolio
- **`PortfolioSummary`** – Portfolio summary stats
- **`AllocationChart`** – Portfolio allocation chart
- **`DCFPanel`**, **`FundamentalsPanel`**, **`GrowthPanel`**, **`ValuationRatiosPanel`** – Research panels
- **`NewsPanel`**, **`TranscriptsPanel`**, **`IndustryPanel`**, **`ProfitabilityPanel`** – Research panels

### UI Component Library (`src/components/ui/`)
- **`WarmCard`** – Main container with modern styling, hover effects, padding options
- **`ModernButton`** – 4 variants: primary, secondary, outline, ghost
- **`button.tsx`** – Radix/shadcn-style button primitive
- **`dropdown-menu.tsx`** – Radix/shadcn-style dropdown primitive
- **`Badge`** – Labels and tags
- **`Heading`** / **`Paragraph`** – Typography components
- **`OptimizedImage`** – Next.js Image wrapper
- **`JourneyTimeline`** – Career timeline visualization
- **`ThemeToggle`** – Dark/light mode toggle
- **`MetricCallout`** – Highlighted metric display
- **`PageSummary`** – Page summary component
- **`ExpertSignal`** – Expert signal indicator
- **`AuthorBio`** – Blog author display
- **`LazyPlayerImage`** – Lazy-loaded player headshots
- **`QADashboard`** – QA dashboard component

### Navigation & Lazy Components
- **Navigation** (`src/components/navigation/`) – `Breadcrumbs.tsx`, `LazyFantasyComponents.tsx`
- **Lazy-loaded** (`src/components/lazy/`) – Heavy components wrapped in React.lazy()
- **Search** (`src/components/search/`) – `SearchInterface`, `SearchResults`, `SearchFilters`

### Utility Components
- **`Analytics`** – Analytics tracking wrapper
- **`StructuredData`** – Standard JSON-LD structured data

---

## Data Management System

### Static Content (`src/constants/`)
```
personal.ts     - Career timeline, metrics, skills, achievements, philosophy
navlinks.tsx    - Navigation configuration
socials.tsx     - Social media links
caseStudies.ts  - Case study/project data
```

### Fantasy Football Data System
The fantasy football platform has a full data pipeline:

1. **SQLite Database** (`fantasy-data.db`) – Local persistence for player data
2. **FantasyPros Integration** – Authenticated session scraping via `src/lib/fantasyProsAPI.ts`, `fantasyProsSession.ts`
3. **Player Image System** – Extensive scraping infrastructure (`scripts/`) for NFL player headshots
4. **Tier Calculation** – Gaussian mixture models (`src/lib/gaussianMixture.ts`), clustering (`src/lib/clustering.ts`), tier calculators
5. **Data Caching** – Unified cache layer (`src/lib/unifiedCache.ts`, `src/lib/dataCache.ts`)
6. **Automated Updates** – Scheduled updates via `/api/scheduled-update/` and Netlify functions

### Utility Libraries (`src/lib/`)
```
Core:
├── utils.ts                - General utilities
├── seo.ts                  - SEO metadata generation
├── analytics.ts            - Analytics tracking
├── auth.ts                 - Authentication utilities (NextAuth)
├── logger.ts               - Logging system
├── rateLimit.ts            - API rate limiting
└── ai-seo.ts               - AI-specific SEO utilities

Fantasy Football:
├── fantasyProsAPI.ts       - FantasyPros authenticated API
├── fantasyProsAlternative.ts - Alternative data source
├── fantasyProsSession.ts   - Session management for scraping
├── unifiedFantasyProsAPI.ts - Unified API abstraction
├── unifiedTierCalculator.ts - Unified tier calculator
├── optimizedTierCalculator.ts - Performance-optimized calculator
├── tierGrouping.ts         - Tier grouping algorithms
├── tierImageGenerator.ts   - Tier image generation
├── clustering.ts           - K-means/clustering for tiers
├── gaussianMixture.ts      - Gaussian mixture model
├── scoringFormatUtils.ts   - PPR/Standard/Half-PPR scoring
├── dataManager.ts          - Data management
├── dataCache.ts            - Caching layer
├── unifiedCache.ts         - Unified cache system
├── dataFileWriter.ts       - File-based data writing
├── dataImport.ts           - Data import utilities
├── database.ts             - SQLite database operations
├── nflverseAPI.ts          - NFLverse data source
├── overallDataGenerator.ts - Overall rankings generation
├── overallValueCalculator.ts - Value calculation
└── playerImageService.ts   - Player image serving

Financial:
└── yahooFinance.ts         - Yahoo Finance API integration (investments page)

Content & SEO:
├── blog.ts                 - Writing/blog post processing
├── localSEO.ts             - Local business SEO
├── localSitemap.ts         - Local sitemap generation
└── webScraper.ts           - Web scraping utilities
```

### Custom Hooks (`src/hooks/`)
```
useDebounce.ts              - Input debouncing

Fantasy Football:
useAllFantasyData.ts        - All positions data fetching
useOverallFantasyData.ts    - Overall rankings data
useUnifiedFantasyData.ts    - Unified data hook

Financial:
useInvestments.ts           - Investment portfolio data
useStockData.ts             - Individual stock data fetching

Player Images:
usePlayerImageCache.tsx     - Player image caching
```

### TypeScript Types (`src/types/`)
```
index.ts        - Core type definitions (fantasy football, portfolio)
navlink.tsx     - Navigation link types
investment.ts   - Investment/stock data types
```

---

## Code Organization
```
Website/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Home (ModernHero)
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Global styles and CSS variables
│   │   ├── metadata.ts         # SEO metadata config
│   │   ├── about/
│   │   ├── portfolio/[slug]/   # Project pages (NOTE: /projects redirects here)
│   │   ├── resume/
│   │   ├── contact/
│   │   ├── accessibility/
│   │   ├── fantasy-football/
│   │   │   ├── page.tsx
│   │   │   ├── fantasy-football-client.tsx
│   │   │   ├── tiers/[position]/
│   │   │   ├── rb-tiers/
│   │   │   └── draft-tracker/
│   │   ├── blog/               # Redirects to /writing (next.config.mjs)
│   │   │   └── [slug]/         # Redirects to /writing/[slug]
│   │   ├── writing/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   ├── search/
│   │   ├── investments/
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── analytics/
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # UI component library
│   │   ├── investments/        # Investment page components
│   │   ├── search/             # Search interface components
│   │   ├── navigation/         # Breadcrumbs, lazy FF components
│   │   └── lazy/               # Lazy-loaded wrappers
│   ├── constants/              # Static data
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and data layer
│   └── types/                  # TypeScript types
├── public/
│   ├── images/                 # Image assets
│   │   └── logos/              # Company logos for career timeline
│   ├── project-screenshots/    # Project portfolio screenshots
│   ├── fantasy/                # Fantasy football assets
│   └── Isaac_Vazquez_Resume.pdf
├── scripts/                    # Utility scripts
│   ├── updateFantasyRBTiers.ts # Main data update script
│   └── *.js                    # Player image scraping scripts (many)
├── docs/                       # Extended documentation
│   ├── DATABASE_SCHEMA.md
│   ├── ENVIRONMENT_CONFIGURATION.md
│   ├── FANTASY_PLATFORM_SETUP.md
│   ├── PLAYER_IMAGES_SETUP.md
│   ├── CRON_SETUP.md
│   ├── SECURITY.md
│   └── AUTOMATION_SCRIPTS.md
├── e2e/                        # Playwright E2E tests
├── netlify/functions/          # Netlify serverless functions
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── jest.config.js
├── playwright.config.ts
├── netlify.toml
└── package.json
```

---

## Configuration Files

### `next.config.mjs`
- URL redirects (portfolio, fantasy football, blog→writing, legacy URLs, typo redirects)
- `typescript.ignoreBuildErrors: true` (**temporary** – TypeScript errors are bypassed)
- `serverExternalPackages: ['better-sqlite3']` – excludes native module from server functions
- Image optimization (AVIF, WebP, remote patterns for unsplash + cloudinary; SVG allowed)
- `compiler.removeConsole` in production
- `experimental.optimizePackageImports` for icons and framer-motion
- `experimental.scrollRestoration: true`
- `turbopack: {}` – acknowledges Turbopack default in Next.js 16
- Webpack config for bundle splitting (ui-components, icons, framer-motion, content chunks)
- `better-sqlite3` also excluded from client bundle via webpack externals

### `tailwind.config.ts`
- `darkMode: "class"` – manual dark mode toggle
- Custom font families mapping to CSS variables
- Fluid font sizes mapped to CSS vars
- Color system tied to CSS custom properties
- Custom spacing scale
- Box shadow utilities
- Custom animation keyframes
- `@tailwindcss/typography` plugin

### `netlify.toml`
- Build: `npm run build`, publish: `.next`
- Uses `@netlify/plugin-nextjs`
- Required environment variables (set in Netlify dashboard):
  - `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
  - `ADMIN_USERNAME`, `ADMIN_PASSWORD`
  - `FANTASYPROS_USERNAME`, `FANTASYPROS_PASSWORD`
  - `CRON_SECRET`

### `jest.config.js` + `jest.setup.js`
- Unit tests in `src/**/__tests__/` and component directories
- Test scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`, `npm run test:ci`

### `playwright.config.ts`
- E2E tests in `e2e/` directory
- Scripts: `npm run test:e2e`, `npm run test:e2e:ui`, `npm run test:e2e:debug`

---

## Development Workflow

### Getting Started
```bash
npm install
npm run dev              # Dev server (webpack mode, --webpack baked into script)
npm run build            # Production build
npm start                # Production server
npm run analyze          # Bundle size analysis
npm test                 # Unit tests
npm run test:e2e         # E2E tests with Playwright
npm run update:fantasy-rb    # Update fantasy football RB tier data
npm run update:investments   # Update investment data (Python script)
```

### Environment Variables
```env
# Authentication (required for /admin)
NEXTAUTH_URL=https://isaacavazquez.com
NEXTAUTH_SECRET=<secret>
ADMIN_USERNAME=<username>
ADMIN_PASSWORD=<password>

# Fantasy Football data (required for live data)
FANTASYPROS_USERNAME=<username>
FANTASYPROS_PASSWORD=<password>
CRON_SECRET=<secret>

# Analytics (optional)
NEXT_PUBLIC_GA_ID=<google_analytics_id>

# Sitemap
SITE_URL=https://isaacavazquez.com
```

### Adding a New Page
1. Create `src/app/[page-name]/page.tsx`
2. Add metadata export for SEO
3. Add to `src/constants/navlinks.tsx` if needed
4. Update `next-sitemap.config.js` with priority/changefreq

### Creating a New Component
1. Create file in `src/components/` or `src/components/ui/`
2. Define TypeScript `interface` for props
3. Add ARIA labels and keyboard support
4. Use CSS custom properties from `globals.css` for colors
5. Ensure 44px minimum touch targets
6. Test reduced motion with `prefers-reduced-motion`
7. Verify dark mode appearance (`.dark` class)

### Styling Conventions
- Tailwind utility classes + CSS custom property references
- Colors come from CSS variables, NOT hardcoded hex values
- Use `--color-primary`, `--surface-primary`, `--text-primary`, etc.
- Minimum 44px touch targets (Tailwind `min-h-touch`, `min-w-touch`)
- Dark mode: ensure styles work with `.dark` class on `<html>`

### Commit Message Format
```
<type>: <description>

Types: feat, fix, refactor, style, docs, test, chore, perf
```

---

## Security Architecture

### Middleware (`src/middleware.ts`)
Applied to all routes – adds security headers:
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection`
- `Referrer-Policy`
- `Permissions-Policy`

CSP includes `connect-src https://api.fantasypros.com` for fantasy data fetching.

### Authentication
- NextAuth.js protects `/admin` routes
- Credentials-based (username/password from env vars)
- Session tokens managed by NextAuth

---

## Known Issues & Technical Debt

### Build Configuration
- **`typescript.ignoreBuildErrors: true`** – TypeScript errors are bypassed at build time
- **`ignoreDuringBuilds: true`** for ESLint – linting not enforced in CI
- **Action:** Resolve TypeScript errors and re-enable strict checking

### Fantasy Football
- FantasyPros session scraping is fragile (depends on login state)
- Player image coverage incomplete (many scripts in `scripts/` address this)
- SQLite not suitable for serverless (Netlify) – data is read-only at runtime from pre-built DB

### Performance
- Bundle size could be further reduced
- Some D3 visualizations load synchronously

---

## Testing Strategy

### Current State
- **Unit tests:** Jest + React Testing Library – configured, test files exist in `src/**/__tests__/` and `src/components/ui/__tests__/`
- **E2E tests:** Playwright – configured in `playwright.config.ts`, test files in `e2e/`
- **API tests:** `src/app/api/__tests__/`

### Running Tests
```bash
npm test                  # Run unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:ci           # CI mode (parallel)
npm run test:e2e          # Playwright E2E
npm run test:e2e:ui       # Playwright UI mode
npm run test:all          # Coverage + E2E
```

---

## Deployment & CI/CD

### Netlify Deployment
- **Platform:** Netlify (primary)
- **Build:** `npm run build` + auto `postbuild` (sitemap)
- **Plugin:** `@netlify/plugin-nextjs` for SSR support
- **Functions:** `netlify/functions/` for serverless functions
- **Secrets scan:** Configured to omit `.next/**` and specific env keys

### Sitemap Configuration (`next-sitemap.config.js`)
- Site URL: `https://isaacavazquez.com`
- Custom `robots.txt` (not auto-generated – already exists at `public/robots.txt`)
- Excluded: `/api/*`, `/admin/*`, `/budgeting`, `/investments`
- Fantasy football pages included with lower priority (0.5–0.6)
- Portfolio pages at high priority (0.9–0.95)
- Dynamic blog/writing posts auto-discovered from `content/` directory

---

## Social Links & Professional Info
```
LinkedIn:  https://linkedin.com/in/isaac-vazquez
GitHub:    https://github.com/isaacavazquez
Email:     isaacavazquez95@gmail.com
Website:   https://isaacavazquez.com
```

---

## AI Assistant Guidelines

### Understand the Dual Purpose
This is BOTH a professional portfolio AND a fantasy football analytics platform. Both sections are actively developed and important. Do not assume it is purely a portfolio.

### Code Quality Standards
- Follow existing TypeScript interfaces and patterns
- WCAG AA accessibility minimum
- Mobile-first responsive design
- Semantic HTML and ARIA labels
- Check `src/components/ui/` before creating new UI primitives

### Critical Conventions
- **Colors:** Use CSS custom properties (`var(--color-primary)`), never hardcode hex values in components
- **Primary color in light mode:** `#2563EB` (Blue 600) – not slate/dark
- **Dark mode:** `.dark` class on `<html>`, all components must work in both modes
- **Touch targets:** Minimum 44px height/width (use `min-h-touch`, `min-w-touch` Tailwind classes)
- **Images:** Always use `OptimizedImage` or Next.js `Image` component
- **`/projects` route:** `/projects` is **not** an actual app route – it redirects to `/portfolio` via `next.config.mjs`. The real project showcase page is `src/app/portfolio/`. Navigation links use `/projects` which redirects.
- **`/blog` route:** `/blog` redirects to `/writing`. The canonical writing content lives at `/writing` and `/writing/[slug]`.
- **Fantasy data:** Never make FantasyPros requests without rate limiting; use the unified cache layer

### Common Pitfalls
- Don't add `better-sqlite3` to client-side code (server-only module, excluded in webpack config)
- Don't hardcode colors – use CSS variables
- Don't skip the `prefers-reduced-motion` check for animations
- Don't bypass TypeScript errors with `any` – fix the root cause when possible
- Don't forget the fantasy football section exists when updating routes, navigation, or sitemaps

### Performance Checklist
- Lazy load heavy components (D3 charts, player images)
- Use `React.memo` for expensive renders in FF tier lists
- Monitor bundle size impact when adding dependencies
- Fantasy football data fetching uses a cache – check `unifiedCache.ts` before adding new fetches

---

## Version History

**Current Version:** 0.1.0
**Last Updated:** March 2026
**Documentation Version:** 4.2

### Changelog
- **v4.2 (March 2026):** Codebase audit and accuracy pass
  - Removed non-existent app routes: `/consulting`, `/faq`, `/notes`, `/newsletter`, `/testimonials`, `/budgeting`
  - Corrected `/blog` as redirect-only (canonical content at `/writing`)
  - Fixed URL redirect table (blog→writing, added typo redirects)
  - Fixed `/projects` – it is a redirect only, not a standalone page
  - Removed ~15 non-existent lib files (`dataLoader`, `dataValidator`, `lazySampleData`, `lazyD3`, `tierCalculator`, `sampleDataService`, `playerImageScraper`, `faqData`, etc.)
  - Added `yahooFinance.ts` to lib inventory
  - Removed non-existent hooks (`useLazyLoad`, `useScrollAnimation`, `useTypingAnimation`, `useFantasyData`, `useBlogPost`)
  - Added `useStockData.ts` hook
  - Removed non-existent API routes (`data-pipeline`, `player-images-mapping`, `newsletter/subscribe`)
  - Added `/api/investments/` API route
  - Removed ~15 non-existent UI components (`CommandPalette`, `SkipToContent`, `TopLoadingBar`, etc.)
  - Added real components: `FeaturedWorkSection`, `ThemeProvider`, `ThinkingPreview`, `WritingPreview`, investments component directory, `button.tsx`, `dropdown-menu.tsx`
  - Added `class-variance-authority`, `next-themes`, `tailwindcss-animate`, `@radix-ui` packages
  - Added `update:investments` script documentation
  - Added `caseStudies.ts` to constants
  - Removed non-existent component directories: `blog/`, `newsletter/`, `testimonials/`, `FAQ/`, `local-seo/`
  - Updated `next.config.mjs` notes (`serverExternalPackages`)

- **v4.1 (February 2026):** Targeted accuracy fixes
  - Fixed dev command (`npm run dev`, not `npm run dev --webpack`)
  - Fixed fantasy data update command (`npm run update:fantasy-rb`)
  - Removed non-existent `performance.ts` from lib inventory
  - Removed non-existent `useNavigation.ts` from hooks inventory
  - Added undocumented `tierImageGenerator.ts` to lib inventory
  - Clarified `/projects` is a real page (not just a redirect)
  - Stripped dependency version numbers (maintenance burden, not actionable)

- **v4.0 (February 2026):** Comprehensive accuracy update
  - Documented fantasy football as a first-class feature (previously omitted)
  - Corrected Next.js version to 16 (was incorrectly listed as 15)
  - Corrected primary color values from actual CSS (`#2563EB` blue, not slate)
  - Added testing infrastructure (Jest + Playwright – now configured)
  - Added SQLite, D3.js, NextAuth to dependency documentation
  - Documented actual URL redirects (`/projects` → `/portfolio`)
  - Added security middleware documentation
  - Added financial pages (budgeting, investments)
  - Complete component and API inventory reflecting actual files

- **v3.0 (February 2026):** Portfolio-only documentation (incomplete – omitted fantasy football)

- **v2.0 (November 2025):** Comprehensive rewrite with dual-purpose documentation

- **v1.0 (January 2025):** Initial CLAUDE.md creation
