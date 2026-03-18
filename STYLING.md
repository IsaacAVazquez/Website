# Styling System

Current styling and design-token reference for the live app.

**Last updated:** 2026-03-17

---

## Core Principles

- token-driven colors, spacing, type, and shadows
- light and dark mode support via CSS variables
- shared shell helpers for page rhythm
- accessible focus styles and touch targets
- restrained motion that respects reduced-motion preferences

The live system is blue/slate-based. Older warm or cyberpunk references are historical only.

---

## Source Files

- `src/app/globals.css`
- `tailwind.config.ts`
- `src/components/ui/*`

---

## Token Model

Global tokens are defined in `src/app/globals.css`.

Important groups:

- colors: `--color-primary`, `--color-secondary`, `--color-accent`, `--color-success`, `--color-warning`, `--color-error`
- neutrals: `--neutral-50` through `--neutral-950`
- surfaces: `--surface-primary`, `--surface-secondary`, `--surface-elevated`, `--surface-overlay`
- text: `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-inverse`
- borders: `--border-primary`, `--border-secondary`, `--border-accent`
- spacing: `--space-xs` through `--space-4xl`
- shadows: `--shadow-sm` through `--shadow-xl`

Do not hardcode hex colors in components when a token exists.

---

## Tailwind Integration

`tailwind.config.ts` maps the token system into:

- font families
- fluid font sizes
- semantic colors
- text colors
- border colors
- spacing
- shadows
- touch target helpers:
  - `min-h-touch`
  - `min-w-touch`

Plugins:

- `@tailwindcss/typography`
- `tailwindcss-animate`

---

## Shared Layout Helpers

The current shell uses these reusable classes from `globals.css`:

- `.page-shell`
- `.page-shell-tight`
- `.page-section`
- `.section-panel`
- `.section-kicker`
- `.section-subtitle`
- `.surface-muted`

Use these before inventing one-off layout wrappers for standard portfolio pages.

---

## Typography

Fonts are loaded in `src/app/layout.tsx`:

- Inter
- JetBrains Mono

Typography is fluid and token-based via:

- `--text-xs`
- `--text-sm`
- `--text-base`
- `--text-lg`
- `--text-xl`
- `--text-2xl`
- `--text-3xl`
- `--text-4xl`
- `--text-5xl`
- `--text-6xl`

Headings use tighter tracking and balanced wrapping by default.

---

## Theme Behavior

Dark mode is class-based:

- `.dark` on `<html>`
- provided by `next-themes`
- components using CSS variables adapt automatically

Use raw Tailwind `dark:` utilities only when you truly need behavior outside the token system.

---

## Accessibility Rules

- `:focus-visible` styles are defined globally
- buttons and links should maintain 44px minimum targets
- reduced-motion behavior is enforced in CSS and should also be respected in Framer Motion components

---

## Practical Rules

- prefer semantic token usage over raw Tailwind color literals
- match existing shell spacing before adding new wrappers
- keep borders and shadows consistent with current section/card treatment
- if a route already has a visual language, extend it instead of introducing a disconnected style system
