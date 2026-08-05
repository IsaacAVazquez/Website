# design-sync notes — isaac-vazquez-portfolio

- Package manager is npm (`npm ci`). `yarn.lock` also exists but is a dependabot artifact — all CI workflows use npm. Never yarn-install here.
- This is a Next.js app, not a component library: no `dist/`, no library build, no `main`/`module` in package.json. The bundle entry is the hand-curated barrel `.design-sync/ds-entry.ts` (ui/ + editorial/ + football/ layers + PreviewProvider), passed to the converter via `--entry .design-sync/ds-entry.ts`. A new DS component must be added there AND in `componentSrcMap`.
- No `buildCmd`: `npm run build` builds the site, not a library. The barrel compiles straight from `src/` via the repo tsconfig (`@/*` alias → `cfg.tsconfig`).
- CSS is Tailwind v4 (`@import "tailwindcss"` + `@config "../../tailwind.config.ts"` inside `src/app/globals.css`; the config sets darkMode "class" and custom scales — do not drop the @config resolution). `cssEntry` is a generated cache file, not committed. Regenerate before every build/re-sync:
  `./.ds-sync/node_modules/.bin/tailwindcss -i src/app/globals.css -o .design-sync/.cache/compiled-globals.css` (run from repo root; `@tailwindcss/cli` lives in `.ds-sync`, installed by the sync setup).
- Fonts: the site loads Instrument Sans / Instrument Serif / Fragment Mono via `next/font/google`, which defines `--font-instrument-sans` / `--font-instrument-serif` / `--font-fragment-mono` at runtime (globals.css aliases all legacy font vars to these three). next/font emits no @font-face we can scrape, so `.design-sync/fonts/fonts.css` hand-declares @font-face over latin woff2s (pulled from Google Fonts 2026-07-20), wired via `extraFonts`.
  - `extraFonts` lifts @font-face rules ONLY. `extractFonts()` (`.ds-sync/lib/css.mjs:30`) iterates `@font-face` blocks and discards everything else in the file, so the trailing `:root` var mapping in `fonts.css` does NOT ship. It is kept as documentation of the intended stack, nothing more. Never rely on an `extraFonts` file to define a custom property.
  - Because of that, the three `--font-instrument-*` vars are undefined inside the bundle. Every consumer therefore carries an in-`var()` fallback naming the family directly (`globals.css` ~L87-97 aliases, `tailwind.config.ts` `fontFamily.sans`/`.mono`), so `.font-sans` resolves to the shipped "Instrument Sans" face instead of going invalid-at-computed-value and falling back to inherited. On the site next/font defines the vars, so the fallbacks never fire and production is unchanged. Fixed 2026-07-31; before that the DS pane rendered every preview in the pane's inherited font while shipping three unused woff2s. `[TOKENS_MISSING]` had flagged the three as "referenced but not defined" but stayed under its `> 3` warn threshold, so validate passed silently.
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
- JourneyTimeline: RESOLVED 2026-07-30. Was unpreviewable (no props, content from `src/constants/personal.ts`, hardcoded `/images/logos/*` that 404 in cards, ~2500px render). Isaac approved a source refactor: it now takes an optional `items?: JourneyTimelineItem[]` defaulting to `careerTimeline`, so `About.tsx`'s zero-prop call is unchanged while previews inject portable data. Preview passes 2 entries per cell with SVG data-URI logos; both cells grade good. `logo` is optional on the item type, so the `IconFallback` cell exercises `renderTimelineIcon` (Florida State → IconSchool, Berkeley/Haas → IconRocket).

## Component nits observed during preview authoring (for a DS-owner design pass, not sync blockers)

- StatFascia truncates longer eyebrows at ClubDrawer's 27rem width ("GOALS AGAI…").
- SegmentedTabs' wrapped rows expose rule-colored filler blocks where a row doesn't fill (side effect of the fused-hairline gap-px technique).
- GoalsPulseStrip's caption row wraps to two lines at the site's own w-44 wrapper when capLabel is present.
- MetricCard compact labels don't truncate; two-word labels wrap at 3-up and stagger value baselines.

## Component prop contracts (dtsPropsFor) — regenerate before every build

