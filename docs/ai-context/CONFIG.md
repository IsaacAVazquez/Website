# Configuration — AI Context Reference

> Every config file: what it controls, key non-default settings, gotchas, and interdependencies.

---

## Config File Map

| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js framework config |
| `tailwind.config.ts` | Tailwind CSS extensions |
| `netlify.toml` | Netlify deployment |
| `tsconfig.json` | TypeScript compiler |
| `jest.config.js` | Unit test runner |
| `playwright.config.ts` | E2E test runner |
| `eslint.config.js` | Linting |
| `postcss.config.js` | CSS processing |
| `next-sitemap.config.js` | SEO sitemap generation |

---

## next.config.mjs

### Build & TypeScript
```javascript
typescript: { ignoreBuildErrors: true }  // TEMPORARY — build succeeds despite TS errors
```
**Gotcha:** TypeScript errors are silently bypassed at build time. Fix these and re-enable.

### Server External Packages
```javascript
serverExternalPackages: ['better-sqlite3', '@tabler/icons-react', 'lucide-react']
```
Prevents these from being bundled into the Netlify server function. Combined with `optimizePackageImports`, this significantly reduces server function size.

### Image Optimization
```javascript
images: {
  remotePatterns: [{ hostname: 'images.unsplash.com' }, { hostname: 'res.cloudinary.com' }],
  formats: ["image/avif", "image/webp"],
  minimumCacheTTL: 60 * 60 * 24 * 30,  // 30 days
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
}
```

### Performance
```javascript
compiler: { removeConsole: process.env.NODE_ENV === "production" }
experimental: {
  optimizePackageImports: ['@tabler/icons-react', 'lucide-react', 'framer-motion'],
  scrollRestoration: true,
}
```
`optimizePackageImports` rewrites barrel imports to direct paths — critical for keeping icon libraries from bloating the bundle.

### Webpack Bundle Splitting
5 cache groups for client-side code splitting:

| Group | Priority | Content |
|-------|----------|---------|
| `uiComponents` | 20 | UI components, modals |
| `icons` | 15 | @tabler/icons-react, lucide-react |
| `framerMotion` | 15 | framer-motion |
| `content` | 12 | Blog/content components |
| `vendor` | -10 | All other node_modules |

### Bundle Analyzer
```bash
ANALYZE=true npm run build  # Generates bundle-analyzer-report.html
```

### Redirects
20+ redirects defined in `redirects()`. See `REDIRECTS-AND-NAVIGATION.md`.

---

## tailwind.config.ts

### Key Settings
```typescript
darkMode: "class"  // Manual toggle via .dark class on <html>
```

### Custom Extensions
All map to CSS custom properties in `globals.css`:
- **Fonts:** `sans` → `var(--font-inter)`, `mono` → `var(--font-jetbrains-mono)`
- **Colors:** All semantic (primary, neutral scale, surface, text, border)
- **Spacing:** xs through 4xl
- **Shadows:** sm through xl
- **Animations:** skeleton-loading, slide-in-up, shake, spinner-rotate
- **Easing:** spring, smooth
- **Touch targets:** `min-h-touch: 44px`, `min-w-touch: 44px`

### Plugins
- `@tailwindcss/typography` — prose styling for rich text
- `tailwindcss-animate` — animation utility classes

See `STYLING.md` for complete variable inventory.

---

## netlify.toml

### Build
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Functions
```toml
[functions]
  directory = "netlify/functions"
```

### Secrets Scan
```toml
[build.environment]
  SECRETS_SCAN_OMIT_PATHS = ".netlify/**,.next/**"
  SECRETS_SCAN_OMIT_KEYS = "ADMIN_USERNAME,ADMIN_PASSWORD,NEXTAUTH_SECRET,CRON_SECRET,FANTASYPROS_USERNAME,FANTASYPROS_PASSWORD"
```

### Cache Headers
| Path Pattern | Cache-Control |
|-------------|---------------|
| `/_next/static/css/*.css` | `public, max-age=31536000, immutable` |
| `/_next/static/chunks/**` | `public, max-age=31536000, immutable` |
| `/_next/static/*` | `public, max-age=31536000, immutable` |

Content-Type explicitly set for CSS (`text/css`) and JS (`application/javascript`) to prevent Netlify serving as `text/plain`.

### Required Environment Variables
Set in Netlify dashboard (not in code):
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` — Auth
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` — Admin login
- `FANTASYPROS_USERNAME`, `FANTASYPROS_PASSWORD` — Fantasy data
- `CRON_SECRET` — Scheduled update auth

---

## tsconfig.json

