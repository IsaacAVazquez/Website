---
target: world:working-instrument
command: audit
total_score: 18
max_score: 20
p0_count: 0
p1_count: 2
p2_count: 4
p3_count: 5
timestamp: 2026-08-13T15:15:40Z
branch: claude/impeccable-skill-rollout-fl7y1p
base_commit: 0b0f88c
slug: world-working-instrument
---

# Audit, The Working Instrument (site-wide rollout)

First Impeccable pass over the ~40 routes governed by The Working Instrument, rather
than the seven Catalog 97 index routes the prior runs covered. Method was a live
Playwright sweep of 35 real routes at 1440x900 and 390x844, each in light and dark,
plus a full static sweep of the mechanical token rules over `src/`. Every contrast
number below came out of a computed-value assertion, and the parser was sanity-checked
at **16.29:1** for ink on paper on every route before any finding was believed, which
is the check that catches the `color(srgb …)` and `oklab()` misparses this palette
invites. The seven Catalog 97 routes (`/`, `/portfolio`, `/writing`, `/dashboards`,
`/about`, `/resume`, `/contact`) and `/admin` were held out of the design-rule scoring:
Catalog 97 has its own token world and its own briefs, and judging it against
`DESIGN.md` would manufacture false findings.

Fixes were applied during the run, so the score below is the **post-remediation** state.
The pre-remediation state scored roughly 15/20, held down by one systemic accessibility
defect that touched most of the dashboards.

## Audit Health Score

| # | Dimension | Score | Key finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 3 | The site-wide `--home-ink-soft` label token failed AA in **both** themes (2.88:1 light, 3.95:1 dark) and carried functional label/header/standings text on 11+ routes. Fixed this run. Residual: `--home-ink-muted` and `--home-signal` dip under 4.5:1 as small text on strong signal-tinted plates. |
| 2 | Performance | 4 | Fast first paint, zero real console errors, zero failed same-origin requests. The only console noise is the sandbox proxy blocking external map tiles and photos (`ERR_TUNNEL_CONNECTION_FAILED`), which is an environment artifact, not a page defect. |
| 3 | Responsive Design | 4 | Zero horizontal overflow on all 35 routes at 390px and 1440px in both themes. Every route has exactly one `<main>` and one `<h1>`. |
| 4 | Theming | 3 | Token discipline is close to perfect (zero legacy tokens, zero `transition-all`, zero `color-mix` toward literal white/black, zero arbitrary `text-[Npx]` micro-type in new code). Held at 3 by the light-mode headroom of signal and ink-muted on tinted plates, the same systemic issue the fantasy audit named. |
| 5 | Implementation Integrity | 4 | Coherent and product-specific. One route family (`.tool-*`) had drifted onto pre-editorial soft-card corners; that is fixed. A handful of routes still bypass the type scale with bespoke `rem` sizes. |
| **Total** | | **18/20** | **Good, trending Excellent** |

## Executive summary

The Working Instrument is in genuinely strong shape as a system. Structure is flawless
across every route measured, token discipline is enforced rather than aspirational, and
most routes carry zero contrast failures. The site is not a template and could not be
mistaken for one.

The rollout found one thing that actually mattered and fixed it, plus a cluster of
smaller and mostly cosmetic issues.

The one that mattered: **`--home-ink-soft`, the "muted eyebrow / label text" token,
was defined at 45% ink and measured 2.88:1 on paper in light and 3.95:1 on dark paper.**
It fails AA in both themes, and it is not decorative. It carries table headers, stat
labels, standings numbers, and eyebrows across the sports and data dashboards. A single
measured sweep of 11 routes turned up 632 failing text nodes traceable to this one
token, and the token has 188 consumers site-wide, so the real count is higher. The
prior `harden` pass darkened `--home-ink-muted` and the three status tokens and left
this one behind. Raising it to 66% ink clears 4.5:1 on paper, paper-alt, and
paper-raised (5.1 to 5.6) and on the signal-10% and signal-soft tinted plates the
system builds (about 4.75 to 4.81), in both themes. Verified live after the change:
the token resolves to `color-mix(#191813 66%, #F6F5F1)` and every consumer now computes
`rgb(100,99,94)`.