This is a Next.js app, not a component library: it ships no built `.d.ts` tree and no package `main`/`module`, so the converter's own ts-morph extraction collapses every `<Name>Props` to the degenerate `[key: string]: unknown`. Real contracts are recovered by `.design-sync/gen-contracts.mjs` (committed), which emits declarations from source (via the repo tsconfig so `@/*` resolves), then serializes each component's props with every non-React domain type (`GenericFixture`, `StatFasciaItem`, …) expanded to its structural shape, and writes the result into `cfg.dtsPropsFor`. Run it from the repo root BEFORE `package-build` whenever a component's prop API may have changed:

  node .design-sync/gen-contracts.mjs

It depends on ts-morph (in `.ds-sync/node_modules`, recreated by sync setup) and the repo's own `node_modules/.bin/tsc`. It regenerates `dist/types/` and a repo-root `index.d.ts` barrel (both gitignored). `dtsPropsFor` in config.json is a GENERATED artifact — do not hand-edit it; edit the component source and re-run the script. The bundle build itself uses `ds-entry.ts` and is independent of this; `dist/types`/`index.d.ts` are only inputs to contract generation, but keep `dist/types` present at build time so the converter's `findTypesRoot` resolves to it (scoped, fast) instead of globbing `.next/`.

## Known render warns (accepted, and re-syncs should NOT re-chase these)

Both appeared for the first time on the 2026-08-03 re-sync and were triaged and accepted, not fixed. Both have the same single root cause, which is that `src/app/globals.css` `@import`s `src/app/catalog97.css`, so the Catalog 97 visual world rides into `cssEntry` and therefore into `_ds_bundle.css`. Catalog 97 governs seven routes (`/`, `/portfolio`, `/writing`, `/dashboards`, `/about`, `/resume`, `/contact`) and is a different design system from The Working Instrument, which is what this project syncs.

- `[TOKENS_MISSING] 4 CSS custom properties referenced but not defined` — `--font-c97-archivo`, `--font-c97-newsreader`, `--font-c97-anton`, `--font-c97-great-vibes`.
- `[FONT_MISSING] "Impact", "Snell Roundhand" (--c97-font-script), "Petit Formal Script" (--c97-font-script)`.

Why accepted rather than resolved. The families are referenced only by `.c97-*` rules, and no component in this DS references `c97` at all (verified: `grep -rl c97 src/components/{ui,editorial,football}` returns nothing). So the usual `[FONT_MISSING]` consequence, every design built with the DS rendering in a fallback font, cannot happen here, because nothing the design agent can compose reaches those rules. The `.c97-*` rules are also inert without a `[data-c97]` ancestor, which the bundle never emits. Measured cost of carrying it on 2026-08-03: 337 of 10,277 lines in the 294 KB `_ds_bundle.css` (~3.3%), 43 `--c97-*` token declarations, 37 `.c97-*` selectors.

