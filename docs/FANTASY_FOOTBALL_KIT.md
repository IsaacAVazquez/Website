# The fantasy football kit

Last updated 2026-10-13.

This is the reference for `src/components/fantasy/fantasy.css`, the stylesheet all eight fantasy football pages draw with, and for the shared parts built on it. Read it before you write markup for one of those pages.

The direction is called Board. A pick is a solid sticker, a list is ruled rows on a cool board with no boxes, position is the colour system, and highlighter yellow means mine or now.

## Where things live

| File | What it holds |
| --- | --- |
| `src/components/fantasy/fantasy.css` | The kit, with tokens, type, every component class, the phone and touch sizes, print, and forced colours |
| `src/components/fantasy/fantasy-<area>.css` | An area sheet, holding what one page or one family of shared parts needs past the kit. Each has a prefix of its own (see the cascade) |
| `src/app/fantasy-football/layout.tsx` | The root every fantasy route renders inside, the font, and the product bar |
| `src/components/fantasy/` | The shared parts, which are the page head, the position switch, the room parts, the player drawer and its parts, the compare tray and modal, Draft Outlook, the redraft decision panel, and My team |
| `src/app/fantasy-football/__tests__/print-shop-rules.test.ts` | The drawing rules held in source, which are the one radius, no blurred shadow, no hex colour in markup, and every area sheet on its own prefix |

In the samples below `ffb-xx-` stands for your area sheet's prefix.

## What the layout and the shared parts give you

`src/app/fantasy-football/layout.tsx` wraps every fantasy route in `<div class="ffb-root …" data-tooltip-scope="ffb-scope">` and renders the product bar above the route. It imports the kit and loads Archivo as a variable font with its width axis. You do not render the product bar, the root, or the font. A Jest test renders your client alone, so neither the bar nor the root is in those renders.

All eight routes are in `WIDE_TOOL_ROUTES`, so `c97-shell c97-frame` (`SHELL_CLASS`) is the 1376px column on every page, and the site header and footer widen with it.

These shared parts draw with the kit.

| Part | What it draws |
| --- | --- |
| `FantasyRouteHeader` | `header.<SHELL_CLASS>.ffb-head` holding `h1.ffb-title`, `p.ffb-lede`, the freshness line, `div.ffb-head-aside` for `aside`, and `div.ffb-head-row` for `children`. A title that opens with "Fantasy Football" shows only the words after it, and the first two stay in the h1 inside `.ffb-vh`, so the accessible name is the same |
| `TitleAccent` | A plain fragment. It sets no face of its own |
| `FantasySectionHeading` | `h2.ffb-h2` |
| `FreshnessParts` | `p.ffb-fresh` of `span.ffb-fresh-part`, one per part. A part holds its label and, after a no-break space, its hidden dot, and from 768px a part does not break. So a wrapped line breaks only between parts, never inside a date, and never opens on a dot. A part with a tone takes the kit's status ink on its label alone, `ffb-warn` or `ffb-bad`, and the label still says what is wrong in words |
| `SeasonalScopeNote` | `div[role=note].ffb-notice.ffb-notice-warn` |
| `PositionFilterBar` | `div[role=radiogroup].ffb-seg.ffb-seg-pos` of `button[role=radio].ffb-seg-btn.ffb-pos-*`. The class comes from `positionClass`, and an option with no `position` whose value is `flex` in any case takes the flex thirds. On a phone the row scrolls sideways and keeps the checked button in view |
| `FantasyLoadingState` | The loading skeleton in all eight `loading.tsx` files, with the same `role="status"` and "Loading …" name |
| `MetricTooltip` | Reads `data-tooltip-scope` above its trigger and puts that value on the element it portals as a class, so a fantasy tooltip takes the kit's colours and type. Its trigger carries `data-metric-trigger`, `text` for a label you pass as children with `focusable` and `chip` for the "?" mark, and the kit fits both to the label they sit in (see Help triggers). Escape closes the bubble and leaves focus on the trigger, Enter or Space brings it back, and an Escape with no bubble open is not stopped, so the drawer around the trigger closes on the second press |
| `positionClass(position)` | `src/components/fantasy/positionClass.ts`. Returns `ffb-pos-qb` and the rest for the six positions, and an empty string for anything else. Use it for every chip, sticker, slot, and cell |
| `useFirstRowCount(listRef, itemCount)` | `src/components/fantasy/useFirstRowCount.ts`. How many children of a list sit on its first row, for hiding the stickers `ffb-picks-list` clips when they are buttons |
| `scrollChildIntoViewX(scroller, child, margin, align)` | Moves a sideways scroller without moving the page. `align` is `"nearest"` by default, and `"start"` puts a child that is not fully in view at the left edge |

`src/lib/fantasyUtils.ts` exports one presentation constant, `SHELL_CLASS` (`"c97-shell c97-frame"`). Markup writes kit classes itself (`ffb-chip ffb-pos-wr`), and there is no helper that hands out a class name or a colour.

The site header opens its search on "/". It leaves the key alone when a page has already claimed it with `preventDefault`, and when a dialog with `aria-modal="true"` is open, so a page that takes "/" for its own search calls `preventDefault` and does not need `stopPropagation`.


## The rules

1. Highlighter (`--ffb-hi`) means mine or now. That covers my queued player, my column in the pick grid, my roster pick, the cell on the clock, the "Your turn" marker, and the action that is mine to take now. It is always a filled area with `--ffb-on-fill` text on it, or a band behind something. It is never text, never an outline, and never a thin line.
2. Position colour appears only on chips, stickers, roster slots, pick-grid cells, the spread plot's marks, and the position switch. Nothing else takes a position colour, and a position always prints its letters.
3. Status is an ink and a word. `--ffb-good`, `--ffb-bad`, and `--ffb-warn` colour text or a 3px key rule. A signed number shows its sign, and a status keeps its word ("Stale", "Value", "Reach", "Withheld"). Status is never a fill.
4. No plate. Lists are ruled rows. A box exists only where the box is the object, which in this kit means a sticker, a roster slot, a pick-grid cell, a chip, a control, or an overlay panel.
5. The one radius is `--ffb-radius` (3px) and it belongs to sticker-shaped objects. Controls, tabs, the scorebug, and panels are square. A test fails any other `border-radius` in a fantasy stylesheet.
6. No blurred shadow, no gradient that blends, no `transition-all`. The kit uses a hard-stop layer in three places (the round guides behind the spread plot, and the flex thirds on a switch button and a slot), and an unblurred inset shadow as an edge or a key. Do not add others.
7. Controls hold a 3:1 boundary against the surface they sit on (`--ffb-edge`). Text holds 4.5:1.
8. On a phone, and for a touch pointer at any width, every link, button, input, select, and summary is at least 44px in both directions. The kit sizes its own controls. A link that runs inside a sentence is the one exception, which is the inline exception in WCAG's target size rule, since two 44px boxes on consecutive lines overlapped and a tap on one opened the other. A link that stands by itself takes `.ffb-link` and keeps 44px.
9. Do not put `transform`, `filter`, `contain`, `container-type`, or `will-change` on anything that wraps a page or a rail. The drawer, the modal, the tray, the toast, and the build sheet are `position: fixed`.

## Rules that came out of review

Each of these faults turned up on more than one page while the pages were being redesigned, so they are rules for every page.

1. A visually hidden label goes inside the cell it names, so it hides when the cell does.
2. A control that removes itself, or the thing it sits in, moves focus somewhere a keyboard user can carry on from. Focus never falls to the page body.
3. A pinned bar keeps one height. Its height never follows a name or a value that changes from pick to pick.
4. A player's name is the last thing to be cut. Let it wrap, or take the room from a neighbouring column, before an ellipsis, and put the full name in a `title` where it can still be cut.
5. Nothing on screen changes scale or position because more rows loaded.
6. Inline spans that read as separate words have a real space between them.
7. When browser storage is blocked, nothing says "saved".
8. A sentence about a player never says "him", since a team defence is a player too.
9. A test of a number pins the number, and a new part with logic of its own gets a test.

## The cascade, which decides what wins

Read this once, because it explains every surprise you could have.

Tokens, the Catalog 97 bridge, the type roles, a short list of frame exceptions, and the print block are unlayered. Every component class is inside `@layer components`.

What that means for you:

- A Tailwind utility on the same element as a kit class wins. `sr-only`, `ml-auto`, `col-span-2`, `min-w-0`, and `sticky` all keep working beside a kit class. The tests that pin those class names keep passing.
- The site's `md` and its other breakpoint variants are screen only (`@custom-variant md (@media screen and …)` in `src/app/globals.css`). On paper none of them applies, so a pair switched with `md:hidden` and `max-md:hidden` prints both halves, and a `hidden md:grid` pair prints its phone half at every paper width. Anything that prints switches with `ffb-only-phone` and `ffb-not-phone`, which follow the page's width on paper as the rest of the kit does.
- `ffb-only-phone` and `ffb-not-phone` are the one case where the kit beats you. They are unlayered and carry the root in their selector, so they hide an element whatever component class, utility, or one-class area rule sets its `display`.
- Any unlayered rule in your area sheet wins over the kit, whatever order the stylesheets load in. So `.ffb-xx-thing { gap: 4px }` beats the kit's gap on an element that has both classes. You do not need to raise specificity to override a component.
- The exception is type. The weight, width, case, and tracking of a kit class come from the unlayered type roles, so `font-semibold` or `uppercase` on a kit element does nothing. To change one in your area sheet, write `.ffb-root .ffb-xx-thing { font-weight: 600 }`. Font size is in the layer, so a `text-*` utility or an area rule changes it as usual.
- Never redeclare an `--ffb-*` token on `.ffb-root` from inside a layer, since the unlayered token wins. Set a token on your own element, or in an unlayered rule.
- `catalog97.css` sets three things on bare elements, outside any layer: `button { min-width: 44px }`, a 2px focus ring in `--c97-accent` at a 3px offset with no radius, and the placeholder colour. The kit undoes the first for its small buttons (`ffb-seg-btn`, `ffb-star`, `ffb-iconbtn`, `ffb-search-clear`, `ffb-tab`, `ffb-cell`, `ffb-row-open`, `ffb-btn-quiet`), draws the ring inside for controls in a scroller or a ruled list, gives a ring inside a filled control the colour that reads on the fill, moves a search field's ring from the input to the whole field, and fits a help trigger to its label. A button of your own narrower than 44px needs `.ffb-root .ffb-xx-thing { min-width: 0 }` in your area sheet.

Your area sheet starts every selector with a class of your prefix or with `.ffb-root`, because a stylesheet stays loaded after in-app navigation and would otherwise reach another route. A test in `print-shop-rules.test.ts` reads every `fantasy-*.css` in the folder and fails a selector that starts anywhere else, and it fails a sheet that has no prefix in its list.

| Sheet | Prefix | For |
| --- | --- | --- |
| `fantasy-rankings.css` | `ffb-rk-` | The rankings board |
| `fantasy-draft.css` | `ffb-dt-` | The redraft room and its setup screen |
| `fantasy-room.css` | `ffb-rm-` | The "All picks" list in the room parts every draft room shares |
| `fantasy-mock.css` | `ffb-mk-` | The mock draft, with its setup screen and recap |
| `fantasy-bestball.css` | `ffb-bb-` | The best ball board |
| `fantasy-bbroom.css` | `ffb-br-` | The best ball room and its setup screen |
| `fantasy-trade.css` | `ffb-tr-` | The trade calculator |
| `fantasy-weekly.css` | `ffb-wk-` | The weekly board, the waiver list, and My team |
| `fantasy-overlays.css` | `ffb-ov-` | The player drawer, the compare tray and modal, Draft Outlook, and the redraft decision panel |

A page imports its own sheet from its client component, and a shared part imports the sheet it needs itself, so a page gets the rules with the part.

## Tokens

