# Dashboard Spatial System

**Last updated:** 2026-04-29
**Reference page:** `/investments`
**Reference component:** `src/components/investments/InvestmentsDashboard.tsx`

The portfolio site has two layout modes:

1. **Editorial mode** — used for marketing surfaces (`/`, `/about`, `/portfolio`, `/writing`, blog posts). Big type, generous whitespace, manifesto pacing. Lives under `home-*` helpers.
2. **Tool mode** — used for interactive products that are doing real work (investments, the trackers, calculators). Dense, product-grade, three columns where possible. Documented here.

Editorial pages should feel like a magazine. Tool pages should feel like a real product the user is operating. Mixing them is what made the new trackers (`/museum-log`, `/wine-cellar`, `/recipe-finder`, `/food-map`) feel padded and slow — they used editorial pacing to display product data.

---

## When to use Tool mode

Use tool mode when the page is **doing work**: filtering, computing, persisting state, comparing items, scoring, logging, tracking. If the user is going to interact for more than 30 seconds, the page is a tool, not an editorial surface.

Editorial framing (oversized titles, marketing intros, full-width hero banners) is wrong on a tool page. Even if the route is one of the user's projects, the tool itself should still feel like a tool — the project framing belongs on `/portfolio`, not on the working surface.

---

## Shell

A bordered card wraps the whole work area. Nothing of the actual product floats free against the page background.

