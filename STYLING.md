# Styling System

Current styling and design-token reference for the live app.

**Last updated:** 2026-04-03

---

## Core Principles

- token-driven colors, spacing, type, and shadows
- light and dark mode support via CSS variables
- a homepage-only editorial system can coexist with the default portfolio shell
- shared shell helpers for page rhythm
- accessible focus styles and touch targets
- restrained motion that respects reduced-motion preferences

The live system is blue/slate-based. Older warm or cyberpunk references are historical only.

---

## Source Files

- `src/app/globals.css`
- `tailwind.config.ts`
- `src/components/ui/*`
- `src/components/home/HomePageContent.tsx`

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
- homepage editorial tokens: `--home-paper`, `--home-paper-alt`, `--home-ink`, `--home-ink-muted`, `--home-acid`, `--home-moss`, `--home-haze`, `--home-stone`, `--home-rule`, `--home-dark-paper`, `--home-dark-panel`, `--home-dark-ink`

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
- `.portfolio-card`
- `.portfolio-card-hover`
- `.resume-panel`
- `.resume-section-title`
- `.resume-outline-button`
- `.resume-chip`

Use these before inventing one-off layout wrappers for standard portfolio pages.

---

## Typography

Fonts are loaded in `src/app/layout.tsx`:

- Inter
- JetBrains Mono
- Instrument Sans
- Instrument Serif

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

Homepage editorial usage:

- `Instrument Sans` for homepage UI, navigation treatment, body copy, and project or writing cards
- `Instrument Serif` for oversized manifesto moments and selective italic emphasis only
- keep the default Inter-based system on non-home routes unless a route-specific design explicitly opts out

---

## Theme Behavior

Dark mode is class-based:

- `.dark` on `<html>`
- provided by `next-themes`
- components using CSS variables adapt automatically

Use raw Tailwind `dark:` utilities only when you truly need behavior outside the token system.

## Homepage Editorial System

`/` has a dedicated editorial namespace and should not rely on the shared portfolio cards or section panels for its main art direction.

Current homepage helpers in `globals.css` include:

- `.home-page`
- `.home-shell`, `.home-shell-tight`, `.home-shell-narrow`
- `.home-section`
- `.home-wordmark`
- `.home-button*`
- `.home-card`
- `.home-section-dark`
- `.home-contact-panel`
- `.header-home*`
- `.footer-home*`

Rules for the homepage:

- keep the redesign isolated to `/` unless there is an explicit decision to expand it
- preserve the theme toggle, but use the home tokens so dark mode still feels editorial rather than like the default app theme
- do not introduce route-wide screenshots as a dependency for homepage cards; stay text-forward unless a later content pass adds curated assets
- if motion is added, keep it to reveal or drift effects and disable it under `prefers-reduced-motion`

---

## Accessibility Rules

- `:focus-visible` styles are defined globally
- buttons and links should maintain 44px minimum targets
- reduced-motion behavior is enforced in CSS and should also be respected in Framer Motion components
- self-shell pages should expose one `main` landmark and one page-level `h1`
- homepage and other hero-led portfolio routes should keep the core value proposition and primary CTA above the fold on mobile

---

## Practical Rules

- prefer semantic token usage over raw Tailwind color literals
- match existing shell spacing before adding new wrappers
- keep borders and shadows consistent with current section/card treatment
- shared cards and panels should rely on token helpers before introducing route-specific styling
- do not use `transition-all` in shared primitives; transition only the properties that actually change
- portfolio and writing cards should reveal role, problem space, and impact in the default scan state
- if a route already has a visual language, extend it instead of introducing a disconnected style system
