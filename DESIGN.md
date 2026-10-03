---
name: Catalog 97
description: Risograph print shop system for Isaac Vazquez, built from sheets of grained paper stock, six riso inks plus a vermilion tint, Anton poster caps, Newsreader headings, Archivo body text, Fragment Mono readouts, torn seams between bands, square corners, and one hard offset shadow.
colors:
  paper: "#f1ebdf"
  bone: "#e4dbc9"
  stone: "#a79e8f"
  chocolate: "#4a3728"
  espresso: "#2b211a"
  print-black: "#17110d"
  riso-blue: "#1a3ea6"
  riso-saffron: "#edb722"
  riso-vermilion: "#df4c1e"
  riso-peach: "#f6b995"
  riso-green: "#32a860"
  riso-teal: "#056c71"
  riso-pink: "#f25f9f"
  ink: "#2b211a"
  ink-2: "#4a3728"
  label: "#645e55"
  rule: "rgba(43, 33, 26, 0.18)"
  positive: "#1b4d2c"
  negative: "#7a1c1c"
  warning: "#5c3600"
typography:
  poster:
    fontFamily: 'Anton, Impact, "Arial Narrow", sans-serif'
    fontSize: "clamp(44px, 7.4vw, 112px)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "0.01em"
  poster-sm:
    fontFamily: 'Anton, Impact, "Arial Narrow", sans-serif'
    fontSize: "clamp(30px, 4vw, 56px)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "0.01em"
  display:
    fontFamily: 'Newsreader, Georgia, "Times New Roman", serif'
    fontSize: "clamp(32px, 4.2vw, 52px)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  h2:
    fontFamily: 'Newsreader, Georgia, "Times New Roman", serif'
    fontSize: "clamp(24px, 2.7vw, 32px)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  h3:
    fontFamily: 'Newsreader, Georgia, "Times New Roman", serif'
    fontSize: "clamp(20px, 2.2vw, 26px)"
    fontWeight: 400
    lineHeight: 1.2
  lead:
    fontFamily: '"Helvetica Neue", Helvetica, Archivo, Arial, sans-serif'
    fontSize: "clamp(19px, 2vw, 22px)"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: '"Helvetica Neue", Helvetica, Archivo, Arial, sans-serif'
    fontSize: "clamp(15px, 1.4vw, 16px)"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: '"Helvetica Neue", Helvetica, Archivo, Arial, sans-serif'
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.08em"
  mono:
    fontFamily: "Fragment Mono, ui-monospace, SFMono-Regular, monospace"
    fontWeight: 400
    letterSpacing: "normal"
  script:
    fontFamily: 'Snell Roundhand, "Great Vibes", "Petit Formal Script", cursive'
    fontWeight: 400
rounded:
  sm: "0"
  md: "0"
  lg: "0"
  xl: "0"
  2xl: "0"
  3xl: "0"
  panel: "0"
  pill: "0"
spacing:
  sp-1: "clamp(8px, 0.9vw, 10px)"
  sp-2: "clamp(12px, 1.3vw, 17px)"
  sp-3: "clamp(22px, 2.6vw, 32px)"
  sp-4: "clamp(28px, 3.4vw, 44px)"
  sp-5: "clamp(40px, 5vw, 68px)"
  sp-6: "clamp(60px, 7.5vw, 116px)"
  sp-7: "clamp(76px, 9vw, 132px)"
  gutter: "clamp(28px, 6vw, 96px)"
