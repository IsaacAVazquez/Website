# Styling — AI Context

Fast styling reference for the current app. The full reference is the root `STYLING.md`.

**Last updated:** 2026-09-27

---

## Source files

- `src/app/catalog97.css` holds every token and component class
- `src/app/globals.css` imports it and keeps the Tailwind wiring, the fluid `--text-*` scale, and a few element defaults
- `tailwind.config.ts`, loaded through `@config`, maps the fluid type scale and compiles the radius and shadow scales to nothing
- route-specific CSS Modules and TSX

---

## Token system

Catalog 97 is the only design language. `src/app/catalog97.css` declares the constants (fonts, chart ramp, spacing and type ladders, riso inks) under `[data-c97]`, which sits on the page root with the `.c97-page` class, and the colours for each sheet under `[data-c97-surface]`. A section sets `data-c97-surface` and reads `--c97-surface`, `--c97-ink`, `--c97-ink-2`, `--c97-label`, `--c97-action`, `--c97-accent`, `--c97-rule`, `--c97-field`, `--c97-panel`, and the status tokens `--c97-positive`, `--c97-negative`, and `--c97-warning`.

The surface rules are descendant selectors (`.c97-page [data-c97-surface=…]`), so they apply to sheets inside the page root and not to the root itself. Anything portalled out of the page, such as a dropdown or a tooltip, portals into the `.c97-page` element and carries its own `data-c97-surface`, or none of the tokens resolve.

The Working Instrument `--home-*` tokens, the legacy `--surface-*`, `--text-*`, `--border-*`, and `--color-*` aliases, `--radius-*`, `--shadow-*`, and the bridge that aliased them were deleted on 2026-09-27. `src/app/__tests__/catalog97-closeout.test.ts` and the ESLint rule `c97/no-working-instrument-tokens` fail on any read of them.

---

## Current visual language

The root `STYLING.md`, `DESIGN_CHECKLIST.md`, and the "Styling Rules" section of `CLAUDE.md` are the current references. The seven designed routes and the 33 project routes print as riso sheets with poster headlines, and the utility pages, Score Pools, and `/admin` use the same bands without the poster hero. Light and dark both come from the surface tokens.

Historical theme docs are not current source of truth.

---

## Shared classes

A route is a sequence of `c97-band` sections, each with its own `data-c97-surface`, with content in a `.c97-shell`. The vocabulary is `.c97-kicker`, `.c97-display`, `.c97-serif` with `.c97-h2`/`.c97-h3`, `.c97-lead`, `.c97-prose`, `.c97-meta`, `.c97-row`, `.c97-columns`, `.c97-panel`, `.c97-stat`, `.c97-chip`, `.c97-table`, `.c97-segmented`, the `.c97-btn` family, `.c97-field`, `.c97-check`, `.c97-range`, and the page furniture (`.c97-article`, `.c97-list`, `.c97-breadcrumb`, `.c97-disclosure`, `.c97-kbd`, `.c97-skeleton`, `.c97-meter`). `globals.css` still provides `.tap-target`, `.sr-only`, `.scroll-shadow-x`, and `.scrollbar-thin`.

The type classes and `.c97-panel` are unlayered and set their own margin or padding, so spacing on the same element goes in an inline style.

---

## Motion rules

- global reduced-motion CSS exists
- entrances are CSS transitions; JS-driven motion reads `useReducedMotion()` from `src/hooks`
- never fade a page or section in from opacity 0

---

## Accessibility rules

- the global `focus-visible` ring takes the surface accent, and `catalog97.css` draws its own on links, buttons, fields, and summaries
- links and buttons should stay at or above 44px touch size
- dark mode should come from the token system, not ad hoc colour overrides
- every route should rely on the single `main` from `Catalog97Shell`
- every route should expose a single page-level `h1`

---

## Practical rules

- do not use `transition-all` in shared primitives
- compose from the `catalog97.css` classes before inventing one-off wrappers
- portfolio and writing cards should surface role, problem space, and impact in the default state
