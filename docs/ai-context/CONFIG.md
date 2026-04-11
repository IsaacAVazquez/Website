# Configuration — AI Context

Current config-file reference.

**Last updated:** 2026-04-10

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

- redirects for `/projects`, `/work`, `/blog`, fantasy shortcuts, and typo routes
- `typescript.ignoreBuildErrors = true`
- `serverExternalPackages = ['better-sqlite3', 'sharp']`
- tracing excludes heavy image and investments data assets from server bundles
- image remote patterns include Unsplash and Cloudinary
- `optimizePackageImports` includes `@tabler/icons-react`, `lucide-react`, and `framer-motion`

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
- `module` and `moduleResolution` are `node16`
- path alias: `@/* -> ./src/*`
- excludes `src/data/backup/**/*`

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

## Middleware

`middleware.ts` only handles `/blog` -> `/writing` redirect coverage. It is not a broad security middleware layer.