components:
  btn-primary:
    backgroundColor: "var(--c97-ink-2)"
    textColor: "var(--c97-surface)"
    rounded: "{rounded.sm}"
    padding: "0 {spacing.sp-3}"
    height: "48px"
  btn-invert:
    backgroundColor: "var(--c97-ink)"
    textColor: "var(--c97-surface)"
    rounded: "{rounded.sm}"
    height: "48px"
  btn-outline:
    backgroundColor: "transparent"
    textColor: "var(--c97-ink)"
    border: "2px solid var(--c97-ink)"
    rounded: "{rounded.sm}"
    height: "64px"
  panel:
    backgroundColor: "var(--c97-panel)"
    textColor: "var(--c97-ink)"
    rounded: "{rounded.panel}"
    padding: "{spacing.sp-3}"
  chip:
    backgroundColor: "var(--c97-field)"
    textColor: "var(--c97-ink)"
    rounded: "{rounded.pill}"
    padding: "0 {spacing.sp-2}"
  field:
    backgroundColor: "var(--c97-field)"
    textColor: "var(--c97-ink)"
    rounded: "{rounded.sm}"
    padding: "0 {spacing.sp-2}"
    height: "48px"
---

# Catalog 97 design system

**Status, 2026-09-27.** This file describes Catalog 97 as shipped. The unification that replaced the prior design language, the Working Instrument, closed out on this date. Every route renders inside `Catalog97Shell` or `Catalog97ToolShell`, every token is a `--c97-*` value declared in `src/app/catalog97.css`, and the old `--home-*` tokens plus the bridge that once aliased them onto Catalog 97 values were deleted from the codebase. `src/app/__tests__/catalog97-closeout.test.ts` fails if any file under `src` reads a Working Instrument token again, and `src/app/__tests__/catalog97-inks.test.ts` holds the measured contrast ratios cited below. `STYLING.md` is the fuller written reference and this file stays consistent with it; where the two disagree with the CSS, the CSS wins.

## Overview

Catalog 97 treats every page as a print run off a risograph press. A route is built from bands of grained paper stock, each one a "sheet" that can change color as the page scrolls, and a sheet that changes surface tears over the one above it in a rough torn or deckled edge. Two lead riso inks carry a page's identity, chosen from blue, saffron, vermilion, green, teal, and pink, with peach counting as a vermilion tint and not a seventh option. Everything else sits on the neutral stock, paper, bone, stone, chocolate, or espresso.

Display type is poster type. Anton caps set every h1 and every section h2, printed in the sheet's own ink with the second ink shadowed a few hundredths of an em off register, the way a two-color riso run drifts slightly out of registration. Newsreader carries every other heading and named title at weight 400 only, because the design never bolds the serif. Archivo stands in for Helvetica Neue, which the source design specifies but which only renders on macOS, and it carries body copy and the kickers and meta rows that use Fragment Mono's tabular pitch for anything measured or counted. Fragment Mono ships at weight 400 only. Great Vibes stands in for Snell Roundhand, another macOS-only face, and it appears exactly once, in the footer's script wordmark.

The system draws no rounded corners and no blurred shadow anywhere. `tailwind.config.ts` compiles the whole radius scale and the whole shadow scale to nothing, so a stray `rounded-lg` or `shadow-sm` left in markup paints square and flat. The one shape exception is the radio input, which sets `border-radius: 50%` so it renders as a circle. The one shadow the system allows is the hard printed offset, `.c97-offset`, a flat rectangle of the sheet's second ink sitting behind a plate, a thumbnail, or a primary button.

## Key characteristics

- Sheets of grained paper stock, not flat panels. Every surface carries a soft speckle texture and tears over its neighbor when the surface changes.
- Two lead riso inks per page, chosen from six plus a vermilion tint, never a third.
- Anton poster caps on every h1 and section h2, shadowed off register in the page's second ink.
- Newsreader at weight 400 for every other heading and title, and Archivo for body copy and kickers.
- Zero radius and zero blurred shadow. The only shadow is the hard offset behind a printed plate, thumbnail, or button.
- Fragment Mono at weight 400 only, with tabular numerals for anything measured or counted.

## Colors

