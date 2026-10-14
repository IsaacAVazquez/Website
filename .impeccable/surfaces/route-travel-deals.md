---
version: 1
slug: "route-travel-deals"
primary_target: "route:/travel-deals"
related_targets: ["src/app/travel-deals/travel-deal-lab-client.tsx","src/app/travel-deals/travel-deals.css","src/app/travel-deals/FareGaugeSignature.tsx","src/app/travel-deals/fareGauge.ts","src/lib/travelDeals.ts","src/data/travelDealsSnapshot.ts"]
---

# Travel Deal Lab surface brief

Written on 2026-10-12 by the stage 2 project sovereign pass (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Calculator, group G7).

Scope. The `/travel-deals` route, rendered by `src/app/travel-deals/travel-deal-lab-client.tsx` with its own stylesheet `travel-deals.css`. The trip lives in `localStorage` under `travel-deals:v1` through the route's own decoder, which this redesign did not touch. The fare bands, booking windows, tactics, and tools are the curated snapshot in `src/data/travelDealsSnapshot.ts` (`TRAVEL_DEALS_VERIFIED = false`, as of `TRAVEL_DEALS_AS_OF`).

Visitor mode. Operate. The visitor has a fare in hand and wants to know if it is any good and when to book.

Genre. A one-page calculator, with the NYT rent-or-buy calculator and Google Flights' price insight panel as the references. The inputs sit on the left and one fare check on the right, stacked on a phone with the four headline inputs first and the check right under them.

## Decisions

The route paints its own paper. `.td-root` declares `--td-paper`, `--td-field`, `--td-ink`, `--td-ink-2`, `--td-orange`, `--td-rule`, and `--td-rule-strong`, with a light story (ticket-stock white `#f6f5f1`, navy ink `#172033`, departure-board orange `#a83a0b`) and a dark one under `.dark .td-root` (`#11151d`, `#ff9b6a`). It redeclares the `--c97-*` tokens the borrowed field, button, chip, table, and kicker classes read, plus `--c97-overprint`, which the booking strip's sweet-spot band paints, so the band and the focus ring are the route's orange. Archivo throughout with an 800 h1, and Fragment Mono for every figure. No added typeface.

The calculator is a grid with three areas. On desktop the left column holds the headline inputs (region, departure date, quoted fare for the whole party, travelers) and, under them, two open `details` disclosures, Budget (nights, total budget) and Cash or points (cash price, taxes and fees, points required, with the method sentence and the not-saved note). The right column is the fare check. On a phone the order is the headline inputs, the fare check, then the disclosures, and the DOM follows that order, so the keyboard path matches the phone's reading order. The disclosures open by default because `e2e/project-workflows.spec.ts` fills Nights. Each summary stays a list item with a 44px line, so it keeps the browser's own open and closed marker and reads as something that collapses.

Every number field commits a whole number, which is what the saved trip keeps. The text stays as typed until the field is left, and the note under it gives the reason the number changed, the range ("This runs from 1 to 12, so I'm using 12.") or the rounding ("This takes whole numbers, so I'm using 412."). A field's step (25 on the fare, 100 on the budget) only sets how far the arrows move, so a number between steps keeps the rule's own colour, where the site's invalid style had painted it in the error colour.

The fare check is the one box on the page, a single hairline frame, since the result is the object. It holds the verdict (the per-seat fare large in mono, the typical fare, the rating chip, the party's saving, and the rating's sentence, or a prompt naming the region before a fare is entered), the gauge and booking strip SVG with no border of its own, then three ruled rows with the label in the margin, which are Booking window (the headline and message), Budget split (the five-row table and one line with the budget, days, and travelers), and Points value (cents per point against the 1.4 cent baseline with its chip and message). The curated, unverified disclosure prints once, word for word, at the foot of the fare check. The fare is rated once, for the whole party, and the gauge takes that rating as a prop, so the chip and the gauge's label cannot name two. The savings line names the party only with two or more travelers. The rating compares the quote with the typical price, so the Good sentence reads "below the typical price", since a fare 10% under it still sits inside the band the gauge draws. The prompt before a fare is entered says the same thing, "score it against the typical price". Before a departure date is entered the Booking window row asks for one, in the server HTML as well. The Budget split table stays inside its column on a phone. Under 360px its cells give up padding (it measured 238px in a 218px column at 320px before), and at any width the note column breaks inside a word before the table leaves the column.

