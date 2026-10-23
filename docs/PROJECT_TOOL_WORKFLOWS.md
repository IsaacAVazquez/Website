# Project tool workflows

I added these workflows on October 22, 2026. The tools keep their existing routes and designs. Personal records stay in the visitor's browser, and downloads start only when the visitor chooses them.

| Project | Workflow | Storage |
| --- | --- | --- |
| Interchange IQ | Compare online checkout or card-present payments, with assumed custom contracts excluded initially | Inputs stay in the current page |
| Decision Lab | Save up to 20 named bets, load and update them, compare scores, and inspect the nearest single-input verdict changes | `decision-lab-bets-v1` |
| Recipe Finder | Save recipes, plan dated meals, and download a shopping list for seven selected calendar dates | `recipe-finder-plan-v1`, plus the existing pantry key |
| Travel Planner | Enter planned activity costs, compare the priced subtotal with the trip budget, and download a calendar | Existing `travel_planner_trips_v1` records, with optional activity cost |
| Bay Area Transit | Save up to 20 stations, store commute endpoints, and filter the selected station's board by reported direction | `bay-area-transit-commute-v1` |
| Enablement Assistant | Create and edit up to 50 team records, record question counts and adoption, and track each team's onboarding checklist | `enablement-teams-v1` |

The new stores use the shared browser storage adapter through `useBrowserRecord`. They validate restored records, read the latest saved value before editing, and display a notice when writes can only be kept in memory. Open bet and team forms retain their loaded baseline, so independent edits in another tab survive a save and a deleted record stays deleted. Onboarding progress resets when the team's intake changes. A stale checklist cannot complete a replacement plan.

## Changes on October 23, 2026

I added five more workflows to the existing tools.

| Project | Workflow | Storage |
| --- | --- | --- |
| Budget Planner | Copy the previous plan into an empty month, carry selected unused balances, and record recurring monthly bills | Existing `budget_planner_months_v1`, with optional category carry amounts and recurring bill records |
| Wine Cellar | Keep owned bottles and a wishlist, adjust quantities, and open a bottle through the tasting form | `wine_cellar_inventory_v1`, alongside the existing tasting journal |
| News Pulse | Inspect outlet pickup and observed title changes, then filter changes since the previous visit | Public `news-pulse/history` durable cache; personal `news-pulse-last-visit-v1` stays in the browser |
| Museum Log | Find selected exhibitions during trip dates and add a museum stop to a saved itinerary | Existing Travel Planner records |
| GitHub Trending Pulse | Save up to 50 repositories and compare up to four | `github-trending-shortlist-v1` |

Budget copying preserves the previous month's plan and starts with an empty expense ledger. A category carries its positive unused balance only when selected, and the copied amount stays fixed if the earlier month is edited later. Monthly allocations and carried balances stay separate. Recurring bills count as spending only after the visitor chooses to record them. The same saved bill is recorded once per month, and a day beyond the month's end uses the last calendar day.

Wine inventory stays separate from earlier tastings. Opening a bottle fills the tasting form, and saving it writes the tasting and reduces the latest saved quantity by one. A depleted or removed inventory record cannot create another opening. Editing or deleting an earlier tasting does not change the current shelf quantity.

News history keeps at most 600 article observations, eight title revisions per article, and records seen within seven days. The identity is the outlet and article URL. It records successful feed responses, with no new observations for failed feeds or stale fallback headlines. Repeated provider links are deduplicated before display. Times describe when the site observed a title. They do not establish when a newsroom first published a story. Related titles are grouped by the existing similarity rule. The archive uses the existing fail-soft durable cache and remains in memory when that cache is unavailable. Refreshes happen on page requests, so this is an observed history with gaps between requests. The previous-visit comparison is local to each browser.

I checked seven selected exhibitions across the Met, MoMA, the Whitney, SFMOMA, and the de Young on October 23, 2026. Each new listing has its museum source and check date in `src/data/museumExhibitions.ts`, and the detail page links to that source. The calendar is a selection. A missing match does not establish that a museum has no exhibitions. Adding a museum to a trip preserves its other stops and leaves the cost unpriced until the visitor confirms the ticket price.

