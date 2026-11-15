# Configuration — AI Context

Current config-file reference.

**Last updated:** 2026-11-02

---

## Primary Config Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | redirects, security and CDN cache headers, tracing, image config, bundling, TS build behavior |
| `tailwind.config.ts` | token-to-Tailwind mapping |
| `netlify.toml` | Netlify build, ignore command, functions, and cache headers |
| `tsconfig.json` | TypeScript compiler settings |
| `jest.config.js` | Jest config |
| `playwright.config.ts` | Playwright config |
| `eslint.config.mjs` | ESLint flat config |
| `postcss.config.js` | PostCSS |
| `src/lib/sitemap.js` + `scripts/generatePublicSitemap.mjs` | sitemap route list and the `postbuild` generator that writes `public/sitemap.xml` |
| `src/proxy.ts` | Next.js proxy that sets the enforcing CSP and other security headers on HTML routes |
| `.nvmrc` | Node major version (`22`) that every workflow installing Node reads through `node-version-file`; `package.json` `engines` asks for `>=22.12.0` |

---

## `next.config.mjs`

Important current behavior:

- redirects (`async redirects()`) cover:
  - `/projects` and `/work` → `/portfolio`, and `/projects/:path*` → `/portfolio/:path*`
  - retired portfolio slugs, under both `/projects/` and `/portfolio/`, → `/investments` and `/writing/*` case studies
  - fantasy shortcuts (`/ff`, `/rankings`, `/qb`, `/rb`, `/wr`, `/te`), the retired tier pages (`/fantasy-football/rb-tiers`, `/fantasy-football/tiers/:position`), and typo routes (`/fantsy-football/*`, `/fantasy-footbal/*`, `/quatrerback`)
  - `/blog`, `/blog/:slug`, `/blog/posts/:slug`, `/blog/:path+`, and `/articles/:slug` → `/writing` or the matching `/writing/:slug`
  - `/fintech-tools` → `/dashboards` and `/release-notes` → `/changelog`
  - the feed aliases (`/rss`, `/feed`, `/feed.xml`, `/rss.xml`) → `/api/rss`
  - contact variations (`/get-in-touch`, `/hire-me`) and resume variations (`/cv`, `/resume.pdf`)
- `poweredByHeader = false`
- `env.DEPLOYMENT_COMMIT` is inlined at build so `/api/data-revisions` can report the commit the deploy came from. `publish-data.yml` sets it, and it is empty everywhere else
- site-wide security headers via `async headers()` (HSTS, X-Content-Type-Options, X-Frame-Options SAMEORIGIN, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control) plus a `Content-Security-Policy-Report-Only` header; the enforcing CSP is set in `src/proxy.ts`. Permissions-Policy turns the camera and the microphone off and allows geolocation for the site itself on every route. The one caller is the Nearest station button on `/bay-area-transit`, and the allowance is site-wide because the policy belongs to the document, so a visitor who lands on another page and follows an in-app link to the transit page keeps the policy of the page they landed on. The geolocation allowance is set in both `headers()` and `src/proxy.ts` (the `headers()` value also carries `interest-cohort=()`), and `src/__tests__/proxy.test.ts` holds the two together
- `headers()` also sends `Netlify-CDN-Cache-Control: public, durable, s-maxage=21600, stale-while-revalidate=86400` and `Netlify-Vary: query` to each path in `cdnCachedPages`, the pages that render per request only because they read `searchParams`. `src/lib/__tests__/edge-cache-policy.test.ts` checks that list
- `compiler.removeConsole` in production, keeping `console.error` and `console.warn`
- TypeScript build errors are enforced; `npm run typecheck` also runs explicitly in CI
- `serverExternalPackages = ['better-sqlite3', 'sharp']`
- tracing excludes `sharp`, its `@img/*` binaries, and `public/data/investments/**` from server bundles
- in production builds the webpack `snapshot` settings check modules and dependencies by content hash instead of timestamp, because Next's bundled webpack crashes on warm builds when a cached context has timestamps but no hash
- image remote patterns include Unsplash and Cloudinary; `dangerouslyAllowSVG` is on with an image-scoped CSP (`script-src 'none'; sandbox`) for remote crest/logo SVGs
- `optimizePackageImports` includes `lucide-react` and `d3`; `experimental.scrollRestoration` is enabled

If you update routes or package behavior, this file is one of the first places to check.

---

## `tailwind.config.ts`

Key facts:

- dark mode is class-based
- `font-sans` and `font-mono` map to the Instrument Sans and Fragment Mono variables from `layout.tsx`; Catalog 97 components use the `--c97-font-*` tokens instead
- font sizes map to the fluid `--text-*` scale in `globals.css`, and the radius and shadow scales compile to `0` and `none`; colours are not mapped, since components read the `--c97-*` tokens
- 44px touch helpers are defined here

