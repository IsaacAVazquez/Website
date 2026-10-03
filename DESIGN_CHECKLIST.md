# Design Checklist

The single pre-merge checklist for any new or edited page, component, or surface. If you build UI in
this repo, run through this before opening a PR. It distills the rules that were previously scattered
across `STYLING.md`, `CLAUDE.md`, and `SNAPSHOT_DRIVEN_DASHBOARDS.md`.

**Last updated:** 2026-10-02 · The spacing and stacking lines were added on 2026-10-02. The print section was added on 2026-09-29. Rewritten on 2026-09-27 for Catalog 97 as the only design language, after the close-out deleted the Working Instrument tokens and helpers. Derived from the 2026-06 site-wide design audit (`docs/DESIGN_AUDIT_2026-06.md`).

> When in doubt, copy a reference implementation instead of inventing. Home (`Catalog97Home.tsx`) is
> the print shop reference, `Catalog97ProjectHero` plus any project route shows the hero and signature
> pattern, `ComparisonRadarChart` shows themeable D3, and `tech-startup-tracker` shows the
> error, loading, and verified disclosure with correct row semantics.

---

## Color & tokens

- [ ] No hardcoded hex in components. Every section sets `data-c97-surface` and reads the `--c97-*`
      tokens in `catalog97.css`. The Working Instrument `--home-*` tokens, the legacy `--surface-*`,
      `--text-*`, `--border-*`, and `--color-*` aliases, and the `--radius-*` and `--shadow-*` tokens no
      longer exist, and `src/app/__tests__/catalog97-closeout.test.ts` fails on any read of them.
- [ ] Every section is a surface. A band that changes surface from the one above carries `c97-sheet`
      and a `data-seam`, and a raised block is `.c97-panel` on its sheet, never a `color-mix` toward
      white or black.
- [ ] Gain, loss, and status use `--c97-positive`, `--c97-negative`, and `--c97-warning`, never green or
      red hex. On ink-green those tokens fall back to ink, so status lines there sit on a paper plate.
- [ ] One accent. `--c97-accent` marks data, state, or action and is never a decorative wash or band.
- [ ] Fields (`.c97-field`, chips, code) paint the pale `--c97-field`, so a field inside an espresso,
      chocolate, or lead-ink sheet sits on a paper plate.
- [ ] CSS Modules alias the tokens (`--x-ink: var(--c97-ink)`) and never re-declare the palette as fresh
      hex with its own `.dark` mirror.
- [ ] No arbitrary z-index on an overlay. A tray, toast, drawer, modal, or sheet reads its
      `--c97-z-*` token (`z-[var(--c97-z-drawer)]`), declared on `:root` because some layers portal to
      the body.
- [ ] No raw Tailwind colour literals (`text-gray-500`, `bg-slate-100`), no radius, and no blurred shadow.
      The Tailwind radius and shadow scales compile to nothing, so a leftover `rounded-lg` or `shadow-sm`
      is dead markup to remove.

## Dark mode

- [ ] Every surface has a `.dark` story, so verify the page in both themes, not just light.
- [ ] D3 and SVG charts resolve series colours at render time via
      `getComputedStyle(svgElement).getPropertyValue('--c97-…')`, read from the chart's own element
      because the document root resolves no Catalog 97 token, and re-resolved on theme change
      (`useTheme().resolvedTheme` as an effect dep). Never bake a token's hex into a constant,
      and never pass `var()`/`color-mix()` into SVG *presentation attributes* (they don't resolve
      there, so use resolved values or `.style()`). References: `ComparisonRadarChart` and
      `FrontierCostContextChart`. Investments visuals share one categorical
      palette: `src/components/investments/holdingPalette.ts`.
- [ ] Avoid ink-equivalent tones (`#12110F`) for logo/series tiles, since they vanish on dark paper.

## Typography

- [ ] Type uses the Catalog 97 stack through its tokens and classes, meaning Archivo (`--c97-font-body`) for
      body and UI, Newsreader (`--c97-font-display`, `.c97-serif`) for headings and the names of things,
      Anton (`.c97-poster`, `.c97-poster-sm`) for poster headlines only, and Fragment Mono
      (`--c97-font-mono`, `.c97-mono`, 400 only) for readouts. See `STYLING.md`.
- [ ] Spacing on a type class or `.c97-panel` goes in an inline style, since those classes are
      unlayered and a Tailwind margin or padding utility on the same element silently loses.
