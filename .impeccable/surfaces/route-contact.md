---
version: 1
slug: "route-contact"
primary_target: "route:/contact"
related_targets: ["src/components/catalog97/Catalog97Contact.tsx"]
---

# Contact surface brief

**Scope.** The `/contact` route, rendered by `src/components/catalog97/Catalog97Contact.tsx`. One of the seven Catalog 97 surfaces.

**Visitor mode.** Persuade. Deliberately the shortest of the seven.

**Job / action.** Send one message through a channel that actually works.

**Route constraints.** THERE IS NO CONTACT FORM AND ONE MUST NOT BE ADDED. The source design draws four fields and a send button; this repo has no form backend, so shipping that markup would look right and silently drop every message. The design's own tobacco line says email is faster than the form and gets read first, so the direct panel takes the weight the form would have had. Do not raise the missing form as a finding.

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

Mode stays Persuade. This loop critiqued, fixed and re-scored the route alongside the other Catalog 97 surfaces. The pre-fix snapshot is `2026-09-14T18-34-44Z__route-contact.md` at 23/32 (72%, Good) with 0 P1, and the post-fix snapshot from the same day scores 26/32 (81%, Good) with 0 P0 and 0 P1.

### What landed, with measured evidence

LinkedIn and GitHub now carry visible "LinkedIn" and "GitHub" kickers above each handle, and their accessible names are "LinkedIn, isaac-vazquez" and "GitHub, IsaacAVazquez". At 390 the email link measures 231.7 by 56px, LinkedIn 106.8 by 54.8 and GitHub 116.1 by 54.8, with hit areas 52px tall for email and 47px for the two channels and 0 overlapping pairs in main, where all three were 19 to 20px tall before. Main has the h1 plus three h2 labels, "Write to me", "Response time" and "Elsewhere", each keeping `c97-kicker`. The copy reads "anything on this site that looks wrong to you" and "name it in the subject line so I can pull up the details before I reply", "Or go direct" became "Elsewhere", and response time is stated once. After the re-score and sweep, `.c97-kicker` gained `font-weight: 400`, because the new h2 kickers rendered at 700 beside 400-weight p kickers, and that was checked only by a targeted style check. Focus rings measured radius 0 and no shadow on all 24 focusables in both themes, the header held 180.4px at 390, 122.8px at 768 and 114px at 1440 with CLS 0, and Escape from Search returned focus to the Search button.

### Decisions that apply to this surface

There is still no contact form, and the route constraint above stands.

### False positives worth not re-deriving

The in-page detector overlay is blocked by the enforcing CSP in `src/proxy.ts`, and `impeccable detect` returns `[]` on the Catalog 97 components. `critique-storage latest` on a `route:` target closes the snapshot it finds, because the helper fingerprints `route:/contact` as a missing local file, so read snapshots with `trend` or by filename.

### Still open

[P3] The tobacco band says email is read first while LinkedIn is "Best for anything role-related or Haas-adjacent." [P3] LinkedIn and GitHub open new tabs with no indication. [P3] `contact/page.tsx` hardcodes the email in ContactPage structured data (not re-checked). The address still sits below three bands of lead-in at 1440.

### Corrected facts in this brief

Page height measured 1,907px at 1440 and 2,269px at 390 on 2026-09-14. Focus rings carried a 4px radius and a halo until this loop.
