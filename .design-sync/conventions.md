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
