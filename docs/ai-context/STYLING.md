# Styling — AI Context

Fast styling reference for the current app.

**Last updated:** 2026-09-21

---

## Source Files

- `src/app/globals.css` (imports `./catalog97.css` and loads `tailwind.config.ts` through `@config`)
- `src/app/catalog97.css`
- `tailwind.config.ts`
- route-specific TSX components

---

## Token System

Since 2026-09-16 every route renders inside the Catalog 97 shell. `src/app/catalog97.css` declares the `--c97-*` tokens under `[data-c97]` (and `[data-c97-surface]` for nested surfaces), and the page root carries both `data-c97` and the `.c97-page` class.

The same file holds a bridge block, between the `BRIDGE START` and `BRIDGE END` markers, that redeclares every `:root` `--home-*`, `--radius-*`, and `--shadow-*` token as an alias of the Catalog 97 value. Components written against `--home-*` repaint without edits, and `src/app/__tests__/catalog97-bridge.test.ts` asserts the bridge covers every token. The `:root` `--home-*` declarations in `globals.css` stay until the last route family migrates.

Tokens still declared in `globals.css` include:

- `--home-paper`, `--home-paper-alt`, `--home-paper-raised`
- `--home-ink`, `--home-ink-muted`, `--home-ink-soft`
- `--home-rule`, `--home-stone`
- `--home-signal`, `--home-signal-ink`, `--home-signal-soft`
- `--home-positive`, `--home-negative`, `--home-warning`

`--home-haze`, `--home-acid`, and `--home-moss` are deleted and have no declaration in either CSS file, so do not use them.

Legacy aliases such as `--surface-*`, `--text-*`, `--border-*`, and `--color-primary` remain for compatibility, but new docs and components should not introduce them.

---

## Current Visual Language

The root `STYLING.md`, `DESIGN_CHECKLIST.md`, and the "Styling Rules" section of `CLAUDE.md` are the current references, along with `docs/superpowers/specs/2026-09-16-catalog97-unification-design.md` for the migration. The bridge sets `--radius-sm` and `--radius-md` to `0`, and light and dark themes both come from the token system.

Historical theme docs are not current source of truth.

---

## Shared Helpers

Important helpers in `globals.css`:

- `.home-page`
- `.home-shell`
- `.home-shell-tight`
- `.home-shell-narrow`
- `.home-section`
- `.home-card`
- `.home-kicker`
- `.page-shell`
- `.page-shell-tight`
- `.page-section`
- `.section-panel`
- `.section-kicker`
- `.section-subtitle`
- `.surface-muted`
- `.portfolio-card`
- `.portfolio-card-hover`
- `.resume-panel`
- `.resume-section-title`
- `.resume-outline-button`
- `.resume-chip`
- `.tap-target`

---

## Motion Rules

- global reduced-motion CSS exists
- Framer Motion usage should also gate animations with `useReducedMotion`
- route polish should feel intentional, not noisy

---

## Accessibility Rules

- `focus-visible` is styled globally
- links and buttons should stay at or above 44px touch size
- dark mode should come from the token system, not ad hoc color overrides
- every route should rely on the single `main` from `Catalog97Shell`
- portfolio-shell pages should expose a single page-level `h1`
- mobile hero layouts should keep the message and primary CTA in the first viewport when feasible

---

## Practical Rules

- do not use `transition-all` in shared portfolio-shell primitives
- favor the shared `home-*` panel/card helpers before inventing new one-off wrappers
- portfolio and writing cards should surface role, problem space, and impact in the collapsed or default state
