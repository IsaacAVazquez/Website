# Styling System

Current styling and design-token reference for the live app.

**Last updated:** 2026-09-27 · Catalog 97 is the only design language on the site. Every route renders inside `Catalog97Shell` or `Catalog97ToolShell`, and every colour, space, and type size comes from the `--c97-*` tokens in `src/app/catalog97.css`. The Working Instrument that came before it (the `--home-*` palette, its `.home-*`, `.section-*`, and `.tool-*` helpers, `HomeStatsPanel`, and the bridge block that aliased the old tokens onto Catalog 97 values) was deleted in the close-out of `docs/superpowers/specs/2026-09-16-catalog97-unification-design.md` on 2026-09-27, and `src/app/__tests__/catalog97-closeout.test.ts` fails if any file under `src` reads one of those tokens again. `/arcade` keeps its CRT palette and `formula-1.module.css` its scoped F1 red, and those are the two sanctioned palette exceptions.

---

## Core principles

- One token system. Components read `--c97-*` tokens inside a `data-c97-surface`, and nothing sets a colour on a component directly.
- Light and dark come from the same tokens, since every surface declares its dark values under `.dark`.
- One accent. `--c97-accent` marks data, state, and action (links, live dots, focus, active states) and is never a decorative wash.
- No radius and no blurred shadow anywhere. The one shadow is the hard printed offset, `.c97-offset`.
- CSS Modules alias the tokens (`--x-ink: var(--c97-ink)`) and never re-declare the palette as fresh hex with its own `.dark` mirror.
- Accessible focus rings, 44px minimum touch targets, and motion that respects reduced-motion preferences, meaning numbers count up once, lines draw in once, and nothing loops.

---

## Source files

- `src/app/catalog97.css` holds every token and every component class. `globals.css` imports it.
- `src/app/globals.css` keeps the Tailwind wiring, the fluid `--text-*` scale that Tailwind's `text-*` utilities read, the `@theme` micro-type sizes, and a few element defaults (focus ring, heading weight, paragraph measure, `.sr-only`, `.scroll-shadow-x`, `.scrollbar-thin`, `.tap-target`).
- `tailwind.config.ts` maps the fluid type scale and the touch helpers, and compiles the radius and shadow scales to nothing.
- `src/components/catalog97/*` holds the shells, the header and footer, and the shared print shop components such as `Catalog97ProjectHero`.

---

## The surface contract

Tokens are declared on data attributes, never on a class. `[data-c97]` sits on the page root that `Catalog97Shell` renders and carries the constants, and `[data-c97-surface]` carries the colours for one sheet. A section sets `data-c97-surface` and everything inside it reads the tokens, so a nested surface re-resolves them on its own element and dark mode is one override per surface in the stylesheet.

The surfaces are `paper`, `bone`, `stone`, `chocolate`, and `espresso`, plus the seven riso ink sheets `ink-blue`, `ink-saffron`, `ink-vermilion`, `ink-peach`, `ink-green`, `ink-teal`, and `ink-pink`. Every one declares the same set.

| Token | Use |
|-------|-----|
| `--c97-surface` | the sheet's own colour |
| `--c97-ink` | body text and strong fills |
| `--c97-ink-2` | secondary text and control boundaries (clears 3:1 as a boundary on every surface) |
| `--c97-label` | kickers, meta rows, and table headings |
| `--c97-action` | hover states |
| `--c97-accent` | the accent, for data, state, and action |
| `--c97-rule` | hairline rules and dividers |
| `--c97-field` | inputs, chips, and code, which paint a pale tint of the sheet |
| `--c97-panel` | `.c97-panel`, a tint of the sheet held at 4.5:1 for ink, ink-2, and label |
| `--c97-positive`, `--c97-negative`, `--c97-warning` | status text, measured at 4.5:1 on the surface |
| `--c97-accent-soft`, `--c97-overlay` | a 16% accent tint and an 8% ink overlay, derived per surface |
| `--c97-chart-up`, `--c97-chart-down` | aliases of positive and negative for charts |
| `--c97-overprint` | the page's second ink, set through the shell's `press` |

On the ink sheets where a status colour cannot clear 4.5:1, the status tokens fall back to the ink, so on ink-green every status line reads as ink. Status lines on those sheets belong on a paper plate. Fields paint the pale `--c97-field` on every surface, so a field inside a dark or lead-ink sheet needs a paper plate too, and on paper and bone `--c97-panel` equals `--c97-field`, which is why `.c97-field` keeps its `--c97-ink-2` bottom rule.

`src/app/__tests__/catalog97-inks.test.ts` holds the measured ratios, and the Playwright sweep in `scripts/contrastSweep.mjs` checks the live pages.

### Constants on the page root

`[data-c97]` also declares the fonts (`--c97-font-body` for Archivo standing in for Helvetica Neue, `--c97-font-display` for Newsreader, `--c97-font-poster` and `--c97-font-numeral` for Anton, `--c97-font-script` for the footer wordmark, `--c97-font-mono` for Fragment Mono), the six-step categorical chart ramp `--c97-chart-1` through `--c97-chart-6` with a dark ramp under `.dark`, the riso ink constants (`--c97-riso-*`), the seam and grain masks, the 1080px `--c97-container`, the 720px running-prose `--c97-column`, and the frozen scales below.