Catalog 97 assigns color per surface. Every band declares `data-c97-surface`, and everything inside it reads that surface's own `--c97-ink`, `--c97-ink-2`, `--c97-label`, `--c97-action`, `--c97-accent`, and `--c97-rule`, so a component never sets a color directly. The values below are the paper surface's defaults in light mode, along with the seven riso ink swatches. A riso swatch names an ink and not a theme, so it is a fixed constant that holds the same hex in both light and dark mode.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| Paper | `#f1ebdf` | `#14100c` | the base stock and the site's default background |
| Bone | `#e4dbc9` | `#1e1811` | a second neutral stock, used to keep two paper bands from sitting adjacent |
| Stone | `#a79e8f` | `#6e655a` | a neutral block for an image slot with no photograph yet |
| Chocolate | `#4a3728` | `#3a2b1f` | a dark-ink stock for a closing or contrast band |
| Espresso | `#2b211a` | `#0c0907` | the darkest stock, closing most routes and carrying the chart ramp |
| Riso blue | `#1a3ea6` | same | lead or second ink |
| Riso saffron | `#edb722` | same | lead or second ink |
| Riso vermilion | `#df4c1e` | same | lead or second ink |
| Riso peach | `#f6b995` | same | a vermilion tint, not a seventh lead ink |
| Riso green | `#32a860` | same | lead or second ink, added 2026-09-25 |
| Riso teal | `#056c71` | same | lead or second ink, added 2026-09-25 |
| Riso pink | `#f25f9f` | same | lead or second ink, added 2026-09-25 |

On the paper surface, `--c97-ink` is `#2b211a`, `--c97-ink-2` is `#4a3728`, `--c97-label` is `#645e55`, `--c97-rule` is `rgba(43, 33, 26, 0.18)`, and the status tokens read `#1b4d2c` positive, `#7a1c1c` negative, and `#5c3600` warning. Every ink surface (`ink-blue`, `ink-saffron`, `ink-vermilion`, `ink-peach`, `ink-green`, `ink-teal`, `ink-pink`) declares the same set of tokens with its own values, and several of them cannot clear 4.5:1 for body-size status text, so on stone, vermilion, green, teal, and pink, plus saffron and peach in dark mode, every status token falls back to the surface's own ink and the color carries only on a swatch, a mark, or a heading at `--c97-fs-h2` and up. The full token table, the measured ratios, and every surface's dark-mode derivation live in `src/app/catalog97.css` and `STYLING.md`.

A six-step categorical chart ramp (`--c97-chart-1` through `--c97-chart-6`) lives on the page root and swaps to a lighter ramp inside espresso and chocolate sheets, since those are already the dark end of the palette. `--c97-chart-up` and `--c97-chart-down` alias the surface's positive and negative tokens for gain and loss series.

## Typography

Catalog 97 draws on four faces. Anton sets poster type, Newsreader sets every heading and named title, Archivo stands in for Helvetica Neue as the body face, and Fragment Mono carries readouts and micro-labels. Great Vibes, standing in for Snell Roundhand, is reserved for the single script wordmark in the footer. All five load through `next/font` in `src/app/layout.tsx`; Instrument Sans also still loads, held over from the Working Instrument, because Tailwind's `font-sans` utility names it and a few fantasy football draft room elements still set that class.

The scale is nine frozen steps, plus the two print shop sizes:

| Step | Size | Class |
| --- | --- | --- |
| Label | fixed 11px | `.c97-kicker`, `.c97-meta` |
| Small | `clamp(13px, 1.3vw, 15px)` | tables, buttons |
| Body | `clamp(15px, 1.4vw, 16px)` | `.c97-prose` |
| Lead | `clamp(19px, 2vw, 22px)` | `.c97-lead` |
| H3 | `clamp(20px, 2.2vw, 26px)` | `.c97-h3` |
| H2 | `clamp(24px, 2.7vw, 32px)` | `.c97-h2` |
| H1 | `clamp(32px, 4.2vw, 52px)` | `.c97-display` |
| Display | `clamp(46px, 5.6vw, 74px)` | rare, larger than an h1 |
| Plate | `clamp(64px, 8vw, 112px)` | `.c97-numeral`, Anton digits only |
| Poster | `clamp(44px, 7.4vw, 112px)` | `.c97-poster`, every h1 |
| Poster small | `clamp(30px, 4vw, 56px)` | `.c97-poster-sm`, section h2s and closing statements |

