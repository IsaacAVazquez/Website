---
version: 1
slug: "route-resume"
primary_target: "route:/resume"
related_targets: ["src/components/catalog97/Catalog97Resume.tsx","src/constants/personal.ts"]
---

**Superseded in part on 2026-09-23.** The seven designed routes now use the print shop layout in `STYLING.md`, and it overrides anything below that disagrees. The pine, camel, and tobacco surfaces were renamed and repainted as `ink-blue`, `ink-saffron`, and `ink-vermilion`, and `ink-peach` was added, so read any mention of pine, camel, or tobacco below as the ink that replaced it. Anton now also sets the h1 and section h2s through `.c97-poster`, so the numerals-only Anton rule is retired. Vermilion carries body text with the darkest ink (4.62:1), so the tobacco large-text-only rule is retired too. Bands that change surface tear over each other, and the one allowed shadow is the hard `.c97-offset` in the second ink.

# Résumé surface brief

**Scope.** The `/resume` route, rendered by `src/components/catalog97/Catalog97Resume.tsx`. One of the seven Catalog 97 surfaces.

**Visitor mode.** Read. A recruiter or peer verifying the record.

**Job / action.** Confirm the track record quickly, or take the PDF.

**Route constraints.** Every role, date and metric is the real record; date ranges are unhyphenated per the writing voice. No certifications column exists because there are no certifications to list, and none may be invented. This was recorded as the low end of the Pine range at ~12%, and it measures 14.6% as of 2026-08-03 at 1440 over the whole `.c97-page` including chrome. It rose because the pine wordmark band above the footer is gone, which shortened the route and raised what remains as a fraction, rather than because any band changed field. Paper is still the dominant surface at 55.5%, so the reasoning holds.

**Fixed 2026-08-03 (layout sweep). The hero scrolled the page sideways on a narrow phone.** The hero row was `display: grid` with `1fr auto`, which is what the other hero rows use, and on them the second cell is a plate numeral about 70px wide that always fits. This one is the Download PDF button, and `.c97-btn` cannot shrink, being `white-space: nowrap` with 22px of padding a side and a 48px floor. At a 320px viewport the shell is 249px, the grid gave the button a 52.8px track, the button kept its 160px anyway, and the document scrolled to 385px against a 320px viewport. It is flex with wrap now, the same pairing the download band lower down already solved that way, with the text cell at `flex: 1 1 260px` so the button drops to its own line when the row cannot hold both. Verified at 320 with the button at the left margin on a second row and zero overflow, and at 1440 unchanged, with the text 813.8px wide and the button flush to the shell's right edge on the same row.

**This route was not measured in the first sweep, which is how that survived.** The `min()` guards were applied here and to `/contact` without either route being opened, on the reasoning that the change was mechanical. The guards were fine. The hero was not, and it was pre-existing rather than caused by them. Open a route before calling it verified.

**Settled 2026-08-03 (heading sweep, degraded single-context).** All five section headings were `h2` carrying `c97-kicker`, so Experience, Capabilities, Education, Outside work and References every one rendered at 11px. Experience sat above 26px `h3` children and Capabilities and Education above 22px ones, so those three were strict inversions. Outside work and References carry prose rather than headings, so neither was an inversion on its own, but all three of Education, Outside work and References are columns of the same camel band, and leaving two at 11px beside a 32px sibling would have put three mismatched headers in one row. All five carry `c97-serif c97-h2` now. Do not reach for `c97-h3` as a quieter option, because it collapses to within a pixel of `--c97-fs-lead` once both clamps bottom out on a phone, which was measured on `/portfolio`. Verified live at 1440 and 390, with five `h2` at 32px and 24px, `h3` at 26px and 22px falling to 20px and 19px, the camel band still three columns of 330.664px, no heading overflowing its box, no horizontal scroll and no element overflow. Nothing in `personal.ts` was touched, so the unhyphenated date ranges this brief pins are unchanged.

**Visual world: Catalog 97, not Working Instrument.** `DESIGN.md` describes The Working Instrument, and until the bridge on 2026-09-16 it governed every other route. Those routes now render inside `Catalog97ToolShell` and are Catalog 97 too, so `DESIGN.md` is stale everywhere until the close-out PR rewrites it. It does NOT govern this surface. `context.mjs` auto-loads it anyway, so a pass that treats it as the spec here will read every deliberate Catalog 97 decision as a violation and manufacture a page of false findings. Tokens live in `src/app/catalog97.css`.

**Do not re-litigate (settled 2026-08-02).**
- Tobacco is a large-text-only field. Paper ink on it is 4.36:1, which clears 3:1 for large text and never clears 4.5:1 for body. A tobacco band carries `--c97-fs-h2` (24px floor) and up, or no text at all. Not a defect; solved by size rather than by darkening the colour.
- Anton draws numerals at `--c97-fs-plate` only. Never running text, never headings, and there is no smaller numeral step. This replaced the earlier one-Anton-per-view rule.
- The scales are frozen: 9 type steps, 8 spacing values (`--c97-gutter` plus `--c97-sp-1..7`), 4 line heights, 3 measures plus `--c97-container`. `--c97-touch-y/x` sit outside the spacing ladder on purpose, solved backwards from the 44px floor.
- Every `--c97-*` value is declared under `[data-c97]` or `[data-c97-surface]`, never under a class, so a token consumer can skip class rules wholesale.
- Image slots without a photograph render as flat Stone or Tobacco fields, which is the design’s own layout rule for a missing photograph. Corrected 2026-09-14, the headshot at `/images/headshot-home.webp` fills the portrait slot on / and /about, so those two slots show a photograph.