| Scale | Tokens |
|-------|--------|
| Spacing | `--c97-sp-1` through `--c97-sp-7`, plus `--c97-gutter` and `--c97-band-y` |
| Type | `--c97-fs-label` (the fixed 11px label), `-small`, `-body`, `-lead`, `-h3`, `-h2`, `-h1`, `-display`, `-plate`, and the print shop `-poster` and `-poster-sm` |
| Line height | `--c97-lh-display`, `-tight`, `-body`, `-loose` |
| Measure | `--c97-measure-tight`, `-body`, `-wide` |

Nothing may use a gap, margin, or band padding that is off the spacing ladder, and nothing is added to the type ladder.

---

## Print shop layout

The seven designed routes and the 33 project routes are laid out as risograph print runs, the method the designed routes took on 2026-09-23 and the project routes took between 2026-09-25 and 2026-09-27. The utility pages, Score Pools, and `/admin` use the same bands and vocabulary without the poster hero. The primitives live at the end of `src/app/catalog97.css` under "Print shop layout", and Home (`Catalog97Home.tsx`) is the reference build.

A page is a print run. It picks two lead inks from blue, saffron, vermilion, green, teal, and pink, with peach counting as a vermilion tint, and everything else is paper, bone, chocolate, espresso, or black. Green, teal, and pink joined on 2026-09-25 so the project routes could each print their own pair, and their measured ratios sit beside each `ink-*` block in `catalog97.css`. The inks stay unlabelled, since a swatch legend naming them read as decoration talking about itself and was removed on 2026-09-23. The printed plates in `public/images/home` carry their own inks and don't count against the page's two.

Sections are sheets. A band that changes surface from the one above it gets `c97-sheet` with `data-seam="torn"`, or `"deckle"` for a softer edge, so its top edge tears over its neighbour. A band that continues the same surface has no seam, and the shared footer always tears over whatever sits above it.

The hero sheet opens on the poster headline with no label above it. Crop marks and a registration target were tried there and removed on 2026-09-23, because they read as decoration.

Display type is poster type. h1s take `.c97-poster` and section h2s and closing statement lines take `.c97-poster-sm`, which set Anton caps with the sheet's second ink (`--c97-overprint`) printed a few hundredths of an em off register. The ink carries the contrast and the offset is decoration. Project and article titles, and the names of things inside a page, stay in Newsreader because they name a specific thing, and body text stays in Archivo.

Tone is a halftone screen. Hover states and empty image fields use a dot screen in the sheet's own ink (`.c97-halftone`, the tile hover).

Printed things sit on an offset. Plates, thumbnails, and the primary buttons take `.c97-offset`, a hard shadow in the second ink, and a button's offset collapses when it is pressed. This is the only shadow the system allows.

Heroes and images carry information. A collage of plates is only used where each plate is a link with something of its own on it, the way Home's dashboard doors each carry a live readout (`Catalog97Collage`). A collage that only repeats a list further down the page gets cut.

Project routes print the same way. A route's ink pair lives in `src/constants/projectPress.ts`, and `ConditionalLayout` hands it to `Catalog97ToolShell`, which sets the second ink as the overprint on every sheet. The route opens on `Catalog97ProjectHero`, a lead-ink sheet with the poster h1, the as-of line, at most three readouts, and the route's signature visual as its child. Anything inside that hero that paints a field, such as an input, a chip, or a code block, or that draws data colours, gets its own `data-c97-surface`, usually a paper plate with `.c97-offset`. Data colours such as liveries, line colours, and party colours stay data and never become inks, and a page whose data already speaks in blue and red prints in neither. The spec is `docs/superpowers/specs/2026-09-25-project-specific-ui-design.md`.

---

## Component vocabulary

A route is a sequence of `c97-band` sections, each with its own `data-c97-surface`, and each band's content sits in a `.c97-shell` (1080px). A dense tool that needs more width widens that one shell inline, the way the Investments terminal does.

| Need | Class |
|------|-------|
| Kicker, heading, standfirst, prose, meta | `.c97-kicker`, `.c97-display`, `.c97-serif` with `.c97-h2`/`.c97-h3`, `.c97-lead`, `.c97-prose`, `.c97-meta` |
| Poster type | `.c97-poster`, `.c97-poster-sm` |
| Ledger rows and columns | `.c97-row` and its variants, `.c97-columns`, `.c97-mosaic`/`.c97-tile` |
| Raised block | `.c97-panel` |
| Readouts | `.c97-stat` with `.c97-stat-label`, `-value`, `-delta`; `.c97-mono` and `.c97-tabular` for numerals |
| Tags and status | `.c97-chip` with `-positive`, `-negative`, `-warning` |
| Tables | `.c97-table` (hairline rules, tabular numerals, sticky header) |
| Tab rows | `.c97-segmented` |
| Buttons | `.c97-btn`, `.c97-btn-invert`, `.c97-btn-ghost`, `.c97-btn-outline` |
| Form controls | `.c97-field`, `.c97-check`, `.c97-range` |
| Page furniture | `.c97-article` for injected HTML, `.c97-list`, `.c97-breadcrumb`, `.c97-disclosure`, `.c97-kbd`, `.c97-skeleton`, `.c97-meter` |
| Dense data surfaces | `.c97-dash`, which drops the paragraph and list margins |

