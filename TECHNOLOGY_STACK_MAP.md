# Technology Stack Map - Isaac Vazquez Digital Platform

**Last Updated:** October 29, 2025
**Framework:** Next.js 15 with App Router
**Deployment:** Netlify (Primary), Vercel (Secondary)

---

## Table of Contents

- [Technology Overview](#technology-overview)
- [Core Framework & Runtime](#core-framework--runtime)
- [UI & Styling](#ui--styling)
- [Data & State Management](#data--state-management)
- [Authentication & Security](#authentication--security)
- [Build & Development Tools](#build--development-tools)
- [Deployment Configuration](#deployment-configuration)
- [Environment Configuration](#environment-configuration)
- [Performance Optimization](#performance-optimization)
- [Quick Reference](#quick-reference)

---

## Technology Overview

### Tech Stack Summary

```
Frontend Stack:
├── Framework: Next.js 15 (App Router)
├── Runtime: React 19
├── Language: TypeScript 5.9
├── Styling: Tailwind CSS v4
├── Animation: Framer Motion 12
└── Icons: Tabler Icons, Lucide React

Backend Stack:
├── API: Next.js API Routes
├── Database: SQLite (better-sqlite3)
├── Auth: NextAuth.js 4
├── Data Processing: Node.js
└── ML/Analytics: D3.js, Custom algorithms

Development:
├── Package Manager: npm
├── Linting: ESLint 9 + TypeScript ESLint
├── Build: Next.js Compiler + Webpack
└── Type Checking: TypeScript Strict Mode

Deployment:
├── Primary: Netlify
├── Secondary: Vercel
├── CDN: Netlify/Vercel Edge Network
└── Database: Local SQLite (Azure Blob storage ready)
```

---

## Core Framework & Runtime

### Next.js 15 Configuration

**File:** `next.config.mjs`

```javascript
Key Features:
├── App Router Architecture (latest)
├── React Server Components
├── Server Actions
├── Image Optimization (AVIF, WebP)
├── Font Optimization (Variable fonts)
├── Bundle Splitting (custom webpack config)
└── Edge Runtime Support

Configuration Highlights:
├── Image formats: AVIF, WebP
├── Device sizes: [640, 750, 828, 1080, 1200, 1920, 2048]
├── Image cache TTL: 30 days
├── Console removal in production
├── Optimized package imports (Tabler, Lucide, Framer)
└── Scroll restoration enabled
```

### React 19

**Version:** 19.1.1

```typescript
Modern React Features:
├── React Server Components (RSC)
├── Server Actions
├── Automatic batching
├── useTransition hook for async updates
├── Concurrent rendering
└── Improved hydration
```

### TypeScript 5.9

**File:** `tsconfig.json`

```json
Compiler Options:
├── Strict mode: true
├── Target: ES2022
├── Module: ESNext
├── JSX: preserve
├── Path aliases: @/* → src/*
├── Incremental compilation
└── Source maps for debugging

Strict Checks:
├── strictNullChecks
├── strictFunctionTypes
├── strictBindCallApply
├── strictPropertyInitialization
├── noImplicitAny
└── noUnusedLocals
```

---

## UI & Styling

### Tailwind CSS v4

**File:** `tailwind.config.ts`

```typescript
Configuration:
├── Dark mode: class-based
├── Custom font families: Orbitron, Inter, JetBrains Mono
├── Custom color system (cyberpunk theme)
├── Custom spacing scale
├── Animation keyframes
└── Typography plugin

Custom Colors:
├── Primary: Electric Blue (#00F5FF)
├── Secondary: Matrix Green (#39FF14)
├── Accent: Neon Purple (#BF00FF)
├── Warning: Amber (#FFB800)
├── Error: Red (#FF073A)
└── Cyber Teal (#00FFBF)

Semantic Colors (2025 System):
├── --color-primary
├── --color-secondary
├── --color-accent
├── --neutral-50 through --neutral-950
└── --surface-primary, secondary, elevated, overlay
```

### Typography System

```css
Font Families:
├── Headings: Orbitron (cyberpunk, futuristic)
├── Body: Inter (readable, professional)
├── Accent: Syne (modern, stylish)
└── Code/Terminal: JetBrains Mono (monospace)

Font Loading:
├── Strategy: swap (fast initial render)
├── Format: Variable fonts (.woff2)
├── Subset: Latin characters
└── Display: optimized for performance
```

### Framer Motion 12

**Version:** 12.23.12

```typescript
Animation Features:
├── Declarative animations
├── Spring physics
├── Gesture recognition
├── Layout animations
├── Scroll-triggered animations
├── Shared layout transitions
└── Reduced motion support

Common Patterns:
├── fadeIn: { opacity: 0 → 1 }
├── slideUp: { y: 20 → 0 }
├── scale: { scale: 0.95 → 1 }
├── stagger: Sequential child animations
└── spring: { stiffness: 100, damping: 15 }
```

### Icon Libraries

| Library | Version | Usage |
|---------|---------|-------|
| `@tabler/icons-react` | 3.34.1 | Primary icon system |
| `lucide-react` | 0.539.0 | Additional icons |
| `react-icons` | 5.5.0 | Extended icon support |

---

## Data & State Management

### Database: SQLite

**Package:** `better-sqlite3` v12.2.0

```typescript
Features:
├── Synchronous API (fast, simple)
├── In-process database (no network latency)
├── ACID transactions
├── Full SQL support
├── Prepared statements
└── Type-safe with TypeScript

Database File:
└── /fantasy-data.db (local development)
    └── Azure Blob storage (production ready)

Connection:
└── src/lib/database.ts
```

### Data Visualization: D3.js

**Package:** `d3` v7.9.0

```typescript
D3 Modules Used:
├── d3-scale: Scales for charts
├── d3-axis: Chart axes
├── d3-shape: Shapes and curves
├── d3-selection: DOM manipulation
├── d3-transition: Smooth animations
└── d3-array: Data processing

Lazy Loading:
└── src/lib/lazyD3.ts (code splitting for performance)
```

### Content Processing

| Package | Version | Purpose |
|---------|---------|---------|
| `gray-matter` | 4.0.3 | MDX frontmatter parsing |
| `remark` | 15.0.1 | Markdown processing |
| `remark-gfm` | 4.0.1 | GitHub Flavored Markdown |
| `remark-html` | 16.0.1 | HTML rendering |

---

## Authentication & Security

### NextAuth.js 4

**Package:** `next-auth` v4.24.11

```typescript
Authentication Features:
├── OAuth providers
├── Credential-based auth
├── JWT sessions
├── Secure session management
├── CSRF protection
└── Role-based access control

Configuration:
└── src/app/api/auth/[...nextauth]/route.ts
└── src/lib/auth.ts
```

### Security Measures

```typescript
Security Features:
├── Rate Limiting
│   └── src/lib/rateLimit.ts (token bucket algorithm)
│
├── Input Validation
│   └── src/lib/dataValidator.ts
│
├── CSP Headers
│   └── Content Security Policy for images
│
├── Environment Variables
│   └── Sensitive data in .env.local
│
└── API Route Protection
    └── Middleware for admin routes
```

---

## Build & Development Tools

### Package Manager

**Manager:** npm (Node Package Manager)

```json
Scripts:
├── dev: next dev (http://localhost:3000)
├── build: next build
├── postbuild: next-sitemap (SEO)
├── start: next start (production)
├── lint: next lint (ESLint)
├── analyze: ANALYZE=true npm run build
└── build:analyze: Bundle analysis
```

### Linting & Code Quality

**ESLint Configuration:** `eslint.config.js`

```javascript
Plugins & Rules:
├── @eslint/js (core rules)
├── typescript-eslint (TS-specific)
├── eslint-plugin-react-refresh
└── next/core-web-vitals (Next.js rules)

Linting Scope:
├── Source files: src/**/*.{js,ts,jsx,tsx}
├── Configuration files: *.config.{js,ts}
├── Ignore: node_modules, .next, out
└── Auto-fix on save (IDE integration)
```

### Build Optimization

**Webpack Configuration:** `next.config.mjs` (webpack function)

```javascript
Optimizations:
├── Code Splitting
│   ├── UI Components chunk
│   ├── Icons chunk (Tabler, Lucide)
│   ├── Framer Motion chunk
│   ├── Content features chunk
│   └── Vendor chunk
│
├── Bundle Analysis
│   └── webpack-bundle-analyzer (ANALYZE=true)
│
├── Externals
│   └── better-sqlite3 (server-only)
│
└── Tree Shaking
    └── Automatic dead code elimination
```

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tailwindcss/postcss` | 4.1.12 | Tailwind v4 PostCSS |
| `autoprefixer` | 10.4.21 | CSS vendor prefixes |
| `postcss` | 8.5.6 | CSS processing |
| `next-sitemap` | 4.2.3 | SEO sitemap generation |
| `webpack-bundle-analyzer` | 4.10.2 | Bundle size analysis |
| `@netlify/functions` | 4.2.1 | Netlify serverless functions |

---

## Deployment Configuration

### Netlify (Primary Deployment)

**File:** `netlify.toml`

```toml
Configuration:
├── Build command: npm run build
├── Publish directory: .next
├── Functions directory: netlify/functions
├── Node version: 20
└── Environment: Node.js runtime

Features:
├── Edge Functions (CDN caching)
├── Serverless Functions (API routes)
├── Automatic HTTPS
├── Custom domains
├── Continuous deployment (Git integration)
├── Build plugins
└── Environment variables management

Build Settings:
└── Framework: Next.js
└── Auto-detect: Yes
└── Deploy previews: Enabled
└── Branch deploys: main
```

### Vercel (Secondary Deployment)

**File:** `vercel.json`

```json
Configuration:
├── Framework preset: Next.js
├── Build command: next build
├── Output directory: .next
└── Node.js version: 20

Features:
├── Edge Network (global CDN)
├── Serverless Functions
├── Analytics
├── Web Vitals monitoring
└── Preview deployments
```

### Deployment Comparison

| Feature | Netlify | Vercel |
|---------|---------|--------|
| Primary Use | Main production | Backup/staging |
| Edge Network | ✓ Global CDN | ✓ Global CDN |
| Serverless | ✓ Functions | ✓ Functions |
| Build Time | ~3-5 min | ~2-4 min |
| Custom Domain | isaacavazquez.com | (secondary) |
| Analytics | ✓ Built-in | ✓ Built-in |
| Cost | Free tier | Free tier |

---

## Environment Configuration

### Environment Variables

**Files:**
- `.env.local` (development, gitignored)
- `.env.production` (production, gitignored)
- Netlify/Vercel dashboard (deployment)

```bash
# Fantasy Sports APIs
FANTASYPROS_API_KEY=your_key_here
ESPN_API_KEY=your_key_here

# Database
DATABASE_URL=./fantasy-data.db
AZURE_STORAGE_CONNECTION_STRING=optional

# Authentication
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=https://isaacavazquez.com

# Analytics
GOOGLE_ANALYTICS_ID=optional
POSTHOG_API_KEY=optional

# Build
ANALYZE=false
NODE_ENV=production
```

### Configuration Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js framework configuration |
| `tailwind.config.ts` | Tailwind CSS theme and utilities |
| `tsconfig.json` | TypeScript compiler options |
| `eslint.config.js` | ESLint rules and plugins |
| `postcss.config.js` | PostCSS plugins (Tailwind) |
| `next-sitemap.config.js` | SEO sitemap generation |
| `netlify.toml` | Netlify deployment settings |
| `vercel.json` | Vercel deployment settings |
| `package.json` | Dependencies and scripts |

---

## Performance Optimization

### Image Optimization

```javascript
Next.js Image Configuration:
├── Formats: AVIF, WebP (modern browsers), fallback to original
├── Device sizes: [640, 750, 828, 1080, 1200, 1920, 2048]
├── Image sizes: [16, 32, 48, 64, 96, 128, 256, 384]
├── Cache TTL: 30 days
├── Lazy loading: Automatic below the fold
├── Priority loading: Above the fold images
└── Responsive srcset: Automatic generation

Remote Patterns:
├── images.unsplash.com (allowed)
└── res.cloudinary.com (allowed)
```

### Font Optimization

```typescript
Font Loading Strategy:
├── Variable fonts (.woff2)
├── Display: swap (show fallback immediately)
├── Subset: Latin characters only
├── Preload: Critical fonts
└── Self-hosted: No external font requests

Fonts:
├── Orbitron: Headings (variable weight)
├── Inter: Body text (variable weight)
├── JetBrains Mono: Code (variable weight)
└── Fallback: system-ui, sans-serif
```

### Bundle Optimization

```javascript
Webpack Optimizations:
├── Code Splitting
│   ├── Route-based: Automatic per page
│   ├── Component-based: Dynamic imports
│   ├── Vendor chunks: node_modules separation
│   └── Icon library: Separate chunk
│
├── Tree Shaking
│   └── Removes unused exports
│
├── Minification
│   ├── Terser for JavaScript
│   └── CSS nano for stylesheets
│
└── Compression
    ├── Gzip: Automatic on CDN
    └── Brotli: Supported by Netlify/Vercel

Package Optimizations:
├── optimizePackageImports: ['@tabler/icons-react', 'lucide-react', 'framer-motion']
└── External server packages: ['better-sqlite3']
```

### Performance Monitoring

**Package:** `web-vitals` v5.1.0

```typescript
Metrics Tracked:
├── LCP (Largest Contentful Paint) - Loading performance
├── FID (First Input Delay) - Interactivity
├── CLS (Cumulative Layout Shift) - Visual stability
├── TTFB (Time to First Byte) - Server response
├── FCP (First Contentful Paint) - Perceived load speed
└── INP (Interaction to Next Paint) - Responsiveness

Reporting:
└── API endpoint: /api/analytics/web-vitals
└── Dashboard: /admin/analytics
```

### Caching Strategy

```typescript
Caching Layers:
├── Browser Cache
│   ├── Static assets: 1 year
│   ├── Images: 30 days
│   └── API responses: 60 seconds
│
├── CDN Cache (Netlify/Vercel)
│   ├── Static pages: Until revalidation
│   ├── API routes: No cache (dynamic)
│   └── Images: 30 days
│
├── Application Cache
│   ├── In-memory: 60 seconds (dataCache.ts)
│   ├── React Query: Stale-while-revalidate
│   └── Player images: Browser cache API
│
└── Database
    └── Query results: In-memory (SQLite)
```

---

## Quick Reference

### Key Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Run production build locally
npm run lint             # Lint code
npm run analyze          # Analyze bundle size

# Deployment
git push                 # Auto-deploy to Netlify (main branch)
vercel deploy            # Deploy to Vercel

# Database
node scripts/update-data.js           # Update player data
node scripts/validate-image-system.js # Validate images
```

### Technology Versions

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.4.6 | Framework |
| React | 19.1.1 | UI library |
| TypeScript | 5.9.2 | Language |
| Tailwind CSS | 4.1.12 | Styling |
| Framer Motion | 12.23.12 | Animations |
| D3.js | 7.9.0 | Data visualization |
| SQLite | 12.2.0 | Database |
| NextAuth | 4.24.11 | Authentication |
| Node.js | 20+ | Runtime |

### Build Output

```
Production Build:
├── .next/static/chunks/          # JavaScript bundles
├── .next/static/css/             # Stylesheets
├── .next/static/media/           # Fonts, images
├── .next/server/                 # Server-side code
├── .next/cache/                  # Build cache
└── public/                       # Static assets

Bundle Sizes (optimized):
├── First Load JS: ~120KB (target <170KB)
├── Shared chunks: ~85KB
├── Route chunks: ~15-40KB per page
└── Total size: <500KB (excellent)
```

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| LCP | < 2.5s | ~1.8s |
| FID | < 100ms | ~50ms |
| CLS | < 0.1 | ~0.05 |
| TTFB | < 600ms | ~400ms |
| Bundle Size | < 170KB | ~120KB |

### Browser Support

```
Supported Browsers:
├── Chrome: Last 2 versions
├── Firefox: Last 2 versions
├── Safari: Last 2 versions
├── Edge: Last 2 versions
└── Mobile: iOS Safari 12+, Chrome Android

Progressive Enhancement:
├── Modern features: AVIF, WebP
├── Fallbacks: PNG, JPEG
├── CSS Grid: Fallback to Flexbox
└── ES6+: Transpiled to ES5 for older browsers
```

---

**For routing information, see:** `WEBSITE_MAP.md`
**For component details, see:** `COMPONENT_MAP.md`
**For data architecture, see:** `DATA_ARCHITECTURE_MAP.md`
**For styling details, see:** `docs/STYLING_SYSTEM.md`
**For performance details, see:** `docs/PERFORMANCE.md`
