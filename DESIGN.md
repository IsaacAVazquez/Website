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
  action: "#4a3728"
  accent: "#6e2b36"
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
    lineHeight: 1.7
  body:
    fontFamily: '"Helvetica Neue", Helvetica, Archivo, Arial, sans-serif'
    fontSize: "clamp(15px, 1.4vw, 16px)"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: '"Helvetica Neue", Helvetica, Archivo, Arial, sans-serif'
    fontSize: "11px"
    fontWeight: 400
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
  sp-0: "clamp(4px, 0.45vw, 5px)"
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

**Status, 2026-09-27.** This file describes Catalog 97 as shipped. The unification that replaced the prior design language, the Working Instrument, closed out on this date. Every route renders inside `Catalog97Shell` or `Catalog97ToolShell`, every token is a `--c97-*` value declared in `src/app/catalog97.css`, and the old `--home-*` tokens plus the bridge that once aliased them onto Catalog 97 values were deleted from the codebase. `src/app/__tests__/catalog97-closeout.test.ts` fails if any file under `src` reads a Working Instrument token again, and `src/app/__tests__/catalog97-inks.test.ts` holds the surface tokens below to their minimum contrast ratios. `STYLING.md` is the fuller written reference and this file stays consistent with it; where the two disagree with the CSS, the CSS wins. As of 2026-11-02 the frame and the seven designed pages still read only `--c97-*` tokens, while a project route may declare its own palette inside the frame, as "Project routes own their design" below describes.

## Overview

Catalog 97 treats every page as a print run off a risograph press. A route is built from bands of grained paper stock, each one a "sheet" that can change color as the page scrolls, and a sheet that changes surface tears over the one above it in a rough torn or deckled edge. Two lead riso inks carry a page's identity, chosen from blue, saffron, vermilion, green, teal, and pink, with peach counting as a vermilion tint and not a seventh option. Everything else sits on the neutral stock, paper, bone, stone, chocolate, or espresso.

Display type is poster type. On the seven designed routes Anton caps set the h1 and every section h2, printed in the sheet's own ink with the second ink shadowed a few hundredths of an em off register, the way a two-color riso run drifts slightly out of registration. Newsreader carries every other heading and named title at weight 400 only, because the design never bolds the serif. Archivo stands in for Helvetica Neue, which the source design specifies but which only renders on macOS, and it carries body copy, kickers, and meta rows, with tabular numerals on meta rows, tables, and stat values. Fragment Mono carries readouts and code through `.c97-mono` and ships at weight 400 only. Great Vibes stands in for Snell Roundhand, another macOS-only face, and it appears exactly once, in the footer's script wordmark.

In the frame and on the designed pages the system draws no rounded corners and no blurred shadow, and since 2026-10-11 a project route decides that for itself in its own route CSS. `tailwind.config.ts` compiles the whole radius scale and the whole shadow scale to nothing, so a stray `rounded-lg` or `shadow-sm` left in markup paints square and flat. The one shape exception is the radio input, which sets `border-radius: 50%` so it renders as a circle. The one shadow the system allows is the hard printed offset, `.c97-offset`, a flat rectangle of the sheet's second ink sitting behind a plate, a thumbnail, or a primary button.

## Key characteristics

- Sheets of grained paper stock, not flat panels. Every surface carries a soft speckle texture and tears over its neighbor when the surface changes.
- Two lead riso inks per page, chosen from six plus a vermilion tint, never a third.
- Anton poster caps on the designed routes' h1s and section h2s, shadowed off register in the page's second ink.
- Newsreader at weight 400 for every other heading and title, and Archivo for body copy and kickers.
- Zero radius and zero blurred shadow in the frame and on the designed pages. The only shadow there is the hard offset behind a printed plate, thumbnail, or button.
- Fragment Mono at weight 400 only for readouts and code, and tabular numerals on anything measured or counted.

## Colors

