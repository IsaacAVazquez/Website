# Configuration — AI Context

Current config-file reference.

**Last updated:** 2026-06-19

---

## Primary Config Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | redirects, tracing, image config, bundling, TS build behavior |
| `tailwind.config.ts` | token-to-Tailwind mapping |
| `netlify.toml` | Netlify build and cache headers |
| `tsconfig.json` | TypeScript compiler settings |
| `jest.config.js` | Jest config |
| `playwright.config.ts` | Playwright config |
| `eslint.config.js` | ESLint flat config |
| `postcss.config.js` | PostCSS |
| `next-sitemap.config.js` | sitemap generation |

---

## `next.config.mjs`

Important current behavior:

- redirects (`async redirects()`) cover:
  - `/projects`, `/projects/:path*`, `/work` → `/portfolio`
  - legacy portfolio slugs → `/investments` and `/writing/*` case studies
  - fantasy shortcuts (`/ff`, `/rankings`, `/qb`, `/rb`, `/wr`, `/te`) and typo routes (`/fantsy-football/*`, `/fantasy-footbal/*`, `/quatrerback`)
  - `/blog`, `/blog/:slug`, `/blog/posts/:slug`, `/articles/:slug` → `/writing`
  - contact variations (`/get-in-touch`, `/hire-me`) and resume variations (`/cv`, `/resume.pdf`)
- `poweredByHeader = false`
- site-wide security headers via `async headers()` (HSTS, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control); a global CSP is still a TODO
- `compiler.removeConsole` in production
- TypeScript build errors are enforced; `npm run typecheck` also runs explicitly in CI
- `serverExternalPackages = ['better-sqlite3', 'sharp']`
- tracing excludes heavy image and investments data assets from server bundles
- image remote patterns include Unsplash and Cloudinary; `dangerouslyAllowSVG` is on with an image-scoped CSP (`script-src 'none'; sandbox`) for remote crest/logo SVGs
- `optimizePackageImports` includes `@tabler/icons-react`, `lucide-react`, and `framer-motion`; `experimental.scrollRestoration` is enabled

If you update routes or package behavior, this file is one of the first places to check.

---

## `tailwind.config.ts`

Key facts:

- dark mode is class-based
- fonts map to Inter and JetBrains Mono variables from `layout.tsx`; the editorial system also uses Instrument Sans and Instrument Serif through globals
- colors, spacing, border colors, and shadows map to CSS variables from `globals.css`, with `--home-*` as the current palette
- 44px touch helpers are defined here

---

## `netlify.toml`

Current facts:

- build command runs `npm run build` plus cleanup of large artifacts
- publish directory is `.next`
- Netlify Next plugin is enabled
- custom cache headers are defined for Next static assets and investment data assets

---

## `tsconfig.json`

Important facts:

- `strict: true`
- `noEmit: true`
- `target: es2022`; `module: esnext`; `moduleResolution: bundler`
- path alias: `@/* -> ./src/*`
- excludes `node_modules` and `src/data/backup/**/*`

---

## Testing Config

### `jest.config.js`

- jsdom environment
- coverage thresholds: 20 / 25 / 25 / 25
- ignores `e2e/`

### `playwright.config.ts`

- starts local dev server via `npm run dev`
- desktop and mobile projects are configured
- HTML reporter enabled

---

## `next-sitemap.config.js`

Current priorities include:

- `/`
- `/portfolio`
- `/about`
- `/resume`
- `/investments`
- `/march-madness-2026`
- `/contact`
- `/writing`
- fantasy football routes

Posts are discovered from `content/blog/`.

---

## Build Steps (`package.json`)

- `typecheck`: `tsc --noEmit --pretty false` — standalone CI type gate
- `build`: `next build --webpack`
- `postbuild`: `next-sitemap && node scripts/patch-nft-sharp.mjs` — regenerates the sitemap, then patches the function bundle so the optional `sharp` native module never ships
- `dev` and `build` both pass `--webpack` (Turbopack is not used)

---

## Middleware

There is no `middleware.ts` in the repo. All redirects (including `/blog` -> `/writing`) are declared in `next.config.mjs` via `async redirects()`. Security headers are likewise applied through `next.config.mjs` `async headers()`, not a middleware layer.