Repository comparisons use the published snapshot, including its measured, partial, and new-baseline growth labels. A saved ID remains saved if it drops out of the snapshot, with a message and a removal control. The comparison reports the snapshot's last push and listed license.

## Payment assumptions

I checked the US pricing pages for [Stripe](https://stripe.com/pricing), [Square](https://squareup.com/us/en/payments/our-fees), [Shopify](https://www.shopify.com/pricing), and [PayPal](https://www.paypal.com/us/business/paypal-business-fees) on October 22, 2026. Each flat-rate row links to its source. Square uses the Free plan's checkout and card-present rates. Shopify uses Basic's standard card rates and includes its $29 monthly equivalent when billed annually. PayPal compares Checkout online with Point of Sale card-present payments.

The interchange-plus markups are illustrative assumptions, and the card mix uses the existing representative interchange estimates. Enabling those estimates changes the comparison's wording to say that the result depends on those assumptions. The interchange estimates are not split by payment channel, so the assumed contracts and the Stripe breakeven are priced for online checkout only, and the page says so when card present is selected. The tool excludes network and assessment fees from interchange-plus totals and excludes hardware, optional add-ons, international cards, and refunds from the published-rate comparison.

## Limits of the outputs

Decision Lab reports the thresholds in its own rubric. Its scores and verdicts depend on the visitor's estimates and have no probability calibration. Enablement recommendations use fit scores out of 100 in both the page and the copied support request. The example program stays separate from saved team records.

The shopping list combines ingredient names and lists the quantities for each meal. It does not add quantities written in different units. Planning the same recipe twice includes its ingredients twice.

An unpriced travel stop stays unknown, while a zero cost means free. The spending summary is the subtotal of priced stops. Calendar events use floating local times, so the visitor must choose the destination time zone when importing. Untimed stops are all-day events with an exclusive next-day end. Calendar text escapes reserved characters and folds lines by UTF-8 bytes.

The commute view filters BART's reported North or South direction at the selected station. It does not calculate connections or assert that a train reaches the saved destination. It keeps endpoint advisories and unscoped system advisories. Elevator notices lack structured station identifiers, so all notices remain visible. Bus connections still need a 511 key.

## Verification

Pure helpers cover restored records, calendar boundaries and escaping, shopping-list grouping, verdict thresholds, direction filters, and concurrent edits. Component tests cover saved bet and team flows and storage failures. The project checks are `npm test -- --runInBand`, `npm run lint`, `npm run typecheck`, and `npm run build`, with Node 22. Browser verification exercises the new controls and saved state and checks phone and desktop rendering in both themes.

On October 22, 2026, all 502 Jest suites and 4,909 tests passed. Lint, standalone TypeScript, and the Node 22 production build passed. The responsive sweep reported zero failures across these six routes at widths from 320 to 2560 pixels. Populated workflows also passed overflow and landmark checks at 320 and 1440 pixels in both themes.

Chromium checks covered saving and reloading bets, recipes, meals, trips, station preferences, and onboarding progress, and downloading an itinerary calendar. The browser showed no application errors and retained framework CSS preload warnings. Firefox and WebKit were not part of this pass.

On October 23, 2026, the full Jest run passed 508 suites. The two suites whose localhost servers and child processes were blocked by the sandbox passed when rerun with the required access. The final project checks passed 29 focused suites and 179 tests, with later focused checks covering the final changes. Lint, standalone TypeScript, and the Node 22 production build passed.

Chromium checks passed for all five routes at phone width in both themes, for hydration in Los Angeles and Tokyo, and for layout at 390, 1440, and 1920 pixels. The 24 route checks passed across the initial run and focused reruns. Browser interactions also covered copying a budget, recording bills, opening and restoring a stocked wine, viewing news observation times, restoring repository comparisons, and adding a museum through Museum Log into Travel Planner. A phone wrapping issue, repeated provider links, and an exhibition toggle hydration warning found during this pass were corrected.