Catalog 97 assigns color per surface. Every band declares `data-c97-surface`, and everything inside it reads that surface's own `--c97-ink`, `--c97-ink-2`, `--c97-label`, `--c97-action`, `--c97-accent`, and `--c97-rule`, so a component never sets a color directly. The values below are the paper surface's defaults in light mode, along with the seven riso ink swatches. A riso swatch names an ink and not a theme, so it is a fixed constant that holds the same hex in both light and dark mode.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| Paper | `#f1ebdf` | `#14100c` | the base stock and the site's default background |
| Bone | `#e4dbc9` | `#1e1811` | a second neutral stock, used to keep two paper bands from sitting adjacent |
| Stone | `#a79e8f` | `#6e655a` | a neutral block for an image slot with no photograph yet |
| Chocolate | `#4a3728` | `#3a2b1f` | a dark stock printed in light ink, for a closing or contrast band |
| Espresso | `#2b211a` | `#0c0907` | the darkest stock, closing most routes and carrying the chart ramp |
| Riso blue | `#1a3ea6` | same | lead or second ink |
| Riso saffron | `#edb722` | same | lead or second ink |
| Riso vermilion | `#df4c1e` | same | lead or second ink |
| Riso peach | `#f6b995` | same | a vermilion tint, not a seventh lead ink |
| Riso green | `#32a860` | same | lead or second ink, added 2026-09-25 |
| Riso teal | `#056c71` | same | lead or second ink, added 2026-09-25 |
| Riso pink | `#f25f9f` | same | lead or second ink, added 2026-09-25 |

On the paper surface, `--c97-ink` is `#2b211a`, `--c97-ink-2` is `#4a3728`, `--c97-label` is `#645e55`, `--c97-action` is `#4a3728`, `--c97-accent` is the oxblood `#6e2b36`, `--c97-rule` is `rgba(43, 33, 26, 0.18)`, `--c97-field` and `--c97-panel` are both bone `#e4dbc9`, and the status tokens read `#1b4d2c` positive, `#7a1c1c` negative, and `#5c3600` warning. Every ink surface (`ink-blue`, `ink-saffron`, `ink-vermilion`, `ink-peach`, `ink-green`, `ink-teal`, `ink-pink`) declares the same set of tokens with its own values, and not every surface can carry status color in body-size text. On vermilion, green, teal, and pink in both themes, and on saffron and peach in dark mode, every status token resolves to the surface's own ink, so a status line there belongs on a paper plate. Stone keeps its status colors in both themes, but they measure under 4.5:1 there, so on stone the color carries only on a swatch, a mark, or a heading at `--c97-fs-h2` and up, and body-size status text takes `--c97-ink`. The ink surfaces themselves deepen in dark mode (blue to `#0a2a78`, saffron to `#c99418`, vermilion to `#b23a16`, peach to `#c98b6a`, green to `#1f6b3f`, teal to `#0f5c61`, and pink to `#a3316c`), while the swatch constants above stay fixed. The full token table, the measured ratios, and every surface's dark-mode derivation live in `src/app/catalog97.css` and `STYLING.md`.

The second ink a sheet prints off register, behind poster type and as the hard offset, is `--c97-overprint`. It is vermilion on paper, saffron, and stone, blue on bone, peach, vermilion, green, and pink, and saffron on blue, teal, chocolate, and espresso, and in dark mode bone moves to vermilion while vermilion, green, and pink move to saffron.

A six-step categorical chart ramp (`--c97-chart-1` through `--c97-chart-6`) lives on the page root and swaps to a lighter ramp inside espresso and chocolate sheets in both themes, since those are already the dark end of the palette, and across the whole page in dark mode. Chocolate is the lighter of the two dark sheets and leaves the ramp's last step under 3:1, so charts belong on espresso. `--c97-chart-up` and `--c97-chart-down` alias the surface's positive and negative tokens for gain and loss series. The polling aggregator's party marks, `--c97-party-d-mark`, `--c97-party-r-mark`, and `--c97-party-tossup-mark`, live on the page root as well. They are drawn from the riso blue, vermilion, and saffron and set per theme, so a line, a swatch, or a figure in them clears 4.5:1 on paper and bone, and like any data color they never become the route's own inks.

## Typography

Catalog 97 draws on four faces. Anton sets poster type, Newsreader sets every other heading and named title, Archivo stands in for Helvetica Neue as the body face, and Fragment Mono carries readouts and code. Great Vibes, standing in for Snell Roundhand, is reserved for the single script wordmark in the footer. All five load through `next/font` in `src/app/layout.tsx`; Instrument Sans also still loads, held over from the Working Instrument, because Tailwind's `font-sans` utility names it and the root layout sets that class on `body`.

