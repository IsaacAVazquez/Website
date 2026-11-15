---
version: 1
slug: "route-contact"
primary_target: "route:/contact"
related_targets: ["src/components/catalog97/Catalog97Contact.tsx"]
---

**Superseded in part on 2026-09-23.** The seven designed routes now use the print shop layout in `STYLING.md`, and it overrides anything below that disagrees. The pine, camel, and tobacco surfaces were renamed and repainted as `ink-blue`, `ink-saffron`, and `ink-vermilion`, and `ink-peach` was added, so read any mention of pine, camel, or tobacco below as the ink that replaced it. Anton now also sets the h1 and section h2s through `.c97-poster`, so the numerals-only Anton rule is retired. Vermilion carries body text with the darkest ink (4.62:1), so the tobacco large-text-only rule is retired too. Bands that change surface tear over each other, and the one allowed shadow is the hard `.c97-offset` in the second ink.

# Contact surface brief
Checked against the code on 2026-11-02.

**Scope.** The `/contact` route, rendered by `src/components/catalog97/Catalog97Contact.tsx`. One of the seven Catalog 97 surfaces.

**Visitor mode.** Persuade. Deliberately the shortest of the seven.

**Job / action.** Send one message through a channel that actually works.

**Route constraints.** THERE IS NO CONTACT FORM AND ONE MUST NOT BE ADDED. The source design draws four fields and a send button; this repo has no form backend, so shipping that markup would look right and silently drop every message. The design's own tobacco line says email is faster than the form and gets read first, so the direct panel takes the weight the form would have had. Do not raise the missing form as a finding. Since 2026-10-19 (PR #613) that weight sits on one reply card (`data-card`) on one paper band. The left half carries the h1 "I’d like to hear from you.", the message, and the reply time, and the right half carries the stamp and the four address lines (To, Email, LinkedIn, GitHub), with one sentence under the card pointing at the résumé and the Work page. `e2e/designed-pages.spec.ts` pins one card, no blue band (the stamp is its own ink-blue surface), the email, LinkedIn and GitHub links at least 44px tall, a stamp that prints the year, and no horizontal scroll at 320, and `e2e/footer-cta.spec.ts` pins the h1. The spec's stamp check is the literal "2026", while the stamp prints the year from `CONTACT_DATE_MODIFIED`, so moving that date into 2027 means changing the test with it. The card sets its halves side by side above 700px and stacks them at 700px and under, where it also drops its 6 / 4 aspect ratio, and `data-c97-object` on the card exempts its inset h1 from the header-edge check in `e2e/layoutChecks.ts`.

**Visual world: Catalog 97.** `DESIGN.md` describes Catalog 97 as shipped, and `context.mjs` auto-loading it now points a pass at the right spec for this surface. Tokens live in `src/app/catalog97.css`.

**Do not re-litigate (settled 2026-08-02).**
- Tobacco is a large-text-only field. Paper ink on it is 4.36:1, which clears 3:1 for large text and never clears 4.5:1 for body. A tobacco band carries `--c97-fs-h2` (24px floor) and up, or no text at all. Not a defect; solved by size rather than by darkening the colour.
- Anton draws numerals at `--c97-fs-plate` only. Never running text, never headings, and there is no smaller numeral step. This replaced the earlier one-Anton-per-view rule.
- The scales are frozen: 9 type steps, 8 spacing values (`--c97-gutter` plus `--c97-sp-1..7`), 4 line heights, 3 measures plus `--c97-container`. `--c97-touch-y/x` sit outside the spacing ladder on purpose, solved backwards from the 44px floor.
- Every `--c97-*` value is declared under `[data-c97]` or `[data-c97-surface]`, never under a class, so a token consumer can skip class rules wholesale.
- Image slots without a photograph render as flat Stone or Tobacco fields, which is the design’s own layout rule for a missing photograph. Corrected 2026-09-14, the headshot at `/images/headshot-home.webp` fills the portrait slot on / and /about, so those two slots show a photograph.

