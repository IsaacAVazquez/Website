---
version: 1
slug: "route-about"
primary_target: "route:/about"
related_targets: ["src/components/catalog97/Catalog97About.tsx","src/constants/personal.ts"]
---

**Superseded in part on 2026-09-23.** The seven designed routes now use the print shop layout in `STYLING.md`, and it overrides anything below that disagrees. The pine, camel, and tobacco surfaces were renamed and repainted as `ink-blue`, `ink-saffron`, and `ink-vermilion`, and `ink-peach` was added, so read any mention of pine, camel, or tobacco below as the ink that replaced it. Anton now also sets the h1 and section h2s through `.c97-poster`, so the numerals-only Anton rule is retired. Vermilion carries body text with the darkest ink (4.62:1), so the tobacco large-text-only rule is retired too. Bands that change surface tear over each other, and the one allowed shadow is the hard `.c97-offset` in the second ink.

# About surface brief

**Scope.** The `/about` route, rendered by `src/components/catalog97/Catalog97About.tsx`. One of the seven Catalog 97 surfaces.

**Visitor mode.** Read. The visitor is deciding whether the thinking is sound.

**Job / action.** Understand how Isaac works and why, then move to the work or the resume.

**Route constraints.** The timeline is the real record from `src/constants/personal.ts`. None of the mockup biography ships. The opening prose takes Pine and "How I work" takes Bone specifically so the two Pine bands are not adjacent. The portrait slot shows the headshot (`/images/headshot-home.webp`), loaded eagerly with a preload since 2026-09-14 because it is the largest contentful paint at 768 and up.

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

**Settled 2026-08-03 (layout, degraded single-context). This was a small pass and the route was mostly right already.** Two findings, both fixed, and one candidate that dissolved when it was measured. The composition, the band order, the pull quote's bottom-aligned tall camel band and the portrait pairing were all inspected and all left alone.

**Both section headings were `h2` carrying `c97-kicker`, so both rendered at 11px directly above 26px `h3` children.** "How I work" on bone sits above three principles and "The route here" on chocolate sits above nine timeline entries, and in both cases the nesting read backwards on the page. They carry `c97-serif c97-h2` now, which is 32px against 26px at 1440 and clamps to 24px against 20px at 320. This is the third route with the same defect, after `/dashboards` and `/portfolio`, so it is worth treating as a pattern in this codebase rather than as three coincidences. The trap when fixing it is reaching for `--c97-fs-h3`, which was tried on `/portfolio` and fails, because `--c97-fs-h3` and `--c97-fs-lead` both bottom out within a pixel of each other on a phone. Go to `--c97-fs-h2`.

**The pine two-up could overflow on a narrow phone.** Its track floor was a bare `minmax(280px,1fr)`, and a track floor does not yield to its container. Measured at a 320px viewport, where the shell is 264px, the track still computed 280px, which pushed this band's content 16px into the right gutter while every other band kept the full 28px, and below roughly a 308px viewport it becomes real horizontal overflow rather than a gutter break. It is `minmax(min(100%, 280px),1fr)` now, which is the same guard the home hero uses. At 320 the track computes 264px and the gutters are symmetric again. The change is a no-op at desktop, where the computed template is still `506px 506px 0px`, exactly what it was.

**The 990px timeline description track is not a defect, and this is worth recording so it is not "fixed" later.** Each timeline row is `auto 1fr`, so the description column measures 990px inside the 1080px shell, which looks like a runaway line length on a Read surface. It is not, because `.c97-prose` carries `max-width: var(--c97-measure-wide)`, 54ch, so the text is already measured and the 990px is only the track it sits in. The trailing space to its right is ordinary prose ragging with nothing on the far side to align to, which is not the same problem as the `/portfolio` ledger void, where a right-hand value sat across the gap.

