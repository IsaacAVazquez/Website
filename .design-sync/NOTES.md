# design-sync notes — isaac-vazquez-portfolio

- Package manager is npm (`npm ci`). `yarn.lock` also exists but is a dependabot artifact — all CI workflows use npm. Never yarn-install here.
- This is a Next.js app, not a component library: no `dist/`, no library build, no `main`/`module` in package.json. The bundle entry is the hand-curated barrel `.design-sync/ds-entry.ts` (ui/ + editorial/ + football/ layers + PreviewProvider), passed to the converter via `--entry .design-sync/ds-entry.ts`. A new DS component must be added there AND in `componentSrcMap`.
- No `buildCmd`: `npm run build` builds the site, not a library. The barrel compiles straight from `src/` via the repo tsconfig (`@/*` alias → `cfg.tsconfig`).
- CSS is Tailwind v4 (`@import "tailwindcss"` + `@config "../../tailwind.config.ts"` inside `src/app/globals.css`; the config sets darkMode "class" and custom scales — do not drop the @config resolution). `cssEntry` is a generated cache file, not committed. Regenerate before every build/re-sync:
  `./.ds-sync/node_modules/.bin/tailwindcss -i src/app/globals.css -o .design-sync/.cache/compiled-globals.css` (run from repo root; `@tailwindcss/cli` lives in `.ds-sync`, installed by the sync setup).
- Fonts: the site loads Instrument Sans / Instrument Serif / Fragment Mono via `next/font/google`, which defines `--font-instrument-sans` / `--font-instrument-serif` / `--font-fragment-mono` at runtime (globals.css aliases all legacy font vars to these three). next/font emits no @font-face we can scrape, so `.design-sync/fonts/fonts.css` hand-declares @font-face over latin woff2s (pulled from Google Fonts 2026-07-20) plus the `:root` var mapping; wired via `extraFonts`.
- Provider: `.design-sync/preview-support.tsx` exports `PreviewProvider` = next-themes ThemeProvider (attribute "class", defaultTheme light, enableSystem false) + AppRouterContext no-op stub (ModernButton/AuthorBio render next/link) + ImageConfigContext with `unoptimized: true` (next/image users: OptimizedImage, JourneyTimeline, AuthorBio). It is exported from the barrel so the provider check finds it in the bundle.
- Playwright render check: repo pins playwright-core 1.61.1 → chromium build 1228, already in `~/Library/Caches/ms-playwright`. No install needed.
- At-risk previews: JourneyTimeline (takes no props; hardcoded `/images/*` logo paths will 404 inside cards) and AuthorBio (headshot path). Decide data-URI vs neutralize at preview authoring.
- `process-shim.ts` (first import of the barrel — order is load-bearing) does three jobs: (1) defines `globalThis.process` because bundled next/link + next/image internals read `process.env.__NEXT_*` at runtime; (2) under capture origins (localhost/file) answers the reduced-motion media query with true; (3) under capture origins, runs a per-frame sweeper that `finish()`es every running WAAPI animation and feeds rAF callbacks a synthetic +10s/frame timeline. Reason: the capture harness freezes the page clock (`page.clock.setFixedTime`), which strands Framer entrances at opacity 0 — framer starts WAAPI animations without `.play()`, so only a `document.getAnimations()` sweeper catches them. Don't "simplify" any of the three without re-running a frozen-clock probe (`.design-sync/.cache/probe3.mjs` pattern).
- Tailwind utility classes used ONLY in `.design-sync/previews/*.tsx` compile into the CSS because Tailwind v4 auto-content-detection scans the whole repo (previews/ is committed, not gitignored). Regenerate `compiled-globals.css` after authoring previews that introduce new utilities, then rebuild.

## Preview-authoring patterns (folded from wave batches, 2026-07-20)

