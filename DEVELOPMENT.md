# Development Guide

Development guide for Isaac Vazquez's portfolio and fantasy football analytics platform — built with Next.js 16.

**Last Updated:** March 2026

---

## Table of Contents

- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Styling & Design](#styling--design)
- [Fantasy Football Development](#fantasy-football-development)
- [Testing & Debugging](#testing--debugging)
- [Troubleshooting](#troubleshooting)
- [Environment Configuration](#environment-configuration)

---

## Quick Start

### Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/)
- **npm 8+**
- **Git**
- **Python 3** (only for `npm run update:investments`)
- **VS Code** (recommended)

### Setup

```bash
# Clone repository
git clone https://github.com/IsaacAVazquez/Website.git
cd Website

# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.example .env.local  # or create .env.local manually

# Start development server
npm run dev
# → http://localhost:3000
```

### Available Scripts

```bash
# Development
npm run dev                  # Dev server (webpack mode)
npm run build                # Production build + sitemap
npm start                    # Serve production build
npm run lint                 # ESLint
npm run analyze              # Bundle size analysis

# Testing
npm test                     # Unit tests (Jest)
npm run test:watch           # Jest watch mode
npm run test:coverage        # Coverage report
npm run test:ci              # CI mode (parallel + coverage)
npm run test:e2e             # Playwright E2E
npm run test:e2e:ui          # Playwright UI mode
npm run test:e2e:debug       # Playwright debug mode
npm run test:all             # Coverage + E2E

# Data
npm run update:fantasy-rb    # Refresh fantasy football RB data
npm run update:investments   # Refresh investment data (Python)
```

---

## Development Environment

### VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Recommended VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "auto"
}
```

---

## Project Architecture

### File Structure

```
src/
├── app/                     # Next.js App Router
│   ├── page.tsx             # Home (ModernHero)
│   ├── layout.tsx           # Root layout
│   ├── globals.css          # Global styles + CSS custom properties
│   ├── metadata.ts          # SEO metadata config
│   ├── about/
│   ├── portfolio/[slug]/    # Project showcase (NOTE: /projects redirects here)
│   ├── resume/
│   ├── contact/
│   ├── accessibility/
│   ├── fantasy-football/    # FF landing + tiers + draft tracker
│   │   ├── page.tsx
│   │   ├── fantasy-football-client.tsx
│   │   ├── tiers/[position]/
│   │   ├── rb-tiers/
│   │   └── draft-tracker/
│   ├── writing/             # Blog/writing (NOTE: /blog redirects here)
│   │   ├── page.tsx
│   │   └── [slug]/
│   ├── investments/
│   ├── search/
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── analytics/
│   └── api/                 # API routes
│
├── components/              # React components
│   ├── ui/                  # Design system primitives
│   ├── investments/         # Investment page components
│   ├── navigation/          # Breadcrumbs, lazy FF components
│   ├── search/              # Search interface components
│   └── lazy/                # React.lazy() wrappers
│
├── constants/               # Static data (nav, projects, career timeline)
│   ├── personal.ts
│   ├── navlinks.tsx
│   ├── socials.tsx
│   └── caseStudies.ts
│
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities, data layer, FF logic
└── types/                   # TypeScript types

public/                      # Static assets
├── images/
│   └── logos/               # Company logos for career timeline
├── project-screenshots/
├── fantasy/
└── Isaac_Vazquez_Resume.pdf

scripts/                     # Data update scripts
netlify/functions/           # Netlify serverless functions
e2e/                         # Playwright E2E tests
docs/                        # Extended documentation
content/blog/                # MDX writing articles
```

### Route Conventions

> **Important:** Do not create `src/app/projects/` — `/projects` permanently redirects to `/portfolio` via `next.config.mjs`. Similarly, `/blog` redirects to `/writing`.

### Design Patterns

**Component structure:**
```typescript
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export const Component: React.FC<ComponentProps> = ({ className, children }) => {
  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  );
};
```

**Error handling in API routes:**
```typescript
try {
  const result = await apiCall();
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  return NextResponse.json(
    { success: false, error: (error as Error).message },
    { status: 500 }
  );
}
```

---

## Development Workflow

### Branch Strategy

- `main` — Production (auto-deploys to Netlify)
- `feature/*` — Feature branches
- `hotfix/*` — Critical production fixes

### Commit Convention

```
feat: add draft tracker page
fix: resolve mobile navigation overlay
docs: update API documentation
style: fix dark mode contrast on tier chart
refactor: optimize player list virtualization
test: add E2E test for fantasy football tiers
chore: bump framer-motion to v12
perf: lazy load D3 tier charts
```

### Adding a New Page

1. Create `src/app/[page-name]/page.tsx`
2. Export `metadata` for SEO
3. Add to `src/constants/navlinks.tsx` if it belongs in navigation
4. Update `next-sitemap.config.js` with priority and `changefreq`

### Creating a New Component

1. Check `src/components/ui/` first — the primitive may already exist
2. Create the file with a typed `interface` for props
3. Add ARIA labels and keyboard support for interactive elements
4. Use CSS custom properties for colors — never hardcode hex values
5. Ensure 44px minimum touch targets (`min-h-touch`, `min-w-touch`)
6. Test with `prefers-reduced-motion`
7. Verify dark mode (`.dark` class on `<html>`)

### Code Quality Checks

```bash
# Before committing
npm run lint                 # ESLint
npx tsc --noEmit             # TypeScript check (note: build ignores errors)
npm test                     # Unit tests
```

---

## Styling & Design

### Color System

All colors use CSS custom properties defined in `src/app/globals.css`. **Never hardcode hex values in components.**

```css
/* Light mode */
--color-primary: #2563EB;    /* Blue 600 */
--color-secondary: #1D4ED8;  /* Blue 700 */
--color-accent: #3B82F6;     /* Blue 500 */
--text-primary: #0F172A;     /* Slate 900 */
--text-secondary: #475569;   /* Slate 600 */
--surface-primary: #FFFFFF;
--border-primary: #E2E8F0;

/* Dark mode (overrides on .dark class) */
--color-primary: #3B82F6;    /* Blue 500 */
--color-secondary: #60A5FA;  /* Blue 400 */
```

### Using Colors in Components

```tsx
// Correct — CSS variables
<div className="text-[var(--text-primary)] bg-[var(--surface-primary)]">

// Incorrect — hardcoded hex
<div className="text-slate-900 bg-white">
```

### Typography

- **Primary font:** Inter (CSS variable `--font-inter`)
- **Monospace font:** JetBrains Mono (CSS variable `--font-jetbrains-mono`)
- **Fluid scale:** All sizes use `clamp()` — e.g., `--text-base`, `--text-lg`

### Responsive Design

Mobile-first with Tailwind breakpoints: `sm` (640px) → `md` (768px) → `lg` (1024px) → `xl` (1280px)

```tsx
className="text-4xl md:text-5xl lg:text-6xl"
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
```

### Dark Mode

Dark mode uses the `.dark` class on `<html>` (class-based, via `next-themes`). All components must work in both modes:

```tsx
<div className="bg-white dark:bg-neutral-900 text-[var(--text-primary)]">
```

### Animations

- Framer Motion for page/component transitions
- Spring physics: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Always check `prefers-reduced-motion`:

```tsx
import { useReducedMotion } from 'framer-motion';

const shouldReduce = useReducedMotion();
const variants = shouldReduce ? {} : animationVariants;
```

---

## Fantasy Football Development

### Data Layer

Fantasy football data flows through:
1. `src/lib/fantasyProsAPI.ts` — FantasyPros scraping (requires auth)
2. `src/lib/unifiedFantasyProsAPI.ts` — Unified API abstraction
3. `src/lib/unifiedCache.ts` — Caching layer
4. `src/lib/database.ts` — SQLite operations (server-only)
5. `/api/fantasy-data/` — HTTP endpoint
6. `src/hooks/useUnifiedFantasyData.ts` — React data hook

### Important Constraints

- **Never** import `better-sqlite3` in client components — it's server-only and excluded from the client bundle
- **Always** use the unified cache layer before adding new data fetches — check `unifiedCache.ts`
- **Rate-limit** all FantasyPros requests — never call their API directly without going through the API layer

### Tier Calculation

Tier charts use a two-step process:
1. **Clustering:** K-means via `src/lib/clustering.ts`
2. **Tier assignment:** Gaussian mixture models via `src/lib/gaussianMixture.ts`

Unified entry point: `src/lib/unifiedTierCalculator.ts`

### Updating Fantasy Data

```bash
# Manual RB data update
npm run update:fantasy-rb

# Trigger scheduled update (dev)
curl -X POST http://localhost:3000/api/scheduled-update \
  -H "x-cron-secret: your_secret"
```

---

## Testing & Debugging

### Performance

**Image optimization:**
```tsx
import Image from "next/image";

<Image
  src="/images/hero.jpg"
  alt="Portfolio hero"
  width={1200}
  height={800}
  priority
/>
```

**Lazy loading heavy components:**
```typescript
const TierChart = dynamic(
  () => import('@/components/TierChart'),
  { loading: () => <Skeleton />, ssr: false }
);
```

**Bundle analysis:**
```bash
npm run analyze
# or
ANALYZE=true npm run build
```

### Debugging

**React DevTools** for component state inspection.

**API debugging:**
```bash
curl http://localhost:3000/api/fantasy-data | jq '.'
curl http://localhost:3000/api/data-metadata | jq '.lastUpdated'
```

**Logging:** `src/lib/logger.ts` — logs are suppressed in production via `compiler.removeConsole`.

---

## Troubleshooting

### Server Won't Start

```bash
rm -rf .next
npm run dev

# Check Node.js version (requires 18+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json && npm install

# Kill port conflicts
lsof -ti:3000 | xargs kill -9
```

### TypeScript Errors

Note: `typescript.ignoreBuildErrors: true` is set in `next.config.mjs`, so TypeScript errors won't block builds. But fix them anyway:

```bash
npx tsc --noEmit
```

### Tailwind Styles Not Applied

```bash
rm -rf .next
npm run dev
```

### SQLite Errors

`better-sqlite3` is server-only. If you see `Module not found: Can't resolve 'better-sqlite3'` on the client side, you've accidentally imported it in a client component. Move the import to a server component or API route.

### Common Error Messages

**"Hydration mismatch":** Ensure server and client render the same content. Use `useEffect` for browser-only APIs.

**"Module not found":** Check path aliases in `tsconfig.json`. Restart the TypeScript server in VS Code.

**Hot reload not working:**
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
```

---

## Environment Configuration

### Local Development (`.env.local`)

```env
# Required for /admin dashboard
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-secret>
ADMIN_USERNAME=<username>
ADMIN_PASSWORD=<password>

# Required for live fantasy football data
FANTASYPROS_USERNAME=<email>
FANTASYPROS_PASSWORD=<password>
CRON_SECRET=<random-secret>

# Optional
NEXT_PUBLIC_GA_ID=<google-analytics-id>
SITE_URL=https://isaacavazquez.com
```

### Production (Netlify Dashboard)

Set all of the above in **Site Settings → Environment Variables**. Never commit `.env.local` to Git.

See [`docs/ENVIRONMENT_CONFIGURATION.md`](./docs/ENVIRONMENT_CONFIGURATION.md) for the complete variable reference.

---

## Additional Resources

### Documentation

- **[README.md](./README.md)** — Quick start and overview
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — System architecture
- **[COMPONENTS.md](./COMPONENTS.md)** — Component library
- **[API.md](./API.md)** — API endpoint reference
- **[TESTING.md](./TESTING.md)** — Testing strategy
- **[STYLING.md](./STYLING.md)** — Design system
- **[docs/FANTASY_PLATFORM_SETUP.md](./docs/FANTASY_PLATFORM_SETUP.md)** — Fantasy platform setup
- **[docs/ENVIRONMENT_CONFIGURATION.md](./docs/ENVIRONMENT_CONFIGURATION.md)** — Environment variables

### External Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [D3.js Documentation](https://d3js.org/)

---

*Last Updated: March 2026*