```
┌──────────────────────────────────────────────────────────────┐
│ ┌──────┐ ┌────────────────────────────┐ ┌──────────────────┐ │
│ │ NAV  │ │ MAIN                        │ │ RAIL             │ │
│ │      │ │                             │ │                  │ │
│ │      │ │                             │ │                  │ │
│ └──────┘ └────────────────────────────┘ └──────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

Concrete values (mirroring `.invest-shell`):

- `display: grid`
- `grid-template-columns: 220px minmax(0, 1fr) 290px`
- `border: 1px solid var(--home-rule)`
- `border-radius: 28px`
- `overflow: hidden`
- Background: a 2-stop radial gradient pinned in the corners (`--home-acid` 18% in one corner, `--home-haze` 18% in the opposite) over `var(--home-paper)`. Subtle atmosphere, not a flat color.
- `box-shadow: var(--shadow-sm)`

### Responsive collapse

- `≤ 1280px`: drop the rail, become 2-col (`200px` nav + flex main).
- `≤ 900px`: drop the nav, become 1-col. Reduce border-radius to `20px`.

The page content adapts; rail content reflows into main if it's still important on tablet, or disappears entirely if it's secondary.

### Page wrapper

The shell sits inside `.home-page` (so the page background, header, footer continue to work) but skips `.home-shell`/`.home-section` — those are editorial helpers and add the wrong padding. Wrap with a generic `tool-page-stack` (or per-project equivalent) using `display: flex; flex-direction: column; gap: 28px`.

If the tool needs a secondary band below the main shell (e.g., research deep-dive on `/investments`), it goes in the same `tool-page-stack` as a sibling card, **not** inside the shell. This avoids leaving the rail empty next to a long single-asset view.

---

## Sidebar (220px)

Brand mark + nav. Pinned helper at the bottom.

- Background: `color-mix(in srgb, var(--home-paper) 96%, var(--home-elev-mix))` (slightly lifted from main)
- `border-right: 1px solid var(--home-rule)`
- Padding: `22px 14px`
- `display: flex; flex-direction: column; gap: 6px`

### Brand block (top)

Small product mark (logo or gradient circle) + product name + small kicker subtitle.

- Wrapper: `display: flex; align-items: center; gap: 10px; padding: 6px 8px 18px; border-bottom: 1px solid var(--home-rule); margin-bottom: 14px`
- Mark: `34×34px`, `border-radius: 12px`, gradient or solid `--home-ink` background
- Name: `13.5px / 700 / -0.04em` letter-spacing, color `--home-ink`
- Kicker (subtitle): `10px / 600 / 0.14em` uppercase, color `--home-ink-muted`

### Nav links

```
icon  Label                                pill?
```

- `display: flex; align-items: center; gap: 12px`
- Padding: `9px 12px`
- `border-radius: 14px`
- Font: `13.5px / 500`
- Color: `--home-ink-muted` default; `--home-ink` on hover; `--home-paper` on active
- Hover background: `color-mix(in srgb, var(--home-acid) 18%, transparent)`
- Active background: `var(--home-ink)` (filled dark, paper text)
- Optional pill at the end (count, status) — `11px / 700`, acid green tinted background

### Footer block (`mt-auto`)

Small text + icon, e.g., `Local browser storage`. `12.5px / --home-ink-muted`. Pinned to bottom of the sidebar with `margin-top: auto` and a top rule.

---

## Topbar (inside main)

Above any content. Density tells the user this is a product.

```
[Crumbs / breadcrumb]                          [Search input]    [Refresh] [Avatar]
[H1 Page title]
```

- Container: `display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 22px`
- Crumbs: `11px / 700 / 0.14em` uppercase, `--home-ink-muted`. Active crumb in `<strong>` with `--home-ink`.
- H1: `clamp(1.4rem, 1.4vw + 1rem, 1.85rem)`, `600 / -0.04em / line-height 1`. **Far smaller than the editorial H1 (`4.6rem`).** The product H1 caps at ~1.85rem because it's a UI label, not a magazine headline.
- Search: `flex: 0 1 320px`, pill-shaped, `9px 14px` padding, `13px` font, has a tiny `⌘K` keyboard hint glyph if relevant.
- Refresh / avatar: small (`14-16px` icons), inline-flex, gap `2`.

If the tool has no refresh/search semantics, drop those affordances — but keep the crumbs + small H1 layout.

---

## Dataset / freshness chip

A pill below the topbar that says when the data was last refreshed and how big it is.

- Border-radius: `999px`
- Padding: `8px 14px`
- Background: `color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))`
- Border: `1px solid var(--home-rule)`
- Font: `11.5px`
- A tiny status dot (`7×7px`, `--home-moss`) on the left
- Right-aligned meta text in `var(--font-mono)` at `10.5px`

For tools that don't have freshness semantics (calculators, local-only trackers), use the same chip pattern to surface other key meta — total items, last updated by user, persistence note, etc.

---

## Section headers (inside main, between sub-sections)

```
[KICKER]
H2 Section title                       [Optional inline action]
```

- Wrapper: `display: flex; align-items: end; justify-content: space-between; gap: 16px; flex-wrap: wrap`
- Kicker: same `10.5px / 700 / 0.14em` uppercase as nav-label
- H2: `clamp(1.4rem, 1.4vw + 0.8rem, 1.85rem)` — same scale as the page H1
- Inline action (search, filter, button): `flex: 0 1 320px`

---

## Cards inside main

The main column is a `space-y` stack of cards. Cards inside a tool are not the same as `.home-card` (which uses `1.6rem` border-radius and editorial padding). Tool cards:

- `border: 1px solid var(--home-rule)`
- `border-radius: 22-28px` (smaller for inline cards, larger for hero/research cards)
- Background: `color-mix(in srgb, var(--home-paper) 92%, var(--home-elev-mix))` or `--home-paper-alt` — pick one and stay consistent
- Padding: `20-26px`
- Box-shadow: `var(--shadow-sm)` or none — not the heavier `--shadow-md`

**Hero / primary card** (the first thing in main): bigger padding (`24-30px`), bigger radius (`28px`), often a small inline gradient or accent strip.

**Inline cards** (stats, lists, filters): tighter padding, smaller radius. Stack with `gap: 16-22px`.

### Stats grid

When you need to show 4 quick numbers, use a flat grid inside a single card — **not four separate cards**. Each cell shows a small uppercase label plus a number. Empty values render as `—`, but inside the grid card so the empty state is one card with four empty cells, not four giant empty cards.

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px 24px;
}
.stat-cell label { font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--home-ink-muted); }
.stat-cell .val { font-size: 1.4rem; font-weight: 600; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
.stat-cell .delta { font-size: 11.5px; color: var(--home-ink-muted); }
```

Collapse to 2 columns at `≤ 720px`.

### Lists / tables

Dense rows, tabular numbers, small font (`13-13.5px`). No alternating row colors. Use a single rule between rows. Sticky header optional.

---

## Right rail (290px)

Compact widgets stacked. Each section has its own kicker label; no card chrome around individual widgets — the rail itself is the container.

- Background: `color-mix(in srgb, var(--home-paper) 96%, var(--home-elev-mix))`
- `border-left: 1px solid var(--home-rule)`
- Padding: `22px 22px 40px`
- `display: flex; flex-direction: column; gap: 16px`

### Rail section label

```
ICON Label
```

- `10.5px / 700 / 0.14em` uppercase, `--home-ink-muted`, `margin: 0 0 8px`

### Use the rail for

