# Building with Working Instrument

This is the design system behind Isaac Vazquez's portfolio and its data dashboards. It is an editorial, print-inspired system built on a single warm paper-and-ink palette with one reserved accent. Components import from `window.WorkingInstrument.*`. Style your own layout glue with the CSS variables and shell classes below, never with hardcoded hex.

## Setup

Every token and font ships in `styles.css`, which is always loaded, so components are styled the moment they render. Two context notes. For dark mode the palette flips when an ancestor carries `class="dark"` (the system is driven by next-themes with the class strategy); without it you get the light theme. A few components render `next/link` or `next/image` internally, so the bundle also exports `PreviewProvider`, a batteries-included wrapper that supplies a theme, a no-op router, and an unoptimized image config. Wrap a composition in it when a component needs routing or images and you are rendering outside the app shell.

## The styling idiom

This is a CSS-variable token system, not a utility-class kit. Color, surface, and border always come from `var(--home-*)`; the accent is reserved for data, state, and action, never decorative fills.

| Token | Use |
|---|---|
| `--home-paper` / `--home-paper-alt` | base and secondary surfaces |
| `--home-paper-raised` | raised surfaces (cards, panels) |
| `--home-ink` / `--home-ink-muted` | primary and secondary text |
| `--home-rule` | hairline borders and dividers |
| `--home-signal` | the single accent, for data and action |
| `--home-positive` / `--home-negative` / `--home-warning` | status only |
| `--home-elev-mix` | elevation mix that flips per theme (never mix toward white) |

Editorial shell classes carry the layout rhythm: `.home-section` for a page section, `.home-card` and `.home-card-static` for card surfaces, and `.home-kicker` for the small mono eyebrow label above a heading. Prefer these over reinventing spacing.

## Where the real detail lives

Read `styles.css` and its `@import` closure for the full token and font set before styling anything. Each component ships a `<Name>.d.ts` (its exact prop contract, fully self-contained) and a `<Name>.prompt.md` (composition examples). The `guidelines/` folder carries `STYLING.md` (the token system in depth), `DESIGN_CHECKLIST.md` (the pre-merge bar, including reduced-motion and 44px touch targets), and `WRITING_VOICE.md` (the copy voice for any text you write into a design).

## One idiomatic composition

```jsx
const { SurfaceCard, Kicker, StatCard } = window.WorkingInstrument;

<section className="home-section">
  <SurfaceCard>
    <Kicker variant="dot">Season pulse</Kicker>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 12 }}>
      <StatCard variant="compact" eyebrow="Points" metric="86" detail="1st of 20"
        icon={<svg width="18" height="18" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/></svg>} />
      <StatCard variant="compact" eyebrow="Goal diff" metric="+57" detail="Best in the league"
        icon={<svg width="18" height="18" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>} />
    </div>
  </SurfaceCard>
</section>
```

# WorkingInstrument (isaac-vazquez-portfolio@0.1.0)

This design system is the published isaac-vazquez-portfolio React library, bundled as a single
browser global. All 39 components are the real upstream code.

## Where things are

- `_ds_bundle.js` — the whole-DS bundle at the project root; loads every component to `window.WorkingInstrument`. First line is a `/* @ds-bundle: … */` metadata header.
- `styles.css` — the single stylesheet entry: it `@import`s the tokens, fonts, and component styles (`_ds_bundle.css`). Link this one file.
- `components/<group>/<Name>/<Name>.prompt.md` (example JSX + variants), `<Name>.d.ts` (types), `<Name>.html` (variant grid).
- `tokens/*.css` — CSS custom properties, names verbatim from upstream.
- `fonts/` — `@font-face` files + `fonts.css` (when the package ships fonts).
- `guidelines/` — the design system's own usage guidance (3 doc(s), see `guidelines/index.md`). Read these before composing larger layouts.

For a specific component, `read_file("components/<group>/<Name>/<Name>.prompt.md")`.

## Loading

Add these two lines to your page once (React must be on the page first):

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
```

Components are then available at `window.WorkingInstrument.*`. Mount into a dedicated child node (e.g. `<div id="ds-root">`), not the host page's own React root, so the two trees don't collide:

```jsx
const { AuthorBio } = window.WorkingInstrument;
ReactDOM.createRoot(document.getElementById('ds-root')).render(<AuthorBio />);
```

Wrap the tree in the provider — most components read theme/i18n from context:

```jsx
<PreviewProvider>{children}</PreviewProvider>
```

## Tokens

301 CSS custom properties from isaac-vazquez-portfolio. Names are
preserved verbatim from upstream. They are declared inside `_ds_bundle.css` (this DS ships one compiled stylesheet rather than separate token files).

- **color** (74): `--color-red-300`, `--color-red-500`, `--color-red-700`, …
- **spacing** (13): `--tw-space-y-reverse`, `--space-xs`, `--space-sm`, …
- **typography** (24): `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`, …
- **radius** (7): `--radius-sm`, `--radius-md`, `--radius-lg`, …
- **shadow** (14): `--shadow-xs`, `--tw-prose-kbd-shadows`, `--tw-prose-invert-kbd-shadows`, …
- **other** (169): `--spacing`, `--breakpoint-sm`, `--breakpoint-md`, …

## Components

### general
- `AuthorBio`
- `Badge`
- `Chip` — Chip  small mono, uppercase, squared metadata tag (rsum skills,
- `DropdownMenu`
- `ExpertSignal`
- `Heading`
- `JourneyTimeline`
- `Kicker` — Kicker  the small label that sits above a heading. dot is the
- `MetricCallout` — MetricCallout - Highlighted metric display with count-up animation
- `ModernButton`
- `OptimizedImage`
- `PageSummary`
- `Paragraph`
- `ReadoutPanel` — ReadoutPanel  the signature live index instrument: a paper panel capped
- `SectionIntro`
- `ThemeToggle`
- `WarmCard`

### football
- `ClubDrawer` — Club detail drawer  the standings' drill-down, opened by selecting a
- `CrestAvatar`
- `EmptyPanel`
- `FixtureCard`
- `FixtureGroupSection`
- `FixtureLedgerSection` — The scoreboard ledger: fixtures grouped by matchday inside a bordered
- `GoalsPulseStrip` — Goals-per-matchday pulse  the dashboard's namesake device: one bar per
- `InfoChip`
- `LeaderLedger` — Denser mono leaderboard row list  the design mirror's .lead-row (mono
- `LeaderList`
- `MetricCard` — Shared metric stat card used across dashboards (Premier League, La Liga,
- `ResultsTape` — League results tape  the investments terminal's quote-tape device ported
- `SegmentedTabs` — Mono fused segmented tab control  ink-fill active state, soft-paper hover
- `StatCard` — Unified stat card used by both the Premier League and La Liga dashboards.
- `StatFascia` — Fused hairline stat strip: a CSS grid with a 1px --home-rule background
- `SurfaceCard`
- `TeamResultPill`

### editorial
- `EditorialPillButton` — Rounded, uppercase-ready pill button used for tabs, filter toggles, and
- `InlineSectionLead` — Small section lead-in used below card titles or section headers to pair a
- `InstrumentTape` — Shared horizontal mono readout strip  a tape  for live-instrument
- `StatusPanel` — Centered editorial status card used for loading, empty, and error states.
- `UtilityStrip` — Thin pill-shaped container used for meta/status strips above or below a
