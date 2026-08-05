---
version: 1
slug: "route-portfolio"
primary_target: "route:/portfolio"
related_targets: ["src/components/catalog97/Catalog97Portfolio.tsx"]
---

# Work index surface brief

**Scope.** The `/portfolio` route, rendered by `src/components/catalog97/Catalog97Portfolio.tsx`. One of the seven Catalog 97 surfaces.

**Visitor mode.** Experience. The artifact leads; the interface recedes.

**Job / action.** Scan the body of shipped work, find one project worth opening, and read the decision behind it.

**Route constraints.** The h1 "Everything I've shipped, and the decisions behind it." is a test anchor. Client component: the category filter is wired to the real `classifyToolSlug` buckets and every slug in `caseStudies.ts` is bucketed, so no project disappears under a filter. Four full-weight entries lead on camel, the remainder drop to the pine ledger; that two-tier split is what keeps camel to its share of the page.

**Visual world: Catalog 97, not Working Instrument.** `DESIGN.md` describes The Working Instrument and governs the other ~40 routes. It does NOT govern this surface. `context.mjs` auto-loads it anyway, so a pass that treats it as the spec here will read every deliberate Catalog 97 decision as a violation and manufacture a page of false findings. Tokens live in `src/app/catalog97.css`.

**Do not re-litigate (settled 2026-08-02).**
- Tobacco is a large-text-only field. Paper ink on it is 4.36:1, which clears 3:1 for large text and never clears 4.5:1 for body. A tobacco band carries `--c97-fs-h2` (24px floor) and up, or no text at all. Not a defect; solved by size rather than by darkening the colour.
- Anton draws numerals at `--c97-fs-plate` only. Never running text, never headings, and there is no smaller numeral step. This replaced the earlier one-Anton-per-view rule.
- The scales are frozen: 9 type steps, 8 spacing values (`--c97-gutter` plus `--c97-sp-1..7`), 4 line heights, 3 measures plus `--c97-container`. `--c97-touch-y/x` sit outside the spacing ladder on purpose, solved backwards from the 44px floor.
- Every `--c97-*` value is declared under `[data-c97]` or `[data-c97-surface]`, never under a class, so a token consumer can skip class rules wholesale.
- Image slots render as flat Stone or Tobacco fields because no photograph exists yet. That is the design’s own layout rule, not an unfinished asset.

**Verified state.** 0 contrast failures across 2774 text nodes in both themes, each resolved against its own enclosing surface and backdrop. Zero shadows, zero radii above 2px, zero off-palette hex in components. `focus-visible` covers anchors, buttons, inputs, textareas, selects and summaries. Exactly one `aria-current` per route. Espresso footer present. No two Pine bands adjacent, and at least two brown bands per route.

**Commands worth running.** `critique` and `audit` to find. Then only what the findings name. `polish` last. Never `document` here (it would regenerate DESIGN.md against the wrong world), and never both halves of `bolder`/`quieter` or `overdrive`/`distill`.

**Settled 2026-08-02 (critique, degraded single-context).** The anchor reset is `:where(.c97-page) a`, not `.c97-page a`. At `.c97-page a` it scored (0,1,1) and outranked every single-class component rule, so each `.c97-btn` rendered as a `<Link>` discarded its own `color: var(--c97-surface)` and inherited the band ink instead. Measured live: "See the work" was espresso on chocolate at 1.4:1, and `.c97-btn-invert`, whose background is `--c97-ink`, was heading for 1:1 invisible text on six routes. All 13 buttons on the site are anchors, so all 13 were affected. Static token-math audits miss this because they read the declared rule rather than the winning cascade. Do not raise the `:where()` back to a plain class, and re-measure buttons in a browser after any change to the anchor reset.

**Settled 2026-08-02 (mobile pass).** The header wordmark carries `.c97-brand`, which applies the same padding-plus-negative-margin hit target as `.c97-microlink`. At 390px it measured a 23px tap target before this, under the 44px floor the rest of the site holds; it is 55px now. Dark mode is verified live rather than by token math: all eight surfaces render their derived dark values and both themes measure zero contrast failures. When re-measuring after a theme toggle, wait a tick before reading computed styles — reading in the same synchronous block returns the pre-toggle paint and looks like dark mode is broken when it is not.

