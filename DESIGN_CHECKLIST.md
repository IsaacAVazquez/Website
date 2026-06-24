# Design Checklist

The single pre-merge checklist for any new or edited page, component, or surface. If you build UI in
this repo, run through this before opening a PR. It distills the rules that were previously scattered
across `STYLING.md`, `CLAUDE.md`, `DARK_MODE_USAGE_GUIDE.md`, and `SNAPSHOT_DRIVEN_DASHBOARDS.md`.

**Last updated:** 2026-06-24 · Derived from the 2026-06 site-wide design audit (`docs/DESIGN_AUDIT_2026-06.md`).

> When in doubt, copy a reference implementation instead of inventing: `PortfolioPerformanceChart`
> (themeable D3), `github-trending-pulse` (touch targets + scoped transitions + token micro-type),
> `tech-startup-tracker` (error/loading/verified disclosure + correct row semantics), the football
> `SurfaceCard`/`StatCard`/`FixtureCard` set (theme-aware surfaces), `EditorialPillButton` (guaranteed 44px).

---

## Color & tokens

- [ ] **No hardcoded hex** in components when a token exists. Use `--home-*` directly (`globals.css`).
- [ ] **No literal `white`/`black` in `color-mix`.** For raised surfaces use `var(--home-paper-raised)`,
      or mix toward `var(--home-elev-mix)` (flips white↔black per theme). `color-mix(… , white)` lightens
      in *both* themes and breaks dark mode. Reuse `SurfaceCard` before hand-rolling an elevated panel.
- [ ] **Gain/loss/status use semantic `--home-*` tokens**, not green/red hex: `--home-positive`,
      `--home-negative`, `--home-warning` (each has a `.dark` variant). Do not introduce the legacy
      `--color-success/-error/-warning` aliases in new code.
- [ ] **CSS-Module surfaces alias the globals** (`--x-paper: var(--home-paper)`) — never re-declare the
      palette as fresh hex with its own `.dark` mirror (that creates a parallel source of truth that drifts).
- [ ] No raw Tailwind color literals (`text-gray-500`, `bg-slate-100`) where a token exists.

## Dark mode

- [ ] Every surface has a `.dark` story — verify the page in both themes, not just light.
- [ ] **D3 / SVG charts resolve series colors at render time** via
      `getComputedStyle(document.documentElement).getPropertyValue('--home-…')`, re-resolved on theme
      change. Never bake a token's hex into a constant. Reference: `PortfolioPerformanceChart`.
      Anti-pattern: `ComparisonRadarChart` (`#2563EB`, stale vs `--home-haze`).
- [ ] Avoid ink-equivalent tones (`#12110F`) for logo/series tiles — they vanish on dark paper.

## Typography

- [ ] Editorial type uses `Instrument Sans` (`--font-home-sans`); `Instrument Serif` for display/italic;
      `Bricolage Grotesque` (`--font-display`) for V3 brutalist headings. (See `STYLING.md` for the full table.)
- [ ] **No arbitrary `text-[Npx]`.** 10px → `text-3xs`, 11px → `text-2xs`, 12–14px → `text-xs`
      (fluid). For fixed 12px that must not scale, add/use a fixed `text-1xs` token — don't reintroduce px.
- [ ] Fluid `--text-*` tokens for everything else; headings keep tight tracking + balanced wrapping.

## Accessibility

- [ ] Exactly **one page-level `<h1>`** that renders at runtime. (Conditional state branches — loading /
      unavailable / loaded — that each contain an `<h1>` are fine because only one renders; don't add a
      second `<h1>` that renders *alongside* the first.)
- [ ] Self-shell routes rely on the single `<main>` owned by `ConditionalLayout`. Leaf sections use
      `div`/`section` — **never** a nested `<main>`.
- [ ] **No heading-order skips** (h1 → h3 with no h2).
- [ ] **44px minimum touch targets** on every button, link, input, select, and icon-button
      (`min-h-touch`/`min-w-touch` or `min-h-[44px]`). Recurring offenders: filter chips, pager buttons,
      native `<select>`, icon-only buttons (`h-7`/`h-8`), `min-h-[38px]/[40px]` pills.
- [ ] Icon-only controls have `aria-label` or `sr-only` text.
- [ ] Meaningful images have descriptive `alt`; decorative images use `alt=""` + `aria-hidden`.
- [ ] Form inputs/selects have an associated `<label>` or `aria-label`.
- [ ] **No `role="button"` on a `<tr>`/`<div>` that wraps a real `<button>`** (duplicate tab stops,
      invalid nesting). Make the row OR the inner control interactive, not both.
- [ ] Hover affordances also work on `:focus-visible` (don't drive hover color via JS `onMouseEnter`
      only — keyboard users get no cue).
- [ ] Status is never signaled by color alone — pair with text or an icon.

## Motion

- [ ] **Framer Motion entrances call `useReducedMotion()`** (or wrap in `<MotionConfig reducedMotion="user">`).
      The global CSS `prefers-reduced-motion` guard does **not** stop JS/rAF-driven Framer animation.
      Shared primitives especially (e.g. `PageSummary`) — fixing once covers many routes.
- [ ] CSS animations/transitions have a `prefers-reduced-motion` fallback (or use `motion-safe:`).
- [ ] **No `transition-all`** in shared primitives — transition only the properties that change
      (`transition-[background-color,transform]`).

## Responsive

- [ ] Mobile-first; verify at ~360px. No horizontal overflow; `white-space: nowrap` display text can't clip.
- [ ] Wide data tables use the scroll pattern: `overflow-x-auto` wrapper with `role="region"`, `tabIndex`,
      and a label (progressive column-hiding is a plus).
- [ ] Grids collapse to one column on mobile (responsive `grid-cols-*`).
- [ ] In-page section nav has a mobile equivalent (don't `display:none` it away with no replacement).
- [ ] Hero value-prop + primary CTA stay above the fold on mobile for portfolio/hero routes.

## Snapshot-driven dashboards (data-fetching routes)

- [ ] Ships a per-route **`error.tsx`** (`'use client'`, re-exports `RouteErrorBoundary` with a bespoke
      `surfaceName`) **and** a `loading.tsx` (`RouteLoadingState`). See `SNAPSHOT_DRIVEN_DASHBOARDS.md`.
- [ ] Curated/unverified datasets carry `verified: false` + `asOf` and disclose the unverified state
      on-page (mirror `tech-startup-tracker`).
- [ ] Compliance disclaimers (retirement/investments) stay intact.

## Consistency

- [ ] Extends the existing visual language rather than inventing a new one; reuses token helpers
      (`home-card`, `home-kicker`, `SurfaceCard`, etc.) before route-specific styling.
- [ ] Injected/`dangerouslySetInnerHTML` markup has a defined prose class styling `a/ul/ol/code/strong`
      with `--home-*` tokens (don't leave links default-blue, e.g. the `.changelog-prose` gap).
- [ ] `/admin` is the only editorial-exempt route — but a11y/responsive/motion rules still apply to it.