The second, more visible one: **the `.tool-*` shell family had never migrated to the
sharp-plate system.** It is built on the right `--home-*` tokens but carried 28px, 22px,
20px, 14px, and 12px corners, squarely inside the "soft 1rem-plus corners" the Sharp
Plate Rule bans, on about a dozen live routes (the fintech calculators and the
browser-persisted personal tools). It has no brief exempting it. Radii were migrated to
the sharp scale; the post-fix sweep confirms zero card corners above 10px anywhere.

Everything else is small. Two token-headroom residuals that predate this work, one
route (`/food-map`) and one deliberate experiment (`/arcade`) running their own
palettes, a few routes bypassing the type scale, one unguarded admin entrance
animation, and three stale chart fallbacks. Nothing blocking, no `P0`.

## What this run changed, and how it was verified

All five edits are in `src/`; measurement scripts and the running server were kept out
of the tree.

1. **`--home-ink-soft`: `ink 45%` → `ink 66%`** (`src/app/globals.css`). The headline
   fix. Closes the 632-node contrast failure across the dashboards, in both themes.
   Verified live: post-change the token resolves to the 66% value and the previously
   failing world-cup table header, the nba standings numbers, and the fintech field
   labels all recompute to `rgb(100,99,94)`, clearing 4.5:1. A stale hot-reload reading
   briefly showed the old value on one element; a direct `getComputedStyle` probe
   confirmed that was reload lag, not a missed consumer.

2. **`.tool-*` and `.section-panel` radii → sharp scale** (`src/app/globals.css`).
   `.tool-shell` 28/20px, `.tool-band` 28px, `.tool-card` 22px, `.tool-card-hero` 28px,
   `.tool-empty` 22px, `.tool-brand-mark` 12px, `.tool-nav-link` 14px, and
   `.section-panel` 1.5rem all move to `var(--radius-3xl)` (8px) or `var(--radius-2xl)`
   (6px for the nav link). Radius-only, no layout or logic change. The post-fix sweep
   of `/travel`, `/decision-lab`, `/fintech-tools/rent-vs-buy`, and
   `/mba-internship-notifications` reports zero card corners above 10px.

3. **Admin entrance honors reduced motion** (`src/app/admin/page.tsx`). The signed-in
   header's `motion.div` faded and translated on mount regardless of
   `prefers-reduced-motion`; the global CSS guard does not stop Framer's JS-driven
   animation. It now reads `useReducedMotion()` and drops the transform and duration
   when motion is reduced, matching the pattern the fantasy and spacex drawers use.
   `/admin` was the only Framer consumer of 19 that lacked the guard.

4. **Three stale chart fallbacks refreshed** (`ComparisonRadarChart.tsx`,
   `PortfolioPerformanceChart.tsx`, `FrontierCostContextChart.tsx`). These resolve
   `--home-ink-muted` at render time and fell back to `#6F6B60` / `#615B52`, the
   pre-hardening value, if `getComputedStyle` returned empty. Updated to the current
   `#68655A`. Dead unless the stylesheet fails to load, but wrong when it fires.

Typecheck is clean. Jest is 1917 of 1918 passing; the one failure,
`best-ball-client › labels the Underdog final-pick placeholder as undrafted`, fails
identically on a clean tree with these changes stashed, so it is pre-existing and
unrelated to this work.

## Detailed findings by severity

### [P1] `--home-ink-soft` failed WCAG AA as label text in both themes — FIXED

**Location:** `src/app/globals.css` token definition; 188 consumers across
`src/components/football/*`, `src/components/spacex/*`, the sports and world-cup
dashboards, the fintech tools, and more.
**Category:** Accessibility · **Attribution:** [pre-existing]. Predates this branch;
the August `harden` pass hardened the neighboring tokens and missed this one.

At `color-mix(var(--home-ink) 45%, var(--home-paper))` the token resolved to
`rgb(147,145,141)` and measured 2.88:1 on paper, 2.66:1 on paper-alt, and 2.49:1 on a
signal-tinted plate in light, and 3.95:1 on paper in dark. It carries functional text:
`th` column headers ("Seed", "Pos", "#"), stat eyebrows ("East leader", "Best record",
"Teams" x110 on world-cup), and standings values rendered in `text-xs`. Measured across
11 routes at two viewports, 632 text nodes failed on this token alone. Raising it to
66% ink clears every plain surface at 5.1 to 5.6 and the common tinted plates at about
4.75 to 4.81, in both themes. The honest cost, recorded in the token comment, is that
the softest text tier now sits at roughly the same weight as `--home-ink-muted`; a text
tier lighter than that cannot clear AA on this paper.