- Capture geometry: card content is ~520 CSS px wide and the `sm`/`md` Tailwind breakpoints are ACTIVE at capture, so responsive grid stories genuinely render multi-column. Review-sheet cells clip silently past ~530px of content height (per-component pages ~725px) — budget tall compositions accordingly (2 FixtureCards max per section story, ClubDrawer frame ≤700px, six-level Heading ladder needs short titles).
- Open Radix overlays: `open modal={false}` is load-bearing (default modal aria-hides sibling cells); wrap in a minHeight div so the portaled popper lands inside the cell.
- Fixed-position overlays (ClubDrawer): wrap in `position: relative; height ≤700px; overflow: hidden; transform: translateZ(0)` — the transform makes the frame the containing block so the drawer renders inside the card. Captured bare it escapes and would need a viewport/cardMode override.
- Icons in previews: only `isaac-vazquez-portfolio` + `react` are importable — hand-drawn inline `<svg stroke="currentColor">` reproduces the site icon treatment (picks up --home-signal / --home-ink-muted correctly).
- Determinism flags: `MetricCallout animateValue={false}`, `OptimizedImage lazy={false}`; OptimizedImage's error state fires deterministically with an invalid base64 data URI. Images always via SVG data URIs, never `/images/*`.
- `--home-dark-ink` is the ink-for-dark-surfaces token and is LIGHT in light mode — CrestAvatar's light crest circle is production-correct, don't "fix" it.
- ThemeToggle renders only its light face (provider pins light theme); dark face deliberately unpreviewable.
- JourneyTimeline: no props, content from `src/constants/personal.ts` with hardcoded `/images/logos/*` (404 in cards) and a ~2500px render. Preview exists but is graded needs-work; pending user decision (floor card vs accept). Not fixable preview-side.

## Component nits observed during preview authoring (for a DS-owner design pass, not sync blockers)

- StatFascia truncates longer eyebrows at ClubDrawer's 27rem width ("GOALS AGAI…").
- SegmentedTabs' wrapped rows expose rule-colored filler blocks where a row doesn't fill (side effect of the fused-hairline gap-px technique).
- GoalsPulseStrip's caption row wraps to two lines at the site's own w-44 wrapper when capLabel is present.
- MetricCard compact labels don't truncate; two-word labels wrap at 3-up and stagger value baselines.

## Component prop contracts (dtsPropsFor) — regenerate before every build

This is a Next.js app, not a component library: it ships no built `.d.ts` tree and no package `main`/`module`, so the converter's own ts-morph extraction collapses every `<Name>Props` to the degenerate `[key: string]: unknown`. Real contracts are recovered by `.design-sync/gen-contracts.mjs` (committed), which emits declarations from source (via the repo tsconfig so `@/*` resolves), then serializes each component's props with every non-React domain type (`GenericFixture`, `StatFasciaItem`, …) expanded to its structural shape, and writes the result into `cfg.dtsPropsFor`. Run it from the repo root BEFORE `package-build` whenever a component's prop API may have changed:

  node .design-sync/gen-contracts.mjs

It depends on ts-morph (in `.ds-sync/node_modules`, recreated by sync setup) and the repo's own `node_modules/.bin/tsc`. It regenerates `dist/types/` and a repo-root `index.d.ts` barrel (both gitignored). `dtsPropsFor` in config.json is a GENERATED artifact — do not hand-edit it; edit the component source and re-run the script. The bundle build itself uses `ds-entry.ts` and is independent of this; `dist/types`/`index.d.ts` are only inputs to contract generation, but keep `dist/types` present at build time so the converter's `findTypesRoot` resolves to it (scoped, fast) instead of globbing `.next/`.

## Re-sync risks

- `compiled-globals.css` is a gitignored cache — a fresh clone must regenerate it (command above) before building, or validate fails on the CSS tags.
- Font woff2s are pinned from Google Fonts as of 2026-07-20. If the type stack in `src/app/layout.tsx` changes, `fonts.css` and the woff2s must be re-pulled by hand — nothing will flag it automatically.
- `ds-entry.ts` + `componentSrcMap` are a hand-curated allowlist. New components under `src/components/{ui,editorial,football}` are NOT picked up automatically; check `ds-entry.ts`, `componentSrcMap`, AND re-run `gen-contracts.mjs` when the DS grows.
- `dtsPropsFor` is regenerated by `gen-contracts.mjs` from source. If a component's props change and the script isn't re-run, the uploaded contract silently goes stale. It is a generated block — never hand-edit.
- JourneyTimeline can't be previewed portably: it takes no props, pulls content from `src/constants/personal.ts`, and hardcodes `/images/logos/*` paths that 404 outside the app. Its preview is graded needs-work by design; pending Isaac's call (accept as floor-ish, or refactor the component to accept a data prop — a source change beyond sync scope).