**Verified live after the change.** One `h1`, two `h2` both at 32px, twelve `h3` all at 26px at 1440, and 24px against 20px at 320. Zero horizontal overflow and no horizontal scroll at 320 or 1440, content right edge flush with the shell, zero DOM to visual order inversions. The bone band grew 25px and the chocolate band 25px, so the page went from 5152px to 5203px, which is the two headings getting their real size and nothing else. Typecheck clean and 38 tests passing across the seven suites in `src/app/__tests__` and `src/components/__tests__`.

## Loop, 2026-09-14

Mode stays Read. This loop critiqued, fixed and re-scored the route alongside the other Catalog 97 surfaces. The pre-fix snapshot is `2026-09-14T18-34-43Z__route-about.md` at 19/28 (68%, Acceptable) with 3 P1, and the post-fix snapshot from the same day scores 20/28 (71%, Good) with 0 P0 and 0 P1.

### What landed, with measured evidence

The timeline figures now match /resume for every role that appears on both. Isaac confirmed them on 2026-09-14, from release efficiency 50% and critical defects cut 90% on the Quality Assurance Analyst role (2022 to 2025), to response rates up 20% in 2021, to onboarding time cut 60% on the 2025 Quality Assurance Engineer role through a Google Cloud event system. The sweep read the 2022 entry as "I held uptime at 99.999%, cut critical defects 90%, and improved release efficiency 50%" and found no 90% onboarding figure anywhere on the page. `src/constants/personal.ts` carries a 2026 Haas@Work entry, and the rendered order is Innovation Consultant Team Lead at Haas@Work, MBA Candidate at UC Berkeley Haas, then Quality Assurance Engineer at Civitech, so the timeline has ten entries now. The body no longer says "Six of those years", and the bio reads "Most of that was at Civitech, a SaaS company building software for political campaigns, after a few years of digital and data work at Open Progress, and I'm at Berkeley Haas for my MBA now." The pull quote reads "What I find interesting about quality work is knowing which bug was always going to matter." and the principle reads "A stale number with a date on it is still useful, but a blank panel at two in the morning is not." The headshot is loaded eagerly with an image preload at 768 and 1440, because it is the largest contentful paint element there. Focus rings measured radius 0 and no shadow on all 21 focusables in both themes, the header held 180.4px at 390, 122.8px at 768 and 114px at 1440 with CLS 0, and the console error the pre-fix sweep saw at 1024 and 1440 is gone.

### Decisions that apply to this surface

The metadata and ProfilePage schema sentence "six years across QA, analytics, SaaS, and civic tech" in `src/app/about/page.tsx` holds, because it counts the whole career from Jun 2019 to Aug 2025, and it stays even though the post-fix design review listed it as P2. The same headshot fills the portrait slot on / and /about at Isaac's request.

### False positives worth not re-deriving

The in-page detector overlay is blocked by the enforcing CSP in `src/proxy.ts`, and `impeccable detect` returns `[]` on the Catalog 97 components, so neither says anything about this route. `critique-storage latest` on a `route:` target closes the snapshot it finds, because the helper fingerprints `route:/about` as a missing local file, so read snapshots with `trend` or by filename.

### Still open

[P2] `personal.ts` and the `experience` array in `Catalog97Resume.tsx` are still two hand-maintained lists, and NPS 23 to 36 appears on /about only. [P2] Three identical "Quality Assurance Analyst" h3s are indistinguishable in a heading list. [P3] No contact exit in the page body. [P3] Civitech is described as a SaaS company in the bio and a civic tech company in the 2022 entry, and the MBA entry keeps one verbless fragment.

### Corrected facts in this brief

The route constraints line said the portrait slot is a flat Stone field with its caption, and it shows the headshot, so that line and the image-slot bullet were corrected. The "nine timeline entries" in the 2026-08-03 entries is history, since there are ten. Page height measured 4,806px at 1440 and 5,616px at 390 on 2026-09-14, against 4,598 and 5,363 in the pre-fix critique and 5,203 at 1440 in the 2026-08-03 entry. Focus rings carried a 4px radius and a halo until this loop.
