# Styling System

Current styling and design-token reference for the live app.

**Last updated:** 2026-04-09

---

## Core Principles

- token-driven colors, spacing, type, and shadows via the `--home-*` editorial palette
- light and dark mode support via CSS variables (every `--home-*` token has a `.dark` counterpart)
- the editorial system (`--home-paper`, `--home-ink`, `--home-haze`, etc.) is the **site-wide standard** for all routes except `/admin`
- shared shell helpers (`home-page`, `home-shell`, `home-card`, `home-kicker`) for page rhythm
- accessible focus styles and 44px minimum touch targets
- restrained motion that respects reduced-motion preferences

Legacy semantic tokens (`--surface-*`, `--text-*`, `--border-*`, `--color-primary`) are aliased to `--home-*` equivalents in `globals.css` for backwards compatibility. New code should use `--home-*` tokens directly. The only route that intentionally uses a different aesthetic is `/admin` (cyberpunk theme).

---

## Source Files

- `src/app/globals.css`
- `tailwind.config.ts`
- `src/components/ui/*`
- `src/components/home/HomePageContent.tsx`

---

## Token Model

Global tokens are defined in `src/app/globals.css`.

### Primary palette (editorial system — use these in new code)

| Token | Purpose |
|-------|---------|
| `--home-paper` | Primary background |
| `--home-paper-alt` | Secondary/card background |
| `--home-ink` | Primary text, strong fills |
| `--home-ink-muted` | Secondary/muted text |
| `--home-haze` | Accent (links, focus rings, highlights) |
| `--home-acid` | Accent (charts, badges, gradients) |
| `--home-moss` | Accent (success-adjacent, nature tones) |
| `--home-stone` | Decorative borders, subtle fills |
| `--home-rule` | Standard borders and dividers |
| `--home-dark-paper` / `--home-dark-panel` / `--home-dark-ink` | Dark-section overrides |

For intermediate tones, use `color-mix()`:
- Tertiary text: `color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))`
- Elevated surface: `color-mix(in srgb, var(--home-paper) 92%, white)`
- Softer card bg: `color-mix(in srgb, var(--home-paper-alt) 78%, white)`

### Semantic tokens (kept for charts and status indicators)

- `--color-success`, `--color-warning`, `--color-error` — still valid for semantic states
- `--color-secondary`, `--color-accent` — available but prefer `--home-haze` / `--home-acid`

### Legacy aliases (deprecated — do not use in new code)

These are defined in `globals.css` but resolve to `--home-*` equivalents:

- `--surface-primary` → `var(--home-paper)`
- `--surface-secondary` → `var(--home-paper-alt)`
- `--text-primary` → `var(--home-ink)`
- `--text-secondary` → `var(--home-ink-muted)`
- `--border-primary` → `var(--home-rule)`
- `--color-primary` → `var(--home-haze)`

### Other groups

- neutrals: `--neutral-50` through `--neutral-950`
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

Font usage across the site:

- `Instrument Sans` (`--font-home-sans`) is the primary font for all editorial surfaces — UI, navigation, body copy, cards, and dashboards
- `Instrument Serif` (`--font-home-serif`) for oversized manifesto moments and selective italic emphasis only
- `Inter` remains available as a system font but is no longer the default for new components

---

## Theme Behavior

Dark mode is class-based:

- `.dark` on `<html>`
- provided by `next-themes`
- components using CSS variables adapt automatically

Use raw Tailwind `dark:` utilities only when you truly need behavior outside the token system.

## Editorial System (Site-Wide)

The editorial design system is the site-wide standard as of April 2026. All routes (except `/admin`) use the `--home-*` palette, `home-card`/`home-kicker` rhythm, and Instrument Sans typography. The system uses warm paper tones, tight tracked type, and acid/haze accent gradients.

**Color tokens (light / dark):**

| Token | Light | Dark |
|-------|-------|------|
| `--home-paper` | `#F1EBDE` | `#12110F` |
| `--home-paper-alt` | `#E7DECD` | `#1A1916` |
| `--home-ink` | `#12110F` | `#F4EEE1` |
| `--home-ink-muted` | `#615B52` | `#C6BCA8` |
| `--home-acid` | `#D7E74F` | `#A8B846` |
| `--home-acid-soft` | `#EEF49D` | `#596134` |
| `--home-moss` | `#B8C793` | `#6F7A4F` |
| `--home-haze` | `#5672F8` | `#6F85FF` |
| `--home-stone` | `#CAC0AE` | `#4F493F` |
| `--home-rule` | `rgba(18,17,15,0.12)` | `rgba(244,238,225,0.14)` |

**Fonts:**
- `--font-home-sans` → `Instrument Sans` (UI, nav, body, cards)
- `--font-home-serif` → `Instrument Serif` (manifesto moments, selective italic emphasis only)

### Layout shells

| Class | Max-width | Use |
|-------|-----------|-----|
| `.home-shell` | 86rem | primary full-width sections |
| `.home-shell-tight` | 70rem | tighter reading sections |
| `.home-shell-narrow` | 76rem | intermediate sections |

All shells: `width: 100%; margin-inline: auto; padding-inline: 1rem` (1.5rem @sm, 2rem @lg).

### Section wrappers

- `.home-page` — root wrapper; multi-stop radial gradient background (acid top-left, haze top-right, paper base)
- `.home-section` — `padding-block: clamp(1.25rem, 2vw, 2rem)` (standard vertical rhythm)
- `.home-hero-section` — `padding-top: clamp(1.375rem, 2.5vw, 2.375rem)`
- `.home-contact-section` — `padding-bottom: clamp(1.25rem, 2.5vw, 2rem)`
- `.home-section-dark` — dark panel with haze radial gradient; use for writing/dark sections
- `.home-section-acid` — acid-yellow gradient background; use sparingly for accent moments