- [ ] Every gap, margin, and padding is on the `--c97-sp-0` through `--c97-sp-7` ladder. `sp-0` is the
      hairline step, for an icon beside its label and the padding in a chip or a dense cell, and only an
      optical nudge of 2px or less sits off it. Spacing that changes at a breakpoint uses token utilities
      at every breakpoint, the base one included (`p-[var(--c97-sp-1)] sm:p-[var(--c97-sp-2)]`), and never
      an inline base beside responsive utilities, because the inline style beats every breakpoint. A
      vertical stack is a flex column with a token gap, not `space-y-*`.
- [ ] No arbitrary `text-[Npx]`. 10px → `text-3xs`, 11px → `text-2xs`, fixed 12px → `text-1xs`,
      12–14px that may scale → `text-xs` (fluid). Don't reintroduce px literals.
- [ ] Fluid `--text-*` tokens for everything else; headings keep tight tracking + balanced wrapping.

## Accessibility

- [ ] Exactly one page-level `<h1>` that renders at runtime. (Conditional state branches, meaning loading,
      unavailable, and loaded, that each contain an `<h1>` are fine because only one renders; don't add a
      second `<h1>` that renders *alongside* the first.)
- [ ] Every route relies on the single `<main>` owned by `Catalog97Shell`. Leaf sections use
      `div`/`section` and never a nested `<main>`.
- [ ] No heading-order skips (h1 → h3 with no h2).
- [ ] 44px minimum touch targets on every button, link, input, select, and icon-button
      (`min-h-touch`/`min-w-touch` or `min-h-[44px]`). The recurring offenders are filter chips, pager buttons,
      native `<select>`, icon-only buttons (`h-7`/`h-8`), `min-h-[38px]/[40px]` pills.
- [ ] Icon-only controls have `aria-label` or `sr-only` text.
- [ ] Meaningful images have descriptive `alt`; decorative images use `alt=""` + `aria-hidden`.
- [ ] Form inputs/selects have an associated `<label>` or `aria-label`.
- [ ] No `role="button"` on a `<tr>`/`<div>` that wraps a real `<button>` (duplicate tab stops,
      invalid nesting). Make the row OR the inner control interactive, not both.
- [ ] Hover affordances also work on `:focus-visible` (don't drive hover color via JS `onMouseEnter`
      only, since keyboard users get no cue).
- [ ] Status is never signaled by colour alone, so pair it with text or an icon.

## Motion

- [ ] Entrances are CSS transitions; JS-driven motion reads `useReducedMotion()` from `src/hooks`.
      The global CSS `prefers-reduced-motion` guard does not stop JS/rAF-driven animation.
      Shared primitives especially, since fixing one covers many routes.
- [ ] CSS animations/transitions have a `prefers-reduced-motion` fallback (or use `motion-safe:`).
- [ ] No `transition-all` in shared primitives. Transition only the properties that change
      (`transition-[background-color,transform]`).
- [ ] A hover or state change that should animate declares its own transition. The default in
      `globals.css` covers colour, background, and border at 150ms, and it gives way to any
      transition the element declares.
- [ ] Interface transitions use `var(--c97-ease)`, not the generic `ease`, `ease-in-out`, or `linear`
      keywords. Looping keyframes and `/arcade` are the exceptions.
- [ ] A trailing → or ↗ inside a link or button carries `.c97-arrow` or `.c97-arrow-out`.
- [ ] No `backdrop-filter` on anything that scrolls, and full-height sections use `dvh`, not `vh`.

## Responsive

- [ ] Mobile-first; verify at ~360px. No horizontal overflow; `white-space: nowrap` display text can't clip.
- [ ] Wide data tables use the scroll pattern, an `overflow-x-auto` wrapper with `role="region"`, `tabIndex`,
      and a label (progressive column-hiding is a plus).
