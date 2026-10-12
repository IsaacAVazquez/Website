---
version: 1
slug: "route-fantasy-formula-1"
primary_target: "route:/fantasy-formula-1"
related_targets: ["src/app/fantasy-formula-1/fantasy-formula-1-client.tsx","src/app/fantasy-formula-1/GarageSignature.tsx","src/app/fantasy-formula-1/fantasy-formula-1.css","src/app/fantasy-formula-1/garage.ts","src/app/fantasy-formula-1/fantasy-formula-1-state.ts","src/lib/fantasyFormula1.ts"]
---

# Fantasy Formula 1 surface brief

Written on 2026-10-12 by the stage 2 G2 pass of the project sovereign design (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Calculator).

Scope. The `/fantasy-formula-1` route, rendered by `fantasy-formula-1-client.tsx` with the garage in `GarageSignature.tsx` and every style in `fantasy-formula-1.css`. Prices, projections, the optimizer, and the lineup sanitizer live in `src/lib/fantasyFormula1.ts`, and the lineup saves in `localStorage` under the season's key with the cross-tab merge in `updateLineup`. None of that was touched.

Visitor mode. Operate. The visitor builds a team of five drivers and two constructors under the model budget, locks the picks they are sure of, and compares against the optimizer.

Genre. The official F1 Fantasy team builder. The references are F1 Fantasy's team screen (slots with the budget bar across them, the player list under it) and FPL's pick team page.

## Decisions

The first screen is a title row (h1, one sentence, and a mono status line with the season, the snapshot time, and the next race), then the garage full width, the three optimizer lineups as a row of cards under it, and the slate. The garage is the team. Its head carries the projected points with the pick count, the value per $10m, and Reset; the seven slots carry each pick's livery, name, price, points, and its own Lock and Remove buttons; and the budget bar and the one not-the-official-game sentence sit at its foot. From 960px the seven slots share one row, livery across the top. On a phone a pick takes a full row with its livery down the left edge and an open slot takes half a row, so an empty team stays short.

Each lineup card has its points, value, drivers, constructors, cost, and a Use button (named "Use option N"), or "Your team" when it matches the current team. On a phone the three cards scroll as one row.

The slate is every asset in one table with the sort (value, projection, price, form) and the driver and constructor filters in its sticky toolbar. On a phone it keeps two columns with price and projection always shown and the rest behind More. The model's rules close the page as one paragraph.

The route paints its own page with `--ff1-*` properties, a light story close to Formula 1 Pulse's (`#f4f4f1`, carbon `#15151e`) and a dark one under `.dark .ff1-root`, so the two read as siblings, and redeclares the `--c97-*` tokens the shell and focus ring read. Liveries come from data, and the risk labels carry a dot and a word so they never rely on colour. The site's body face and Fragment Mono, no added face.

Cut, and not to be restored. The saffron hero sheet and the paper plate, the readout trio (its numbers are in the garage head and the budget bar), the suggested-lineup strip (it was option 1 again), the "Current team" list (the garage is the team), the builder, assets, and rules view switch and the `view` URL parameter (an old link's `view` is dropped), the boxed cost, left, and value tiles in each card, the "Open full board" step, and three of the four not-the-official-game lines. The route stopped reading its `PROJECT_PRESS` row.

## Pinned, and kept

`data-testid="fantasy-formula-1-lineup"` is now the garage, and `e2e/all-projects.spec.ts` still adds an asset, finds "Remove X" in it across two tabs and a reload, and removes it. The "Add X", "Remove X", "Lock X", and "Unlock X" labels, Reset, the empty-slate message, the phone row's details (Type, Standing, Value, Form, Risk, and one Add per row), `sort` and `focus` in the URL, and the storage behaviour all stay. In `fantasy-formula-1-client.test.tsx` the readout test now checks "0 of 7 picked" and that the disclaimer prints once in the garage, and the suggestion test now uses the lineup cards. `fantasy-formula-1-state.test.ts` drops the view parameter.

## Verified state, 2026-10-12

Against a production build served on 3760 in Chromium. `scripts/contrastSweep.mjs` found no failures in either theme, including a sorted and filtered slate. `scripts/layoutSweep.mjs` found 0 fails; the reviews are the empty driver slots' 2, 2, 1 rows on a phone, which is the intended half-row open slot.

The first slate row sits at y831 at 1440x900 (first Add at y841) and y1166 at 390x844 (first Add at y1193), against y2864 and y3259 for the first Add before, and the garage itself is at y380 and y557. The keyboard order from the page top runs header, Reset, the three Use buttons, the sort and filter buttons, the table, and the first Add. Space on Use option 1 filled all seven slots, and Enter on the first Add put one pick in the garage. A Chromium print came out with the garage, the cards, and the slate. I did not check Safari's and Firefox's engines, touch devices, or a screen reader.