The playbook and the toolkit are one section, "How I find a better fare", with the applied count, the tactics as a ruled list (title, body, category and impact, and the Mark applied toggle), six shown and the rest behind Show all, and then "Where I actually search" as a three-column list of links with what each is best for, and the no-affiliate line.

The gauge's prompts read "Add a quoted fare to place it on the gauge" and "Add a departure date to place today on the strip", since the inputs are no longer below it, and its classes are `td-fare-*`.

## Cut, and not to be restored

The hero sheet and poster h1, the plate around the trip form and gauge, the three readouts (fare per seat, booking window, points value, each repeated by the check), the torn and deckled seams, the separate booking and budget band, the separate cash or points band with its stat block, the category filter (each tactic names its category), the tactic cards in a column grid, the boxed tool rows, the Sparkles storage note in the plate, and the second storage mention.

## Pinned, and kept

`src/app/travel-deals/__tests__/travel-deal-lab-client.test.tsx` covers the labels "Travelers", "Departure date", "Nights", and "Quoted fare, whole party (USD)", the clamp note, the storage round trip and the cross-tab merge, "Your trip, fare, and budget are saved in this browser.", "$300" for a 600 quote and two travelers, the bounded saved fare, and six Mark applied buttons with Show all and Show fewer. The first-visit and return-visit tests changed from the cut readout's "Add a fare below" to the verdict's prompt in the same commit. `e2e/project-workflows.spec.ts` (Departure date, Nights, no NaN or Infinity) holds unchanged, as do `data-testid="travel-deals-shell"`, now on the calculator grid, the 1.4 cent baseline, and the dated estimate note.

Added on 2026-10-12 after the stage 2 review. The client test pins a fare typed with cents staying as typed and saving as whole dollars with the rounding note, one rating on the chip and the gauge for a quote that splits them (US regional, three travelers, 400), and the savings line with one traveler and with two. `travel-deals-css.test.ts` pins the summaries carrying no `display` and the search links' title selector. `fareGauge.test.ts` lost its rating test with the field. `src/lib/__tests__/travelDeals.test.ts` pins the missing-departure headline with today unknown and the Good sentence's wording.

## Verified state, 2026-10-12

First field and the result, page coordinates including the header. The region select sits at y375 at 1440x900 and y435 at 390x844, against y593 and y556 before, and the fare check starts at y347 at 1440 (beside the inputs) and y798 at 390, where the gauge used to start at y758 and y984 and the budget table at y1841 and y1921. The page is 4072px tall at 1440, against 7848 before.

Checked against a production build (`next build --webpack`, served with `next start` on 3810) in Chromium. `scripts/contrastSweep.mjs` reported no failures in either theme, and its `measurePage` run on the seeded states (a saved collection, an opened detail, a filtered view, with every disclosure opened) found none in either theme either. `scripts/layoutSweep.mjs` reported 0 fails across the five G7 routes (the one orphan-row review is the calculator grid at 1024, where the inputs and the disclosures share the left column beside the fare check, which is intended). The route's e2e specs passed against both the dev server and the production build. A scripted keyboard walk from the page top reached the region, date, fare, and travelers fields, then the disclosures and their fields; typing a fare updated the verdict, and Space on Mark applied toggled it. Under `prefers-reduced-motion` the shared button transition collapsed to 1e-05s. A Chromium print with `page.pdf()` kept the gauge and each result row whole (`break-inside: avoid`), which leaves a gap at the foot of the first page when the gauge moves to the second. I did not check Safari's and Firefox's engines, touch devices, or a screen reader.

Changed on 2026-10-12 after these checks and not seen in a browser since. The disclosure markers and the top margin over "Where I actually search" are read from the cascade and not measured.

Added later on 2026-10-12, after the browser pass, and not seen in a browser yet. `travel-deals-css.test.ts` pins the rule that keeps an off-step number field's colour and the Budget split table's two phone rules, and the client test's first-visit prompt reads "typical price". The table's fit at 320px is arithmetic from the measured 238px and the 8px and 12px spacing steps (198px at the default budget and 214px at $1,000,000, in 218px). I did not check what a screen reader says about an off-step field, which the browser still counts as invalid.