As of 2026-11-02 the scale and declaration bullets are out of date. The type scale has 11 steps, since `--c97-fs-poster` and `--c97-fs-poster-sm` arrived on 2026-09-24, the spacing ladder has 9 values, since `--c97-sp-0` arrived on 2026-10-02, and `--c97-container-wide` (1376px) and the 720px prose column `--c97-column` sit beside `--c97-container`. Some `--c97-*` values are also declared outside `[data-c97]` and `[data-c97-surface]`, from the `--c97-z-*` stacking tokens and the motion curves on `:root`, to the `--c97-monet-*` canvas on `.c97-header-brand`, to per-component overrides such as `--c97-overprint` on the About plate.

**Verified state.** 0 contrast failures across 2774 text nodes in both themes, each resolved against its own enclosing surface and backdrop. Zero shadows, zero radii above 2px, zero off-palette hex in components. `focus-visible` covers anchors, buttons, inputs, textareas, selects and summaries. Until 2026-09-14 each of those rings also carried a 4px radius and a signal-orange halo inherited from `globals.css`, and the `.c97-page` focus rule now sets `border-radius: 0` and `box-shadow: none`. Exactly one `aria-current` per route. Espresso footer present. No two Pine bands adjacent, and at least two brown bands per route. As of 2026-11-02 the brown-band count describes the 2026-08-02 palette, since under the print shop layout the espresso footer is the only brown sheet on every designed route except `/portfolio`, whose CTA band is chocolate.

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

The in-page detector overlay is blocked by the enforcing CSP in `src/proxy.ts`, and `impeccable detect` returns `[]` on the Catalog 97 components. `critique-storage latest` on a `route:` target closes the snapshot it finds, because the helper fingerprints `route:/contact` as a missing local file, so read snapshots with `trend` or by filename. As of 2026-11-02, outside production the CSP in `src/proxy.ts` has allowed `http://localhost:8400` since 2026-09-24 so Impeccable live mode can load its picker, which means a dev server may now load the overlay. The snapshots under `.impeccable/critique/` were untracked on 2026-10-02 (c6ee4f4ed) and are gitignored, so the snapshot files named in this brief are not in the repository.

### Still open

[P3] The tobacco band says email is read first while LinkedIn is "Best for anything role-related or Haas-adjacent." [P3] LinkedIn and GitHub open new tabs with no indication. [P3] `contact/page.tsx` hardcodes the email in ContactPage structured data (not re-checked). The address still sits below three bands of lead-in at 1440.

As of 2026-11-02 the reply card of 2026-10-19 retired most of these. There is no tobacco band and no "Best for anything role-related" line, LinkedIn and GitHub carry "opens in a new tab" in their accessible names though nothing visible says so, and the address sits on the same card as the message. `contact/page.tsx` still hardcodes `IsaacVazquez@berkeley.edu` in the ContactPage structured data, which matches `profile.email` in `src/lib/profile.ts`.

### Corrected facts in this brief

Page height measured 1,907px at 1440 and 2,269px at 390 on 2026-09-14. Focus rings carried a 4px radius and a halo until this loop.

## Clarify pass, 2026-10-19

The sentence under the card now says "the Work page has the longer one" instead of "the work index has the long one", since the route is Work everywhere else and, after 2026-10-19, it is the curated page rather than an index.

## Harden pass, 2026-10-19

The three address links overlapped each other vertically, by 9px at 1440 and 15px at 390, because `touchTarget` padded every link by a fixed 16px above and below a 25px to 29px line, which made each box 58px to 61px tall in rows about 32px apart. The padding is now solved from the line height (`calc((44px - 1lh) / 2)`, with the matching negative margin) so every link box is exactly 44px, and `.lines` moved from `--c97-sp-2` to `--c97-sp-3`. Measured live: three boxes of 44px with zero overlap at both widths, and the card's rules and stamp unchanged. The two inline links under the card stay 17px tall as inline links in a sentence, which WCAG 2.5.8 exempts. On 2026-10-21 `touchTarget` also took `minBlockSize: "44px"` (ae410d730, PR #634), because Firefox rounded the solved padding down to a 43.98px box.
