# Styling System

Current styling and design-token reference for the live app.

**Last updated:** 2026-04-13

---

## Core Principles

- token-driven colors, spacing, type, and shadows via the `--home-*` editorial palette
- light and dark mode support via CSS variables (every `--home-*` token has a `.dark` counterpart)
- the editorial system (`--home-paper`, `--home-ink`, `--home-haze`, etc.) is the **site-wide standard** for all routes except `/admin`
- shared shell helpers (`home-page`, `home-shell`, `home-card`, `home-kicker`) for page rhythm
- accessible focus styles and 44px minimum touch targets
- restrained motion that respects reduced-motion preferences

Legacy semantic tokens (`--surface-*`, `--text-*`, `--border-*`, `--color-primary`) are aliased to `--home-*` equivalents in `globals.css` for backwards compatibility. New code should use `--home-*` tokens directly. The only route that intentionally uses a different aesthetic is `/admin`.

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

- `--color-success`, `--color-warning`, `--color-error` — back-compat aliases; in new code prefer the
  canonical `--home-positive` / `--home-warning` / `--home-negative` (see *Semantic status colors* below)
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

### Dark-mode elevation (raised surfaces)

To lift a surface one step above its background, **use the theme-aware elevation token**, never a
literal `white`/`black` mix:

- `--home-paper-raised` = `color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))`
- `--home-elev-mix` flips per theme — `white` in light, `black` in dark (`globals.css` ~L196 / ~L278)

**Anti-pattern (do not introduce):** `color-mix(in srgb, var(--home-paper) 92%, white)`. Mixing toward a
literal `white` lightens the surface in *both* themes; in dark mode an elevated panel must darken
(mix toward black), so a white mix renders the surface wrong. When you need a custom ratio, mix toward
`var(--home-elev-mix)` (e.g. `color-mix(in srgb, var(--home-paper-alt) 80%, var(--home-elev-mix))`),
not toward `white`/`black` directly. The shared `SurfaceCard` (football) already does this correctly —
reuse it before hand-rolling an elevated panel.

### Semantic status colors — canonical names

Prefer the `--home-*` semantic tokens in new code; the `--color-*` names are aliases kept for
back-compat (`globals.css` aliases `--color-success → var(--home-positive)`, etc.):

| Use | New code | Legacy alias (avoid in new code) |
|-----|----------|----------------------------------|
| Positive / gain / success | `--home-positive` | `--color-success` |
| Negative / loss / error | `--home-negative` | `--color-error` |
| Warning / caution / tie | `--home-warning` | `--color-warning` |

All three have `.dark` counterparts, so use them for theme-aware gain/loss and status — never hardcode
green/red hex (e.g. `#22A06B`/`#D54E4E`). Decorative, brand, or categorical colors (medal tones, party
colors, team crests) may stay raw when no token represents them.

### Charts and D3 (theme-aware series colors)

D3/SVG fills can't read Tailwind classes, so charts must resolve token colors **at render time**:

- Resolve via `getComputedStyle(document.documentElement).getPropertyValue('--home-haze')` inside the
  render/effect (re-resolve on theme change). `PortfolioPerformanceChart` is the reference
  implementation; `ComparisonRadarChart` (hardcoded `#2563EB`, stale vs `--home-haze` `#5672F8`) is the
  anti-pattern.
- Never bake a token's hex into a constant (it drifts when the token changes and ignores dark mode).
- Avoid ink-equivalent tones (e.g. `#12110F`) for logo/series tiles — they vanish on dark paper.
- Investments charts should share **one** categorical palette so a holding keeps one color across the
  donut, table sparkline, and research header.

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

Use the `home-*` helpers first for new route work. The older semantic helpers remain available for routes that already use them.

---

## Typography

Fonts are loaded in `src/app/layout.tsx` (five families, each exposed as a CSS variable):

| Font | Variable | Role |
|------|----------|------|
| `Instrument Sans` | `--font-instrument-sans` → `--font-home-sans` | Primary editorial font — UI, nav, body, cards, dashboards |
| `Instrument Serif` | `--font-instrument-serif` → `--font-home-serif` | Display/manifesto moments and selective italic emphasis only |
| `Bricolage Grotesque` | `--font-display` | Drives the V3 editorial-brutalist surfaces (home, about, portfolio, contact, writing wordmarks/section titles) |
| `JetBrains Mono` | `--font-jetbrains-mono` → `--font-mono` | Code blocks and kicker/meta micro-labels |
| `Inter` | `--font-inter` | Legacy body fallback; not the default for new components |

> `STYLING.md` previously listed only four fonts and omitted **Bricolage Grotesque** (`--font-display`). The V3 composition roots and their CSS Modules (`page.module.css`, `about.module.css`, `portfolio.module.css`, `contact.module.css`, `writing.module.css`, `ContactCta.module.css`) reach for `var(--font-display)` directly — confirm against `layout.tsx`, which is the source of truth.

Typography is fluid and token-based via:

- `--text-3xs` / `--text-2xs` — fixed micro sizes (10px / 11px) for dense labels, table cells, and metadata. Registered in the `@theme` block in `globals.css` and exposed as the `text-3xs` / `text-2xs` utilities. Prefer these over arbitrary `text-[10px]` / `text-[11px]` values so micro-type stays consistent and tokenized. They are intentionally non-fluid (these labels should not scale).
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

**Micro-type policy (10–13px).** Use the fixed micro tokens for small labels, and **never** ship an
arbitrary `text-[Npx]` value:

- 10px → `text-3xs`, 11px → `text-2xs` (both fixed/non-fluid by design).
- 12–14px → `text-xs` (fluid `clamp(0.75rem … 0.875rem)`) when the label may scale.
- **Token gap:** there is no *fixed* 12px or 13px token, yet `text-[12px]` (×26) and `text-[13px]` (×20)
  are the most common arbitrary values in the codebase (heaviest in `decision-lab`, `interchange-iq`,
  `budget-planner`, `formula-1`, `travel`, `museum-log`). For dense labels that must **not** scale at 12px,
  add a fixed `--text-1xs: 0.75rem` token to the `@theme` block (exposed as `text-1xs`) rather than
  reintroducing arbitrary px. Pick one policy per label: fluid `text-xs` if scaling is fine, the new fixed
  token if it must stay put. Either way, retire the `text-[Npx]` literals.

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

### Writing Archive Cards (`/writing`)

The archive cards on `/writing` are owned by `src/app/writing/page.tsx`, not `src/components/home/HomePageContent.tsx`.
Do not use the home writing-preview card as the visual source of truth for the archive page.

The footer metadata row on both `CuratedWritingCard` and `ArchiveWritingCard` is a locked pattern and should stay visually stable:

- keep the footer pinned to the bottom with `mt-auto`
- keep the outer row as `flex items-center justify-between gap-4 pt-4`
- keep the divider material as a top border using `var(--home-rule)`
- keep the left metadata cluster as one line: reading time plus up to two `resume-chip` tags
- preserve the original reading-time styling: `Instrument Sans`, `0.8rem`, `gap-1`, `Clock` icon at `h-3.5 w-3.5`
- use real `resume-chip` elements for tags; do not replace them with plain text summaries unless explicitly redesigning the card
- prevent wrapping with layout constraints (`min-w-0`, `overflow-hidden`, `whitespace-nowrap`) instead of shrinking the typography or moving the tags to a second line

This note exists because the archive footer regressed during the April 2026 SEO/archive refactor:

- the footer chips were temporarily replaced with plain text
- the bottom row styling drifted from the original spacing and font sizing
- the fix was to restore the original footer structure and sizing, then add overflow constraints so the entire metadata strip stays on one line

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