*Suggested command:* `/impeccable harden` (done this run)

### [P1] The `.tool-*` shell never migrated to sharp plates — FIXED

**Location:** `src/app/globals.css` `.tool-shell`, `.tool-band`, `.tool-card`,
`.tool-card-hero`, `.tool-empty`, `.tool-brand-mark`, `.tool-nav-link`; live on
`/travel`, `/wine-cellar`, `/museum-log`, `/recipe-finder`, `/travel-deals`,
`/decision-lab`, and the three `/fintech-tools/*` calculators.
**Category:** Implementation Integrity / Theming · **Attribution:** [pre-existing].

The shell is built on `--home-*` tokens and hairline rules, so it belongs to the
editorial world, but it carried 28/22/20/14/12px corners against a 10px ceiling and had
no brief claiming an exception. This reads as a route family that predates the
sharp-plate redesign and was never brought across. Radii migrated to the sharp scale;
zero card corners above 10px remain in the post-fix sweep.

*Suggested command:* `/impeccable polish` (radii done this run)

### [P2] `--home-ink-muted` dips under 4.5:1 on strong signal-soft tinted plates — OPEN

**Location:** `/decision-lab` (`tool-section-kicker` "Recommendation", 3.91:1 on
`rgb(236,205,193)`), `/earthquake-pulse` (the "Mag" labels, 4.15 to 4.29:1 on the
magnitude tint plates), `/nba` and the other standings routes (record cells, 4.41:1 on
`rgb(236,221,212)`), `/world-cup-2026`.
**Category:** Theming · **Attribution:** [pre-existing, systemic].

`--home-ink-muted` (`#68655A`) clears 4.5:1 comfortably on plain paper (5.35) but the
signal-soft and status tint plates lift the background luminance enough to drop it under
as small text. This is the same headroom pattern the fantasy audit named, now confirmed
on the data dashboards. It is not solvable by the ink-soft change, which is a different
token. Options: darken `--home-ink-muted` a further step and re-sweep, define a paired
`--home-ink-muted-on-tint`, or lighten the tint mix on the specific plates. This is a
system-level decision, left open deliberately.

*Suggested command:* `/impeccable harden`

### [P2] `--home-signal` as small text fails on paper-alt and tinted plates — OPEN

**Location:** `/fintech-tools/rent-vs-buy` and `/interchange-iq` (signal-colored
financial values, "$233,590" / "$50,000" at 12–13px, 4.45:1 on `rgb(243,242,237)`),
`/travel-deals` (a "Good" badge, 3.77:1), `/march-madness-2026` ("KenPom", "Round 1"
labels, 3.73 to 3.96:1 on tint), `/spacex-mission-control` (a mono kicker, 4.44:1).
**Category:** Accessibility / Theming · **Attribution:** [pre-existing, systemic].

`--home-signal` (`#C93F19`) is 4.57:1 on paper, 4.26:1 on paper-alt, and 3.8 to 4.2:1
on tinted plates. As large text (≥24px) and as icons and borders it is fine, and that is
most of its use. As small body text it is under 4.5:1. The prior fantasy audit found no
live small-text instances; this run did, in the fintech money values. Not auto-changed
because darkening the one accent is a brand decision, not a token cleanup. Recommended
fix: set small signal-colored values to `--home-ink` and keep signal for the large
figure, the border, the icon, and the state, which is where the rule already puts it.

*Suggested command:* `/impeccable harden`

### [P2] `.tool-shell` and `.tool-band` use decorative signal gradient washes — OPEN

**Location:** `src/app/globals.css` `.tool-shell` (two `radial-gradient` washes of
`--home-signal-soft 18%` and `--home-signal 18%`), `.tool-band` (`--home-signal 12%`).
**Category:** Theming · **Attribution:** [pre-existing].