Poster type is presentational uppercase set in Anton, printed in the sheet's own ink with the second ink cast as a text-shadow a few hundredths of an em off register. The ink carries the contrast and the offset is decoration only. The uppercase case is presentational and is not part of the accessible name, so a screen reader still hears the heading in its written case. Newsreader never bolds; `em` inside injected article prose sets it italic. Project and article titles, and the names of things inside a page, stay in Newsreader because they name a specific thing, while every h1 and section h2 takes the poster treatment.

Two fixed micro sizes, `text-3xs` (10px) and `text-2xs` (11px), plus a fixed `text-1xs` (12px), are registered in `globals.css` for labels that must not scale, and nothing ships an arbitrary `text-[Npx]` value.

## Layout

The centered measure is `.c97-shell`, capped at 1080px (`--c97-container`) with margin-inline auto. The four dense tools in `WIDE_TOOL_ROUTES` (the trade calculator, the best ball draft room, Investments, and score pools) print on the 1376px `--c97-container-wide`, and every shell on those pages widens with them, the header's and footer's included, so each page keeps one edge. The running-prose column, `--c97-column`, is 720px, wide enough to hold the tables and code blocks a long article carries alongside its paragraphs. Horizontal gutter (`--c97-gutter`) is fluid, `clamp(28px, 6vw, 96px)`, and it sits off the spacing ladder because it answers a different question than block rhythm does.

Vertical rhythm comes entirely off a seven-step spacing ladder, and nothing in a Catalog 97 route may use a gap, margin, or band padding that is not one of these seven values:

| Step | Value |
| --- | --- |
| `--c97-sp-1` | `clamp(8px, 0.9vw, 10px)` |
| `--c97-sp-2` | `clamp(12px, 1.3vw, 17px)` |
| `--c97-sp-3` | `clamp(22px, 2.6vw, 32px)` |
| `--c97-sp-4` | `clamp(28px, 3.4vw, 44px)` |
| `--c97-sp-5` | `clamp(40px, 5vw, 68px)`, the default band height (`--c97-band-y`) |
| `--c97-sp-6` | `clamp(60px, 7.5vw, 116px)`, a taller band |
| `--c97-sp-7` | `clamp(76px, 9vw, 132px)`, the tallest band, reserved for blue sections |

Two more constants, `--c97-touch-y` (16px) and `--c97-touch-x` (8px), sit deliberately outside the ladder. They are solved backward from the 44px touch-target floor against an 11px label, not chosen for rhythm, and only `.c97-microlink` and the header brand lockup use them.

A route is a sequence of `.c97-band` sections, each carrying its own `data-c97-surface`. A band that changes surface from the one above it carries `.c97-sheet` with `data-seam="torn"` for a rough edge or `data-seam="deckle"` for a softer one, and a band that continues the same surface carries neither. The seven designed routes and the 33 project routes take the full print shop treatment with a poster hero; the utility pages and Score Pools use the same bands and vocabulary without the poster hero.

Every project route reads its own pair of lead inks from `src/constants/projectPress.ts`, keyed by pathname, and `ConditionalLayout` hands that pair to `Catalog97ToolShell`, which sets the second ink as the overprint (`data-c97-press-second`) on every sheet in the route. The route opens on `Catalog97ProjectHero`, a lead-ink sheet holding the poster h1, an optional standfirst and as-of line, at most three readouts, and the route's own signature visual as its child.

## Elevation and depth

Depth comes from tearing between sheets and from one hard offset shadow, never from a soft or ambient one. `.c97-offset` casts `8px 8px 0` in the sheet's second ink behind a plate or thumbnail, and the same class on a button (`.c97-btn`, `.c97-btn-invert`, `.c97-btn-outline`) draws a tighter `4px 4px 0` offset that collapses to nothing and shifts the button 4px on press, so pressing a button reads like pressing a printed tab down onto the page. A disabled control drops the offset entirely and reads as unprinted, a dashed edge in `--c97-ink-2` with no fill and no shadow.