All on `.ffb-root` and `.ffb-scope`, with dark values under `html.dark`.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--ffb-board` | `#f7f8f6` | `#0f1316` | The page |
| `--ffb-raised` | `#ffffff` | `#161b1f` | Inputs, overlay panels |
| `--ffb-sunk` | `#eceeea` | `#0a0d0f` | Open slots, empty cells, a hovered row |
| `--ffb-surface` | the board | the board | What a thing sits on. Overlay panels set it to raised. Sticky parts paint it |
| `--ffb-rule` | `#d5d9d3` | `#283037` | The line between rows |
| `--ffb-grid` | `#e3e6e1` | `#1d2429` | Guides behind a plot |
| `--ffb-edge` | `#737d86` | `#6c7882` | The outline of a control, at least 3:1 on every surface |
| `--ffb-ink` | `#15191c` | `#eef1f0` | Text, the ink rule, a primary fill |
| `--ffb-muted` | `#566069` | `#9ba6ae` | Secondary text, at least 5.5:1 |
| `--ffb-hi` | `#ffe94a` | same | Highlighter |
| `--ffb-on-fill` | `#15191c` | same | Text on the highlighter and on every position fill |
| `--ffb-hi-edge` | on-fill | highlighter | The edge of a highlighter control, so it holds 3:1 on the light board |
| `--ffb-qb` `--ffb-rb` `--ffb-wr` `--ffb-te` `--ffb-k` `--ffb-dst` | `#ff6b81` `#2fd08a` `#5ab0ff` `#ffa53d` `#b79cff` `#b9c2ca` | same | Position fills |
| `--ffb-qb-ink` … `--ffb-dst-ink` | `#c81e45` `#0b7a4b` `#1b5fc4` `#a85200` `#6a3bd0` `#55606a` | the fills | A position mark drawn on the board itself |
| `--ffb-good` `--ffb-bad` `--ffb-warn` | `#0a6b41` `#b4162f` `#8a4a00` | `#46d896` `#ff8090` `#ffb84d` | Status ink, at least 4.5:1 on board, raised, and sunk |
| `--ffb-bug` `--ffb-bug-ink` `--ffb-bug-muted` `--ffb-bug-rule` | ink, board, `#aab4bb`, `#39424a` | sunk, ink, muted, rule | The scorebug |
| `--ffb-scrim` | 46% ink | 62% black | Behind an overlay |
| `--ffb-s1` … `--ffb-s7` | 4, 8, 12, 16, 24, 32, 48px | same | Spacing, a 4px step |
| `--ffb-row` | 36px | same | Row height. `.ffb-board-room` sets 44px |
| `--ffb-control` | 36px, 44px below 768px | same | Control height |
| `--ffb-radius` | 3px | same | The sticker radius |
| `--ffb-bleed` | the page gutter | same | For a band that runs to the screen edge on a phone |
| `--ffb-font` | Archivo variable, then Helvetica Neue, Helvetica, Arial | same | The one face |

A position class sets two properties for whatever is inside it: `.ffb-pos-qb`, `.ffb-pos-rb`, `.ffb-pos-wr`, `.ffb-pos-te`, `.ffb-pos-k`, `.ffb-pos-dst` each set `--ffb-pos` (the fill) and `--ffb-pos-ink`. `.ffb-pos-flex` is only for a switch button and a roster slot.