**Verified state.** 0 contrast failures across 2774 text nodes in both themes, each resolved against its own enclosing surface and backdrop. Zero shadows, zero radii above 2px, zero off-palette hex in components. `focus-visible` covers anchors, buttons, inputs, textareas, selects and summaries. Until 2026-09-14 each of those rings also carried a 4px radius and a signal-orange halo inherited from `globals.css`, and the `.c97-page` focus rule now sets `border-radius: 0` and `box-shadow: none`. Exactly one `aria-current` per route. Espresso footer present. No two Pine bands adjacent, and at least two brown bands per route.

**Commands worth running.** `critique` and `audit` to find. Then only what the findings name. `polish` last. Never `document` here (it would regenerate DESIGN.md against the wrong world), and never both halves of `bolder`/`quieter` or `overdrive`/`distill`.

**Settled 2026-08-02 (critique, degraded single-context).** The anchor reset is `:where(.c97-page) a`, not `.c97-page a`. At `.c97-page a` it scored (0,1,1) and outranked every single-class component rule, so each `.c97-btn` rendered as a `<Link>` discarded its own `color: var(--c97-surface)` and inherited the band ink instead. Measured live: "See the work" was espresso on chocolate at 1.4:1, and `.c97-btn-invert`, whose background is `--c97-ink`, was heading for 1:1 invisible text on six routes. All 13 buttons on the site are anchors, so all 13 were affected. Static token-math audits miss this because they read the declared rule rather than the winning cascade. Do not raise the `:where()` back to a plain class, and re-measure buttons in a browser after any change to the anchor reset.

**Settled 2026-08-02 (mobile pass).** The header wordmark carries `.c97-brand`, which applies the same padding-plus-negative-margin hit target as `.c97-microlink`. At 390px it measured a 23px tap target before this, under the 44px floor the rest of the site holds; it is 55px now. Dark mode is verified live rather than by token math: all eight surfaces render their derived dark values and both themes measure zero contrast failures. When re-measuring after a theme toggle, wait a tick before reading computed styles, because reading in the same synchronous block returns the pre-toggle paint and looks like dark mode is broken when it is not.

## Loop, 2026-09-14

Mode stays Read. This loop critiqued, fixed and re-scored the route alongside the other Catalog 97 surfaces. The pre-fix snapshot is `2026-09-14T18-34-44Z__route-resume.md` at 25/36 (69%, Acceptable) with 2 P1, and the post-fix snapshot from the same day scores 27/36 (75%, Good) with 0 P0 and 0 P1.

### What landed, with measured evidence

The download band no longer says "Two pages", and `pdfinfo public/Isaac_Vazquez_Resume.pdf` reports one page. At re-score it read "One page, with no summary paragraph.", and after the re-score and sweep it became "The one-page version, ready to print.", checked only by a targeted text check. The 2025 Quality Assurance Engineer entry now ends "Built a real-time event system in Google Cloud that moved clients to self-service and cut onboarding time 60%.", which the sweep read in both themes and which matches the PDF. Every figure that appears on both /resume and /about now agrees, and the /about side was the one corrected, in `src/constants/personal.ts`. Focus rings measured radius 0 and no shadow on all 22 focusables in both themes, and the header held 180.4px at 390, 122.8px at 768 and 114px at 1440 through theme toggle mount.

### Decisions that apply to this surface

Print styles and the date column are unchanged on purpose. Career figures were confirmed by Isaac on 2026-09-14, from release efficiency 50% and 90% critical defects on the Quality Assurance Analyst role (2022 to 2025), to response rates up 20% in 2021, to onboarding cut 60% on the 2025 Quality Assurance Engineer role through Google Cloud.

### False positives worth not re-deriving

The in-page detector overlay is blocked by the enforcing CSP in `src/proxy.ts`, and `impeccable detect` returns `[]` on the Catalog 97 components. `critique-storage latest` on a `route:` target closes the snapshot it finds, because the helper fingerprints `route:/resume` as a missing local file, so read snapshots with `trend` or by filename.

### Still open

[P2] The date gutter is sized per row and the phone text column is narrow (kept). [P2] No print stylesheet (kept). [P2] `personal.ts` and the `experience` array in `Catalog97Resume.tsx` are still two hand-maintained lists. [P3] An intermittent layout shift of 0.0223 at 390 in light, seen in 3 of 10 probe runs and 1 of 3 sweep runs. In each run that shifted, the h1 "Product work, with a quality engineering habit." grew from 77px to 115px tall, re-wrapping from two lines to three when Newsreader and Instrument Sans finished loading, which moved the Download PDF button and the Experience band down 38px. It predates this loop, since the pre-fix critique recorded about 0.023 with no cause isolated, and the dark runs did not shift. [P3] The Civitech and Open Progress marks read as small light squares in dark mode, the document title says "Resume", and both PDF links force a download.

### Corrected facts in this brief

The theme toggle no longer shifts the header on this route, so any remaining layout shift here is the font-load re-wrap above and not the toggle. Page height measured 3,867px at 1440 and 6,036px at 390 on 2026-09-14. Focus rings carried a 4px radius and a halo until this loop.