Four traps come with the vocabulary. The type classes and `.c97-panel` are unlayered and set their own margin or padding, so a Tailwind margin, padding, or `space-y-*` utility on the same element silently loses, and that spacing belongs in an inline style. `.c97-lead` sets `max-inline-size: none` and `.c97-prose` sets `margin: 0`, both unlayered. `.c97-disclosure` is a collapsible details widget, so a disclaimer never goes inside it. `sticky` only pins within its parent, so a sticky rail needs a parent as tall as the content it rides beside.

---

## Tailwind integration

`tailwind.config.ts` is loaded through `@config` in `globals.css`, which is what makes class-based `dark:`, `min-h-touch`/`min-w-touch`, and the fluid `text-*` scale work. It also sets every step of the radius scale to `0` and every step of the shadow scale to `none`, so a `rounded-lg` or `shadow-sm` left in markup paints square and flat on every route, including anything outside the page root. Colour utilities are not mapped, so colour reaches Tailwind only as an arbitrary value that reads a token, as in `text-[var(--c97-ink-2)]`. Migrated routes prefer the `catalog97.css` classes over Tailwind for type, spacing, and colour.

The typography plugin (`@tailwindcss/typography`) is still installed.

---

## Typography

Fonts load through `next/font` in `src/app/layout.tsx`. Newsreader, Archivo, Anton, and Great Vibes sit behind the `--c97-font-*` tokens, and Fragment Mono behind `--c97-font-mono`. Instrument Sans still loads, because Tailwind's `font-sans` names it and a few fantasy and Score Pools elements still set that utility.

The fluid type tokens `--text-xs` through `--text-6xl` in `globals.css` back Tailwind's `text-*` utilities. The micro sizes `--text-3xs` (10px), `--text-2xs` (11px), and `--text-1xs` (a fixed 12px) are registered in the `@theme` block, and nothing ships an arbitrary `text-[Npx]` value. Use 10px as `text-3xs`, 11px as `text-2xs`, a fixed 12px as `text-1xs`, and a label that may scale between 12 and 14px as `text-xs`. On a migrated route the Catalog 97 type classes above come first.

Headings default to the body face at 700 with tight tracking and balanced wrapping, and take their colour from the surface they sit on. `em` sets Newsreader italic.

---

## Theme behaviour

Dark mode is class based. `next-themes` puts `.dark` on `<html>`, and every surface block in `catalog97.css` has a `.dark` counterpart, so components that read tokens adapt without any `dark:` utility. The body outside the page root paints the paper values as printed, which covers the overscroll gutter and the skip link (`.c97-skip-link`).

### Charts and D3

D3 and SVG fills can't read Tailwind classes, so charts resolve token colours at render time. Read them with `getComputedStyle(svgElement).getPropertyValue('--c97-accent')` from the chart's own element, since the tokens are scoped to the `[data-c97]` container and `document.documentElement` resolves none of them, and re-resolve on theme change (`useTheme().resolvedTheme` as an effect dependency). `var()` and `color-mix()` never resolve inside SVG presentation attributes, so pass resolved values to `.attr()` or use `.style()`. Never bake a token's hex into a constant.

The light chart ramp has four steps that read apart (chart-1, 2, 3, and 6), so a chart with more categories pairs a step with a hollow mark. Espresso and chocolate sheets print the dark ramp in both themes. A categorical palette assigns colours by position in the full sorted set and passes that set to every consumer, so a filter or a sort never recolours a series. Marks inside `role="img"` are pointer-only, and the list or table beside the chart is the keyboard path.

---

## Accessibility rules

- The global `:focus-visible` ring takes the surface accent, and `catalog97.css` draws its own square ring on links, buttons, fields, and summaries.
- Buttons and links keep a 44px minimum target.
- Reduced motion is enforced in CSS, and Framer Motion components also call `useReducedMotion()`, since the CSS guard does not stop JS-driven animation. Never fade a page or section in from opacity 0.
- `Catalog97Shell` owns the only `main` landmark, so routes never add their own, and every route exposes one page-level `h1`.
- Party, line, and status colours used as small text fail 4.5:1, so the colour goes on a swatch and the text prints in ink.

---

## Practical rules

- Compose bands from the vocabulary before writing route CSS, and scope any route CSS to a route class so it cannot style another route after that route has loaded.
- A grid wrapper with no `grid-template-columns` sizes its column to max-content and blows out the page, so give it `minmax(0, 1fr)`.
- Do not use `transition-all` in shared primitives; transition only the properties that change.
- Portfolio and writing cards reveal role, problem space, and impact in the default scan state.
- If a route already has a visual language, extend it.