- [ ] Grids collapse to one column on mobile (responsive `grid-cols-*`).
- [ ] A grid of three or four cards never leaves one alone on its last row; `.c97-columns` and `.c97-mosaic` handle both counts.
- [ ] The h1, any breadcrumb, and the footer start on the header's content edge at every width, including the wide tool routes.
- [ ] Run `node scripts/layoutSweep.mjs <baseUrl> <routes…>` against a production build and clear every fail at phone (320 to 430), tablet, laptop (1280 to 1512), and big-monitor (1920 and 2560) sizes.
- [ ] In-page section nav has a mobile equivalent (don't `display:none` it away with no replacement).
- [ ] Hero value-prop + primary CTA stay above the fold on mobile for portfolio/hero routes.

## Print

See "Printing on paper" in `STYLING.md` for the measurements behind these.

- [ ] Nothing repeats an SVG as a background under print media. Firefox's engine prints the whole page
      with no text when it has to, and `e2e/print.spec.ts` checks `/`, `/about`, and `/investments`.
- [ ] Nothing that has to reach paper sits under a CSS `filter` or a `mix-blend-mode` in Firefox's
      engine, which prints nothing for such an element. The effect comes off under `@media print`
      inside `@supports (-moz-appearance: none)`, as it does on `.c97-slot-img`, and
      `e2e/print.spec.ts` checks `/about`, `/resume`, and an article in the Firefox project.
- [ ] A layout that would not fit a page about 700px wide narrows under `print` as well as under its
      width query, as in `@media (max-width: 900px), print`, since Safari's engine answers a width
      query with the window's width.
- [ ] A layout that widens with the window holds its wide rule to the screen, as in
      `@media screen and (min-width: 881px)`, so paper takes the narrow arrangement in every engine
      and either orientation. Three stacked children go in block flow, since Safari's engine leaves a
      blank line in a paragraph inside a grid of one column, and a `.c97-columns` with its own gap
      sets `--c97-columns-gap`, which the paper margin reads.
- [ ] Nothing that shows on paper carries a mask, since Safari's engine paints the mask's image over
      the element and Firefox's engine printed the masked seams as straight strips. A shape that has
      to tear on paper is a clip path, and a fade that needs a mask comes off under print media.
      `e2e/print.spec.ts` checks `/`, `/about`, `/investments`, and `/writing`.
- [ ] A disclaimer or a disclosure is never hidden under print media.

## Snapshot-driven dashboards (data-fetching routes)

- [ ] Ships a `loading.tsx` (`RouteLoadingState`). The root `error.tsx` covers render failures.
      See `SNAPSHOT_DRIVEN_DASHBOARDS.md`.
- [ ] Curated/unverified datasets carry `verified: false` + `asOf` and disclose the unverified state
      on-page (mirror `tech-startup-tracker`).
- [ ] Compliance disclaimers (retirement/investments) stay intact.

## Print shop layout

See `STYLING.md` for the method. Before merging a change to one of the seven designed routes or a project
route (the ones in `src/constants/projectPress.ts`); the utility pages and Score Pools use the
bands and vocabulary without the poster hero:

- [ ] The page prints in two lead inks (blue, saffron, vermilion, green, teal, pink, with peach as a
      vermilion tint), a project route takes its pair from `src/constants/projectPress.ts`, and nothing on
      the page labels or names the inks.
- [ ] Every band that changes surface from the one above carries `c97-sheet` and a `data-seam`, and no
      band that continues the same surface does.
- [ ] The h1 uses `.c97-poster` and section h2s use `.c97-poster-sm`; project and article titles stay in
      Newsreader, and nothing below the h2 step is set in Anton.
- [ ] The only shadow is the hard `.c97-offset` in `--c97-overprint`, and it sits outside any element that
      declares its own surface so it prints in the sheet's second ink.
- [ ] Hover and empty fields use the halftone screen, not a colour shift toward white or black.
- [ ] No collage repeats a list further down the page; a clickable plate carries something of its own.
- [ ] At 320px the poster headline wraps without horizontal scroll and the hero's primary action is still
      above the fold.

## Consistency

- [ ] Extends the existing visual language. Compose `c97-band` sections from the `catalog97.css`
      vocabulary (`.c97-row`, `.c97-columns`, `.c97-panel`, `.c97-stat`, `.c97-chip`, `.c97-table`)
      before writing route CSS, and scope any route CSS to a route class.
- [ ] Injected/`dangerouslySetInnerHTML` markup renders inside `.c97-article` (`catalog97.css`), which
      styles `a/ul/ol/code/pre/blockquote/table/img` in the palette. Don't leave links default-blue and
      don't hand-roll a second prose class.
- [ ] `/arcade` keeps its deliberate retro CRT palette, but the accessibility, responsive, and motion rules apply to it.