---

## `netlify.toml`

Current facts:

- build command runs `npm run build` plus cleanup of large artifacts
- publish directory is `.next`
- the `ignore` command runs `scripts/ci/netlify-ignore.sh`, which cancels Netlify's own builds of `main` and `dependabot/*` branches, since `publish-data.yml` builds production in GitHub Actions
- `[functions]` points at `netlify/functions/` and packages `public/data/investments/**` with the functions through `included_files`
- `[build.environment]` sets the secrets-scan omit paths and keys
- Netlify Next plugin is enabled
- custom cache headers are defined for Next static assets and for the investments and fantasy data assets, and the CSS and JS chunk rules also pin their `Content-Type`

---

## `tsconfig.json`

Important facts:

- `strict: true`
- `noEmit: true`
- `target: es2022`; `module: esnext`; `moduleResolution: bundler`
- path alias: `@/* -> ./src/*`
- excludes `node_modules`

---

## Testing Config

### `jest.config.js`

- jsdom environment
- global coverage thresholds: branches 52, functions 62, lines 66, statements 65
- ignores `e2e/`, `__tests__/fixtures/`, `.next/`, and the worktree clones under `.claude/` and `.worktrees/`

### `playwright.config.ts`

- starts the server via `npm run dev` locally and `npm run start` in CI
- desktop and mobile projects are configured, and only `chromium` runs unless `E2E_FULL_MATRIX=1` (`npm run test:e2e:full`)
- HTML reporter enabled, plus the list reporter in CI

---

## Sitemap (`src/lib/sitemap.js`)

There is no `next-sitemap.config.js` and `next-sitemap` is not a dependency. `src/lib/sitemap.js` exports `PUBLIC_SITEMAP_ENTRIES`, and `scripts/generatePublicSitemap.mjs` writes `public/sitemap.xml` from it during `postbuild`, prefixing each path with `SITE_URL` (default `https://isaacvazquez.com`). The route list comes from a walk of every `src/app/**/page.tsx` that skips `api/`, `_`-prefixed folders, dynamic segments, and pages that mark themselves noindex or only redirect, so it covers routes such as:

- `/`
- `/portfolio`
- `/about`
- `/resume`
- `/investments`
- `/march-madness-2026`
- `/contact`
- `/writing`
- fantasy football routes

Writing topic pages come from `BLOG_TOPIC_PAGES` in `src/lib/blog-config.ts`, portfolio case studies from `caseStudiesData` in `src/constants/caseStudies.ts`, and posts from `content/blog/`, leaving out any post whose `publishedAt` is still in the future. A static route with no row in `STATIC_ROUTE_LASTMOD` carries the build date and a build warning.

`public/sitemap.xml` is committed. `scripts/ci/commit-and-push-snapshot.sh` also regenerates it when a refresh workflow commits a snapshot, and `src/lib/__tests__/sitemap-consistency.test.ts` fails when the committed file drifts from the route list.

---

## Build Steps (`package.json`)

- `typecheck`: `tsc --noEmit --pretty false` — standalone CI type gate
- `build`: `next build --webpack`
- `postbuild`: `npm run generate:sitemap && npm run build:llms && node scripts/patch-nft-sharp.mjs` regenerates the sitemap, writes `public/llms-full.txt` through `scripts/buildLlmsFull.mjs`, then patches the function bundle so the optional `sharp` native module never ships
- `build` passes `--webpack`, and `dev` runs `scripts/dev.cjs`, which starts `next dev --webpack` bound to `localhost` (Turbopack is not used)
- `analyze` (`ANALYZE=true npm run build`, which still runs `postbuild`) and `build:analyze` (`ANALYZE=true next build --webpack`, which does not) add `webpack-bundle-analyzer` to the build

---

## Middleware

There is no `middleware.ts`, but `src/proxy.ts` is the Next.js 16 equivalent. Its matcher admits every path except `_next/static`, `_next/image`, `favicon.ico`, and `api/`. It sets the enforcing `Content-Security-Policy` and the other security headers, widens the CSP for Google Analytics only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is a valid ID, and sets `Netlify-CDN-Cache-Control: no-store`. On Netlify the proxy runs in front of the CDN cache, so that header reaches the browser and does not decide what the cache stores. Prerendered pages are served from the cache with it set, and the pages in `cdnCachedPages` in `next.config.mjs` ask to be cached through headers of their own. The proxy issues no redirects. Its `/blog` and `/blog/*` redirects were removed on 2026-09-24, because on Netlify the proxy answers before the `next.config.mjs` rules and would turn their permanent redirects into temporary ones, and `src/__tests__/proxy.test.ts` checks that a `/blog` URL passes through. Every redirect is declared in `next.config.mjs` via `async redirects()`, and `async headers()` there adds a second set of security headers.