The scale is nine frozen steps, plus the two print shop sizes:

| Step | Size | Class |
| --- | --- | --- |
| Label | fixed 11px | `.c97-kicker`, `.c97-meta` |
| Small | `clamp(13px, 1.3vw, 15px)` | tables, buttons |
| Body | `clamp(15px, 1.4vw, 16px)` | `.c97-prose` |
| Lead | `clamp(19px, 2vw, 22px)` | `.c97-lead` |
| H3 | `clamp(20px, 2.2vw, 26px)` | `.c97-h3` |
| H2 | `clamp(24px, 2.7vw, 32px)` | `.c97-h2` |
| H1 | `clamp(32px, 4.2vw, 52px)` | `.c97-display`, the h1 on the utility pages and articles |
| Display | `clamp(46px, 5.6vw, 74px)` | rare, larger than an h1 |
| Plate | `clamp(64px, 8vw, 112px)` | `.c97-numeral`, Anton digits only |
| Poster | `clamp(44px, 7.4vw, 112px)` | `.c97-poster`, the h1 on Home, About, Résumé, and Contact |
| Poster small | `clamp(30px, 4vw, 56px)` | `.c97-poster-sm`, section h2s, closing statements, and the h1 on Work, Writing, and Dashboards |

Poster type is presentational uppercase set in Anton, printed in the sheet's own ink with the second ink cast as a text-shadow a few hundredths of an em off register. The ink carries the contrast and the offset is decoration only. The uppercase case is presentational and is not part of the accessible name, so a screen reader still hears the heading in its written case. Newsreader never bolds; `em` inside injected article prose sets it italic. Project and article titles, and the names of things inside a page, stay in Newsreader because they name a specific thing, while the h1 and every section h2 on the seven designed routes take the poster treatment. Work, Writing, and Dashboards moved their h1 down to the `.c97-poster-sm` step on 2026-10-19, so the three index pages share one heading size with the section headings, and the utility pages and articles set their h1 in Newsreader at the `.c97-display` step. The Résumé sheet and the About proof, both set on 2026-10-19, give their few section headings Anton caps at sizes of their own, below the `.c97-poster-sm` step.

Outside the poster classes, Anton also sets three pieces of the frame at sizes of their own, the header wordmark, the names on the footer's tiles, and the "-30-" mark that closes an article. A heading that takes none of the classes above falls back to the base layer in `globals.css`, which sets h1 through h6 in the body face at weight 700, and the same layer sets every `em` that nothing else styles in Newsreader italic, anywhere on the site.

Two fixed micro sizes, `text-3xs` (10px) and `text-2xs` (11px), plus a fixed `text-1xs` (12px), are registered in `globals.css` for labels that must not scale, and nothing ships an arbitrary `text-[Npx]` value.

## Layout

The centered measure is `.c97-shell`, capped at 1080px (`--c97-container`) with margin-inline auto. The dense tools in `WIDE_TOOL_ROUTES` (Bay Area Transit, all eight fantasy football routes, Investments, and score pools) print on the 1376px `--c97-container-wide`, and every shell on those pages widens with them, the header's and footer's included, so each page keeps one edge. The running-prose column, `--c97-column`, is 720px, wide enough to hold the tables and code blocks a long article carries alongside its paragraphs. Horizontal gutter (`--c97-gutter`) is fluid, `clamp(28px, 6vw, 96px)`, and it sits off the spacing ladder because it answers a different question than block rhythm does. Content that sits outside a `.c97-band` pairs `.c97-shell` with `.c97-frame`, which carries that gutter itself, so its edges land where a band's shell would.

Vertical rhythm comes entirely off an eight-step spacing ladder, and nothing in a Catalog 97 route may use a gap, margin, or band padding that is not one of these eight values, apart from an optical nudge of 2px or less:

| Step | Value |
| --- | --- |
| `--c97-sp-0` | `clamp(4px, 0.45vw, 5px)`, the hairline step, for an icon beside its label and the padding inside a chip or a dense tool's cell |
| `--c97-sp-1` | `clamp(8px, 0.9vw, 10px)` |
| `--c97-sp-2` | `clamp(12px, 1.3vw, 17px)` |
| `--c97-sp-3` | `clamp(22px, 2.6vw, 32px)` |
| `--c97-sp-4` | `clamp(28px, 3.4vw, 44px)` |
| `--c97-sp-5` | `clamp(40px, 5vw, 68px)`, the default band height (`--c97-band-y`) |
| `--c97-sp-6` | `clamp(60px, 7.5vw, 116px)`, a taller band (`.c97-band-tall`) |
| `--c97-sp-7` | `clamp(76px, 9vw, 132px)`, the tallest band (`.c97-band-taller`), reserved for blue sections |

