# Styling — AI Context

Fast styling reference for the current app.

**Last updated:** 2026-04-03

---

## Source Files

- `src/app/globals.css`
- `tailwind.config.ts`
- route-specific TSX components

---

## Token System

Current live styling is based on CSS variables for:

- brand colors
- neutrals
- surfaces
- text hierarchy
- borders
- shadows
- spacing
- transitions

These are defined in `globals.css` and mapped into Tailwind in `tailwind.config.ts`.

---

## Current Visual Language

- blue/slate palette
- crisp light/dark theme support
- shared shell helpers for spacing rhythm
- rounded panels and cards
- restrained shadow usage

Historical warm/cyberpunk styling docs are not current source of truth.

---

## Shared Helpers

Important helpers in `globals.css`:

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
- favor the shared panel/card helpers before inventing new one-off wrappers
- portfolio and writing cards should surface role, problem space, and impact in the collapsed or default state
