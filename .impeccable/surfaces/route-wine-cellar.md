---
version: 1
slug: "route-wine-cellar"
primary_target: "route:/wine-cellar"
related_targets: ["src/app/wine-cellar/wine-cellar-client.tsx","src/app/wine-cellar/wine-cellar.css","src/app/wine-cellar/wineRack.ts","src/hooks/useWineCellar.ts","src/lib/wineCellar.ts"]
---

# Wine Cellar surface brief

Written on 2026-10-11 by the project sovereign pilot (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Log).

Scope. The `/wine-cellar` route, rendered by `src/app/wine-cellar/wine-cellar-client.tsx` with its own stylesheet `wine-cellar.css`. Bottles live in `localStorage` under `wine_cellar_entries_v1`, read and written through `useWineCellar` and `src/lib/wineCellar.ts`, which this redesign did not touch.

Visitor mode. Operate. The visitor logs a bottle, then comes back to read, filter, and correct the log.

Genre. A cellar book, the ledger a collector keeps beside the rack, with Vivino's and Delectable's bottle lists as the app references. Each bottle is one ruled line, read left to right, with the vintage large in the margin (NV when there is none), the producer in small caps over the wine's name, region, grape, and type under it, tasting notes in italic, and the rating as stars with the number, the date tasted, the price, and the Edit and Delete actions at the right edge. On phones the right edge drops under the wine.

## Decisions

The route paints its own paper inside the site frame. `.wc-root` declares `--wc-paper`, `--wc-field`, `--wc-ink`, `--wc-ink-2`, `--wc-wine`, `--wc-rule`, and `--wc-rule-strong`, with a light story (label-stock ivory `#f7f2e8`, oxblood `#74233a`) and a dark one under `.dark .wc-root` (cellar black `#161012`, rosé `#e3949f`). It redeclares `--c97-surface`, `--c97-field`, `--c97-ink`, `--c97-ink-2`, `--c97-label`, `--c97-rule`, and `--c97-accent` from those so the borrowed `c97-field`, `c97-range`, `c97-btn`, and `c97-btn-ghost` read the book's palette, and the focus ring paints the wine colour.

The root handles the frame's base layer itself. Headings take Newsreader explicitly, and `.wc-root :where(p, ul, li, figure)` resets the paragraph measure, margins, and list padding at one class of weight, so every route class still outranks it. An earlier draft reset with `.wc-root li`, which outranked `.wc-line` and silently removed the row padding.

Type is Newsreader for the title, the wine names, the vintages, and the notes, Archivo for everything else, and Fragment Mono for the rating and price figures. No added typeface.

The first screen is a title row (h1 and one sentence) and the book under it, the log on the left and the form on the right from 900px up, with a single vertical rule between them. The form is sticky only when the window is also at least 820px tall, since it measures about 750px with the error line showing, and on a shorter window (1366x700, a tablet on its side) it scrolls with the page so Add tasting is never pinned below the fold. Under 900px the form comes first while the cellar is empty (the `order-first` class the route test pins) and after the list once bottles exist.

The rack is a compact visual in the title row, six cells to a strip, one strip per region, and it renders only once there are bottles. Its legend lists only the types in the cellar. The type marks keep `WINE_TYPE_MARK` (the chart ramp, filled and hollow), which `wineRack.test.ts` pins.

The empty state is one sample line, captioned above as a sample and ruled in dashes, drawn with the same `BottleLine` markup but with no actions, outside the log list, and never counted. The form heading reads "Log your first bottle" while the cellar is empty, "Log a bottle" after, and "Edit bottle" while editing.

The readouts became one sentence in the title row once bottles exist. It names a region only where the data supports it, meaning the one bottle's region ("1 bottle logged, rated 4.5 stars, from Tuscany."), a region holding every bottle ("all from Tuscany"), or a region that leads outright ("with Tuscany the most logged region"). A tie for the lead reads "across N regions" instead, and bottles with no region name none. The first draft said "most of them from" the plurality region, which claimed a majority the data often did not have, and a route test now covers all five cases. The legend reads its types from `summary.typeBreakdown`, so it lists them by count. The "N of M shown" count prints only while a filter is active.