Focus rings are square and carry no halo. Every anchor, button, input, textarea, select, and summary gets a 2px outline in the surface's `--c97-accent`, offset 3px, with `border-radius: 0` and no box-shadow, and a tile's ring sits inset 6px so it never falls under the 3:1 non-text contrast floor against the paper gap around it.

## Shapes

Every corner is square. The radius scale in `tailwind.config.ts` compiles every step, from `sm` through `full`, to `0`, and that holds on every route including the ones outside the page root. Buttons print as rectangles now, a break from the prior design language, where buttons and chips were the one rounded exception. The single true exception is the radio input, `.c97-check[type="radio"]`, which sets `border-radius: 50%` because a radio control has to render as a circle to read as a radio control at all.

## Components

A route composes bands from the vocabulary in `catalog97.css`.

| Need | Class |
| --- | --- |
| Kicker, heading, standfirst, prose, meta | `.c97-kicker`, `.c97-display`, `.c97-serif` with `.c97-h2` or `.c97-h3`, `.c97-lead`, `.c97-prose`, `.c97-meta` |
| Poster type | `.c97-poster`, `.c97-poster-sm` |
| Ledger rows and columns | `.c97-row` and its variants, `.c97-columns`, `.c97-mosaic` with `.c97-tile` |
| Raised block | `.c97-panel` |
| Readouts | `.c97-stat` with `.c97-stat-label`, `-value`, `-delta`, plus `.c97-mono` and `.c97-tabular` for numerals |
| Tags and status | `.c97-chip` with `-positive`, `-negative`, `-warning` |
| Tables | `.c97-table`, hairline rules, tabular numerals, a sticky header |
| Tab rows | `.c97-segmented` |
| Buttons | `.c97-btn`, `.c97-btn-invert`, `.c97-btn-ghost`, `.c97-btn-outline` |
| Form controls | `.c97-field`, `.c97-check`, `.c97-range` |
| Page furniture | `.c97-article` for injected HTML, `.c97-list`, `.c97-breadcrumb`, `.c97-disclosure`, `.c97-kbd`, `.c97-skeleton`, `.c97-meter` |
| Dense data surfaces | `.c97-dash`, which drops the default paragraph and list margins |

The primary button (`.c97-btn`) is a solid rectangle, `--c97-ink-2` behind `--c97-surface` text, 48px minimum height, uppercase small type. `.c97-btn-invert` swaps to `--c97-ink` for use on a saffron or vermilion band, `.c97-btn-ghost` is a text-only underlined action, and `.c97-btn-outline` is a 64px outlined display button used once, on a route's closing statement. A tile in `.c97-mosaic` hovers into a halftone screen (`.c97-halftone`), a dot pattern rendered in the sheet's own ink, and the header wordmark and any element marked `data-c97-paint` reveal a painted version of a photograph in a soft circle around the pointer, both gated behind `prefers-reduced-motion`.

## Print shop layout

A page is a print run. It picks two lead inks from blue, saffron, vermilion, green, teal, and pink, with peach counting as a vermilion tint, and everything else sits on paper, bone, chocolate, espresso, or black. The inks stay unlabeled on screen, since a swatch legend naming them was tried and removed on 2026-09-23 for reading as decoration talking about itself.

Sections are sheets. A band that changes surface from the one above it carries `.c97-sheet` with `data-seam="torn"` or `data-seam="deckle"`, so its top edge tears over its neighbor, and the shared footer always tears over whatever sits above it. The hero sheet opens on the poster headline with no label above it; a registration target and crop marks were tried there and removed on 2026-09-23 for the same reason.

Display type is poster type. Anton caps carry the sheet's own ink with the second ink printed a few hundredths of an em off register, on every h1 (`.c97-poster`) and every section h2 or closing statement (`.c97-poster-sm`). Project and article titles stay in Newsreader because they name a specific thing, and body text stays in Archivo. Tone is a halftone screen, and printed things, plates, thumbnails, and primary buttons, sit on the one allowed shadow, the hard offset in the second ink.