**Corrected 2026-08-03 (layout sweep). The filter row's row gap is `--c97-sp-5`, not `--c97-sp-3`.** The entry below treats the tablist wrap as a settled matter, and that conclusion came from measuring at 1440 only. `--c97-sp-3` clamps to 22px on a phone against 50px `.c97-microlink` hit boxes, which put wrapped rows 39px apart. The identical control on `/dashboards` measured eight overlapping tap-target pairs at 320 because of it, and this one had the same geometry. The two axes are separate now, and this route measures zero overlapping pairs at 320 with the rows 57px apart. Everything the entry below says about not tightening the gap still stands. The ledger deliberately does not take `c97-row-stack-sm`, the mobile row-stacking class added for the writing archive, because its second cell is a bare year that already fits beside the title.

**Settled 2026-08-03 (layout, degraded single-context). The pine ledger is two columns above roughly 780px and one below.** The two-tier split itself did not change and is still four full-weight entries on camel with the remainder below. What changed is the ledger's internal layout. `.c97-row` is `1fr auto`, so as one full-width column inside the 1080px shell the title track measured 1020px while a title's text runs about 140px to 250px, which left a void of roughly 910px at the median between a title and its own date, with nothing bridging it, repeated 29 times. That is the scanning failure a ledger exists to prevent. The title track is 446px now and the measured void runs 131px at the minimum, 336px at the median and 386px at the maximum, so it is down by about 574px per row, which is exactly the track reduction. The pine band went from 1940px to 1142px and the page from 4496px to 3698px at 1440. A hairline per row would also close the gap and the design owns that device, but proximity gets there without adding 29 rules, which is the order the layout playbook asks for. Reading order is row-major, so the grid fills left to right and then down, and DOM order matches visual order with zero inversions at both widths.

**The heading sizes on this route now map one to one with the heading levels, and the first attempt at that was wrong.** "The rest of the index" was an `h2` carrying `c97-kicker`, so it rendered at 11px directly above 22px children while its four sibling `h2`s in the camel band ran at 32px. `c97-h3` was tried first, on the reasoning that the ledger is the quiet tier and its header should stay quiet, and it does not survive mobile. Both steps clamp down at 390px, `--c97-fs-h3` to 20px and `--c97-fs-lead` to 19px, so the header sat one pixel above its own children and the nesting went invisible, which is the same defect one step over. `c97-h2` clamps to 24px against 19px at 390 and is 32px against 22px at 1440. Every `h2` on the route draws at one size now, which is the thing to preserve if this is ever revisited.

**The 29 ledger titles are `h3` rather than `div`.** They are the same kind of thing as the four `h2` entries in the camel band, so as plain divs they left 29 of the 33 projects unreachable by heading navigation while 4 were reachable. The level mirrors the two-tier split the design already makes visually, and `c97-lead` carries the size, so nothing moved on screen. The outline reads one `h1`, five `h2` and 29 `h3`.

**Checked and deliberately left alone.** `.c97-row` sizes its date track to content and sits it flush right, so dates align to the same right edge across every row while their left edges vary. That is correct for a ledger and is not a defect. The tablist wraps to two rows at 1440 with 50px targets, which is the same measured and settled situation recorded at length in `route-dashboards.md`, so do not try to even up the wrap here either.

**Verified live after the change.** One `h1`, five `h2` all at 32px, 29 `h3` all at 22px at 1440, and 24px against 19px at 390. Two ledger columns at 1440 and one at 390, 29 rows either way. Zero overlapping link pairs at both widths, zero horizontal overflow, zero DOM to visual order inversions. Typecheck clean, and 42 tests passing across the seven suites in `src/app/__tests__` and `src/components/__tests__` plus `src/constants/__tests__/caseStudies.test.ts`.