The One Signal Rule reserves the accent for data, state, and action and bars it as a
decorative background wash. The tool shell paints two corner washes of it. This is a
real named-rule violation, but removing it re-textures the whole tool family, which is
a larger aesthetic call than a radius change, so it is flagged rather than done. If the
soft washes are intentional shell character, that belongs in a `/food-map`-style
sub-theme brief; if not, they should come off and the shell should earn its warmth from
paper and hairlines like the rest of the system.

*Suggested command:* `/impeccable quieter`

### [P2] `/food-map` runs an off-token palette that fails AA — OPEN

**Location:** `src/app/food-map/food-map.css`, `--fm-ink-faint: #9c8a71` and the amber
cuisine label; `.fm-stat-label`, `.fm-tab-count`, `.fm-ticket-cuisine` measured 2.68
to 3.21:1.
**Category:** Accessibility · **Attribution:** [pre-existing]. `/food-map` carries its
own `--fm-*` sub-theme, similar to `/arcade`.

Even inside a bespoke sub-theme, functional labels have to clear AA. Contained to one
file; the fix is to darken `--fm-ink-faint` and the cuisine amber until each clears
4.5:1 on its own fields. Left for a food-map-scoped pass rather than tuning a palette
this audit did not design.

*Suggested command:* `/impeccable harden`

### [P3] A few routes bypass the type scale with bespoke `rem` sizes — OPEN

**Location:** `src/app/formula-1/formula-1-client.tsx` (`text-[1.35rem]` through
`text-[2.6rem]` in several places), `src/components/spacex/MissionControlHero.tsx` and
`spacex-mission-control-client.tsx` (`sm:text-[2.8rem]` / `sm:text-[2.9rem]`),
`src/components/ui/ModernButton.tsx` (`text-[0.75rem]`).
**Category:** Implementation Integrity · **Attribution:** [pre-existing].

These are not the banned micro-type `text-[Npx]`, but they still step outside the
tokenized display/title scale, so two routes size their headings by hand. Low stakes.
`ModernButton` should use `text-1xs`; the formula-1 and spacex display sizes should
resolve to the nearest scale step or a shared clamp.

*Suggested command:* `/impeccable typeset`

### [P3] Formula 1 podium numerals fail large-text contrast — OPEN

**Location:** `src/app/formula-1/formula-1-client.tsx` podium block, hardcoded
`#D6B65A` (gold) and `#A4A4AC` (silver) as 41.6px numerals on paper.
**Category:** Accessibility · **Attribution:** [pre-existing].

The gold P1 numeral measured 1.82:1 and the silver P2 2.29:1 against a 3.0:1 floor for
large text, so the two loudest numbers on the podium are the hardest to read. The medal
colors are meaningful, so the fix is to carry gold/silver/bronze as a small accent (a
chip, a rule, the border) and set the numeral itself in `--home-ink`, or to darken the
medal tones until each clears 3.0:1.

*Suggested command:* `/impeccable harden`

### [P3] Admin entrance ignored reduced motion — FIXED

Covered above. `/admin` keeps its own aesthetic but is still bound by the site's
reduced-motion commitment.

### [P3] Three chart fallbacks referenced the pre-hardening ink-muted hex — FIXED

Covered above.

### [P3] Orphaned pre-redesign CSS still ships — OPEN (cleanup)

**Location:** `src/app/globals.css` `.wp-feat-big`, `.wp-feat-small`, `.wp-card`,
`.wp-empty` (soft 1.1–1.4rem corners), `.home-headshot-frame` (1.6rem),
`.home-hero-aside-chip` (0.9rem). Zero consumers in `src/` or `content/`.
**Category:** Implementation Integrity · **Attribution:** [pre-existing].

Left over from the Catalog 97 homepage and the writing redesigns. Harmless (nothing
renders them) but they are soft-corner definitions that a future reader could copy.
Deletion left for a cleanup pass rather than done blind, since dead-by-grep is not
dead-by-proof for CSS reachable through injected HTML.

*Suggested command:* `/impeccable polish`

## Residual systemic patterns

There is one systemic story and it is the same one the fantasy audit told: the
light-mode palette gives its muted and accent tokens almost no headroom over 4.5:1,
while the visual system leans on tinted plates built with `color-mix` against paper.
`--home-ink-soft` was the acute case and is fixed. `--home-ink-muted` (4.4 to 4.5 on
tints) and `--home-signal` (3.8 to 4.5 as small text) are the chronic remainder. Each
is individually reasonable and jointly they guarantee a trickle of tinted-plate failures
wherever muted or accent text lands on a wash. The durable fix is a headroom decision at
the token level, not per-component patches, and it is the same decision for both tokens.