Two more constants, `--c97-touch-y` (16px) and `--c97-touch-x` (8px), sit deliberately outside the ladder. They are solved backward from the 44px touch-target floor against an 11px label, not chosen for rhythm. `.c97-microlink` uses both, and the header brand lockup (`.c97-brand`) and, since 2026-10-19, the superscript note links and source links on /about (`Catalog97About.module.css`) use `--c97-touch-y`.

A route is a sequence of `.c97-band` sections, each carrying its own `data-c97-surface`. A band that changes surface from the one above it carries `.c97-sheet` with `data-seam="torn"` for a rough edge or `data-seam="deckle"` for a softer one, and a band that continues the same surface carries neither, while `.c97-band-continues` takes the top padding off such a band so a hero and the block under it read as one section. The seven designed routes take the full print shop treatment, Home, Work, Writing, and Dashboards with a poster hero and, since 2026-10-19, About, Résumé, and Contact as one object each on one band ("Print shop layout" below). The project routes own their design inside the frame (the section below), and the utility pages use the same bands and vocabulary without the poster hero.

A project route renders its own root inside `Catalog97ToolShell` and owns everything from there down, which "Project routes own their design" below describes.

## Elevation and depth

Depth comes from tearing between sheets and from one hard offset shadow, never from a soft or ambient one. `.c97-offset` casts `8px 8px 0` in the sheet's second ink behind a plate or thumbnail, and the same class on a button (`.c97-btn`, `.c97-btn-invert`, `.c97-btn-outline`) draws a tighter `4px 4px 0` offset that collapses to nothing and shifts the button 4px on press, so pressing a button reads like pressing a printed tab down onto the page. A disabled control drops the offset entirely and reads as unprinted, a dashed edge in `--c97-ink-2` with no fill and no shadow.

Stacking order is a token as well. Overlays read the `--c97-z-*` values declared on `:root`, since some layers portal to the body outside the page root, from `--c97-z-sticky` (5) for an in-page sticky bar through tray (50), toast (55), drawer (60), and modal (70) to sheet (80), and never an arbitrary z-index. The header lifts one step above the tray level while its search is open, so the search panel passes over a route's sticky bar.

Focus rings are square and carry no halo. Every anchor, button, input, textarea, select, and summary gets a 2px outline in the surface's `--c97-accent`, offset 3px, with `border-radius: 0` and no box-shadow, and a tile's ring sits inset 6px so it never falls under the 3:1 non-text contrast floor against the paper gap around it.

## Motion

Every state change, from a hover to a press to an overlay entrance, decelerates on one curve, `--c97-ease` (`cubic-bezier(0.22, 1, 0.36, 1)`), and the plate reveal settles on the longer `--c97-ease-slow` (`cubic-bezier(0.19, 0.72, 0.16, 1)`). Both live on `:root` for the same portal reason as the stacking tokens, and Tailwind's transition utilities default to `--c97-ease` as well, through `--default-transition-timing-function` in `globals.css`. Looping keyframes, the skeleton pulse and the header wordmark's drift, keep `ease-in-out`, since a loop that alternates needs a symmetric curve. Drawers, trays, and modals enter through `.c97-enter-fade`, `.c97-enter-slide-x`, `.c97-enter-slide-y`, and `.c97-enter-pop`, which transition in from `@starting-style` with no exit animation. The reduced-motion block in `catalog97.css` holds every transition and animation inside the page root to 0.01ms, `Catalog97Reveal` never arms a plate reveal under reduced motion, and JavaScript-driven motion reads `useReducedMotion()` from `src/hooks/useReducedMotion.ts`.

## Printing on paper

