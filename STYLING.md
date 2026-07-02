# Styling System

Current styling and design-token reference for the live app.

**Last updated:** 2026-07-02 · **Working Instrument** redesign, phases one and two complete: flagship surfaces rebuilt; every dashboard, tool, and personal surface refreshed to the instrument language (sharp `--radius-*` plates, flat paper, semantic status tokens). `--home-haze`/`--home-acid`/`--home-moss` are token definitions only — zero component usages remain (the scoped F1-red override in `formula-1.module.css` and `/arcade`'s deliberate CRT aesthetic are the two sanctioned exceptions). `tailwind.config.ts` is loaded via `@config` in `globals.css`; `min-h-touch`, class-based `dark:`, and the fluid `text-*` scale are live.

---

## Core Principles

- token-driven colors, spacing, type, and shadows via the `--home-*` palette
- light and dark mode support via CSS variables (every `--home-*` token has a `.dark` counterpart)
- the **Working Instrument** system (limestone paper, graphite ink, one signal-orange accent,
  hairline rules, mono readouts) is the site-wide standard for all routes except `/admin`
- one accent: `--home-signal` is reserved for data, state, and action (links, live dots, focus,
  active states). It is never a decorative wash. `--home-acid` / `--home-haze` / `--home-moss`
  remain **defined but legacy** — pre-redesign dashboards still read them; do not use them in new code
- CSS-Module surfaces alias the global tokens (`--x-paper: var(--home-paper)`) — never re-declare
  the palette as fresh hex (see the flagship modules `page.module.css`, `portfolio.module.css`,
  `about.module.css`, `contact.module.css` for the reference pattern)
- accessible focus styles and 44px minimum touch targets
- restrained motion that respects reduced-motion preferences: numbers count up once, lines draw in
  once, nothing loops, no marquees

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

### Primary palette (Working Instrument — use these in new code)

| Token | Purpose |
|-------|---------|
| `--home-paper` | Primary background (limestone) |
| `--home-paper-alt` | Secondary/chip background |
| `--home-paper-raised` | Lifted panel/card surface (theme-aware elevation) |
| `--home-ink` | Primary text, strong fills (graphite) |
| `--home-ink-muted` | Secondary/muted text |
| `--home-signal` | **The accent.** Data, state, action: links, live dots, active chips, focus |
| `--home-signal-soft` | Soft signal tint for chips/badges |
| `--home-stone` | Decorative borders, subtle fills |
| `--home-rule` | Standard hairline borders and dividers |
| `--home-dark-paper` / `--home-dark-panel` / `--home-dark-ink` | Dark-section overrides |

**Legacy accents (token definitions only; do not use):**
`--home-haze` (blue), `--home-acid` / `--home-acid-soft` (yellow-green), `--home-moss`.
Phase two migrated every component usage off these (wins/qualification → `--home-positive`,
ties/deadlines → `--home-warning`, failures → `--home-negative`, categorical chips → ink/stone
mixes). The definitions remain only as a cascade safety net and can be removed once external
consumers are ruled out.

For intermediate tones, use `color-mix()` — always mixing toward another token, never toward
literal `white`/`black`:
- Tertiary text: `color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))`
- Elevated surface: `var(--home-paper-raised)` (or mix toward `var(--home-elev-mix)` for a custom ratio)
- Softer hairline: `color-mix(in srgb, var(--home-rule) 55%, transparent)`

### Semantic tokens (kept for charts and status indicators)

- `--color-success`, `--color-warning`, `--color-error` — back-compat aliases; in new code prefer the
  canonical `--home-positive` / `--home-warning` / `--home-negative` (see *Semantic status colors* below)
- `--color-secondary`, `--color-accent` — back-compat aliases; use `--home-signal` in new code

### Legacy aliases (deprecated — do not use in new code)

These are defined in `globals.css` but resolve to `--home-*` equivalents:

- `--surface-primary` → `var(--home-paper)`
- `--surface-secondary` → `var(--home-paper-alt)`
- `--text-primary` → `var(--home-ink)`
- `--text-secondary` → `var(--home-ink-muted)`
- `--border-primary` → `var(--home-rule)`
- `--color-primary` → `var(--home-signal)`

### Other groups

- neutrals: `--neutral-50` through `--neutral-950`
- spacing: `--space-xs` through `--space-4xl`
- shadows: `--shadow-sm` through `--shadow-xl`
- radii: `--radius-sm` (2px) through `--radius-3xl` (8px) — the Working Instrument scale is
  deliberately sharp; `--radius-pill` stays for genuinely round controls. Do not reintroduce
  soft 1rem+ card radii.

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

- Resolve via `getComputedStyle(document.documentElement).getPropertyValue('--home-signal')` inside the
  render/effect, and re-resolve on theme change (`useTheme().resolvedTheme` as an effect dep).
  Reference implementations: `PortfolioPerformanceChart`, `ComparisonRadarChart`, and
  `FrontierCostContextChart`. Remember `var()`/`color-mix()` never resolve inside SVG *presentation
  attributes* — pass concrete resolved values to `.attr()`, or use `.style()`.
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

Fonts are loaded in `src/app/layout.tsx` (three families, each exposed as a CSS variable):

| Font | Variable | Role |
|------|----------|------|
| `Instrument Sans` | `--font-instrument-sans` → `--font-home-sans` | Primary face — display headlines, UI, nav, body, cards, dashboards. Variable weight; instrument display sits around 560–640 with −0.03em tracking |
| `Instrument Serif` | `--font-instrument-serif` → `--font-home-serif` | One italic gesture per surface (a dek word, a closing statement). Never body copy |
| `Fragment Mono` | `--font-fragment-mono` → `--font-mono` | Readouts, kickers, micro-labels, code. 400 only — do not fake bold weights |

**Retired families (2026-07):** Bricolage Grotesque, Inter, and JetBrains Mono no longer load.
Their old variables (`--font-display`, `--font-inter`, `--font-jetbrains-mono`) are aliased to the
new stack in `globals.css` as a safety net for pre-redesign surfaces — new code must use
`--font-home-sans` / `--font-home-serif` / `--font-mono` directly.

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
- `--text-1xs` (fixed 12px) is registered in the `@theme` block for dense labels that must not
  scale. Pick one policy per label: fluid `text-xs` if scaling is fine, `text-1xs` if it must stay
  put. The old `text-[12px]`/`text-[13px]` literals were retired in phase two — do not reintroduce them.

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

## Working Instrument System (Site-Wide)

The Working Instrument design system is the site-wide standard as of July 2026 (phase one shipped
the flagship surfaces: `/`, `/about`, `/portfolio`, `/resume`, `/contact`, header, footer, and the
shared ContactCta; phase two propagates it to the dashboards). All routes (except `/admin`) use the
`--home-*` palette and Instrument Sans typography. The system uses cool limestone paper, graphite
ink, hairline rules, mono readouts, and exactly one accent reserved for data, state, and action.

**Color tokens (light / dark):**

| Token | Light | Dark |
|-------|-------|------|
| `--home-paper` | `#F6F5F1` | `#151412` |
| `--home-paper-alt` | `#EFEDE6` | `#1C1B18` |
| `--home-ink` | `#191813` | `#ECEAE2` |
| `--home-ink-muted` | `#6F6B60` | `#9B9585` |
| `--home-signal` | `#C93F19` | `#FF6B3B` |
| `--home-signal-soft` | `#F6E0D7` | `#462214` |
| `--home-stone` | `#D8D4C9` | `#45423B` |
| `--home-rule` | `rgba(25,24,19,0.14)` | `rgba(236,234,226,0.16)` |
| `--home-acid` *(legacy)* | `#D7E74F` | `#A8B846` |
| `--home-haze` *(legacy)* | `#5672F8` | `#6F85FF` |
| `--home-moss` *(legacy)* | `#B8C793` | `#6F7A4F` |

**Fonts:**
- `--font-home-sans` → `Instrument Sans` (display + UI + body)
- `--font-home-serif` → `Instrument Serif` (one italic gesture per surface)
- `--font-mono` → `Fragment Mono` (readouts, kickers, micro-labels)

**Recurring primitives (currently defined per flagship CSS module; extract when phase two needs
them shared):** signal-dot kicker, hairline panel (`--home-rule` border + `--home-paper-raised`
fill + 10px radius), mono readout rows with tabular numerals, stat strips with hairline cell
dividers, ledger rows (hairline top rule + soft hairline row dividers), and the instrument button
pair (ink solid that hovers signal, hairline ghost that hovers signal).

### Layout shells

| Class | Max-width | Use |
|-------|-----------|-----|
| `.home-shell` | 86rem | primary full-width sections |
| `.home-shell-tight` | 70rem | tighter reading sections |
| `.home-shell-narrow` | 76rem | intermediate sections |

All shells: `width: 100%; margin-inline: auto; padding-inline: 1rem` (1.5rem @sm, 2rem @lg).

### Section wrappers

- `.home-page` — root wrapper; flat `--home-paper`, no ambient gradients (surfaces earn emphasis through hairlines and type, not washes)
- `.home-section` — `padding-block: clamp(1.25rem, 2vw, 2rem)` (standard vertical rhythm)
- `.home-hero-section` — `padding-top: clamp(1.375rem, 2.5vw, 2.375rem)`
- `.home-contact-section` — `padding-bottom: clamp(1.25rem, 2.5vw, 2rem)`


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
| `.home-button-primary` | ink fill, paper text; hover blends toward signal |
| `.home-button-secondary` | paper bg, stone border; hover adds a signal-soft tint |
| `.home-button-dark` | transparent, dark-ink text; for use on dark sections |

### Cards

- `.home-card` — 1.6rem radius, paper bg 88%, `shadow-md`, lifts on hover (`translateY(-4px)`, `shadow-lg`)
- `.home-project-card` — `.home-card` + `padding: 1.5rem`
- `.home-writing-card` — `.home-card` variant, no shadow by default
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

### Headshot

- `.home-headshot-frame` — `min(100%, 26rem)`, 3/4 aspect ratio, 1.8rem radius, `shadow-xl`

### Misc components

- `.home-pill` — signal-soft-tinted pill badge (e.g. "Project 01")
- `.home-pill-dark` — dark variant of pill
- `.home-inline-link` — icon-paired text link, signal on hover
- `.home-intro-block` — centered grid, used for page-level intro above hero
- `.home-section-intro` — two-column grid for section heading + copy pairing

### Motion

- `.home-reveal` — fade + `translateY(18px)` in via `home-reveal` keyframe (700ms, `easing-smooth`)
- `.home-reveal-delay-1` / `-delay-2` / `-delay-3` — staggered delays (120ms / 220ms / 320ms)
- Nothing loops: entrances play once (see the F1 start-light gantry for the pattern)

All motion respects `prefers-reduced-motion`.

### Header (site-wide)

Applied to `StaticHeader`:

- `.header-home` — hairline `--home-rule` border bottom
- `.header-home-brand` — Instrument Sans 640, normal case, signal dot prefix
- `.header-home-link` — quiet sans nav links; active gets an inset 2px `--home-signal` underline; inactive is ink-muted
- `.header-home-mobile-link` — Instrument Sans 560, normal case, for the mobile menu
- `.header-home-control` — theme toggle with hairline border, transparent bg
- `.header-home-menu` — mobile menu panel on `--home-paper-raised`

### Footer (site-wide)

- `.footer-home` — paper background with hairline top border
- `.footer-home-panel` — card panel inside footer on `--home-paper-raised`
- `.footer-home-colophon` — mono colophon with signal dot prefix
- `.footer-home-text` / `.footer-home-text-strong` — muted / full ink variants
- `.footer-home-icon` — hairline-bordered icon buttons; ink fill on hover

### Rules

- all routes except `/admin` use the editorial `--home-*` palette — do not introduce a separate token system
- preserve the theme toggle; dark mode uses the `.dark` counterparts of `--home-*` tokens
- project cards use the committed pixel-art SVG covers (`public/images/projects/{slug}.svg`); do not introduce route-wide page screenshots as a card dependency
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
