# Configuration — AI Context

Current config-file reference.

**Last updated:** 2026-09-21

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
| `eslint.config.mjs` | ESLint flat config |
| `postcss.config.js` | PostCSS |
| `src/lib/sitemap.js` + `scripts/generatePublicSitemap.mjs` | sitemap route list and the `postbuild` generator that writes `public/sitemap.xml` |
| `src/proxy.ts` | Next.js proxy that sets the enforcing CSP and other security headers on HTML routes |

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
- site-wide security headers via `async headers()` (HSTS, X-Content-Type-Options, X-Frame-Options SAMEORIGIN, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control) plus a `Content-Security-Policy-Report-Only` header; the enforcing CSP is set in `src/proxy.ts`
- `compiler.removeConsole` in production
- TypeScript build errors are enforced; `npm run typecheck` also runs explicitly in CI
- `serverExternalPackages = ['better-sqlite3', 'sharp']`
- tracing excludes heavy image and investments data assets from server bundles
- image remote patterns include Unsplash and Cloudinary; `dangerouslyAllowSVG` is on with an image-scoped CSP (`script-src 'none'; sandbox`) for remote crest/logo SVGs
- `optimizePackageImports` includes `lucide-react` and `framer-motion`; `experimental.scrollRestoration` is enabled

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
- global coverage thresholds: branches 52, functions 62, lines 66, statements 65
- ignores `e2e/`

### `playwright.config.ts`

- starts the server via `npm run dev` locally and `npm run start` in CI
- desktop and mobile projects are configured
- HTML reporter enabled

---

## Sitemap (`src/lib/sitemap.js`)

There is no `next-sitemap.config.js` and `next-sitemap` is not a dependency. `src/lib/sitemap.js` exports `PUBLIC_SITEMAP_ENTRIES`, and `scripts/generatePublicSitemap.mjs` writes `public/sitemap.xml` from it during `postbuild`. Routes it should cover include:

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
- `postbuild`: `npm run generate:sitemap && node scripts/patch-nft-sharp.mjs` regenerates the sitemap, then patches the function bundle so the optional `sharp` native module never ships
- `dev` and `build` both pass `--webpack` (Turbopack is not used)

---

## Middleware

There is no `middleware.ts`, but `src/proxy.ts` is the Next.js 16 equivalent. It sets the enforcing `Content-Security-Policy` and the other security headers on HTML routes, widens the CSP for Google Analytics only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is a valid ID, sets `Netlify-CDN-Cache-Control: no-store`, and redirects `/blog` and `/blog/*` to `/writing`. The rest of the redirects are declared in `next.config.mjs` via `async redirects()`, and `async headers()` there adds a second set of security headers.