Paper has rules of its own, most of them measured in three browser engines on 2026-09-29 and written up under "Printing on paper" in `STYLING.md`. Under `@media print` the grain comes off, the torn and deckled seams tear with clip paths (`--c97-seam-torn-clip` and `--c97-seam-deckle-clip`) because Safari's engine paints a mask's image over the element instead of masking it, the halftone comes off, and in Firefox's engine alone a photograph's 35mm filter comes off as well. Since 2026-10-09 the spacing, type, and gutter tokens take the fixed values of a 740px layout on paper, and a grid that widens with the window holds its wide rule to `screen`, so the columns, the mosaic, and the footer tiles print in their narrow arrangement from any window. `e2e/print.spec.ts` checks these rules under print media on a handful of pages, Home and About among them.

## Shapes

Every corner in the frame and on the designed pages is square. The radius scale in `tailwind.config.ts` compiles every step, from `xs` through `full`, to `0`, and that holds on every route including the ones outside the page root, so a rounded corner can only come from a page's own CSS, which is where many project routes, /arcade and the fantasy kit's 3px stickers among them, round theirs. Buttons print as rectangles now, a break from the prior design language, where buttons and chips were the one rounded exception. The single true exception is the radio input, `.c97-check[type="radio"]`, which sets `border-radius: 50%` because a radio control has to render as a circle to read as a radio control at all.

## Components

A route composes bands from the vocabulary in `catalog97.css`.

| Need | Class |
| --- | --- |
| Kicker, heading, standfirst, prose, meta | `.c97-kicker`, `.c97-display`, `.c97-serif` with `.c97-h2` or `.c97-h3`, `.c97-lead`, `.c97-prose`, `.c97-meta` |
| Poster type | `.c97-poster`, `.c97-poster-sm` |
| Ledger rows and columns | `.c97-row` and its variants, `.c97-columns`, `.c97-mosaic` with `.c97-tile` |
| Raised block | `.c97-panel` |
| Links | `.c97-link` inside prose, `.c97-link-heading` for a heading that is itself a link, `.c97-sectionlink` for the link that closes a section, and `.c97-microlink` for an uppercase label link with a 44px target |
| Image fields | `.c97-slot` with `.c97-slot-img` (`Catalog97Slot`), a photograph in the warm 35mm treatment over a flat stone, vermilion, or peach field |
| Readouts | `.c97-stat` with `.c97-stat-label`, `-value`, `-delta`, plus `.c97-mono` and `.c97-tabular` for numerals |
| Tags and status | `.c97-chip` with `-positive`, `-negative`, `-warning` |
| Tables | `.c97-table`, hairline rules, tabular numerals, a sticky header |
| Tab rows | `.c97-segmented` |
| Buttons | `.c97-btn`, `.c97-btn-invert`, `.c97-btn-ghost`, `.c97-btn-outline` |
| Form controls | `.c97-field`, `.c97-check`, `.c97-range` |
| Page furniture | `.c97-article` for injected HTML, `.c97-list`, `.c97-breadcrumb`, `.c97-disclosure`, `.c97-kbd`, `.c97-skeleton`, `.c97-meter` |
| Dense data surfaces | `.c97-dash`, which drops the default paragraph and list margins |

The primary button (`.c97-btn`) is a solid rectangle, `--c97-ink-2` behind `--c97-surface` text, 48px minimum height, uppercase small type. `.c97-btn-invert` swaps to `--c97-ink` for use on a saffron or vermilion band, `.c97-btn-ghost` is a text-only underlined action, and `.c97-btn-outline` is a 64px outlined display button used once, on Home's closing vermilion band. A tile in `.c97-mosaic` hovers into a halftone screen, a dot pattern in the tile's own ink laid over its grain. The `.c97-halftone` span is the decorative screen a sheet or panel carries for tone, and hovering its field on a screen with hover splits its dots into blue, vermilion, and saffron a little off register. The header wordmark fills with a slowly drifting Monet canvas on hover and keyboard focus, picked by the visitor's time of day, and reduced motion freezes the drift. Any element marked `data-c97-paint` reveals a painted version of its photograph in a soft circle around the pointer, only on a screen with hover and no reduced-motion preference.

## Print shop layout

A page is a print run. It picks two lead inks from blue, saffron, vermilion, green, teal, and pink, with peach counting as a vermilion tint, and everything else sits on paper, bone, stone, chocolate, espresso, or print black. The inks stay unlabeled on screen, since a swatch legend naming them was tried and removed on 2026-09-23 for reading as decoration talking about itself.