### Key Settings
```json
{
  "compilerOptions": {
    "target": "ES5",
    "module": "node16",
    "moduleResolution": "node16",
    "strict": true,
    "jsx": "react-jsx",
    "incremental": true
  }
}
```

### Path Aliases
```json
{ "paths": { "@/*": ["./src/*"] } }
```
Usage: `import { WarmCard } from "@/components/ui/WarmCard"`

### Exclusions
`node_modules`, `src/data/backup/**/*`

---

## jest.config.js

### Environment
```javascript
testEnvironment: 'jest-environment-jsdom'
```

### Coverage Thresholds
```javascript
coverageThreshold: {
  global: { branches: 20, functions: 25, lines: 25, statements: 25 }
}
```

### Test Patterns
- Match: `**/__tests__/**/*.[jt]s?(x)`, `**/?(*.)+(spec|test).[jt]s?(x)`
- Ignore: `/node_modules/`, `/e2e/`, `/.next/`

### Coverage Exclusions
`*.d.ts`, `*.stories.*`, `layout.tsx`, `page.tsx`, `middleware.ts`, `data/backup/**`

### Commands
```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ci       # CI mode (parallel, coverage)
```

---

## playwright.config.ts

### Test Setup
```typescript
testDir: './e2e'
baseURL: 'http://localhost:3000'
fullyParallel: true
retries: process.env.CI ? 2 : 0
workers: process.env.CI ? 1 : undefined
```

### Timeouts
| Type | Duration |
|------|----------|
| Global | 60s |
| Navigation | 30s |
| Action | 15s |
| Assertion | 15s |

### Test Browsers
Desktop: Chromium, Firefox, WebKit
Mobile: Chrome (Pixel 5), Safari (iPhone 12)

### Artifacts
- Reporter: HTML
- Trace: on-first-retry
- Screenshot: only-on-failure

### Commands
```bash
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # UI mode
npm run test:e2e:debug  # Debug mode
```

---

## eslint.config.js

Flat config format (ESLint 9+).

### Extends
- `@eslint/js` recommended
- TypeScript ESLint recommended configs

### Key Rules
| Rule | Severity | Notes |
|------|----------|-------|
| `react-hooks/*` | recommended | All React hooks rules |
| `@typescript-eslint/no-unused-vars` | warn | Ignores `_`-prefixed vars |
| `@typescript-eslint/no-explicit-any` | warn | Not error |
| `prefer-const` | warn | |
| `react-refresh/only-export-components` | warn | Non-component exports |

### Ignored Paths
`dist`, `.next`, `node_modules`, `src/data/backup`

---

## postcss.config.js

```javascript
module.exports = { plugins: { '@tailwindcss/postcss': {} } }
```
Uses Tailwind CSS v4's PostCSS plugin (not the legacy `tailwindcss` plugin).

---

## next-sitemap.config.js

See `SEO-AND-METADATA.md` for full details. Key settings:
- Site URL: `https://isaacavazquez.com`
- Generates `sitemap.xml` and `sitemap-local.xml`
- Does NOT generate `robots.txt` (manually maintained in `public/`)
- Excludes `/api/*`, `/admin/*`
- Dynamic blog post discovery from `content/blog/`

---

## Config Interdependencies

```
next.config.mjs
├── tailwind.config.ts (dark mode, font vars, colors — must match globals.css)
├── netlify.toml (build command, publish dir, plugin)
├── tsconfig.json (path aliases used in imports)
└── next-sitemap.config.js (runs in postbuild)

globals.css (CSS variables)
├── tailwind.config.ts (maps CSS vars to Tailwind utilities)
└── All components (consume via var(--...))

jest.config.js
└── jest.setup.js (test environment setup)

playwright.config.ts
└── Dev server (npm run dev, port 3000)
```

---

## Gotchas

1. **`typescript.ignoreBuildErrors: true`** — TS errors don't fail the build. This is temporary.
2. **`eslint.ignoreDuringBuilds: true`** — ESLint doesn't run in CI either (implied by absence of lint step).
3. **`--webpack` flag** — Baked into `npm run dev` and `npm run build` scripts. Forces webpack over Turbopack.
4. **`better-sqlite3`** — Native module. Must be in `serverExternalPackages`. Cannot be used in client code.
5. **PostCSS plugin** — Uses `@tailwindcss/postcss` (Tailwind v4), not the older `tailwindcss` plugin.
6. **robots.txt** — Manually maintained in `public/`, NOT auto-generated by next-sitemap.
7. **Content-Type headers in netlify.toml** — Explicitly set for CSS/JS to prevent Netlify serving as `text/plain`.