Isaac was offered the alternative on 2026-08-03 (compile the DS's CSS from an entry that omits the catalog97 import, removing both warns and the dead ~3%) and chose to ship as-is. Revisit only if Catalog 97 grows enough that the dead weight matters, or if a DS component ever starts consuming a `c97` token, at which point the two worlds have merged and this note is wrong.

## Reading Isaac's own design work back out of the project (2026-08-03)

The project holds design work authored in claude.ai/design alongside the synced
bundle. Two formats, and only one of them is worth fetching.

- The four root `Catalog 97 *.html` files are **viewer bundles, not source**.
  Each is ~256 KB and is a loader stub plus a base64 PNG thumbnail; the actual
  design is fetched by the loader at runtime. Grepping one for the design's own
  vocabulary (Anton, pine, chocolate, wordmark) returns zero hits. `get_file`
  caps at 256 KiB, so they also sit right at the limit. Do not pull them to diff
  against code.
- `templates/catalog-pages/*.dc.html` **are** readable authored source, and are
  what you want. Nine files: one per Catalog 97 route plus `SiteHeader` and
  `SiteFooter`. Hand-written HTML with inline styles, a shared `:root` palette
  block repeated in each file, and a `<script type="text/x-dc">` block holding a
  `DCLogic` subclass for interactive bits. `SiteHeader.dc.html` is ~7 KB and
  carries the full token block, so it alone is enough to verify the palette and
  the whole type/spacing scale.

The design's canonical palette names, which `catalog97.css` deliberately does
not mirror (it uses a per-surface `--c97-ink`/`-ink-2`/`-label`/`-action`/
`-accent` contract instead, so dark mode is one override rather than a
per-component edit): paper `#F1EBDF`, bone `#E4DBC9`, stone `#A79E8F`,
muted-ink `#645E55`, camel `#C09461`, tobacco `#8A6642`, chocolate `#4A3728`,
espresso `#2B211A`, pine `#0D3531`, sage `#99A88B`, oxblood `#6E2B36`,
navy `#1F2A38`, ochre `#C08A38`, brick `#A8553C`.

Verified 2026-08-03: every scale token in `catalog97.css` (7 spacing steps, 9
type steps, 4 line-heights, 3 measures, container, gutter) matches the source
exactly. The palette matches too, with two documented contrast deviations on
`--c97-action` (paper/bone and camel), both carrying their measured ratios in a
comment. navy, ochre, and brick are unused in the implementation; navy appears
in the source only as a card image backdrop.

## `gen-contracts.mjs` flattens discriminated unions (found 2026-08-03)

The uploaded contract for `ModernButton` is wrong, and the same will be true of
any component typed as a union. `ModernButtonProps` is
`ModernButtonAsButton | ModernButtonAsLink`, and each member extends
`ButtonHTMLAttributes` / `AnchorHTMLAttributes` with `Omit`. The serializer
collapses that to the nine props both members declare and drops every native
HTML attribute, so the published contract says `<ModernButton>` accepts no
`onClick`, `type`, `disabled`, `target`, or `rel`. The component accepts and
forwards all of them, and real call sites use them.

What that means is a design built in claude.ai/design against this contract
will be told those props do not exist. Worth fixing in the serializer if a
design ever needs an interactive ModernButton. Nothing in the repo is broken by
it, since TypeScript enforces the real union locally.

The ported lint rules (`eslint.ds-adherence.mjs`) work around it with a
`SPREADS_DOM_PROPS` set that skips the undeclared-prop check for such
components while keeping their variant and size enum checks.

## Re-sync risks

- `compiled-globals.css` is a gitignored cache — a fresh clone must regenerate it (command above) before building, or validate fails on the CSS tags.
- Font woff2s are pinned from Google Fonts as of 2026-07-20. If the type stack in `src/app/layout.tsx` changes, `fonts.css` and the woff2s must be re-pulled by hand — nothing will flag it automatically.
- `ds-entry.ts` + `componentSrcMap` are a hand-curated allowlist. New components under `src/components/{ui,editorial,football}` are NOT picked up automatically; check `ds-entry.ts`, `componentSrcMap`, AND re-run `gen-contracts.mjs` when the DS grows.
- `dtsPropsFor` is regenerated by `gen-contracts.mjs` from source. If a component's props change and the script isn't re-run, the uploaded contract silently goes stale. It is a generated block — never hand-edit.
- JourneyTimeline now has an `items` prop (see the resolved entry above). The default is still `careerTimeline`, so if that constant gains entries the site picks them up automatically but the preview will not, since the preview passes its own 2 entries. That is intentional (cell height budget), not drift to fix.
- The project holds Isaac's own design work alongside the synced bundle, and a sync must never delete it. As of 2026-08-03 `list_files` also returns `templates/catalog-97/`, `templates/catalog-pages/`, `templates/harbor-light/`, `uploads/*.png`, and four root `Catalog 97 *.html` files. None of that comes from this repo; it was authored in claude.ai/design. The anchored path is safe by construction, because `deletePaths` only ever names files the sync itself produced, and it was empty on 2026-08-03. The danger is the no-anchor path, because if the anchor is ever lost and the project is re-adopted, the skill asks you to review `list_files` for "files this build doesn't produce" and put them in the plan's deletes. Doing that literally would destroy every file listed above. Review that list against this bullet and delete nothing outside `components/`, `_preview/`, `tokens/`, `fonts/`, `guidelines/`, and the root `_ds_*` / `styles.css` / `README.md` set.
- The 2026-08-03 re-sync uploaded styling only. `upload.bundle` was false, `upload.components` and `upload.deletePaths` were both empty, and all 39 components came back unchanged with grades carried forward at zero cost. That is the expected shape whenever only `globals.css`, or anything it `@import`s, moves. Nothing needed grading, so `package-capture.mjs` correctly reported `capture skipped — no capturable changed or added components`.
- The Claude Design project was deleted server-side between the 2026-07-21 sync and 2026-07-30. The old id (f4a2b881-7dae-4667-b2bd-c5a938909087) is dead; the current project is "Working Instrument Design System" (00466307-2745-4bc3-b1fc-7af6cadd0349). If a future `get_project` 404s again, the recovery is cheap: local grades in `.design-sync/.cache/review/` carry forward off sources, not off the remote anchor, so a fresh project only costs a rebuild plus re-upload, not re-authoring.