Sections are sheets. A band that changes surface from the one above it carries `.c97-sheet` with `data-seam="torn"` or `data-seam="deckle"`, so its top edge tears over its neighbor, and the shared footer always tears over whatever sits above it. The hero sheet opens on the poster headline with no label above it; a registration target and crop marks were tried there and removed on 2026-09-23 for the same reason.

Since 2026-10-19 About, Résumé, and Contact have no hero sheet. Each is one object on one band (`docs/superpowers/specs/2026-10-19-about-resume-contact-objects-design.md`), About a proofread document with checked notes in its margin, the résumé a letter sheet on a bone press bed, and Contact a reply card. The object's root carries `data-c97-object`, which tells `e2e/layoutChecks.ts` and `scripts/layoutSweep.mjs` that the h1 inside it is inset by design and does not start on the header's edge.

Display type is poster type. Anton caps carry the sheet's own ink with the second ink printed a few hundredths of an em off register, on the h1 (`.c97-poster` on Home, About, Résumé, and Contact, and `.c97-poster-sm` on Work, Writing, and Dashboards since 2026-10-19) and every section h2 or closing statement (`.c97-poster-sm`). Project and article titles stay in Newsreader because they name a specific thing, and body text stays in Archivo. Tone is a halftone screen, and printed things, plates, thumbnails, and primary buttons, sit on the one allowed shadow, the hard offset in the second ink.

Project routes printed the same way from 2026-09-25 until 2026-10-11, with an ink pair per route and `Catalog97ProjectHero` as the lead-ink headline sheet (`docs/superpowers/specs/2026-09-25-project-specific-ui-design.md`). Every route had moved to its own design by 2026-10-12 and the close-out deleted that pattern's code, so the section below is what replaced it.

## Project routes own their design

Isaac's decision on 2026-10-10 is that each project route owns its design inside the site frame. The header, the one `main`, and the footer stay Catalog 97, and everything a project renders inside them is the project's, from the layout and whether there is a hero at all to the type scale, the density, and its own color system where the genre calls for it. A project may also add one typeface when its genre earns it, loaded with `next/font` on that route only. The `--c97-*` tokens stay available there as a default and are never required. The contract a project route follows, including the shared rules that leak into a project root and how to handle them, is the "Project routes" section of `DESIGN_CHECKLIST.md`, and the spec is `docs/superpowers/specs/2026-10-11-project-sovereign-design.md`.

`/arcade` (`src/app/arcade/arcade.module.css`) was the first route to work this way, as a fully self-contained synthwave CRT palette that paints its own root, writes its own focus rules, and borrows no `c97-*` class beyond `c97-shell c97-frame`. Its swatches are a deep-indigo void (`#06010f`, `#11052b`), neon cyan (`#21e6ff`), magenta (`#ff2e97`), acid green (`#d6ff3f`), amber (`#ffb000`), and green (`#19f7a3`), against an off-white text color (`#ece4ff`). It also loads two faces of its own, Press Start 2P and VT323, through `next/font` in `src/app/arcade/page.tsx`, which it has had since it was built on 2026-06-25, before the one-typeface rule. It is the model for how a project root reaches independence.