- A primary "Add" / "Create" form (kept persistently visible, not behind a button)
- A summary or breakdown chart (allocation donut, score pie, etc.)
- A "today's movers" / "recent activity" list — compact rows with `auto 1fr auto` grid
- A pinned help line at the bottom (`mt-auto`) explaining persistence model or other rules

If the tool has fewer than 2 widgets that fit the rail, don't force a rail — collapse to a 2-col layout.

---

## Density rules

These apply throughout tool mode. They're what makes it feel like a product.

| Element | Editorial mode | Tool mode |
|---|---|---|
| Page H1 | `clamp(2.6rem, 5.4vw, 4.6rem)` | `clamp(1.4rem, 1.4vw + 1rem, 1.85rem)` |
| Section H2 | `clamp(2.15rem, 4.5vw, 4.2rem)` | `clamp(1.4rem, 1.4vw + 0.8rem, 1.85rem)` |
| Kicker | `0.72rem / 0.14em` | `10.5px / 0.14em` |
| Body | `clamp(1.02rem, 0.95rem + 0.25vw, 1.16rem)` | `13-13.5px` |
| Nav / chip / meta | n/a | `11-12.5px` |
| Numbers | normal | `font-variant-numeric: tabular-nums` |
| Border-radius | `1.6rem-2rem` (cards) | `14-28px` (cards), `999px` (chips) |
| Section gap | `clamp(1.25rem, 2vw, 2rem)` block padding | `16-22px` flex/grid gap |
| Card padding | `1.5-2.25rem` | `20-26px` |
| Box shadow | `--shadow-sm` to `--shadow-md` (sparingly) | `--shadow-sm` mostly, `--shadow-md` on hero only |

---

## Empty states

Inside tool mode, an empty state is one card, not a marketing landing page.

- Stats grid empty → cells render `—` (em-dash). Card wrapper stays.
- Holdings/list empty → single card with `border: 1px dashed var(--home-rule)`, `padding: 24px` in light, brief copy + a clear next action ("Add your first stock using the form on the right").
- Don't grow the empty state into the rail; the rail still shows the form/action that resolves the empty state.

---

## Footer / page CTA

Tool pages still get the project's standard footer (the "Thanks for taking a look" CTA + site footer). That sits **outside** the shell, in `tool-page-stack` as the last sibling. It is editorial, not tool — that's intentional. Once the user finishes interacting with the tool, the footer pivots back to the portfolio frame.

---

## How to apply this to a new tracker

1. Wrap the page content in a flex column (`tool-page-stack`).
2. Inside, add the bordered grid shell (`tool-shell`).
3. Sidebar: brand mark + nav links + pinned helper. Nav links should anchor to in-page sections (`#`).
4. Main: topbar (crumbs + small H1 + optional search/refresh) → freshness/meta chip → hero card → stats grid card → list/table card.
5. Rail: primary "create/add" form → secondary breakdown/chart → recent activity → pinned help.
6. Below the shell, only break out a separate band if there's a deep-dive view that needs full width.
7. Keep the editorial site footer and "Thanks for taking a look" CTA at the bottom of `tool-page-stack` (outside the shell).

The visible difference vs. the old layout: roughly **30-40% less vertical real estate** for the same content, and a clear sense that the user is operating a product rather than scrolling through a marketing page.

---

## Reusable CSS (`tool-*`)

The `.invest-*` classes were the prototype. They've been generalized to `.tool-*` in `src/app/globals.css` so any tracker can adopt the system without copying styles per-project. See the `tool-*` block in `globals.css` (search for `.tool-shell`).

- `.tool-page-stack` — outer flex column
- `.tool-shell` — the 3-col bordered card
- `.tool-sidebar` — left nav column
- `.tool-brand`, `.tool-brand-mark`, `.tool-brand-name`
- `.tool-nav-link`, `.tool-nav-pill`, `.tool-sidebar-footer`
- `.tool-main`
- `.tool-topbar`, `.tool-crumbs`, `.tool-search`, `.tool-search-kbd`
- `.tool-meta-chip`, `.tool-meta-chip-dot`, `.tool-meta-chip-divider`, `.tool-meta-chip-meta`
- `.tool-section-header`, `.tool-section-kicker`, `.tool-section-title`
- `.tool-stats-grid`, `.tool-stat-cell`, `.tool-stat-label`, `.tool-stat-val`, `.tool-stat-delta`
- `.tool-rail`, `.tool-rail-label`
- `.tool-band` — full-width card below the shell, for deep-dive views

The investments dashboard still uses its existing `invest-*` namespace because the migration is not in scope. New tools should use `tool-*` directly.
