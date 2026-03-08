# AGENT.md — Quick Reference

Next.js 16 portfolio + fantasy football analytics platform. See `CLAUDE.md` for full context.

---

## Critical Rules

- **Never hardcode hex colors** — use `var(--color-primary)`, `var(--text-primary)`, etc.
- **Never import `@tabler/icons-react` in server components** — use `@/components/ui/ServerIcons` instead
- **Never import `better-sqlite3` in client code** — server-only module
- **Never create pages at `/projects` or `/blog`** — these are redirects; real pages are `/portfolio` and `/writing`
- **Never skip `prefers-reduced-motion`** for Framer Motion animations
- **Always use 44px min touch targets** — `min-h-touch min-w-touch` Tailwind classes

---

## Key Commands

```bash
npm run dev          # dev server (webpack mode)
npm run build        # prod build + auto-runs sitemap postbuild
npm test             # Jest unit tests
npm run test:e2e     # Playwright E2E tests
npm run update:fantasy-rb   # update fantasy football tier data
```

---

## Server vs Client Boundary

```
src/app/layout.tsx          (SERVER — root layout)
└── Providers.tsx           (CLIENT ← first boundary)
    └── ConditionalLayout.tsx (CLIENT)
        ├── StaticHeader.tsx  (CLIENT)
        └── {children}        (SERVER unless marked 'use client')
    └── Footer.tsx            (CLIENT)
```

Server components = no hooks, no browser APIs, no `@tabler/icons-react`.

---

## Icon Usage

| Context | Import from |
|---------|-------------|
| Server components | `@/components/ui/ServerIcons` |
| Client components | `@tabler/icons-react` or `lucide-react` |

Available server icons (`src/components/ui/ServerIcons.tsx`):
`ArrowRight`, `ArrowLeft`, `ExternalLink`, `Calendar`, `Clock`, `ChartBar`,
`BrandGithub`, `Home`, `User`, `Briefcase`, `FileText`, `Mail`, `Menu2`, `X`, `BrandLinkedin`

```tsx
// Server component — correct
import { ArrowRight } from "@/components/ui/ServerIcons";

// Client component — correct
import { IconArrowRight } from "@tabler/icons-react";
```

---

## Color System

Always use CSS custom properties — never raw hex values in components.

```css
var(--color-primary)    /* Blue 600 light / Blue 500 dark */
var(--color-secondary)  /* Blue 700 light / Blue 400 dark */
var(--color-accent)     /* Blue 500 light / Blue 300 dark */
var(--color-success)    /* Emerald 600 */
var(--color-warning)    /* Amber 600 */
var(--color-error)      /* Red 600 */

var(--surface-primary)  /* #FFFFFF light */
var(--text-primary)     /* Slate 900 light */
var(--text-secondary)   /* Slate 600 light */
var(--border-primary)   /* Slate 200 light */

var(--neutral-50) … var(--neutral-950)   /* Slate scale */
```

Dark mode is class-based: `.dark` on `<html>`. All components must support both modes.

---

## Critical File Paths

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout (server) |
| `src/app/globals.css` | CSS variables, design tokens |
| `src/components/ui/ServerIcons.tsx` | SVG icons for server components |
| `src/components/ConditionalLayout.tsx` | Route-based layout switching |
| `src/constants/personal.ts` | Career timeline, skills, metrics |
| `src/constants/navlinks.tsx` | Navigation config |
| `src/lib/unifiedCache.ts` | Fantasy data cache layer |
| `src/lib/database.ts` | SQLite operations (server-only) |
| `src/types/index.ts` | Core TypeScript interfaces |
| `next.config.mjs` | Redirects, webpack config, image domains |
| `src/middleware.ts` | Security headers (applied to all routes) |

---

## TypeScript Quick Reference

```ts
// src/types/index.ts
type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST' | 'FLEX' | 'OVERALL' | 'ALL';
type ScoringFormat = 'STANDARD' | 'PPR' | 'HALF_PPR';

interface Player {
  id: string; name: string; team: string; position: Position;
  averageRank: number | string; projectedPoints: number;
  standardDeviation: number | string; tier?: number;
  expertRanks: number[]; adp?: number; byeWeek?: number;
  headshotUrl?: string; consensusLevel?: 'high' | 'medium' | 'low';
  // ...projections, weeklyProjections
}

interface TierGroup { tier: number; players: Player[]; color: string; }

interface DraftState { /* draft tracker state — see src/types/index.ts */ }
```

---

## Key Packages & Constraints

| Package | Constraint |
|---------|-----------|
| `better-sqlite3` | Server-only — excluded from client bundle via webpack |
| `next-themes` | Class-based dark mode (`.dark` on `<html>`) |
| `@tabler/icons-react` | Client components only — 116MB, excluded from server bundles |
| `framer-motion` | Tree-shaken via `optimizePackageImports` in `next.config.mjs` |
| TypeScript | `ignoreBuildErrors: true` — errors bypassed at build; fix root causes anyway |

---

> For full documentation: routes, all components, API routes, data pipeline, SEO, see `CLAUDE.md`.