Formula 1 Pulse (`src/app/formula-1/formula-1.module.css`) used to be a scoped-red exception, and the sports pass (#478) moved it onto `--c97-*` tokens. Since its redesign on 2026-10-12 the module declares its own `--f1-*` palette on the route root, a track-grey page with a light and a dark story and a carbon timing tower in both themes, and it maps the `--c97-*` tokens the shell and the focus ring read onto that palette. Each team's livery still arrives as data.

Fantasy football is eight routes that share one design. Since its redesign on 2026-10-13 a layout at `src/app/fantasy-football/layout.tsx` wraps all eight in a root that carries the kit's `--ffb-*` tokens, loads Archivo as a variable font with its width axis, and renders a product bar that links the eight tools. The kit is `src/components/fantasy/fantasy.css`, a cool board in light and in dark where position is the color system, a pick is a solid sticker, and lists are ruled rows with no boxes. `docs/FANTASY_FOOTBALL_KIT.md` is its reference and `docs/superpowers/specs/2026-10-13-fantasy-football-redesign-design.md` is the spec.

Everywhere, data colors, team liveries, BART line colors, and party colors, stay data and never become inks. A route whose data already speaks in blue and red, for instance, prints its own two lead inks in neither, and because those colors used as small text routinely fail 4.5:1, the color goes on a swatch or a mark and the label text prints in the surface's own ink.

## Held by tests

`src/app/__tests__/catalog97-closeout.test.ts` scans every file under `src` and `e2e` for a read of a Working Instrument token (`--home-*`, the legacy `--radius-*` and `--shadow-*` tokens, and a handful of other dead names) and fails if it finds one. The same file fails if `globals.css` or `catalog97.css` declares one of those tokens or a Working Instrument helper class (`.home-*`, `.section-*`, `.tool-*`, and the rest of that family), if Tailwind's radius and shadow scales stop compiling to nothing, if a class of the tool vocabulary goes missing, or if a Tailwind spacing utility sits on an element whose Catalog 97 class already sets that property. `src/app/__tests__/catalog97-inks.test.ts` holds ink, ink-2, label, and action at 4.5:1 or better on every ink surface, ink, ink-2, and label at 4.5:1 or better on every surface's panel, and the dark chart ramp's readable steps at 3:1 on espresso and chocolate, all in both themes. `src/app/__tests__/catalog97-stacking.test.ts` holds the header's lift over the page while its search is open, the street map's own stacking context, and the street map's tiles dropping their wash and blend on paper in Firefox's engine. `scripts/contrastSweep.mjs` measures the text contrast of live pages in both themes through Playwright.

`scripts/layoutSweep.mjs` checks every public route from phone to big-monitor sizes for sideways scroll and for an h1, breadcrumb, or footer that misses the header's edges, and `e2e/layoutChecks.ts`, the part of it cheap enough for CI, holds the same edges at 390, 1440, and 1920px. `src/app/__tests__/route-stylesheets.test.ts` fails when two route folders name a class the same way, since a route's plain stylesheet stays on the page through later client-side navigation, and `src/app/fantasy-football/__tests__/print-shop-rules.test.ts` holds the fantasy kit to its own rules, meaning its one 3px sticker radius, shadows with no blur, no hex color in markup, and a class prefix for each of its area sheets.

## Rules to keep

### Do

- Set `data-c97-surface` on the section and read `var(--c97-ink)`, `var(--c97-ink-2)`, `var(--c97-label)`, `var(--c97-action)`, `var(--c97-accent)`, and `var(--c97-rule)` inside it, and never set a color directly on a component.
- Keep every gap, margin, and band padding on the `--c97-sp-0` through `--c97-sp-7` ladder, with `sp-0` as the hairline step and only an optical nudge of 2px or less off it.
- Keep radii at zero in the frame and on the designed pages, and let the one hard `.c97-offset` shadow stand in for every other shadow there; a project route decides for itself in its own route CSS.
- Keep Fragment Mono at weight 400 and set tabular numerals on anything measured or counted.
- Keep Newsreader at weight 400, and reserve Anton poster type for h1s, section h2s, and closing statements.
- Confirm a status color clears 4.5:1 as body-size text on its surface before shipping it that way; several surfaces resolve their status tokens to ink, and on stone the status colors are large-text-or-mark only.
- Keep a project's data colors, liveries, line colors, and party colors, as data, never as an ink.

### Don't

- Don't hardcode a hex in a component; read the token for the surface the component sits inside.
- Don't round a corner or add a blurred shadow in the frame or on a designed page.
- Don't fake a bold Fragment Mono weight, and don't bold Newsreader.
- Don't give a print run a third lead ink. A page picks exactly two, and peach counts as a vermilion tint, not a seventh ink.
- Don't read a `--home-*`, `--surface-*`, `--radius-*`, or `--shadow-*` token or one of the legacy `--text-*`, `--border-*`, and `--color-*` aliases such as `--text-primary`, `--border-accent`, and `--color-primary` (the fluid `--text-xs` through `--text-6xl` scale and the micro sizes in `globals.css` are live) or a retired font name such as `--font-mono` or `--font-heading` (`--font-fragment-mono` and the `--c97-font-*` tokens are live), and don't reach for `HomeStatsPanel`, `WarmCard`, `Badge`, `Chip`, `Kicker`, `SectionIntro`, `Heading`, `Paragraph`, or `InlineSectionLead`; all were deleted with the Working Instrument on 2026-09-27.