Cut, and not to be restored. The vermilion hero sheet and poster h1, the three readouts, the rack plate and the empty dark rack, the seven-type legend, the "What you've been drinking" type breakdown band (it repeats the rack), the "Recent 4.5+ stars" rail (it repeats the rating sort), the torn and deckled seams, the panel around the form, the offset shadow on each bottle card, and the decorative icons. The route's `PROJECT_PRESS` row was deleted in de1243b64, which also added the build-note purpose and method.

Print depends on the state. An empty cellar prints the title row, the sample line, the form, and the storage note, so the sheet still shows how to add a bottle. A cellar with bottles prints the title row with its summary and rack, the lines, and the storage note, and hides the form's heading and fields, the toolbar, and the row actions. The root carries `data-empty` while the cellar is empty, which is what the print rule keys on (a filtered view with no matches still counts as a cellar with bottles). The two-column rule and the sticky form are held to `screen`.

Long unbroken text wraps anywhere in the wine name, producer, region line, notes, and the rack's region labels, so a region like "Languedoc-Roussillon/Occitanie" or a pasted URL in the notes stays inside 320px.

## Pinned, and kept

`src/app/wine-cellar/__tests__/wine-cellar-client.test.tsx` holds unchanged, covering the h1 "Wine Cellar", "Log your first bottle" visible while empty, no "Search wines" searchbox and no "Filter by wine type" select while empty, "Wine cellar side panel" with `order-first` only while empty, the "Tasting log" region, "Edit Barolo" moving focus to "Wine name", "Save tasting", "Delete Updated Barolo", "Reset filters", and the alert "Give the bottle a name to log it." with `aria-invalid`. The region renders as its own span so `getAllByText("Piedmont")` still finds it now that the readouts are gone.

`e2e/all-projects.spec.ts:58-71` holds unchanged, covering the labels "Wine name" and "Producer", and the buttons "Add tasting", "Save tasting", "Edit X", and "Delete X". Also kept are `#add-tasting`, every form label, the half-step rating range, the sort direction toggle, and the storage key.

## Verified state, 2026-10-11 (re-run after the PR #583 review)

Against a production build (`next build --webpack`, served on 3720) in Chromium. `scripts/contrastSweep.mjs` reported no failures in either theme, and its `measurePage` run in the filled, no-match, and editing-with-error states also found none in either theme. `scripts/layoutSweep.mjs` reported 0 fails and 10 reviews. The six `orphan-row` reviews are the sample line's grid (vintage and wine on the first row, the rating block under the wine on the second), which is intended, and the four `sticky-offset` reviews are the form's `top` on the windows at least 820px tall, which is fine because the site header is `position: relative`. The filled state measured 0px of overflow at 320 and 360, while browsing and while editing, with a long name, a slash-joined region, a hyphenated producer, a URL in the notes, and a four-digit price. With 30 bottles the form is static at 1366x700 and 1024x600 and Add tasting scrolls into view, and at 1440x900 the form is sticky and Add tasting stays on screen.

First field and first row, page coordinates including the header. At 1440x900 the first field sits at y414 empty and y448 filled, and the first row at y582. At 390x844 the first field sits at y447 empty, and the first row at y838 filled, against a 1266 budget. Before the redesign those were y996, y1130, and y1314 at 1440, and y957 and y1573 at 390.

The keyboard order from the page top runs through the header, the toolbar (search, type, minimum rating, sort, direction), each row's Edit and Delete, the form fields in reading order, Add tasting, the build note, and the footer. Edit by Enter moved focus to Wine name, Enter in the field saved, and Space on Delete removed the row. A reload kept the bottles. Two tabs adding a bottle each and one editing a third ended with all five changes in storage and on both pages. Under `prefers-reduced-motion` the submit button's transition collapsed to 1e-05s and Edit jumped to the form. I did not check Safari's and Firefox's engines, touch devices, and a screen reader.