Project routes print the same way. A route's ink pair lives in `src/constants/projectPress.ts`, and `Catalog97ToolShell` sets the second ink as the overprint on every sheet below the hero. The hero itself is `Catalog97ProjectHero`, a lead-ink sheet with the poster h1, the as-of line, and at most three readouts. Anything inside that hero that paints a field, an input, a chip, or a code block, or that draws a data color, gets its own `data-c97-surface`, usually a paper plate with `.c97-offset`. The spec for this pattern is `docs/superpowers/specs/2026-09-25-project-specific-ui-design.md`.

## Identity exceptions

Isaac's decision is that a project keeps an identity that fits it, and one route prints outside the shared ink system as of 2026-09-27.

`/arcade` (`src/app/arcade/arcade.module.css`) is a fully self-contained synthwave CRT palette, deliberately scoped and never referencing a `--c97-*` token. Its swatches are a deep-indigo void (`#06010f`, `#11052b`), neon cyan (`#21e6ff`), magenta (`#ff2e97`), acid green (`#d6ff3f`), amber (`#ffb000`), and green (`#19f7a3`), against an off-white text color (`#ece4ff`). Keep it scoped and off the shared palette.

Formula 1 Pulse (`src/app/formula-1/formula-1.module.css`) used to be a second exception, for a scoped racing red. Since the sports pass (#478) the module reads only `--c97-*` tokens for its gantry, timing tower, podium, and race strip, and each team's livery arrives inline from the standings data, so it is no longer an exception.

Outside `/arcade`, data colors, team liveries, BART line colors, and party colors, stay data and never become inks. A route whose data already speaks in blue and red, for instance, prints its own two lead inks in neither, and because those colors used as small text routinely fail 4.5:1, the color goes on a swatch or a mark and the label text prints in the surface's own ink.

## Held by tests

`src/app/__tests__/catalog97-closeout.test.ts` scans every file under `src` and `e2e` for a read of a Working Instrument token (`--home-*`, the legacy `--radius-*` and `--shadow-*` tokens, and a handful of other dead names) and fails if it finds one. `src/app/__tests__/catalog97-inks.test.ts` holds the measured contrast ratios behind the surface tokens above, and `scripts/contrastSweep.mjs` runs the same check against the live pages in Playwright.

## Rules to keep

### Do

- Set `data-c97-surface` on the section and read `var(--c97-ink)`, `var(--c97-ink-2)`, `var(--c97-label)`, `var(--c97-action)`, `var(--c97-accent)`, and `var(--c97-rule)` inside it, and never set a color directly on a component.
- Keep every gap, margin, and band padding on the `--c97-sp-0` through `--c97-sp-7` ladder, with `sp-0` as the hairline step and only an optical nudge of 2px or less off it.
- Keep radii at zero everywhere outside `/arcade`, and let the one hard `.c97-offset` shadow stand in for every other shadow.
- Keep Fragment Mono at weight 400 and set tabular numerals on anything measured or counted.
- Keep Newsreader at weight 400, and reserve Anton poster type for h1s, section h2s, and closing statements.
- Confirm a status color clears 4.5:1 as body-size text on its surface before shipping it that way; several surfaces are large-text-or-mark only and fall back to ink.
- Keep a project's data colors, liveries, line colors, and party colors, as data, never as an ink.

### Don't

- Don't hardcode a hex in a component; read the token for the surface the component sits inside.
- Don't round a corner or add a blurred shadow anywhere outside `/arcade`.
- Don't fake a bold Fragment Mono weight, and don't bold Newsreader.
- Don't give a print run a third lead ink. A page picks exactly two, and peach counts as a vermilion tint, not a seventh ink.
- Don't read a `--home-*`, `--surface-*`, `--text-*`, `--border-*`, `--color-*`, `--radius-*`, or `--shadow-*` token, and don't reach for `HomeStatsPanel`, `WarmCard`, `Badge`, `Chip`, `Kicker`, `SectionIntro`, `Heading`, `Paragraph`, or `InlineSectionLead`; all were deleted with the Working Instrument on 2026-09-27.
