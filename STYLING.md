# Styling System

Current styling and design-token reference for the live app.

**Last updated:** 2026-09-23 · On 2026-09-23 the seven designed routes took the print shop layout below. On 2026-09-16 every route moved onto the Catalog 97 shell. The seven designed routes and `src/components/catalog97` use the `--c97-*` tokens in `src/app/catalog97.css`, declared under `[data-c97]` and read through `data-c97-surface`. Every other route still uses the Working Instrument `--home-*` tokens described below, which keep working because a bridge block in `catalog97.css` aliases each one onto the Catalog 97 value for the enclosing surface. The `--home-*` tokens are slated for removal in the family migrations described in `docs/superpowers/specs/2026-09-16-catalog97-unification-design.md`. `--home-haze`, `--home-acid`, and `--home-moss` are deleted (the scoped F1-red override in `formula-1.module.css` and `/arcade`'s deliberate CRT aesthetic are the two sanctioned palette exceptions). `tailwind.config.ts` is loaded via `@config` in `globals.css`; `min-h-touch`, class-based `dark:`, and the fluid `text-*` scale are live.

---

## Core Principles

- token-driven colors, spacing, type, and shadows, via `--c97-*` on the seven designed routes and via the bridged `--home-*` palette elsewhere
- light and dark mode support via CSS variables (every `--home-*` token has a `.dark` counterpart)
- the **Working Instrument** system (limestone paper, graphite ink, one signal-orange accent,
  hairline rules, mono readouts) is what the components outside the seven designed routes were written against; the bridge repaints it in Catalog 97 values
- one accent: `--home-signal` is reserved for data, state, and action (links, live dots, focus,
  active states). It is never a decorative wash. `--home-acid` / `--home-haze` / `--home-moss`
  are deleted from `globals.css`; do not reintroduce them
- CSS-Module surfaces alias the global tokens (`--x-paper: var(--home-paper)`) — never re-declare
  the palette as fresh hex (see `src/app/investments/investments.module.css` for the reference pattern)
- accessible focus styles and 44px minimum touch targets
- restrained motion that respects reduced-motion preferences: numbers count up once, lines draw in
  once, nothing loops, no marquees

Legacy semantic tokens (`--surface-*`, `--text-*`, `--border-*`, `--color-primary`) are aliased to `--home-*` equivalents in `globals.css` for backwards compatibility. New code outside the seven designed routes should use `--home-*` tokens directly, and new code on those seven routes or in `src/components/catalog97` should use `--c97-*`.

---

## Print shop layout (the seven Catalog 97 routes)

As of 2026-09-23 the seven designed routes are laid out as risograph print runs, and that method now decides how each page is composed. The primitives live at the end of `src/app/catalog97.css` under "Print shop layout", and Home (`Catalog97Home.tsx`) is the reference build.

A page is a print run. It picks two lead inks from blue, saffron, vermilion, green, teal, and pink, with peach counting as a vermilion tint, and everything else is paper, bone, chocolate, espresso, or black. Green, teal, and pink joined on 2026-09-25 so the project routes could each print their own pair, and their measured ratios sit beside each `ink-*` block in `catalog97.css`, held at 4.5:1 by `src/app/__tests__/catalog97-inks.test.ts`. The inks stay unlabelled, since a swatch legend naming them read as decoration talking about itself and was removed on 2026-09-23. The printed plates in `public/images/home` carry their own inks and don't count against the page's two.

Sections are sheets. A band that changes surface from the one above it gets `c97-sheet` with `data-seam="torn"`, or `"deckle"` for a softer edge, so its top edge tears over its neighbour. A band that continues the same surface stays seamless, and the shared footer always tears over whatever sits above it.

The hero sheet opens on the poster headline with no label above it. Crop marks and a registration target were tried there and removed on 2026-09-23, because they read as decoration.

Display type is poster type. h1s take `.c97-poster` and section h2s and closing statement lines take `.c97-poster-sm`, which set Anton caps with the sheet's second ink (`--c97-overprint`) printed a few hundredths of an em off register. The ink carries the contrast and the offset is decoration. Project and article titles stay in Newsreader, because they name a specific thing, and body text stays in Archivo.

Tone is a halftone screen. Hover states and empty image fields use a dot screen in the sheet's own ink (`.c97-halftone`, the tile hover).

Printed things sit on an offset. Plates, thumbnails, and the primary buttons take `.c97-offset`, a hard shadow in the second ink, and a button's offset collapses when it is pressed. This is the only shadow the system allows, and blurred shadows stay banned along with radius.

Heroes and images carry information. A collage of plates is only used where each plate is a link with something of its own on it, the way Home's dashboard doors each carry a live readout (`Catalog97Collage`). A collage that only repeats a list further down the page gets cut.

Project routes print the same way (2026-09-25). A route's ink pair lives in `src/constants/projectPress.ts`, and `ConditionalLayout` hands it to `Catalog97ToolShell`, which sets the second ink as the overprint on every sheet. The route opens on `Catalog97ProjectHero`, a lead-ink sheet with the poster h1, the as-of line, at most three readouts, and the route's signature visual as its child. Anything inside that hero that paints a field or panel gets its own `data-c97-surface`, usually a paper plate with `.c97-offset`, because on the ink and espresso surfaces the field tint is pale under a pale ink. Data colours such as liveries, line colours, and party colours stay data and never become inks, and a page whose data already speaks in blue and red prints in neither. The spec is `docs/superpowers/specs/2026-09-25-project-specific-ui-design.md`.

Every other Catalog 97 rule still holds, from the spacing ladder and the token scoping, to one accent for data, state, and action, to 44px targets, reduced motion, one h1, and the shell's single `main`. The migrated tool routes will take the same primitives in their own family passes.

---

## Source Files

- `src/app/globals.css`
- `src/app/catalog97.css` (Catalog 97 tokens declared under `[data-c97]`, plus the bridge block that aliases `--home-*`)
- `tailwind.config.ts`
- `src/components/ui/*`

---

## Token Model

Global tokens are defined in `src/app/globals.css`.

### Primary palette (Working Instrument, for routes outside the seven designed ones)

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

The legacy accents `--home-haze`, `--home-acid`, and `--home-moss` are no longer defined in `globals.css`.
Phase two migrated every component usage off these (wins/qualification → `--home-positive`,
ties/deadlines → `--home-warning`, failures → `--home-negative`, categorical chips → ink/stone
mixes).

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
  soft 1rem+ card radii. Inside `[data-c97]`, which now wraps every route, the bridge sets every
  `--radius-*` to `0` and every `--shadow-*` to `none`.

Do not hardcode hex colors in components when a token exists.

### Dark-mode elevation (raised surfaces)

To lift a surface one step above its background, **use the theme-aware elevation token**, never a
literal `white`/`black` mix:

- `--home-paper-raised` = `color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))`
- `--home-elev-mix` flips per theme — `white` in light, `black` in dark (both defined in `globals.css`)

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

Fonts are loaded in `src/app/layout.tsx`. The three Working Instrument families are below. The same file also loads four Catalog 97 families (Newsreader, Archivo, Anton, Great Vibes) behind the `--c97-font-*` tokens, and inside `[data-c97]` the bridge points `--font-home-sans`, `--font-home-serif`, and `--font-mono` at that stack.

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

The Working Instrument design system was the site-wide standard from July 2026 until the Catalog 97 shell landed on 2026-09-16 (phase one shipped
the flagship surfaces: `/`, `/about`, `/portfolio`, `/resume`, `/contact`, header, footer, and the
shared ContactCta; phase two propagated it to the dashboards). Routes outside the seven designed ones still consume the
`--home-*` palette through the bridge. The values below are the `:root` declarations in `globals.css`. The system uses cool limestone paper, graphite
ink, hairline rules, mono readouts, and exactly one accent reserved for data, state, and action.

**Color tokens (light / dark):**

| Token | Light | Dark |
|-------|-------|------|
| `--home-paper` | `#F6F5F1` | `#151412` |
| `--home-paper-alt` | `#EFEDE6` | `#1C1B18` |
| `--home-ink` | `#191813` | `#ECEAE2` |
| `--home-ink-muted` | `#68655A` | `#9B9585` |
| `--home-signal` | `#C93F19` | `#FF6B3B` |
| `--home-signal-soft` | `#F6E0D7` | `#462214` |
| `--home-stone` | `#D8D4C9` | `#45423B` |
| `--home-rule` | `rgba(25,24,19,0.14)` | `rgba(236,234,226,0.16)` |

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
| `.home-intro-copy` | `home-body` constrained to 38rem |
| `.home-section-copy` | body constrained to 33rem |

Dark variants: `.home-kicker-dark`, `.home-body-dark`, `.home-meta-dark`, `.home-section-title-dark`, `.home-section-intro-dark`, `.home-writing-title` (uses `--home-dark-ink` by default).

### Buttons

Base: `.home-button` — 48px min-height, pill shape (radius 999px), Instrument Sans 600, 0.95rem, transition on bg/border/color/shadow/transform.

| Modifier | Style |
|----------|-------|
| `.home-button-primary` | ink fill, paper text; hover blends toward signal |
| `.home-button-secondary` | paper bg, stone border; hover adds a signal-soft tint |
| `.home-button-dark` | transparent, dark-ink text; for use on dark sections |

### Cards

- `.home-card` — `var(--radius-2xl)` radius, paper bg 88%, `shadow-md`, lifts on hover (`translateY(-4px)`, `shadow-lg`)
- `.home-project-card` — `.home-card` + `padding: 1.5rem`
- `.home-writing-card` — `.home-card` variant, no shadow by default
- `.home-note-card` — small inset card, 1.1rem radius, paper-alt bg

### Writing Archive Cards (`/writing`)

`/writing` is a Catalog 97 route. Its index is owned by `Catalog97Writing`, and every color, size, and space on it comes from the `--c97-*` tokens in `src/app/catalog97.css`, not from the `--home-*` palette. Do not use the homepage writing block as the visual source of truth for the archive page.

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

### Header and footer (site-wide)

The header and footer on every route come from `Catalog97Header` and the espresso footer inside `Catalog97Shell`, styled by the `.c97-*` classes in `src/app/catalog97.css`. `StaticHeader` and `Footer.tsx` were deleted on 2026-09-16. The `.header-home*` and `.footer-home*` classes are still defined in `globals.css`, and the only one still referenced from a component is `.header-home-menu` in `HeaderSearchPanel`.

### Rules

- routes outside the seven designed ones use the bridged `--home-*` palette, and the seven designed routes use `--c97-*`; do not introduce a third token system
- preserve the theme toggle; dark mode uses the `.dark` counterparts of `--home-*` tokens
- project cards use the committed pixel-art SVG covers (`public/images/projects/{slug}.svg`); do not introduce route-wide page screenshots as a card dependency
- all motion classes must be paired with reduced-motion guards in CSS (`@media (prefers-reduced-motion: reduce)`)

---

## Accessibility Rules

- `:focus-visible` styles are defined globally
- buttons and links should maintain 44px minimum targets
- reduced-motion behavior is enforced in CSS and should also be respected in Framer Motion components
- `Catalog97Shell` owns the only `main` landmark, so routes never add their own, and every route exposes one page-level `h1`
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
