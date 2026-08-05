---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Home surface brief (superseded pointer)

**Read `.impeccable/surfaces/route.md` instead.** That brief is the live one for this surface. This file exists because `src/app/page.tsx` is still a valid target name and would otherwise resolve to the stale Atlas brief that this replaces.

**What changed.** `/` moved from The Working Instrument to Catalog 97 and now renders `Catalog97Home`. `HomeInstrument.tsx` is deleted. The Atlas direction, `TERRITORY`, `PROJECT_PLOTS`, and the 2026-08-02 cartography ruling all went with it. The route carries no map. Do not apply any of that to the current page; the prior record is kept in git history rather than here.

**Visual world: Catalog 97, not Working Instrument.** `DESIGN.md` describes The Working Instrument and governs the other ~40 routes, not this one. `context.mjs` loads it anyway, so a pass that treats it as the spec here will read every deliberate Catalog 97 decision as a violation and manufacture false findings. Tokens live in `src/app/catalog97.css`.

**Do not re-litigate.** Tobacco is large-text-only (`--c97-fs-h2` floor, 4.36:1 paper ink). Anton draws numerals at `--c97-fs-plate` only. The type, spacing, line-height and measure scales are frozen. Every `--c97-*` is declared under `[data-c97]` or `[data-c97-surface]`, never a class. Image slots are flat Stone or Tobacco fields by design, not missing assets. The h1 wording is a test anchor.

**Verified state.** 0 contrast failures across 2774 text nodes in both themes. Zero shadows, zero radii above 2px, zero off-palette hex in components. One `aria-current` per route.

**Commands worth running.** `critique` and `audit` to find, then only what the findings name, then `polish`. Never `document` here.

**Settled 2026-08-02 (critique, degraded single-context).** The anchor reset is `:where(.c97-page) a`, not `.c97-page a`. At `.c97-page a` it scored (0,1,1) and outranked every single-class component rule, so each `.c97-btn` rendered as a `<Link>` discarded its own `color: var(--c97-surface)` and inherited the band ink instead. Measured live: "See the work" was espresso on chocolate at 1.4:1, and `.c97-btn-invert`, whose background is `--c97-ink`, was heading for 1:1 invisible text on six routes. All 13 buttons on the site are anchors, so all 13 were affected. Static token-math audits miss this because they read the declared rule rather than the winning cascade. Do not raise the `:where()` back to a plain class, and re-measure buttons in a browser after any change to the anchor reset.

**Settled 2026-08-02 (mobile pass).** The header wordmark carries `.c97-brand`, which applies the same padding-plus-negative-margin hit target as `.c97-microlink`. At 390px it measured a 23px tap target before this, under the 44px floor the rest of the site holds; it is 55px now. Dark mode is verified live rather than by token math: all eight surfaces render their derived dark values and both themes measure zero contrast failures. When re-measuring after a theme toggle, wait a tick before reading computed styles — reading in the same synchronous block returns the pre-toggle paint and looks like dark mode is broken when it is not.