### Typography

| Class | Description |
|-------|-------------|
| `.home-wordmark` | 3–6.75rem, 700, −0.08em tracking, uppercase; site name treatment |
| `.home-hero-title` | 2.85–5.8rem, 600, −0.08em; hero heading |
| `.home-section-title` | 2.15–4.2rem, 600, −0.065em, max 12ch; section headings |
| `.home-project-title` / `.home-writing-title` | 1.55–2.1rem, 600, −0.05em; card titles |
| `.home-body` | 1.02–1.16rem, lh 1.65, max 40rem; standard body copy |
| `.home-body-strong` | `.home-body` variant with higher ink saturation |
| `.home-hero-body` | `.home-body` with max-width 33rem; hero paragraph |
| `.home-kicker` | 0.72rem, 600, +0.14em, uppercase; section label above headings |
| `.home-meta` | 0.72rem, 600, +0.12em, uppercase; card metadata (role, date) |
| `.home-note-copy` / `.home-writing-copy` | 0.96rem, lh 1.6; secondary card copy |
| `.home-manifesto` | 3–6.4rem, 400, −0.08em; large ghost-weight display text |
| `.home-manifesto em` | Instrument Serif italic, full ink color |
| `.home-intro-copy` | `home-body` constrained to 38rem |
| `.home-section-copy` | body constrained to 33rem |
| `.home-manifesto-copy` | body constrained to 28rem |

Dark variants: `.home-kicker-dark`, `.home-body-dark`, `.home-meta-dark`, `.home-section-title-dark`, `.home-section-intro-dark`, `.home-writing-title` (uses `--home-dark-ink` by default).

### Buttons

Base: `.home-button` — 48px min-height, pill shape (radius 999px), Instrument Sans 600, 0.95rem, transition on bg/border/color/shadow/transform.

| Modifier | Style |
|----------|-------|
| `.home-button-primary` | ink fill, paper text; hover blends haze |
| `.home-button-secondary` | paper bg, stone border; hover adds acid tint |
| `.home-button-dark` | transparent, dark-ink text; for use on dark sections |

### Cards

- `.home-card` — 1.6rem radius, paper bg 88%, `shadow-md`, lifts on hover (`translateY(-4px)`, `shadow-lg`)
- `.home-project-card` — `.home-card` + `padding: 1.5rem`
- `.home-writing-card` — `.home-card` on dark panel, no shadow by default; hover tints with haze
- `.home-note-card` — small inset card, 1.1rem radius, paper-alt bg

### Hero art panel

- `.home-artboard` — constrained to `min(100%, 44rem)`, centered
- `.home-art-panel` — 1.22 aspect ratio, 1.8rem radius, split gradient background, `shadow-xl`
- `.home-art-split-left` / `.home-art-split-right` — acid-left / haze-right radial gradients at the center divide
- `.home-art-orb-left` / `.home-art-orb-right` — blurred (54px) color orbs for ambient glow
- `.home-art-caption` — bottom-left pill label inside the art panel

### Headshot

- `.home-headshot-frame` — `min(100%, 26rem)`, 3/4 aspect ratio, 1.8rem radius, `shadow-xl`

### Spotlight / writing section components

- `.home-spotlight-board` — large card with haze radial + paper gradient, `shadow-xl`
- `.home-spotlight-note` — pill badge at top of spotlight card
- `.home-spotlight-poster` — large display text (1.6–3rem), second `<span>` uses Instrument Serif italic
- `.home-spotlight-tags` — flex pill row at bottom of spotlight card

### Misc components

- `.home-pill` — acid-tinted pill badge (e.g. "Project 01")
- `.home-pill-dark` — dark variant of pill
- `.home-inline-link` — icon-paired text link, haze on hover
- `.home-intro-block` — centered grid, used for page-level intro above hero
- `.home-manifesto-grid` — two-column grid for manifesto + copy pairing
- `.home-section-intro` — two-column grid for section heading + copy pairing
- `.home-contact-panel` — bordered rounded panel with haze radial gradient, centered, used for the CTA section

### Motion

- `.home-reveal` — fade + `translateY(18px)` in via `home-reveal` keyframe (700ms, `easing-smooth`)
- `.home-reveal-delay-1` / `-delay-2` / `-delay-3` — staggered delays (120ms / 220ms / 320ms)
- `.home-gradient-drift` — 18s infinite subtle drift on the art background

All motion respects `prefers-reduced-motion`.

### Header overrides (home only)

Applied to `StaticHeader` when on `/`:

- `.header-home` — stone border bottom
- `.header-home-brand` — Instrument Sans 700, uppercase, ink
- `.header-home-link` — pill nav links; active gets ink border + paper bg; inactive is ink-muted
- `.header-home-mobile-link` — uppercase Instrument Sans for mobile menu
- `.header-home-control` — theme toggle border/bg using paper/stone tokens
- `.header-home-menu` — mobile menu panel in paper tones

### Footer overrides (home only)

- `.footer-home` — paper-tinted footer background with home-rule top border
- `.footer-home-panel` — card panel inside footer (haze gradient + paper bg)
- `.footer-home-text` / `.footer-home-text-strong` — muted / full ink variants
- `.footer-home-icon` — bordered icon buttons; acid hover tint

### Rules

- all routes except `/admin` use the editorial `--home-*` palette — do not introduce a separate token system
- preserve the theme toggle; dark mode uses the `.dark` counterparts of `--home-*` tokens
- do not introduce route-wide screenshots as a dependency for homepage cards; stay text-forward unless a later content pass adds curated assets
- all motion classes must be paired with reduced-motion guards in CSS (`@media (prefers-reduced-motion: reduce)`)

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
