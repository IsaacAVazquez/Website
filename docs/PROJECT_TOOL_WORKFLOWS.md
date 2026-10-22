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

## Payment assumptions

I checked the US pricing pages for [Stripe](https://stripe.com/pricing), [Square](https://squareup.com/us/en/payments/our-fees), [Shopify](https://www.shopify.com/pricing), and [PayPal](https://www.paypal.com/us/business/paypal-business-fees) on October 22, 2026. Each flat-rate row links to its source. Square uses the Free plan's checkout and card-present rates. Shopify uses Basic's standard card rates and includes its $29 monthly equivalent when billed annually. PayPal compares Checkout online with Point of Sale card-present payments.

The interchange-plus markups are illustrative assumptions, and the card mix uses the existing representative interchange estimates. Enabling those estimates changes the comparison's wording to say that the result depends on those assumptions. The tool excludes network and assessment fees from interchange-plus totals and excludes hardware, optional add-ons, international cards, and refunds from the published-rate comparison.

## Limits of the outputs

Decision Lab reports the thresholds in its own rubric. Its scores and verdicts depend on the visitor's estimates and have no probability calibration. Enablement recommendations use fit scores out of 100 in both the page and the copied support request. The example program stays separate from saved team records.

The shopping list combines ingredient names and lists the quantities for each meal. It does not add quantities written in different units. Planning the same recipe twice includes its ingredients twice.

An unpriced travel stop stays unknown, while a zero cost means free. The spending summary is the subtotal of priced stops. Calendar events use floating local times, so the visitor must choose the destination time zone when importing. Untimed stops are all-day events with an exclusive next-day end. Calendar text escapes reserved characters and folds lines by UTF-8 bytes.

The commute view filters BART's reported North or South direction at the selected station. It does not calculate connections or assert that a train reaches the saved destination. It keeps endpoint advisories and unscoped system advisories. Elevator notices lack structured station identifiers, so all notices remain visible. Bus connections still need a 511 key.

## Verification

Pure helpers cover restored records, calendar boundaries and escaping, shopping-list grouping, verdict thresholds, direction filters, and concurrent edits. Component tests cover saved bet and team flows and storage failures. The project checks are `npm test -- --runInBand`, `npm run lint`, `npm run typecheck`, and `npm run build`, with Node 22. Browser verification exercises the new controls and saved state and checks phone and desktop rendering in both themes.

On October 22, 2026, all 502 Jest suites and 4,909 tests passed. Lint, standalone TypeScript, and the Node 22 production build passed. The responsive sweep reported zero failures across these six routes at widths from 320 to 2560 pixels. Populated workflows also passed overflow and landmark checks at 320 and 1440 pixels in both themes.

Chromium checks covered saving and reloading bets, recipes, meals, trips, station preferences, and onboarding progress, and downloading an itinerary calendar. The browser showed no application errors and retained framework CSS preload warnings. Firefox and WebKit were not part of this pass. The independent code review has no remaining required findings.
