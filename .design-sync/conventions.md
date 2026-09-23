# Building with Catalog 97

This is the design system behind Isaac Vazquez's portfolio and its data dashboards. Since September 2026 the whole site renders in Catalog 97, a print-catalog language of warm paper and bone grounds, espresso ink, square corners with no shadows, Helvetica or Archivo body type, and a Newsreader serif for display. Components import from `window.WorkingInstrument.*`, a global name kept from the system's earlier life. Style your own layout glue with the `--c97-*` tokens and `.c97-*` classes below, and never with hardcoded hex.

## Setup

Wrap every composition in `PreviewProvider`. It is exported from the bundle, and it puts the Catalog 97 scope around its children, meaning a `.c97-page` root carrying `data-c97` and a nested `data-c97-surface="paper"` div. Every `--c97-*` token is declared on that scope, and the older `--home-*` names the components still read are aliased onto it. Without the wrapper the components fall back to the retired Working Instrument palette, with rounded corners, a cooler paper, and Instrument Sans, which is wrong for anything new. The wrapper also supplies a light theme, a no-op router for components that render `next/link`, and an unoptimized image config.

To change the ground for a section inside the wrapper, set `data-c97-surface` on that section's element. The values are `paper`, `bone`, `stone`, `camel`, `tobacco`, `chocolate`, `pine`, and `espresso`. Every token re-resolves for that surface, so ink stays readable on dark bands without any per-component edits. The surface rules use the descendant combinator, so a surface attribute only takes effect below the `data-c97` root.

## The styling idiom

Color always comes from the surface tokens, and the accent is reserved for data, state, and action, never for decorative fills.

| Token | Use |
|---|---|
| `--c97-surface` / `--c97-field` | the current ground, and a slightly raised field on it |
| `--c97-ink` / `--c97-ink-2` / `--c97-label` | primary text, secondary text, small labels |
| `--c97-rule` | hairline borders and dividers |
| `--c97-accent` / `--c97-action` | data accent, and link or button color |
| `--c97-positive` / `--c97-negative` / `--c97-warning` | status only |
| `--c97-sp-1` to `--c97-sp-7` | the spacing ladder, applied as inline `style` values |
| `--c97-font-body` / `--c97-font-display` / `--c97-font-mono` | the three type faces |

| Class | Use |
|---|---|
| `.c97-band` + `.c97-shell` | a full-width section with centered content inside it |
| `.c97-kicker` | the small uppercase label above a heading |
| `.c97-display`, `.c97-serif` with `.c97-h2` / `.c97-h3` | page title and serif section headings |
| `.c97-lead`, `.c97-prose`, `.c97-meta` | standfirst, running text, small metadata |
| `.c97-row`, `.c97-columns`, `.c97-panel` | ledger rows, column grids, bordered panels |
| `.c97-stat` with `.c97-stat-label` / `.c97-stat-value` / `.c97-stat-delta` | a single figure with its label |
| `.c97-chip`, `.c97-table`, `.c97-segmented` | tags, data tables, segmented controls |
| `.c97-btn` with `.c97-btn-outline` / `.c97-btn-ghost` | buttons |

Leave radius and shadow at zero, since the system has none.

## Where the real detail lives

`styles.css` and its `@import` closure hold every token, font, and class, and the Catalog 97 rules sit in `_ds_bundle.css`, so read those before styling anything. Each component ships a `<Name>.d.ts` with its exact prop contract and a `<Name>.prompt.md` with composition examples. The `guidelines/` folder carries `STYLING.md`, `DESIGN_CHECKLIST.md` (the pre-merge bar, including reduced motion and 44px touch targets), and `WRITING_VOICE.md` (the voice for any copy you write). `STYLING.md` still describes the Working Instrument tokens, and where it disagrees with the `--c97-*` names above, the tokens here win.

## One idiomatic composition

```jsx
const { PreviewProvider, SurfaceCard, Kicker, StatCard } = window.WorkingInstrument;

<PreviewProvider>
  <section className="c97-band">
    <div className="c97-shell">
      <p className="c97-kicker">Premier League</p>
      <h2 className="c97-serif c97-h2" style={{ marginTop: "var(--c97-sp-2)" }}>Season pulse</h2>
      <SurfaceCard>
        <Kicker variant="dot">Arsenal</Kicker>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--c97-sp-3)", marginTop: "var(--c97-sp-3)" }}>
          <StatCard variant="compact" eyebrow="Points" metric="86" detail="1st of 20"
            icon={<svg width="18" height="18" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/></svg>} />
          <StatCard variant="compact" eyebrow="Goal diff" metric="+57" detail="Best in the league"
            icon={<svg width="18" height="18" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>} />
        </div>
      </SurfaceCard>
    </div>
  </section>
</PreviewProvider>
```
