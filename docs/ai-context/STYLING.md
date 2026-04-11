# Styling — AI Context

Fast styling reference for the current app.

**Last updated:** 2026-04-10

---

## Source Files

- `src/app/globals.css`
- `tailwind.config.ts`
- route-specific TSX components

---

## Token System

Current live styling is based on the `--home-*` editorial CSS variables defined in `globals.css` and mapped into Tailwind in `tailwind.config.ts`.

Use these tokens first in new work:

- `--home-paper`
- `--home-paper-alt`
- `--home-ink`
- `--home-ink-muted`
- `--home-haze`
- `--home-acid`
- `--home-moss`
- `--home-stone`
- `--home-rule`

Legacy aliases such as `--surface-*`, `--text-*`, `--border-*`, and `--color-primary` remain for compatibility, but new docs and components should prefer `--home-*`.

---

## Current Visual Language

- editorial paper/ink palette with acid, haze, moss, and stone accents
- class-based light/dark theme support through token counterparts
- shared `home-*` shell helpers for spacing rhythm
- rounded panels, cards, and editorial section treatments
- restrained shadow usage

Historical theme docs are not current source of truth. `/admin` is the only live route with an intentionally separate visual language.

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
- self-shell routes should rely on a single `main` from `ConditionalLayout`
- portfolio-shell pages should expose a single page-level `h1`
- mobile hero layouts should keep the message and primary CTA in the first viewport when feasible

---

## Practical Rules

- do not use `transition-all` in shared portfolio-shell primitives
- favor the shared `home-*` panel/card helpers before inventing new one-off wrappers
- portfolio and writing cards should surface role, problem space, and impact in the collapsed or default state