## Positive findings

Token discipline is real and enforced, not aspirational. Across the non-test tree:
zero hardcoded hex in components except justified cases (`getComputedStyle` fallbacks,
external brand colors for the frontier-models and transit charts, `ImageResponse`
OG-image render contexts that cannot see CSS variables, and `theme-color` meta tags),
zero legacy `--surface-*` / `--text-*` / `--border-*` / `--color-*` tokens, zero
`--home-haze` / `--home-acid` / `--home-moss` in new code, zero `transition-all`, zero
`color-mix` toward literal white or black, and zero arbitrary `text-[Npx]` micro-type.
All 19 Framer consumers now call `useReducedMotion`.

Structure holds everywhere. Thirty-five routes, thirty-five single `<main>` elements,
thirty-five single `<h1>` elements, zero horizontal overflow at 390px or 1440px in
either theme. Many routes carry zero contrast failures outright: `/golf`,
`/bay-area-transit`, `/frontier-models`, `/ai-dev-tools`, `/tech-startup-tracker`,
`/github-trending-pulse`, `/news-pulse`, `/score-pools`, `/now`, `/changelog`,
`/accessibility`, `/search`, `/writing`.

Dark mode has more headroom than light, confirmed by token math and spot measurement,
which is why the ink-soft fix was gated on the light-mode numbers.

## What I skipped or could not run

Honest about the gaps so the clean numbers do not imply total coverage.

- **Dark-mode contrast was spot-checked, not fully trusted.** The site splits dark
  styling between the next-themes `.dark` class (the token overrides) and Tailwind's
  `dark:` utilities, which compile to a `prefers-color-scheme` media query. Emulating
  both in one page sometimes left an inconsistent paint, so a few dark readings were
  unreliable. Light mode is the binding constraint here and dark has more headroom, so
  the ink-soft fix was decided on light and confirmed adaptive by token math. A
  dark-only pass on a production build would firm this up.
- **External images and map tiles do not load in this sandbox.** The image and tile
  hosts are egress-denied, so the console `ERR_TUNNEL_CONNECTION_FAILED` entries on the
  sports, food-map, and world-cup routes are environment artifacts, and the
  spacex "Falcon 9 Block 5" white-on-light reading (1.12:1) is a caption over a mission
  photo that never painted, not a live defect. Both were excluded from findings. A run
  with images would need to re-check the spacex photo captions.
- **Coverage is 35 of ~40 Working Instrument routes.** The dynamic-parameter routes
  (`/portfolio/[slug]`, `/writing/[slug]`, `/fantasy-football/tiers/[position]`),
  `/enablement-assistant`, `/polling-aggregator` deep states, and `/admin` signed-in
  were not swept. The fantasy routes were audited separately on 2026-08-07 and are not
  re-scored here.
- **The seven Catalog 97 routes and `/admin` were intentionally excluded from
  design-rule scoring**, per their own briefs.
- **The deterministic `detect.mjs` was not run.** Prior briefs proved with a positive
  control that it cannot read Tailwind utilities or JSX inline style objects, which is
  how this site is styled, so a zero from it carries no information. The computed-value
  sweep is the real mechanical check for this codebase.

## Recommended next actions

1. **[P2] `/impeccable harden`** on the two remaining token-headroom cases together:
   `--home-ink-muted` on tinted plates and `--home-signal` as small text. One token-level
   decision closes both, and it is the last real accessibility item on the site.
2. **[P2] `/impeccable quieter`** on the `.tool-shell` decorative signal washes, or a
   `shell-tool` brief that declares them intentional.
3. **[P2] `/impeccable harden`** scoped to `/food-map`'s `--fm-*` palette.
4. **[P3] `/impeccable typeset`** to fold the formula-1 and spacex bespoke `rem` display
   sizes back onto the scale, and fix the podium numeral contrast.
5. **[P3] `/impeccable polish`** to delete the orphaned `.wp-*` and `.home-headshot-frame`
   CSS.

Re-run `/impeccable audit` after the harden pass; the two dimensions holding this at 18
are Accessibility and Theming, and both move on the same fix.
