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

The calculator is a grid with three areas. On desktop the left column holds the headline inputs (region, departure date, quoted fare for the whole party, travelers) and, under them, two open `details` disclosures, Budget (nights, total budget) and Cash or points (cash price, taxes and fees, points required, with the method sentence and the not-saved note). The right column is the fare check. On a phone the order is the headline inputs, the fare check, then the disclosures, and the DOM follows that order, so the keyboard path matches the phone's reading order. The disclosures open by default because `e2e/project-workflows.spec.ts` fills Nights.

The fare check is the one box on the page, a single hairline frame, since the result is the object. It holds the verdict (the per-seat fare large in mono, the typical fare, the rating chip, the party's saving, and the rating's sentence, or a prompt naming the region before a fare is entered), the gauge and booking strip SVG with no border of its own, then three ruled rows with the label in the margin: Booking window (the headline and message), Budget split (the five-row table and one line with the budget, days, and travelers), and Points value (cents per point against the 1.4 cent baseline with its chip and message). The curated, unverified disclosure prints once, word for word, at the foot of the fare check.

The playbook and the toolkit are one section, "How I find a better fare", with the applied count, the tactics as a ruled numbered list (title, body, category and impact, and the Mark applied toggle), six shown and the rest behind Show all, and then "Where I actually search" as a three-column list of links with what each is best for, and the no-affiliate line.

The gauge's prompts read "Add a quoted fare to place it on the gauge" and "Add a departure date to place today on the strip", since the inputs are no longer below it, and its classes are `td-fare-*`.

## Cut, and not to be restored

The hero sheet and poster h1, the plate around the trip form and gauge, the three readouts (fare per seat, booking window, points value, each repeated by the check), the torn and deckled seams, the separate booking and budget band, the separate cash or points band with its stat block, the category filter (each tactic names its category), the tactic cards in a column grid, the boxed tool rows, the Sparkles storage note in the plate, and the second storage mention.

## Pinned, and kept

`src/app/travel-deals/__tests__/travel-deal-lab-client.test.tsx` covers the labels "Travelers", "Departure date", "Nights", and "Quoted fare, whole party (USD)", the clamp note, the storage round trip and the cross-tab merge, "Your trip, fare, and budget are saved in this browser.", "$300" for a 600 quote and two travelers, the bounded saved fare, and six Mark applied buttons with Show all and Show fewer. The first-visit and return-visit tests changed from the cut readout's "Add a fare below" to the verdict's prompt in the same commit. `e2e/project-workflows.spec.ts` (Departure date, Nights, no NaN or Infinity) holds unchanged, as do `data-testid="travel-deals-shell"`, now on the calculator grid, the 1.4 cent baseline, and the dated estimate note.

## Verified state, 2026-10-12

Filled in after the production pass, below.