Inside `.ffb-root` the `--c97-*` colour and font tokens resolve to kit values (surface to board, ink to ink, ink-2 and label to muted, accent and action to ink, rule to rule, field to raised, panel to sunk, positive, negative, and warning to the three status inks, every font token to Archivo, and Tailwind's `font-mono` and `font-sans` to Archivo too). No fantasy markup writes a Catalog 97 class or an inline `--c97-*` colour any more. The redeclaration is there for the shared parts that still read those tokens inside the root, which are `MetricTooltip` (its "?" mark and its bubble) and the frame's own focus ring. The kit restyles no Catalog 97 class. `--c97-sp-*` and `--c97-z-*` are untouched and stay available.

Contrast, computed from the tokens. The lowest text pair in light is RB ink on sunk at 4.61:1, muted on sunk is 5.50:1, the edge is 3.59:1 at its lowest (light, on sunk), and on-fill text on the fills runs 6.46 to 9.79:1.

## Type

One family, three roles, plus the heavy number. The role sets weight, width, case, and tracking. The component sets the size.

| Role | Setting | Used by |
| --- | --- | --- |
| Sticker | 800 at 72% width, capitals, 0.02em | `ffb-title`, `ffb-h2`, `ffb-bar-name`, `ffb-tier-tab`, `ffb-chip`, `ffb-sticker-name`, `ffb-slot-code`, a filled slot's name, `ffb-log`, `ffb-turn-tab`, a made grid cell, `ffb-verdict-title`, `ffb-empty-title`, `ffb-countbadge` |
| Label | 700 at 80% width, capitals, 0.05em | `ffb-label`, `ffb-h3`, bar links, tabs, switch buttons, `ffb-btn`, `ffb-toggle`, field labels, choice titles, column heads, table heads, tier counts, team codes, scorebug labels and buttons, sticker and slot meta, grid labels, tally and turn notes, badges, `ffb-best`, `dt` in `ffb-stat` and `ffb-pairs` |
| Row name | 600 at normal width | `ffb-c-name`, `ffb-h4`, `dt` in `ffb-fact`, `ffb-score-label`, `ffb-neighbor-name` |
| Heavy number | 800 at 78% width | `ffb-heavy`, `ffb-bug-value`, `dd` in `ffb-stat` and `ffb-fact`, `ffb-note-num`, `ffb-strip-value`, `ffb-slot-value` |

Body copy is 400 at normal width. Numbers are tabular everywhere inside the root.

The scale, in px: 10 (round labels), 10.5 (scorebug labels, grid numbers, slot meta, stat labels, badges), 11 (column heads, sticker meta), 12 (labels, switch and button text, team codes), 12.5 (freshness, notes, chips, tier counts, methods), 13 (the Log button, large buttons), 14 (numbers in a row, notices, fields), 15 (row names, body, the lede), 16 (inputs on a phone), 18 (sticker names, empty titles), 20 (a fact's value), 22 (section headings, a stat's value), 24 (scorebug values), 26 (the running head, the verdict), 40 (the page title, 34 on a phone), 56 (the setup headline, 40 on a phone). Nothing is smaller than 10px.

## Spacing and breakpoints

Spacing is the 4px step, `--ffb-s1` to `--ffb-s7`. Sections sit `--ffb-s7` apart (`ffb-stack-page`), blocks `--ffb-s4` to `--ffb-s6`, and things inside a block `--ffb-s2` to `--ffb-s3`. `--c97-sp-*` still works where you keep it.

There are two breakpoints. Below 768px (Tailwind's `md`) is the phone layout, where controls are 44px, a board row is two lines, the scorebug is two rows, and the drawer and the modal come up from the bottom. Below 1200px the rail drops under the list, and in a split layout the rail's lead block moves above it.

Controls are also 44px for a touch pointer at any width (`(pointer: coarse)`), which is an iPad or a touch laptop. `--ffb-control` is 44px there, and the controls that do not read the token (the star, the search's clear button, a tab, a neighbour row, the Log button's height, a row's name button, the product bar's links, and every link the kit sizes) take their 44px on the same condition. Only sizes follow the pointer. The phone's layouts stay below 768px.

The pages add these content-driven breakpoints in their own sheets, each because one thing stopped fitting. Reuse one of these before adding another. None of them moves the rail.

| Width | Sheet | What changes |
| --- | --- | --- |
| below 360px | redraft | The scorebug's clock drops its small note |
| below 360px | rankings | The count takes a line of its own under the two rows of controls |
| below 340px | best ball room | A phone row drops its bye, which the drawer still carries |
| below 360px | best ball board | The count takes a line of its own, and a phone row drops the Week 17 opponent |
| 375px and under | the kit's `ffb-board-tight` | A room's phone row sets its second line at 11px |
| below 420px | trade | The verdict strip holds its two-line height, so it never changes height with the verdict |
| from 480px | redraft | The setup screen's optional fields go to two columns |
| from 640px | redraft, mock draft | The setup screen's fields go to three columns, with the custom lineup in the redraft room and the three lineup plates in the mock draft |
| 768px to 1199px | best ball board | The rail sits above the board at full width, so its notices take a second column beside the contest |
| 768px up to 823, 891, 905, 973, 1023, or 1091px | rankings | The board drops the spread plot where its cell would be under about 240px. The width depends on which columns the state shows, so there is one range for each set |
| below 1024px | rankings | A tier's scale prints every other label |
| below 1024px | mock draft | The scorebug takes its short forms and drops its pool cell |
| from 1024px | redraft, mock draft, best ball room | The setup screen takes a second column (Start draft beside the form in the two redraft-style rooms, the contest's details beside the slot picker in the best ball room). None is an `ffb-work` layout, so the 1200px rule does not apply to them |
| from 1200px | mock draft | The recap's four facts read two by two |
| below 1280px | rankings | The spread column's head drops its legend, and a scale of more than eight labels prints every other one |
| below 1280px | redraft | The scorebug drops its pool cell |
| from 1280px | redraft | The custom lineup goes to six columns |
| below 1440px | redraft | The scorebug takes its short forms. The kit's own switch is at 1300px, and this room's six cells and three buttons need more room than that |

The redraft decision panel lays its rows out from its own width with two container queries, at 544px and 1100px, so it has no screen breakpoint. These are the widths in the eight sheets on 2026-10-13. Tailwind's `lg` is 1024px and `xl` is 1280px, so anything you show or hide together with the rail takes `min-[1200px]:` or `max-[1200px]:`. Tailwind compiles `max-[1199px]:` to a width below 1199px, so at exactly 1199px it and `min-[1200px]:` would both be off, and `max-[1200px]:` meets `min-[1200px]:` at 1200. Both are plain width queries, so on paper they follow the page's width and the narrow half prints. To hide something below 1200px on screen only, write a rule in your area sheet under `@media screen and (max-width: 1199.98px)`.

## Helpers

| Class | What it does |
| --- | --- |
| `ffb-vh` | Visually hidden, still read. Tailwind's `sr-only` is fine too, and some tests pin it |
| `ffb-vh-desk` | Visually hidden from 768px and printed on a phone, for a word the desktop's column head already says (the "Bye" before a row's bye week). It is still read at every width |
| `ffb-skip` | A link or button that lets a keyboard past a long list. It is out of sight until it takes focus, and it does not print. Put `ffb-btn` on the same element |
| `ffb-noprint` | Left off paper, for a control or a note that does nothing there |
| `ffb-only-phone`, `ffb-not-phone` | Hidden from 768px up, and hidden below 768px. Each only hides, so where it does not apply the element keeps the display its own class gives it (`ffb-iconbtn ffb-only-phone` is still an inline grid on a phone). They beat every component class and utility, and they follow the page's width on paper |
| `ffb-muted`, `ffb-good`, `ffb-bad`, `ffb-warn` | Text colour |
| `ffb-num` | Right aligned, no wrap |
| `ffb-label` | Label type at 12px, for a stray label |
| `ffb-heavy` | The heavy number on a plain element, at 18px. Use it where a number is not a `dd` in `ffb-stat` or `ffb-fact` |
| `ffb-fine` | A muted note at 12.5px, under or beside something |
| `ffb-copy` | A muted paragraph at 14px with a 62ch measure. `ffb-empty-body` is the same rule under its older name |
| `ffb-stack` | A column of blocks with a `--ffb-s4` gap. `ffb-stack-tight` is s2 (8px), `ffb-stack-mid` s5 (24px), `ffb-stack-loose` s6 (32px), `ffb-stack-page` s7 (48px) |
| `ffb-block` | A block that carries its own 12px bottom margin, for a column that cannot use a gap because one of its children stays mounted while empty |
| `ffb-with-help` | A label with a help trigger beside it on one line (`<dt class="ffb-with-help">Expert consensus <MetricTooltip … /></dt>`) |
| `ffb-dotlist` | A wrapping line of short items joined by dots. The dot is drawn after each item but the last, so a wrapped line never starts with one, and it is left out of the accessible text. Put a real space between the items in the markup |
| `ffb-cluster` | A wrapping row of small things, centred |
| `ffb-columns` | Equal columns that fall to one. Set `--ffb-col-min` (default 280px) inline or in your sheet |
| `ffb-sticky` | Pins to the top of the page on the surface colour, at `--c97-z-sticky`. It paints 4px past each side, which is how far a queued rank's highlighter runs, so nothing slides past it. A second bar under the first reads `--ffb-sticky-top`, which you set from the measured height of the first. A pinned wrapper that holds a scorebug directly gets 4px of block padding, the room the live cell needs to stand proud. `ffb-bug-pin` stacks a pinned bar one above the others, which is the scorebug section the room parts render. The live cell draws its focus ring inside itself in the ink that reads on the highlighter |
| `ffb-sticky-ruled` | With `ffb-sticky`, for a pinned block that holds the column heads. It ends on the 2px ink rule a table head ends on. Put `ffb-board-ruled` on the board (see The board) |

`--ffb-col-min`, `--ffb-choice-min`, and `--ffb-stat-min` are registered so they do not inherit, which lets a grid inside a grid keep its own minimum. Each takes a length or a percentage, so `--ffb-choice-min: 100%` gives one column and `--ffb-choice-min: 30%` three.

The samples in this file put a real space between adjacent inline parts (a tier's tab, count, and range, a number and its `small`, a slot's code and name). The gap you see is drawn by CSS, and without the space assistive tech reads "Tier 26 players" as one word. Keep the space in your markup. Inside a flex or grid parent it draws nothing.

## Shell

### Product bar

Rendered by the layout. `nav.ffb-bar[aria-label="Fantasy football"]` holds `span.ffb-bar-name` and `ul.ffb-bar-links` of `a.ffb-bar-link`, with `li.ffb-bar-gap` starting the second and third group. The current link has `aria-current="page"`. Do not render a second one, and do not link to sibling tools from a kicker or a breadcrumb. The bar is the navigation. Below 1200px the list scrolls sideways. When the page loads, the current link comes in whole. On a phone, where the list snaps each link's start to its left edge, it comes in behind as many of the links before it as fit, so its neighbours stay in view, and the name tab sets its two words one over the other. From 768px a current link that is not whole goes to the list's left edge. A link that keyboard focus lands on goes to the left edge too, since a browser scrolls by itself only for a link that is wholly out of view. A pointer press does not move the list, because the press would then land on the link that slid under it. While more links sit past the right edge the bar carries `data-more="end"`, and from 768px the kit closes that end with a plate and an arrow. On a phone the cut word at the edge says it.

### Page head

Use `FantasyRouteHeader`, or the same classes on your own `header` where the route draws its own (both trackers).

```html
<header class="c97-shell c97-frame ffb-head">
  <h1 class="ffb-title"><span class="ffb-vh">Fantasy Football </span>Rankings</h1>
  <p class="ffb-lede">One orienting sentence.</p>
  <p class="ffb-fresh">2026 · PPR · FantasyPros consensus Sep 8 · <span class="ffb-warn">ADP stale</span></p>
  <div class="ffb-head-aside">page actions</div>
  <div class="ffb-head-row">a full-width row</div>
</header>
```

From 1200px the freshness line sits at the right on the title's baseline, the lede runs under both, and the aside sits at the right of the lede's line. The head is a three-column grid in which the lede and the freshness line each span the flexible column, so a long one never squeezes the other. Below 1200px the freshness line drops under the lede. On a phone everything is one column in DOM order.

`ffb-head-run` is the running head of a live room, one compact line holding the title at 26px, the league line in `ffb-lede`, and the freshness line. `ffb-head-setup` is the setup head, a 56px headline with the pitch in `ffb-lede` at 17px. A setup screen keeps a headline and a running draft gets one line, and these two modifiers are how you draw them.

```html
<header class="c97-shell c97-frame ffb-head ffb-head-run">
  <h1 class="ffb-title">Draft Tracker</h1>
  <p class="ffb-lede">My Fantasy League · 12-team snake · PPR</p>
  <p class="ffb-fresh">FantasyPros consensus Sep 8</p>
</header>
```

Do not put a kicker over the title, and do not wrap the head in a surface.

### Section headings

`ffb-h2` is a section's heading (22px sticker type). `ffb-h3` is a rail or panel heading (12px label type, weight 800). `ffb-h4` is a small heading inside prose (15px, weight 600).

The element follows the page's outline and the class sets the look, and the two are independent. A block that sits directly under the page's h1 is an `h2` whatever it looks like, so "Last picks", a rail head, and a tier name are `<h2 class="ffb-h3">` or `<h2 class="ffb-tier-name">` on a page with no h2 above them. The samples below use the level a page would most likely use, so check yours against your own outline.

`ffb-sechead` puts a heading on a 1px ink rule with a note at its right. `ffb-sechead-lg` is the page-section version on a 2px rule. `ffb-sechead-ctl` is for a head that holds a button, and for every head beside it on the same line. It gives them one height (the control plus 17px), so three column heads share a rule even when only one holds a control.

A rail that is also a named section of the page takes the `ffb-h2` head on the 2px rule, paired with the board's head beside it, as My team does on the weekly and waivers pages. The blocks inside it use `ffb-h3`. A rail that only serves the list (the room's roster and pick grid, the trade result) keeps `ffb-h3` heads.

```html
<div class="ffb-sechead"><h2 class="ffb-h3">Your roster</h2> <p class="ffb-sechead-note">1 of 15 picked</p></div>
```

### The working layout

```html
<div class="ffb-work ffb-work-split">
  <div class="ffb-board ffb-board-room">the list</div>
  <aside class="ffb-rail" aria-label="Your draft">
    <section class="ffb-rail-lead">roster</section>
    <section>pick grid</section>
    <section>outlook</section>
  </aside>
</div>
```

`ffb-work` is the list beside a rail of 404 to 460px. `ffb-work-3` is settings, the work, and a result rail (200px, the rest, 300 to 360px, with a 24px gap, which leaves the centre 690px at 1440 for two packages side by side). The rail is sticky at `--ffb-sticky-top` plus 8px. `ffb-rail-scroll` lets a rail taller than the screen scroll by itself. It is inset 6px on each side so a focus ring inside is not clipped at its edge, and it draws a 6px scrollbar in the edge colour all the time, so a rail cut off at the foot of the screen reads as "more below". The scrollbar keeps its room whether or not the rail overflows (the rail is `overflow-y: scroll` from 1200px where the browser takes `::-webkit-scrollbar`, since Safari reserves the room only once the rail overflows), and that room comes out of the page gutter at the rail's right, so the rail's content is exactly as wide as its column (Chromium and Safari. Firefox draws a thin scrollbar and follows the system's setting for when). The rail does not hold the wheel. Once it reaches its end, and when it has nothing to scroll, the wheel moves the page, so do not set `overscroll-behavior` on it. One trait the kit cannot fix from CSS is that focusing a control low in a scrolled rail can also scroll the page, because the rail is sticky. Where that matters, focus with `preventScroll` and scroll the rail yourself. Below 1200px the grid becomes one column and the rail's sections sit side by side where they fit.

`ffb-work-split` changes the order below 1200px, so the section marked `ffb-rail-lead` moves above the list and the rest of the rail follows the list, side by side where two sections fit. It does that with `display: contents` on the rail, so below 1200px the rail is not a box. Put the landmark role on the sections inside if you need one, and check it with a screen reader. A roster in the lead block takes its compact form there (see Position and picks), which at 1024 by 768 and at 768 by 1024 leaves the first board row on the first screen.

The list keeps growing as someone scrolls, so whatever follows it below 1200px can only be reached if the list stops extending by itself there. So a page with a split layout ends its list on `ffb-more-row` with a Load more button below 1200px, and puts a skip link to the rail before the list. The redraft room does both. `DraftBoard.tsx` extends its window by itself only from 1200px, and "Skip to your roster" is an `ffb-btn ffb-skip` link before the board that shows when it takes focus. All three rooms have one.

## Controls

### Toolbar

`ffb-toolbar` is a wrapping row of controls with `ffb-count` pushed to its right end. Wrap it in `ffb-sticky` where it should pin.

```html
<div class="ffb-sticky ffb-toolbar" data-testid="fantasy-board-controls">
  …switches, search, toggle…
  <p class="ffb-count" aria-live="polite">40 of 551 shown</p>
</div>
```

### Segmented switch

```html
<div class="ffb-seg" role="group" aria-label="Scoring">
  <button type="button" class="ffb-seg-btn" aria-pressed="true">PPR</button>
  <button type="button" class="ffb-seg-btn" aria-pressed="false">Half PPR</button>
</div>
```

The pressed look follows `aria-pressed="true"`, `aria-checked="true"`, or `aria-selected="true"`, so it works for toggle buttons, radios, and tabs. Inside a toolbar on a phone it stretches to fill the row.

`ffb-seg-fill` makes a switch fill its field, so it lines up with the selects beside it on a setup screen. `ffb-seg-scroll` is for a switch too long for its row (the eight contests). It scrolls sideways at any width, and up to 800px it runs off the right edge of the screen as the position switch does on a phone, so it has to sit in the page column. Eight contests need 688px, which fits the column from 800px.

A pressed button that is disabled (a board that failed to load keeps its selection) gives up its ink fill for a 2px edge, since the muted disabled label measured 2.76:1 on the fill in light and 2.18:1 in dark. A pressed position keeps its sticker, whose label is not muted.

The position switch adds `ffb-seg-pos` on the group and a position class on each button. Each position carries its colour as a 4px foot bar, Flex carries three, and the pressed position is a full sticker. Use `PositionFilterBar` where you can. A disabled button loses its foot bar, goes muted, and should print "NA" in `span.ffb-seg-na` with the reason in its accessible name and `title`. When every button is disabled the group's edge goes dashed. On a phone the group scrolls sideways off the right edge of the screen, so it has to sit in the page column.

### Buttons

| Class | Use |
| --- | --- |
| `ffb-btn` | Secondary, the base. An outlined label, 36px |
| `ffb-btn ffb-btn-primary` | The main action of a screen. Ink fill |
| `ffb-btn ffb-btn-now` | The action that is mine to take now (log this pick while I am on the clock). Highlighter fill. One per screen at most |
| `ffb-btn ffb-btn-quiet` | No edge, for the lesser of a pair. Disabled, it stays a muted word and gains no box |
| `ffb-btn ffb-btn-toggle` | A labelled toggle with no count ("Mark available", a drawer's Compare). With `aria-pressed="true"` it takes a 2px ink edge, the same pressed look as `ffb-toggle`. A plain `ffb-btn` shows no pressed state, so a toggle needs this class |
| `ffb-btn ffb-btn-danger` | A destructive action. With `ffb-btn-primary` it is the filled confirm |
| `ffb-btn-lg` | 44px (48px on a phone), for the one button that starts something |
| `ffb-btn-block` | Full width |

A disabled button (`disabled` or `aria-disabled="true"`) prints unfilled with a dashed edge and muted text. It works on `a` and `button`.

A destructive step asks once, in place:

```html
<div class="ffb-confirm">
  <span class="ffb-confirm-q">Reset this room and its 15 picks?</span>
  <button type="button" class="ffb-btn ffb-btn-quiet">Keep</button>
  <button type="button" class="ffb-btn ffb-btn-danger ffb-btn-primary">Confirm reset</button>
</div>
```

`ffb-log` is the row action of a room (Log, Draft), 56 by 30px on a desktop and 52 by 44px on a phone. `ffb-more` is the full-width "Load more" under a board.

`ffb-iconbtn` is a square icon button at the control height (close, undo, remove), and `ffb-iconbtn-edge` gives it an outline. Give it an `aria-label`. With `aria-pressed="true"` or the class `ffb-is-on` it is an ink fill, for a button that shows something is in force (the phone's search button while a query filters the board). `aria-expanded` does not fill it, since a button that opens a panel is not "on".

`ffb-star` is the queue star. `aria-pressed="true"` puts a highlighter sticker behind a filled star. The icon inside takes `ffb-star-icon`.

```html
<button type="button" class="ffb-star" aria-pressed="false" aria-label="Queue Justin Jefferson">
  <svg class="ffb-star-icon" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M10 2.6l2.3 4.7 5.1.7-3.7 3.6.9 5.1L10 14.3l-4.6 2.4.9-5.1L2.6 8l5.1-.7z"/></svg>
</button>
```

`ffb-toggle` is a toggle button with room for a count, used for the queued-only view: `<button class="ffb-toggle" aria-pressed="false">…star… Queued <span class="ffb-countbadge">1</span></button>`.

### Fields

```html
<label class="ffb-field">
  <span class="ffb-field-label">Teams</span>
  <select class="ffb-select">…</select>
  <span class="ffb-field-hint">Optional help.</span>
</label>
```

`ffb-input`, `ffb-select`, and `ffb-textarea` are the controls. `aria-invalid="true"` turns the edge to the error ink, and the message goes in `ffb-field-error`. `ffb-field-count` is the right-aligned counter under a textarea. A disabled control has a dashed edge. Inputs are 16px on a phone so iOS does not zoom.

A required field with no placeholder is not marked as an error before anyone types. The site's base styles turn every empty required input red unless it shows a placeholder, and the kit holds its edge until you set `aria-invalid`.

An input with a unit (the input carries 8px of start padding after a leading mark, so its inside focus ring clears the first digit):

```html
<span class="ffb-affix"><span class="ffb-affix-mark">$</span><input class="ffb-input" inputmode="decimal"></span>
```

Search:

```html
<label class="ffb-search">
  <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M12.8 12.8L17 17"/></svg>
  <span class="ffb-vh">Search the board</span>
  <input class="ffb-search-input" type="search" placeholder="Search player or team">
  <button type="button" class="ffb-search-clear" aria-label="Clear search">×</button>
</label>
```

The field's edge is drawn on the label, so the input is the full 44px on a phone. Render the clear button only when there is text. Where a field renders it, the kit hides the browser's own clear button, and a `type="search"` field that does not render it keeps the browser's. The focus ring goes round the whole field (2px, 2px out), not the input, where it started after the icon and crossed the first letter typed. A field whose input is `disabled` prints with a dashed edge and no fill.

`ffb-check` is a native checkbox or radio with its words: `<label class="ffb-check"><input type="checkbox">Practice with the dated preseason board</label>`.

A list of radios drawn as plates, which the trade calculator's scoring uses:

```html
<fieldset class="ffb-choices">
  <legend class="ffb-vh">Scoring</legend>
  <label class="ffb-choice"><input type="radio" name="scoring" checked>
    <span class="ffb-choice-title">PPR</span> <span class="ffb-choice-note">One point per catch</span></label>
  …
</fieldset>
```

The checked plate is an ink fill. `ffb-choice-mine` makes the checked plate a highlighter fill, for a choice that marks what is mine (my draft slot). The input covers the plate and is transparent, and the plate takes the focus ring. A `button.ffb-choice` with `aria-pressed` or `aria-checked` gets the same look. Set `--ffb-choice-min` on the `fieldset` for the column width (default 132px, 44px for slot numbers, a percentage for a fixed count).

### Help triggers

A "What is…?" trigger is `MetricTooltip`. Pass the label as children with `focusable` for a text trigger, or nothing for the "?" mark. The kit fits both inside `.ffb-root`:

- A text trigger takes the case of the label it sits in (a button does not inherit it) and loses the frame's 44px minimum width, which centred a short label away from its column's edge. On a phone, and for a touch pointer at any width, it is a 44px target with a negative margin that keeps its label's line. The label sits at the left of that target. Inside `ffb-h-num` it sits at the right, on the edge the numbers under it share.
- The "?" mark is a 16px mark inside a 44px target. Its focus ring goes round the mark, so it does not cover the end of the label beside it.

Put the trigger's label in `ffb-with-help` to keep the two on one line. A phone's column head has no room for triggers, so print the plain word there and carry the definitions in the drawer, as the rankings board does.

### Disclosure, tabs, links

`details.ffb-details` with a plain `summary` and the content in `div.ffb-details-body`. The summary is a 36px row (44px on a phone and for a touch pointer) on a rule, with a caret that turns over when open. A closed disclosure prints closed. Add `ffb-details-print` to one whose content has to be on paper (a method, a model's limits), and it prints open with no caret.

`ffb-tabs` holds `ffb-tab` buttons or links, drawn like the product bar's links. The gap is 16px, and 12px on a phone, where three labels fit a 320px screen. The current one is `aria-selected="true"`, `aria-pressed="true"`, or `aria-current`.

`ffb-link` is an underlined link. `ffb-link-arrow` adds an arrow for a link to another page and `ffb-link-out` the out arrow for another site. The arrow is drawn with empty alternative text, so the link's accessible name is its words alone. On a phone, and for a touch pointer at any width, a link that stands by itself is a 44px target with a negative margin, so its line keeps its height. That is an `ffb-link` on a line of its own and every link in `ffb-footlinks`. A link that runs inside a sentence is exempt, the inline exception in WCAG's target size rule, because two boxes on consecutive lines overlapped and a tap on one opened the other. So an `ffb-link` inside `ffb-notice`, `ffb-method`, `ffb-lede`, `ffb-fresh`, `ffb-copy`, or `ffb-empty-body` takes no box, and neither does a plain link in running text anywhere, `ffb-prose` included.

## The board

A board is a list of ruled rows on one column template. You set the template once as `--ffb-cols` on `.ffb-board` in your area sheet, and every `ffb-colhead` and `ffb-row` inside uses it.

```css
.ffb-xx-board { --ffb-cols: 30px 46px minmax(150px, 0.8fr) 36px 26px 52px 56px 48px 48px minmax(220px, 1.5fr) 44px 36px; }
```

```html
<div class="ffb-board ffb-xx-board">
  <div class="ffb-colhead" aria-hidden="true">
    <span class="ffb-h-num ffb-is-sorted ffb-m-show">Rk</span> <span class="ffb-h-pos">Pos</span> <span class="ffb-m-show">Player</span>
    <span>Team</span> <span class="ffb-h-num">Bye</span> <span class="ffb-h-num">ADP</span>…
    <span class="ffb-only-phone ffb-m-show">ADP, vs ADP</span>
  </div>
  <section class="ffb-tier" style="--ffb-gap:16px" aria-label="Tier 2">
    <header class="ffb-tier-head">
      <h2 class="ffb-tier-name"><span class="ffb-tier-tab">Tier 2</span> <span class="ffb-tier-count">6 players</span> <span class="ffb-tier-range">Picks 7–12</span></h2>
      <p class="ffb-tier-cliff"><span class="ffb-cliff-mark" aria-hidden="true"></span><b>4.0</b> <span class="ffb-not-phone">avg-rank </span>cliff</p>
    </header>
    <ol class="ffb-rows">
      <li class="ffb-row ffb-is-queued">
        <button type="button" class="ffb-row-open" aria-label="Open Justin Jefferson detail"></button>
        <span class="ffb-c-rank">7</span>
        <span class="ffb-chip ffb-pos-wr">WR5</span>
        <span class="ffb-c-name">Justin Jefferson</span>
        <span class="ffb-c-team">MIN</span>
        <span class="ffb-c-bye"><span class="ffb-only-phone">Bye </span>6</span>
        <span class="ffb-c-num ffb-m-top">11.7</span>
        <span class="ffb-c-num ffb-m-sub ffb-is-strong">+4.7</span>
        <span class="ffb-c-num">141</span>
        <span class="ffb-spread ffb-pos-wr" …>…</span>
        <button type="button" class="ffb-star" aria-pressed="true" aria-label="Remove Justin Jefferson">…</button>
      </li>
    </ol>
  </section>
  <button type="button" class="ffb-more">Load more (511 left)</button>
</div>
```

Cells, in order: `ffb-c-rank`, the chip, `ffb-c-name`, `ffb-c-team`, `ffb-c-bye`, then any number of `ffb-c-num`, the spread, and the actions. `ffb-c-num.ffb-is-strong` is a number that carries a judgement (a real gap against ADP, a move), and `ffb-is-flat` is one that carries none or is only a reference. `ffb-is-good` puts a number in the good ink, for a gap that reads as value at this pick. A signed number prints its sign in every case, and a negative prints the minus sign (U+2212), never a hyphen. `formatPickDelta` and `withMinusSign` in `src/lib/fantasyUtils.ts` do that.

Opening the player. Either put `button.ffb-row-open` first in the row, which covers the whole row while the star, the Log button, links, and anything marked `data-ffb-above` stay above it, or make the name the button (`button.ffb-c-name`). On a phone the name button covers both lines of the row so it is a 44px target.

States of a row: `ffb-is-queued` (a highlighter sticker behind the rank, used with the pressed star) and `ffb-is-active` (the row the keyboard is on, a 2px ink outline). A hovered row takes the sunk surface.

Column heads are label type. `ffb-h-num` right aligns and `ffb-h-pos` centres. `ffb-is-sorted` marks the head of the column the list is sorted by, in ink with a caret. A "What is…?" help trigger is `MetricTooltip` with children, which draws a dotted underline, and it needs no kit class. A head that leaves a phone takes `ffb-not-phone`, never `hidden md:grid`, since the site's `md` is screen only and the head would never print.

The phone row. Below 768px the kit replaces the template: a row is two lines, the name over the chip, team, and bye, with up to two numbers at the right and the action at the edge. Mark what a phone keeps and everything else drops out.

| Mark | Where it goes on a phone |
| --- | --- |
| `ffb-c-num ffb-m-top` | Line one, right |
| `ffb-c-num ffb-m-sub` | Line two, right |
| `ffb-c-num ffb-m-meta` | Line two, after the bye, muted (a room's ADP) |
| `ffb-m-show` on a column head | Kept. The last kept head moves right |

The board's action columns on a phone are set by a modifier on `.ffb-board`: none for a single star (44px), `ffb-board-log` for a single Log or Draft button (52px), `ffb-board-star-log` for both, and `ffb-board-plain` for no action. `ffb-board-room` sets 44px rows on a desktop, since each row carries a button. `ffb-board-tight` is a room's phone row with one more thing on its second line (a number with its label). It takes 8px from the Log button's column, 2px from each gap, and 4px from the chip, and at 375px and under the second line sets at 11px. The redraft room and the best ball room use it. `ffb-board-open` is for a board whose rows open the player from anywhere. Every cell sits above the opener, so a hover title fires and a name can be selected, and the row's own click still opens the player. The rankings board and the best ball board use it.

A row outside `.ffb-board` keeps its own `--ffb-cols` on a phone. Two such rows are in the kit.

`ffb-row-two` is a two-line row outside a board, holding the chip, the name over the team, one number, and one action (a trade package row). It does not light up under the pointer, since it is not a button.

```html
<li class="ffb-row ffb-row-two">
  <span class="ffb-chip ffb-pos-rb">RB1</span> <span class="ffb-c-name">Jahmyr Gibbs</span>
  <span class="ffb-c-team">DET · ADP 1.4</span> <span class="ffb-c-num ffb-is-strong">91.4</span>
  <button type="button" class="ffb-iconbtn" aria-label="Remove Jahmyr Gibbs">×</button>
</li>
```

A phone list that is a table reflowed is `ffb-listhead` over `ffb-row-stack` rows. Each row is the player over that player's values, the values sit in columns that hold their place down the list (`ffb-pairs ffb-pairs-cols`), and one head names the columns. Set `--ffb-pair-cols` on a wrapper, and the head and every row read it. The labels stay in each row for assistive tech and are visually hidden, so the head is `aria-hidden`. Add `ffb-sticky` to the head to pin it. `ffb-listhead-plain` and `ffb-row-stack-plain` drop the 28px rank column.

```html
<div style="--ffb-pair-cols: minmax(0, 1.1fr) minmax(0, 1.2fr) minmax(0, 1fr)">
  <div class="ffb-colhead ffb-listhead ffb-sticky" aria-hidden="true"><span class="ffb-h-num">#</span> <span>Opponent</span> <span>Expert range</span> <span>Rostered</span></div>
  <ol class="ffb-rows" aria-label="Flex rankings, Week 5">
    <li class="ffb-row ffb-row-stack">
      <span class="ffb-c-rank">1</span>
      <div>
        <p class="ffb-namecell"><span class="ffb-chip ffb-pos-wr">WR1</span> <span>Ja'Marr Chase</span> <span class="ffb-c-team ffb-label">CIN</span></p>
        <dl class="ffb-pairs ffb-pairs-cols">
          <div><dt>Opponent</dt><dd>at DAL</dd></div>
          <div><dt>Expert range</dt><dd>1 to 6</dd></div>
          <div><dt>Rostered</dt><dd class="ffb-is-strong">99.9%</dd></div>
        </dl>
      </div>
    </li>
  </ol>
</div>
```

`ffb-namecell` is a chip, a name, and a team in one cell of a table or a stacked row. `ffb-more-row` holds `ffb-more` beside a second button (Load more beside Show all).

The two kinds of phone list put the chip in different places on purpose. A board's phone row is the name over the chip, team, and bye. A table's phone reflow keeps the chip before the name on line one, as the table's own name cell has it, with the values under the list head.

The rankings board swaps the sideways position switch for a native `select` on a phone. That is a pinned exception, since `e2e/fantasy-football.spec.ts` finds the select, and no other page should copy it.

A control in a row that takes keyboard focus is scrolled clear of what is pinned over the list. Every `a`, `button`, `select`, and `input` inside `ffb-row`, a kit table's body row, and `ffb-more-row`, and `ffb-more` itself, carries `scroll-margin-top: var(--ffb-pinned-top, 152px)` and `scroll-margin-bottom: var(--ffb-pinned-bottom, 96px)`. The fallbacks clear the tallest pinned stack measured on the pages (147px, the redraft room's scorebug and board bar) and the 74px compare tray. A page that measures its bars can set `--ffb-pinned-top` to the height of everything pinned over its list, on the list or any wrapper, and `--ffb-pinned-bottom` to the tray's height while the tray shows. `--ffb-sticky-top` is a different thing, the offset a second bar pins at. Both margins are zero inside `ffb-sticky`, an overlay, the tray, and a sticky rail, because a margin on a control that is itself pinned would scroll the page every time it took focus. A room's controls between its scorebug and its board, a last-picks sticker that is a button and every control in an `ffb-strip`, are scrolled clear of the scorebug alone, `--ffb-sticky-top` plus 8px, which falls back to the scorebug's height (68px, and 112px on a phone).

The rankings board sets `--ffb-pinned-top` on `.ffb-rk-board` in its sheet, from the height of its toolbar block, which `fantasy-football-client.tsx` measures and writes as `--ffb-rk-bar`, plus the pinned tier head, and it keeps the kit's 152px as the floor. The redraft room does the same from 768px, where its board bar is measured as `--ffb-dt-bar` and takes a second row near 1200px (173px with the scorebug, against the kit's 152px). The best ball board sets it from its own measured toolbar block. The mock draft writes the variable inline from its two measured bars, and the best ball room sets it on a phone. From 1200px the best ball room's stack is 149px, inside the fallback, so it sets nothing there. The compare tray shows on the two best ball pages, so the page that draws the tray is the one to set `--ffb-pinned-bottom`, on the wrapper of its board, while the tray shows.

### A pinned head on the ink rule

Where the toolbar and the column heads pin together, add `ffb-sticky-ruled` to the `ffb-sticky` block and `ffb-board-ruled` to the board. The block ends on the 2px ink rule a table head ends on, the first tier's tab hangs from that rule in place of its own, and the first row, an empty state, or a skeleton's first row under it drops its own rule, so nothing doubles.

```html
<div class="ffb-board ffb-board-ruled ffb-xx-board">
  <div class="ffb-sticky ffb-sticky-ruled">
    <div class="ffb-toolbar">…</div>
    <div class="ffb-colhead">…</div>
  </div>
  <section class="ffb-tier" aria-label="Tier 1">…</section>
</div>
```

The layout sweep reports `orphan-row` on `div.ffb-colhead` wherever the two-line spread head is used. The head is taller than the one-line heads beside it in a bottom-aligned row, so the sweep reads their different tops as two rows. Nothing wraps, and it is a known false positive.

### Tier break, round break, and the lines in a list

The tier break is a 2px ink rule with the tier's tab hanging from it, then the count, the pick range, and at the right a ledge-and-drop mark with the cliff. The tab prints the tier in two digits on every board ("Tier 03"), and the section's accessible name keeps the plain number ("Tier 3"). The gap above a break grows with the cliff, so set `--ffb-gap` on `.ffb-tier` in 4px steps from 8 to 28px (the rankings board and the redraft board use `min(28, max(8, round(cliff * 6 / 4) * 4))`). A round break is the same markup with "Round 3" in the tab.

`p.ffb-tier-gone` under the head says who is already gone from a tier, on one clipped line:

```html
<p class="ffb-tier-gone"><span class="ffb-label">Gone</span> <span>N. Collins, J. Cook III, C. Brown</span></p>
```

`li.ffb-turnline` marks where the board stands when my turn comes back:

```html
<li class="ffb-turnline"><span class="ffb-turn-tab">Your turn #22</span> <span class="ffb-turn-note">if picks follow this board</span></li>
```

### Expert spread

One scale for every row of a section. The range is a thin line from the best to the worst rank, one standard deviation each side of the average is the thicker segment (clipped to the range by the CSS), and the average is an ink tick. Give each mark its position as a percentage of the scale.

```html
<span class="ffb-spread ffb-pos-wr" role="img" aria-label="Expert rank range 4 to 26, average 9.2"
  style="--ffb-min:2.5%;--ffb-max:21.67%;--ffb-sd-lo:5.1%;--ffb-sd-hi:9.4%;--ffb-avg:7.25%">
  <i class="ffb-spread-range"></i><i class="ffb-spread-sd"></i><i class="ffb-spread-avg"></i>
</span>
```

The guides behind it are evenly spaced. `--ffb-rounds` (default 10) sets how many, so use them where the scale is that many equal divisions. The column head carries the three-part legend, and the round labels where one scale serves the whole board:

```html
<span class="ffb-h-spread">
  <span class="ffb-h-spread-label"><span>Expert spread</span>
    <span class="ffb-spread-key"><span><i class="ffb-key-range"></i>Range</span> <span><i class="ffb-key-sd"></i>±1 SD</span> <span><i class="ffb-key-avg"></i>Average</span></span></span>
  <span class="ffb-h-rounds"><span>R1</span>…<span>R10</span></span>
</span>
```

The marks take the position's ink from the `ffb-pos-*` class on the plot, or plain ink without one. In a row the plot is a block that fills its cell.

The scale never changes because more rows loaded. A plot on screen keeps the scale it was fitted with, and the labels for that scale print beside the plots that use it. `fitSpreadScale(lo, hi, options)` in `src/components/fantasy/spreadScale.ts` fits a window of whole divisions around the ranks `lo` to `hi` and returns a `SpreadScale`, which is the first and last rank the plot covers and a tick with a label at the start of each division.

| Option | Default | What it does |
| --- | --- | --- |
| `unit` | 12 | Ranks in a division (a round of a 12-team draft) |
| `pad` | 0 | Divisions of room added each side, where they exist |
| `minDivisions` | 3 | The narrowest window. It grows to the right to get there |
| `label` | "R1", "R2", … | The label for a division, from its first rank and its index |

Past sixteen divisions the ticks double their spacing, so the labels do not crowd. A rank is a slot one wide on the scale, so rank `r` runs from `(r - min) / (max - min + 1)` to `(r - min + 1) / (max - min + 1)` of the plot, the range starts at the left of the best rank, and it ends at the right of the worst.

The rankings board fits one scale for each section it draws (a tier, or a page of the VORP view) and prints that scale's labels on the section's head, so a tier that loads later brings its own scale and nothing above it moves. A drawer fits a scale around its one player with a division of room each side. The compare modal is the one place with a single shared scale, since its columns are compared with each other.

Standing alone (a drawer, a compare column), wrap it in `ffb-plot`. The plot is then 32px tall with larger marks (3, 12, and 24px), and a range of one rank still draws a 4px mark. `ffb-plot-compact` keeps the board's marks at a 20px height. `ffb-plot-ends` is the line of best, average, and worst under it, and `ffb-plot-none` the sentence for a player with no range.

```html
<div class="ffb-plot">
  <span class="ffb-spread ffb-pos-wr" role="img" aria-label="…" style="…">…</span>
  <p class="ffb-plot-ends"><span>Best 4</span> <span class="ffb-is-avg">Avg 9.2</span> <span>Worst 26</span></p>
</div>
```

### Tables

A real `table` for the weekly board, the waiver list, and the compare modal.

```html
<div class="ffb-table-wrap">
  <table class="ffb-table">
    <caption class="ffb-vh">Flex rankings, Week 5</caption>
    <thead><tr><th scope="col" class="ffb-num">#</th><th scope="col">Player</th><th scope="col" class="ffb-num">Rostered</th></tr></thead>
    <tbody><tr><td class="ffb-c-rank">1</td><th scope="row">Ja'Marr Chase</th><td class="ffb-num">99.9%</td></tr></tbody>
  </table>
</div>
```

Heads are label type on a 2px ink rule, rows are ruled at the row height (44px on a phone), and a row header in the body is the row-name weight. `td.ffb-c-rank` is the rank cell, right aligned at 15px and weight 700. `ffb-c-num ffb-is-strong` and `ffb-c-num ffb-is-flat` work in a table cell as they do in a row. `ffb-table-wrap` scrolls a table sideways when it is wider than the screen. `ffb-table-sticky` keeps the head on screen while the page scrolls, and it cannot be used inside `ffb-table-wrap`, since a scroller stops a sticky head.

`ffb-table-compare` is the compare layout: a 7.5rem label column that stays put while the table scrolls sideways, and one column per player. The stronger value on a row takes `<span class="ffb-best">Best</span>` directly after the value, with no text between them, which is what the test reads. The tag is ink, never highlighter.

The sticky head draws its 2px ink rule as an inset edge, because a collapsed table does not carry a stuck cell's border with it. On paper the head is not stuck and takes its real border back, since an inset edge leaves seams between head cells in a PDF. In the compare table the corner cell stays with the label column, so a player's head never slides over the row labels.

Where a table would be too wide for a phone and the page switches to a list, as the weekly board does, use `ffb-listhead` and `ffb-row-stack` (see The board).

### Facts

A bordered tile grid becomes one of these.

Label beside value, ruled:

```html
<dl class="ffb-facts">
  <div class="ffb-fact"><dt>Your rank in this room, modeled</dt><dd>3 of 12</dd>
    <dd class="ffb-fact-note">82nd percentile among same-progress teams</dd></div>
</dl>
<p class="ffb-fact-foot">A closing line for the block.</p>
```

`ffb-facts-sm` is the compact size (a 15px value), for the evidence mix and the like.

Label over value, in columns:

```html
<dl class="ffb-stats">
  <div class="ffb-stat"><dt>Tier</dt><dd>2 <small>of 14</small></dd></div>
  <div class="ffb-stat"><dt>You give</dt><dd>91.4</dd><dd class="ffb-stat-note">86.0 to 96.1</dd></div>
</dl>
```

Set `--ffb-stat-min` for the column width (default 88px). `ffb-stats ffb-stats-2` is two fixed columns, for four figures that read best as two by two, where auto-fit would leave three and one.

`dl.ffb-pairs` is small label and value pairs on one wrapping line, each pair in a `div`.

### Neighbour list

The players ranked around one player, each a button, with the player himself marked `aria-current="true"`.

```html
<ol class="ffb-neighbors">
  <li><button type="button" class="ffb-neighbor" aria-current="true">
    <span class="ffb-c-rank">7</span> <span class="ffb-chip ffb-pos-wr">WR5</span>
    <span class="ffb-neighbor-name">Justin Jefferson</span> <span class="ffb-muted">11.7</span></button></li>
</ol>
```

## Position and picks

`ffb-chip` with a position class is the position chip, at least 46 by 20px, printing the position and its rank (WR5). `ffb-chip-sm` is the letters alone at 30 by 18px.

The sticker is a pick:

```html
<li class="ffb-sticker ffb-pos-rb ffb-is-mine">
  <span class="ffb-sticker-meta"><span>#15 · Slot 10</span> <span>RB6 · CIN</span></span>
  <span class="ffb-sticker-name">C. Brown</span>
</li>
```

`ffb-sticker-sm` is the small size. `ffb-is-mine` adds a highlighter band at the left edge. A `button.ffb-sticker` is fine where a pick opens the player or undoes back to it. As a button it draws a 1px inset edge in the on-fill ink, because no position fill reaches 3:1 against the light board, and my own sticker keeps the edge and the band together.

A sticker with a remove button inside it (a pinned player in the compare tray) is `ffb-sticker-pin` with an `ffb-iconbtn ffb-sticker-remove`. The button is the on-fill colour, hovers to an inset edge, and rings inside the fill.

```html
<span class="ffb-sticker ffb-sticker-sm ffb-sticker-pin ffb-pos-wr">
  <span class="ffb-sticker-meta"><span>WR1 · CIN</span></span> <span class="ffb-sticker-name">J. Chase</span>
  <button type="button" class="ffb-iconbtn ffb-sticker-remove" aria-label="Remove Ja'Marr Chase from compare">×</button>
</span>
```

Last picks is one row of whole stickers, newest first. The older ones are clipped, so nothing is cut in half. On a phone it scrolls sideways off the right edge. `ffb-picks-head` holds the heading with `ffb-picks-note` under it, a short note that says what a sticker does when it is a button, and on a phone the two share a line. Inside the list a `button.ffb-sticker` fills its `li` and takes an ink outline under the pointer. Where the stickers are buttons, a clipped one still takes focus where nobody sees it, so count the first row with `useFirstRowCount(listRef, picks.length)` and set `visibility: hidden` on the items past that count, as `DraftLastPicks` does. Where the stickers are plain and the list scrolls sideways, give the list `tabindex="0"` and name it from its heading, since Safari does not let a keyboard into a scroller with nothing focusable in it.

```html
<div class="ffb-picks"><h2 class="ffb-h3">Last picks</h2> <ol class="ffb-picks-list">…stickers…</ol></div>
```

A roster slot is a socket the size of a sticker, keyed with the colour that fits it, and a filled slot is the sticker itself.

```html
<ul class="ffb-slots">
  <li class="ffb-slot ffb-pos-qb"><span class="ffb-slot-code">QB</span> <span class="ffb-slot-name">Open</span></li>
  <li class="ffb-slot ffb-is-filled ffb-pos-wr"><span class="ffb-slot-code">WR</span> <span class="ffb-slot-name">P. Nacua</span> <span class="ffb-slot-meta">LAR · Bye 11</span></li>
  <li class="ffb-slot ffb-pos-flex"><span class="ffb-slot-code">FLEX</span> <span class="ffb-slot-name">Open</span></li>
  <li class="ffb-slot ffb-slot-bench"><span class="ffb-slot-code">BN</span> <span class="ffb-slot-name">Bench</span> <span class="ffb-slot-meta">0 of 6</span></li>
</ul>
```

The list fills two columns top to bottom, five rows each. Set `--ffb-slot-rows` for a different count.

A filled slot never cuts the player's name to make room for the team and bye. The name takes what it needs first, and the meta sits at the slot's right and drops out whole when it does not fit, so a bye week is never cut to its first digit. Only a name longer than the whole slot is cut. Give the team and the bye a span each inside `ffb-slot-meta`, as `DraftRoster` does, and the bye drops first while the team stays as long as it fits. The meta is a wrapping flex line with a clipped second line, which is how it drops, so do not set a height or `display` on it outside a list slot.

A roster inside `ffb-rail-lead` is compact below 1200px, where the lead block sits above the list. Each slot is the code over the name in a socket of 62px or more with no team or bye, the bench prints its count, and a filled name takes the face's narrowest width. A filled name prints the last name alone, on up to two lines (the initial is `span.ffb-slot-initial`, which the compact form hides), and the slot's name carries the full name as its title. A lineup of ten is one 44px row from 900px. Below 900px the sockets are 72px or more, because a ten-across row there leaves a name 50px and cuts a nine-letter last name, so the row wraps to eight and two at 768px and four across on a phone, with rows added as the lineup needs them. A roster that is not in a lead block keeps its two columns at every width.

`ffb-slots ffb-slots-list` is the same slots in one column at every width, with a meta line under the name and `ffb-slot-value` at the right (the weekly lineup).

```html
<ul class="ffb-slots ffb-slots-list">
  <li class="ffb-slot ffb-is-filled ffb-pos-rb"><span class="ffb-slot-code">RB</span> <span class="ffb-slot-name">J. Gibbs</span>
    <span class="ffb-slot-meta">DET · at DAL</span> <span class="ffb-slot-value">3 <small>flex</small></span></li>
  <li class="ffb-slot ffb-pos-te"><span class="ffb-slot-code">TE</span> <span class="ffb-slot-name">No ranked player</span></li>
</ul>
```

The pick grid is rounds down and slots across. Set `--ffb-teams` and `--ffb-my-slot` on it. My column sits on a highlighter band and is headed "You", each round's label carries a mark for the way the round runs, the cell on the clock is highlighter with an ink outline, and a cell's accessible name carries the pick number, the player, and the position. The open cells of my column and its "You" head paint the highlighter themselves, so their text measures against it. `ffb-grid-names` is the grid at the page's width, as a recap draws it. Its labels are 14px in 40px cells (34px cells on a phone, where the phone's narrow label applies), and from 1200px each made cell prints its player under the label, in `span.ffb-cell-name`, in 52px cells. `DraftPickGrid` does this with its `names` prop. `ffb-gridwrap` is 3px wider than its column on each side, so the highlighter band, which runs 3px past my column, stays inside the scroller when my column is the last.

```html
<div class="ffb-grid" style="--ffb-teams:12;--ffb-my-slot:3">
  <span></span> <span class="ffb-grid-slot">1</span> <span class="ffb-grid-slot">2</span> <span class="ffb-grid-slot ffb-is-mine">You</span>…
  <span class="ffb-grid-round">R1<i class="ffb-grid-dir" aria-hidden="true"></i></span>
  <span class="ffb-cell ffb-is-made ffb-pos-wr" role="img" aria-label="Pick 1, Ja'Marr Chase, WR">WR1</span>…
  <span class="ffb-grid-round">R2<i class="ffb-grid-dir ffb-is-rev" aria-hidden="true"></i></span>
  <span class="ffb-cell ffb-is-mine" role="img" aria-label="Pick 22, open">22</span>
  <span class="ffb-cell ffb-is-live" role="img" aria-label="Pick 16, on the clock">16</span>…
</div>
<p class="ffb-tally"><span class="ffb-tally-label">Taken</span>
  <span class="ffb-tally-item"><span class="ffb-chip ffb-chip-sm ffb-pos-wr">WR</span>9</span>…</p>
```

A four-character label ("WR10") needs 29px at the grid's size. On a phone every made cell sets at 10px on the face's narrowest width, which needs 20px. Add `ffb-grid-tight` to the grid for the same labels in a 14 or 16 team room at any width, but not to a grid at the page's width, whose cells have room. A five-character label ("DST10") needs 32px, more than a rail's cell from 1024px, so mark that made cell `ffb-cell-long` and it takes the narrow form at any team count. Wrap the grid in `ffb-gridwrap` where it can be wider than its column (16 teams in a rail or on a phone), which scrolls it sideways at 24px a column.

The direction mark is drawn by the CSS and is hidden from assistive tech, so say the direction in words where the grid is described (a caption, or the round label's accessible name). A `button.ffb-cell` is fine where a cell opens the pick.

## Status

### Scorebug

One bar of four to six cells with the live cell in highlighter. In the light theme it is a solid ink bar. In the dark theme it is the sunk surface between two ink rules with ink text, so the highlighter is the brightest thing on the page in both.

```html
<div class="ffb-sticky">
  <div class="ffb-bug" role="group" aria-label="Live draft status">
    <div class="ffb-bug-seg"><span class="ffb-bug-label">Pick</span><p class="ffb-bug-value">16 <small>of 180</small></p></div>
    <div class="ffb-bug-seg"><span class="ffb-bug-label">Round</span><p class="ffb-bug-value">2 <small>of 15</small></p></div>
    <div class="ffb-bug-seg ffb-bug-live" title="Slot 9"><span class="ffb-bug-label">On the clock</span><p class="ffb-bug-value">Slot 9</p>
      <p class="ffb-bug-note">Prev · C. Brown #15</p></div>
    <div class="ffb-bug-seg"><span class="ffb-bug-label">Your next turn</span><p class="ffb-bug-value">#22 <small>in 6 picks</small></p></div>
    <div class="ffb-bug-seg"><span class="ffb-bug-label">Pool</span><p class="ffb-bug-value">536 <small>left</small></p></div>
    <div class="ffb-bug-actions"><button type="button" class="ffb-bug-btn">Undo pick</button><button type="button" class="ffb-bug-btn ffb-bug-btn-quiet">New room</button></div>
  </div>
</div>
```

The cells are plain flex children, so four, five, or six all work, and the live cell can sit anywhere in the order. It stands 4px proud of the bar and is one column, a label over a value. Its value holds a width of 8.5rem from 768px and ends a long name in an ellipsis, so the bar wraps at the same point, and keeps the same height, whoever is on the clock. Put the full name in the cell's `title`. `ffb-bug-note` is a small second line under any cell's value (the pick just logged). On a phone the bar runs edge to edge in two rows, the live cell with the actions and then the other cells in equal columns. Below about 360px the actions wrap to a row of their own. The bar has to sit in the page column for the bleed to reach the screen edge.

Inside the bug the focus ring is the highlighter in light and ink in dark. Use `ffb-bug-btn` for its buttons, since `ffb-btn` reads the board's colours.

The clock in a cell of its own. The pick clock is advisory and quiet while other teams pick, which a clock inside the highlighter cell cannot be. So a room gives the clock its own `ffb-bug-seg` and marks its state. `ffb-is-quiet` mutes the value, and `ffb-is-urgent` turns the cell to the highlighter, standing proud like the live cell (the redraft room uses it for the last 15 seconds of my own pick).

```html
<div class="ffb-bug-seg ffb-bug-live"><span class="ffb-bug-label">On the clock</span> <p class="ffb-bug-value">Slot 9</p></div>
<div class="ffb-bug-seg ffb-is-quiet"><span class="ffb-bug-label">Clock</span>
  <p class="ffb-bug-value" role="timer">1:29 <small><span class="ffb-bug-long">advisory, 90s per pick</span><span class="ffb-bug-short">advisory</span></small></p></div>
```

A bar that does not fit takes a second line, since the bug wraps. Six cells and three buttons need about 1113px, so below 1300px a room shortens what it can with a pair of spans, `ffb-bug-long` shown from 1300px and `ffb-bug-short` below it (an Undo button that drops its word, a clock note in its short form). On a phone the first row holds the live cell and the actions, and it has room for two text buttons, or one text button and icon buttons. A third text button pushes the live cell to a row of its own at 390px.

Where the bar pins, a `ffb-sticky` wrapper that holds the bug directly has 4px of block padding, so the live cell's overshoot is not clipped at the top of the screen.

### The on-the-clock strip

"Your pick is live" is a highlighter tab hanging from an ink rule, then the facts side by side with no boxes. Each fact is at least 248px, so one a disclosure adds wraps to a new row.

```html
<div class="ffb-block">
  <div class="ffb-strip-head"><h2 class="ffb-turn-tab">Your pick is live</h2> <button type="button" class="ffb-btn ffb-btn-quiet" aria-expanded="false">Why these picks</button></div>
  <div class="ffb-strip">
    <div class="ffb-strip-item"><span class="ffb-label ffb-muted">Best available</span>
      <div class="ffb-strip-line"><span class="ffb-chip ffb-pos-wr">WR5</span> <button type="button" class="ffb-c-name">Justin Jefferson</button> <button type="button" class="ffb-log">Log</button></div>
      <p class="ffb-strip-note">Tier 2, and the last receiver in it.</p></div>
    <div class="ffb-strip-item"><span class="ffb-label ffb-muted">If you wait · WR</span>
      <p class="ffb-strip-value">4 left</p><p class="ffb-strip-note">in tier 2 at your next turn.</p></div>
  </div>
</div>
```

### Ruled entries

Draft signals, a turn replay, and position runs are a title line and a muted note between hairlines.

```html
<ol class="ffb-entries">
  <li class="ffb-entry">
    <p class="ffb-entry-line"><span class="ffb-chip ffb-pos-rb">RB1</span> <span class="ffb-c-name">Reach at pick 9</span> <span class="ffb-badge ffb-warn">Reach −6.2</span></p>
    <p class="ffb-entry-note">Taken by slot 9, six picks ahead of ADP.</p>
  </li>
</ol>
```

### Freshness line

`p.ffb-fresh`, muted, 12.5px, parts joined by a dot. Each part is a `span.ffb-fresh-part` that holds its label and its dot, so from 768px the line breaks only between parts. A part that carries a status takes `ffb-warn` or `ffb-bad` on its label and still says so in words ("ADP stale"). `FreshnessParts` draws it, from a part's `tone` of `warning` or `negative`. It prints once per page.

### Notice

Text with a 3px key rule at its left edge, on the board, with no border and no fill. One class with tone modifiers, for the in-season note, a stale-source or paused note, a storage warning, and an error.

```html
<div class="ffb-notice ffb-notice-warn" role="note">
  <p><strong>Week 5 of the 2026 season.</strong> This board stopped moving when the season started.</p>
  <div class="ffb-notice-actions"><button type="button" class="ffb-btn">Retry rankings</button></div>
</div>
```

| Modifier | Key rule | For |
| --- | --- | --- |
| none | ink | A plain note (storage, a method boundary) |
| `ffb-notice-warn` | warning ink | Stale, aging, in season, paused |
| `ffb-notice-bad` | error ink | A failure. Pair it with `role="alert"` and a retry |
| `ffb-notice-good` | good ink | Something that worked |
| `ffb-notice-held` | dashed edge | Something the page is holding back: a withheld verdict, a paused read |

Keep the role the page already uses (`note`, `status`, `alert`), since tests read it. Protected text goes in the notice word for word. Do not stack three notices over the tool. One status prints once.

### Badge, count, meter

`ffb-badge` is a status word in a 20px outline, toned with `ffb-good`, `ffb-bad`, or `ffb-warn`. A badge is a label, so do not make one a button.

`ffb-countbadge` is a highlighter count of what is mine (queued players).

`ffb-meter` is a 6px meter. Set `--ffb-value` as a percentage and give it `role="progressbar"` with its values. `ffb-meter-weighted` makes the track as wide as `--ffb-weight`. One scored component of Draft Outlook is:

```html
<div class="ffb-score">
  <span class="ffb-score-label">Market price</span> <span class="ffb-score-value">71 score · 45% weight</span>
  <span class="ffb-meter" role="progressbar" aria-label="Market price score" aria-valuemin="0" aria-valuemax="100" aria-valuenow="71" style="--ffb-value:71%"></span>
  <span class="ffb-score-note">A line of detail.</span>
</div>
```

### Verdict and the balance scale

```html
<div class="ffb-verdict">
  <p class="ffb-verdict-title ffb-good">You get the better side</p>
  <p class="ffb-verdict-body">The side you receive carries about 45% more index value.</p>
</div>
<figure class="ffb-scale" role="img" aria-label="…"><svg …/></figure>
```

Tone the title with a status class, or leave it ink for a balanced read. `ffb-scale` is the frame of the balance scale, which has no border and holds the SVG at full width, drawn in `currentColor`. A withheld verdict is `ffb-verdict ffb-notice ffb-notice-held` with its words. The verdict keeps its own spacing there.

## Room parts

A draft room is built from `src/components/fantasy/DraftRoomParts.tsx`. A room imports these parts and does not copy their markup, so a fix to a part reaches every room. The redraft room, the mock room, and the best ball room are all built from them. Each part is kit markup with the room's values filled in. None of them holds room state, and none imports from a route folder. The kit draws them. The one thing past it is the "All picks" list under the grid, whose four rules are in `fantasy-room.css` (prefix `ffb-rm-`), which the parts file imports itself, so a room gets it with the parts.

| Part | What it draws | Props |
| --- | --- | --- |
| `DraftScorebug` | The pinned `section.ffb-sticky` holding the `ffb-bug` bar. Its children are the cells | `label` is the section's accessible name. The section carries `ffb-bug-pin`, which stacks it one above every other pinned bar, so a room's board bar, pinned or a flex item at the same level and later in the page, never covers Undo, Redo, or New room. `announcement` is optional. With it the bar prints a visually hidden status sentence, and without it the bar prints none, which is what a room wants (see below). `actions` are the `ffb-bug-btn` buttons at the bar's far end. `sectionRef` is the element a room measures to pin its board bar and its rail. `className` goes on the bar |
| `DraftScorebugCell` | One `ffb-bug-seg`, a label over a value | `label` is a node, so a room can pass a long form and a short form. `live` paints the on-the-clock cell in the highlighter and holds its width, so a long team name ends in an ellipsis and the bar keeps one height. Put the full name in `title`. `note` is a small second line under the value (the pick just logged). The value is the children. Any other `div` attribute lands on the cell, so a room can give it a `ref` and `tabIndex` to focus it, a `role`, or a class |
| `DraftLastPicks` | `ffb-picks`, with the picks as stickers, newest first. It renders nothing while there are no picks | `picks` and `userTeam`. `heading` is "Last picks" unless you pass another. `headingLevel` is 2 or 3 and changes the element, not the look. With `onUndoToPick` each sticker is a button that undoes back to that pick, a note beside the heading says so, and the stickers that fell out of the first row are hidden so none takes focus unseen. Without it the list takes focus itself, named by its heading, so a keyboard can scroll it |
| `DraftRoster` | The rail's lead block, `section.ffb-rail-lead`, with the roster as `ffb-slots` and the bench | `assignment` is the lineup's `slots` and `bench`. `picked` and `rounds` print as "3 of 15 picked". The bench is left out while the draft has no room for one (a mock shorter than the lineup) and nothing is on it |
| `DraftPickGrid` | The pick grid, rounds down and slots across, growing to the current round, with the tally and an "All picks" disclosure that lists every pick by round for a touch screen, a keyboard, and paper | `picks`, `totalTeams`, `userTeam`, `rounds`, `currentPick`, `currentRound`, and `isComplete`. `slotForPick` is the room's draft order, the slot that makes a given overall pick, and the grid reads each round's direction from it. `heading` ("Pick grid" unless you pass another) and `headingLevel` (2 or 3) name the grid and place it in the page's outline. `sectionHead` draws the head a section of the page takes, for a grid that is a section and not a rail block. `names` is the grid at the page's width, which never takes the tight type and prints each player's name in its cell from 1200px, so pass it only where the grid has the page's width. `picksOpen` renders "All picks" open, and its round headings sit one level below the grid's own. A made cell with a five-character label is marked `ffb-cell-long`. The mock draft's recap passes all five |

A pick is a `RoomPick`, which is the `pickNumber`, `teamNumber`, and `player` of a draft pick, so a redraft pick and a best ball pick both fit.

A room keeps what is its own in its own sheet, which means the cells it puts in the scorebug, its strip, its board's columns, and its rail blocks. If a part needs a change, change the part.

A room announces its state in one status element of its own, `<p role="status" aria-live="polite" class="sr-only">`, which it keeps mounted from its setup screen through the room to the recap. So each sentence is a change inside a region a screen reader already knows. A region that mounts together with its text can be skipped, which is why the scorebug does not carry the room's sentence. The paragraph is empty on setup. All three rooms do this, and each has a test that the element is the same node before and after its Start button.

## Overlays

The markup below is `position: fixed` inside the route root, as the drawer, the modal, and the tray are today. Keep `useModal`, the `tabIndex={-1}` panel, the backdrop button outside the panel, and the order of focusable elements, since tests pin them.

```html
<div class="ffb-overlay ffb-enter-fade">
  <button type="button" class="ffb-scrim" aria-label="Close player detail" tabindex="-1"></button>
  <div class="ffb-drawer ffb-enter-side" role="dialog" aria-modal="true" aria-label="Justin Jefferson detail" tabindex="-1">
    <div class="ffb-panel-head">…chip, rank line, h2.ffb-h2 name… <button class="ffb-iconbtn" aria-label="Close">×</button></div>
    <div class="ffb-panel-body">…sections…</div>
  </div>
</div>
```

| Class | What it is |
| --- | --- |
| `ffb-overlay` | The fixed layer, at `--c97-z-drawer`, with its content at the right. `ffb-overlay-modal` centres it at `--c97-z-modal`, and `ffb-overlay-sheet` puts it at the bottom at `--c97-z-sheet` |
| `ffb-scrim` | The dimmed backdrop, a button |
| `ffb-drawer` | The right-hand panel, 26rem wide with a 2px ink edge. On a phone it is a bottom sheet up to 88dvh |
| `ffb-modal` | A centred panel up to 44rem. On a phone it comes up from the bottom |
| `ffb-sheet` | A bottom sheet at every width |
| `ffb-panel-head`, `ffb-panel-body` | The sticky head, and the padded body with a 24px gap between sections. The body is one column that cannot be wider than the panel, whatever its widest block wants |
| `ffb-tray`, `ffb-tray-row`, `ffb-tray-space` | The compare tray pinned to the bottom at `--c97-z-tray`, its row (put `c97-shell c97-frame` on the same element), and the 80px of room it needs at the end of the page. The row does not wrap, or it would outgrow that room, so give its list `flex: 1 1 0; min-width: 0` and let that part shrink. `ffb-tray-narrow` on the tray and on its spacer is a tray that shows only below 1200px (a room's bottom bar, where the rail is not beside the list). While a page shows a tray's spacer, the kit runs the site's footer 80px longer in its own colour, so the footer's last lines clear the tray at the end of the page |
| `ffb-toast` | A message at the bottom centre at `--c97-z-toast`, ink with board text in both themes |
| `ffb-enter-fade`, `ffb-enter-rise`, `ffb-enter-side` | Entrances from `@starting-style`, off under reduced motion, so the first paint is never transparent |

Panels are the raised surface and set `--ffb-surface` to it, so a sticky head or a sticky table column inside paints the right colour. Inside a panel, sections are ruled with `ffb-sechead`, facts are `ffb-stats` or `ffb-facts`, and nothing is a bordered card.

The open site search sits at `--c97-z-tray` plus one. Keep sticky bars at `--c97-z-sticky` and the overlays on their tokens, and nothing covers it.

A tooltip is `MetricTooltip`. Its bubble is portalled outside the root with the `ffb-scope` class, which gives it the kit's ink, board, and type.

### Drawer parts

Every player drawer on the fantasy pages renders the same three blocks from `src/components/fantasy/`, so use them and do not rebuild them.

| Part | What it draws | Props |
| --- | --- | --- |
| `RankDistributionBar` | The expert spread as a standing plot (`ffb-plot`), with a rank axis whose guides and labels mark the start of each division, and the line of best, average, and worst under it. A player with no range gets one sentence | `player`. `scale` is a `SpreadScale` from `fitSpreadScale`. Without one the plot fits its own, in rounds of a 12-team draft with a round of room each side. `scaleMin` and `scaleMax` put several plots on one plain scale with no axis, which the compare modal uses. `compact` is the small inline form with no labels. `showEnds` set to false leaves out the best, average, and worst line for a caller that prints those numbers elsewhere |
| `PlayerPointsPerGame` | A section head with its help trigger and the basis line (season, scoring, games), then the low, median, average, and high as four `ffb-stat` figures. It is history and never a projection, which the help on the label says | `gameLog` is the player's log, so render the block only for a player who has one. `scoringLabel` ("PPR") prints in the basis line when the caller knows it |
| `PlayerNoteField` | The private note, which is a label, a two-row `ffb-textarea`, and a counter that says where the note is kept | `id` (also the field's name), `value`, `maxLength`, `onChange`. `persistent` is false when browser storage is blocked, and the counter then reads "kept in this tab only" and nothing says "saved" |

The shared drawer itself is `PlayerDetailDrawer`, loaded on demand through `DeferredPlayerDetailDrawer`, and the compare tray is `DeferredCompareTray`. Do not import `PlayerDetailDrawer.tsx` or `CompareTray.tsx` statically, since they stay out of a page's first load.

## States

Loading is `FantasyLoadingState` at the route level. Inside a page, a pending block is `ffb-skel` lines (set a width and height) and `ffb-skel-row` rows. The pulse is off under reduced motion.

Empty, with one action:

```html
<div class="ffb-empty">
  <p class="ffb-empty-title">No players match on this board</p>
  <p class="ffb-empty-body">The reason, in a sentence.</p>
  <button type="button" class="ffb-btn">Clear search</button>
</div>
```

An error is `ffb-notice ffb-notice-bad` with `role="alert"` and a retry in `ffb-notice-actions`. A disabled control has a dashed edge and muted text, and never a faded one.

## Prose

| Class | For |
| --- | --- |
| `ffb-prose` | Running text at 15px with a 68ch measure and 12px between paragraphs |
| `ffb-faq` | Questions and answers in columns. Each child is a block of `h3.ffb-h4` and `p` |
| `ffb-notes`, `ffb-note`, `ffb-note-num` | Field notes: a list of short entries on rules, each with an optional number, an `ffb-h4` title, and a paragraph |
| `ffb-method` | The method footnote under a board, 12.5px and muted. `ffb-method-ruled` puts it on a 1px rule with 12px above the text. The rule runs the width of the column and the sentence keeps the method's 96ch measure |
| `ffb-footlinks` | The last line of a page, with one sentence at the left and a `nav` of `ffb-link` at the right, on a rule |

A page's last line is its source or method sentence on that rule, as `<p class="ffb-method ffb-method-ruled">`. The product bar replaced the foot's link lists, so `ffb-footlinks` is for a page that still has a real link to put beside the sentence, and nothing follows either one. Set the space above the line in your own sheet, since it depends on what the line follows.

## Print

On paper the board prints its light palette whatever the theme. Position fills print (chips, stickers, slots, cells, the spread). The highlighter does not, and what was highlighted keeps a 2px ink outline or an underline. The product bar, toolbars, stars, Log buttons, "Load more", the scorebug's actions, icon buttons, search, the tray, the toast, and the head's aside are left off, sticky things are static, and the rail drops under the list. The root keeps 24px of padding at its foot, so the site's next band does not sit on the page's last line. A scrolling rail prints whole. Paper is narrower than 1200px, so a split layout prints its lead block above the list, with a roster in its compact form.

The kit's breakpoints follow the paper's width. A portrait Letter or A4 page is under 768px wide, so it prints the phone layout and the `ffb-only-phone` half of a pair, and a page turned on its side prints the desktop half. Tailwind's `md` variants never apply on paper (see the cascade), so a pair that has to print right switches with the kit's helpers. A closed `details` prints closed unless it carries `ffb-details-print`.

A control or a note that does nothing on paper takes `ffb-noprint`. Anything more particular is hidden in your area sheet under `@media print` with a `.ffb-root` selector. A board's column head has to print wherever the desktop row does, so it leaves a phone through `ffb-not-phone`.

## Forced colours

Windows high contrast paints its own colours over every background. The kit has one block for it. The spread's three marks and its legend take the text colour, a queued star is filled in the text colour, and a pressed, checked, or selected `ffb-seg-btn`, `ffb-tab`, `ffb-toggle`, `ffb-iconbtn`, and a checked or pressed `ffb-choice` take the system's selection pair (`Highlight` and `HighlightText`). That rule also sets `forced-color-adjust: none`, because the browser otherwise paints a plate in the page colour behind the label and the label disappears into it. If your sheet draws a state or a mark with a fill alone, give it the same treatment under `@media (forced-colors: active)`, which the trade calculator's active search option still needs.

## How a page is put together

A board page, top to bottom:

```html
<section class="relative overflow-x-clip" aria-label="…" data-testid="…" data-hydrated="…">
  <FantasyRouteHeader title={…} lead="…" freshness={<FreshnessParts parts={…} />} />
  <div class="c97-shell c97-frame ffb-stack ffb-stack-page">
    <div>
      <!-- only when it applies, once -->
      <SeasonalScopeNote season={2026} week={5}>…</SeasonalScopeNote>
      <div class="ffb-sticky ffb-toolbar">
        <PositionFilterBar … />
        <div class="ffb-seg" role="group" aria-label="Scoring">…</div>
        <label class="ffb-search">…</label>
        <button class="ffb-toggle" aria-pressed="false">…Queued…</button>
        <p class="ffb-count" aria-live="polite">40 of 551 shown</p>
      </div>
      <div class="ffb-board ffb-xx-board">
        <div class="ffb-colhead" aria-hidden="true">…</div>
        <section class="ffb-tier" aria-label="Tier 1">…<ol class="ffb-rows">…</ol></section>
        <button class="ffb-more">Load more (511 left)</button>
      </div>
    </div>
    <section aria-labelledby="questions">
      <div class="ffb-sechead ffb-sechead-lg"><h2 class="ffb-h2" id="questions">Questions</h2></div>
      <div class="ffb-faq">…</div>
    </section>
    <p class="ffb-method ffb-method-ruled">The source or method sentence, which is the page's last line.</p>
  </div>
</section>
```

A room:

```html
<section class="relative overflow-x-clip" aria-label="…" data-testid="…">
  <div class="c97-shell c97-frame">
    <header class="ffb-head ffb-head-run">
      <h1 class="ffb-title">Draft Tracker</h1>
      <p class="ffb-lede">My Fantasy League · 12-team snake · PPR</p>
      <FreshnessParts parts={…} />
    </header>
    <p role="status" aria-live="polite" class="sr-only">{the room's one announcement, empty on setup}</p>
    <DraftScorebug label="Live draft status" sectionRef={measured} actions={…}>…cells…</DraftScorebug>
    <DraftLastPicks … />
    <div class="ffb-work ffb-work-split" style="--ffb-sticky-top: <the bug's measured height>px">
      <a class="ffb-btn ffb-skip" href="#your-draft">Skip to your roster</a>
      <div class="ffb-board ffb-board-room ffb-board-star-log ffb-xx-board">
        <div class="ffb-sticky ffb-toolbar">…position switch, search, count…</div>
        <div class="ffb-colhead ffb-not-phone" aria-hidden="true">…</div>
        <section class="ffb-tier">…rows with a star and a Log button…</section>
      </div>
      <aside class="ffb-rail">
        <DraftRoster … />
        <DraftPickGrid … />
        <section>…ffb-sechead, ffb-facts, ffb-score…</section>
      </aside>
    </div>
  </div>
</section>
```

A setup screen is `ffb-head ffb-head-setup`, then one form in the page column made of `ffb-field`, `ffb-seg`, and `ffb-choices`, with one `ffb-btn ffb-btn-primary ffb-btn-lg` to start. No card around the form.

A fantasy page does not use `c97-dash` on its root (the kit's root already resets paragraphs, lists, `fieldset`, and `legend`), `c97-kicker` labels over headings, `c97-panel` or bordered plates, `gap-px` grids painted on a rule colour, or an inline `--c97-*` colour. Inline styles are only for values computed at runtime, which in this kit means the custom properties below.

| Property | Set on | What it is |
| --- | --- | --- |
| `--ffb-cols` | `.ffb-board` or a row | The row's column template (static, so it belongs in your area sheet) |
| `--ffb-gap` | `.ffb-tier` | The gap above a tier break |
| `--ffb-min`, `--ffb-max`, `--ffb-sd-lo`, `--ffb-sd-hi`, `--ffb-avg` | `.ffb-spread` | The plot's marks, as percentages |
| `--ffb-rounds` | `.ffb-spread` and `.ffb-h-rounds`, or a parent | How many round guides |
| `--ffb-teams`, `--ffb-my-slot` | `.ffb-grid` | The pick grid's columns and my column |
| `--ffb-pinned-top`, `--ffb-pinned-bottom` | The list or any wrapper of it | The height of what is pinned over the list at the top, and of the tray at the bottom, when the page measures them |
| `--ffb-slot-rows` | `.ffb-slots` | Rows per roster column |
| `--ffb-value`, `--ffb-weight` | `.ffb-meter` | The meter's fill and a weighted meter's width |
| `--ffb-sticky-top` | A parent of a second sticky bar and the rail | The measured height of the first sticky bar |
| `--ffb-col-min`, `--ffb-choice-min`, `--ffb-stat-min` | `.ffb-columns`, `.ffb-choices`, `.ffb-stats` | Column minimums |

If the kit lacks something a second page would also need, add it to the kit. Until a second page needs it, a rule in your area sheet is the right place.

## How to check a change

Run these from the repository root. The Playwright specs and the two sweeps need a server of your own running.

| Check | Command |
| --- | --- |
| The drawing rules and the area prefixes | `npx jest src/app/fantasy-football/__tests__/print-shop-rules.test.ts` |
| The shared parts and the pages | `npx jest src/components/fantasy src/app/fantasy-football` |
| The pages in a browser | `npx playwright test e2e/fantasy-football.spec.ts e2e/fantasy-trade-calculator.spec.ts` |
| Layout from a phone to a wide monitor | `node scripts/layoutSweep.mjs <baseUrl> /fantasy-football /fantasy-football/draft-tracker …` |
| Text contrast in both themes | `node scripts/contrastSweep.mjs <baseUrl> /fantasy-football …` |

The layout sweep turns touch on at its phone sizes only, and neither sweep turns on forced colours or paper. So look at a touch pointer on a wide screen, forced colours, and paper yourself when a change could reach them. In Playwright that is a context with `hasTouch`, a context with `forcedColors: "active"`, and `page.emulateMedia({ media: "print" })`.
