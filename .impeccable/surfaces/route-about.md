---
version: 1
slug: "route-about"
primary_target: "route:/about"
related_targets: ["src/components/catalog97/Catalog97About.tsx"]
---

# About surface brief

**Scope.** The `/about` route, rendered by `src/components/catalog97/Catalog97About.tsx`. One of the seven Catalog 97 surfaces.

**Visitor mode.** Read. The visitor is deciding whether the thinking is sound.

**Job / action.** Understand how Isaac works and why, then move to the work or the resume.

**Route constraints.** The timeline is the real record from `src/constants/personal.ts`. None of the mockup biography ships. The opening prose takes Pine and "How I work" takes Bone specifically so the two Pine bands are not adjacent. The portrait slot is a flat Stone field with its caption.

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

**Settled 2026-08-03 (layout, degraded single-context). This was a small pass and the route was mostly right already.** Two findings, both fixed, and one candidate that dissolved when it was measured. The composition, the band order, the pull quote's bottom-aligned tall camel band and the portrait pairing were all inspected and all left alone.

**Both section headings were `h2` carrying `c97-kicker`, so both rendered at 11px directly above 26px `h3` children.** "How I work" on bone sits above three principles and "The route here" on chocolate sits above nine timeline entries, and in both cases the nesting read backwards on the page. They carry `c97-serif c97-h2` now, which is 32px against 26px at 1440 and clamps to 24px against 20px at 320. This is the third route with the same defect, after `/dashboards` and `/portfolio`, so it is worth treating as a pattern in this codebase rather than as three coincidences. The trap when fixing it is reaching for `--c97-fs-h3`, which was tried on `/portfolio` and fails, because `--c97-fs-h3` and `--c97-fs-lead` both bottom out within a pixel of each other on a phone. Go to `--c97-fs-h2`.

**The pine two-up could overflow on a narrow phone.** Its track floor was a bare `minmax(280px,1fr)`, and a track floor does not yield to its container. Measured at a 320px viewport, where the shell is 264px, the track still computed 280px, which pushed this band's content 16px into the right gutter while every other band kept the full 28px, and below roughly a 308px viewport it becomes real horizontal overflow rather than a gutter break. It is `minmax(min(100%, 280px),1fr)` now, which is the same guard the home hero uses. At 320 the track computes 264px and the gutters are symmetric again. The change is a no-op at desktop, where the computed template is still `506px 506px 0px`, exactly what it was.

**The 990px timeline description track is not a defect, and this is worth recording so it is not "fixed" later.** Each timeline row is `auto 1fr`, so the description column measures 990px inside the 1080px shell, which looks like a runaway line length on a Read surface. It is not, because `.c97-prose` carries `max-width: var(--c97-measure-wide)`, 54ch, so the text is already measured and the 990px is only the track it sits in. The trailing space to its right is ordinary prose ragging with nothing on the far side to align to, which is not the same problem as the `/portfolio` ledger void, where a right-hand value sat across the gap.

**Verified live after the change.** One `h1`, two `h2` both at 32px, twelve `h3` all at 26px at 1440, and 24px against 20px at 320. Zero horizontal overflow and no horizontal scroll at 320 or 1440, content right edge flush with the shell, zero DOM to visual order inversions. The bone band grew 25px and the chocolate band 25px, so the page went from 5152px to 5203px, which is the two headings getting their real size and nothing else. Typecheck clean and 38 tests passing across the seven suites in `src/app/__tests__` and `src/components/__tests__`.
