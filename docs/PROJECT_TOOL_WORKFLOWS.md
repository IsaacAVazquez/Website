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
| News Pulse | See which outlets ran a story and how its headlines changed, then filter to the changes since the previous visit | Public `news-pulse/history` durable cache; personal `news-pulse-last-visit-v1` stays in the browser |
| Museum Log | Find the listed exhibitions open during a trip and add a museum stop to a saved itinerary | Existing Travel Planner records |
| GitHub Trending Pulse | Save up to 50 repositories and compare up to four | `github-trending-shortlist-v1` |

Budget copying preserves the previous month's plan and starts with an empty expense ledger. A category carries its positive unused balance only when selected, and the copied amount stays fixed if the earlier month is edited later. Monthly allocations and carried balances stay separate. Recurring bills count as spending only after the visitor chooses to record them. The same saved bill is recorded once per month, and a day beyond the month's end uses the last calendar day.

Wine inventory stays separate from earlier tastings. Opening a bottle fills the tasting form, and saving it writes the tasting and reduces the latest saved quantity by one. A depleted or removed inventory record cannot create another opening. Editing or deleting an earlier tasting does not change the current shelf quantity.

News history keeps at most 600 article observations from the last seven days, with up to eight headline revisions for each one, and it identifies an article by its outlet and URL. It only records feeds that answered successfully, so a failed feed or a stale fallback headline never adds an observation, and repeated provider links are removed before anything is shown. The feeds are only checked when someone requests the page, which means this is a history of what the site saw with gaps between visits, and the times show when the site saw a headline, which can be later than when the newsroom published it. Related headlines are grouped by the same title similarity rule the front page uses. The archive lives in the existing fail-soft durable cache and falls back to memory when that cache is unavailable, and the comparison with the previous visit stays local to each browser.

The trip search reads the exhibition calendar that was read again on October 22, 2026 in `src/data/museumSnapshot.ts`, where each date cites the museum page it came from. On October 23, 2026 I added two shows that pass did not list, MoMA's The Surrealist Book and SFMOMA's New Work: Raven Chacon, in `src/data/museumExhibitions.ts` with their source pages and check date, and the detail page links to those sources. Five other shows I had read the same day were already in the October 22 calendar, so I left them out to keep any show from being listed twice, and a test now fails if a museum lists the same title twice. The calendar is hand-picked, so a museum with no match may still have a show on. Adding a museum to a trip keeps the trip's other stops and leaves the cost unpriced until the visitor confirms the ticket price.

Repository comparisons use the published snapshot, including its measured, partial, and new-baseline growth labels. A saved repository stays saved if it drops out of the snapshot, and the shortlist says so and has a control to remove it. The comparison reports the snapshot's last push and listed license.

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

On October 23, 2026, the full Jest run passed 508 suites. The two suites whose localhost servers and child processes were blocked by the sandbox passed when rerun with the required access. The final project checks passed 29 focused suites and 179 tests. The last changes after that were checked only with their own focused suites, not with another full run. Lint, standalone TypeScript, and the Node 22 production build passed.

Chromium checks passed for all five routes at phone width in both themes, for hydration in Los Angeles and Tokyo, and for layout at 390, 1440, and 1920 pixels. The 24 route checks passed across the initial run and focused reruns. Browser interactions also covered copying a budget, recording bills, opening and restoring a stocked wine, viewing news observation times, restoring repository comparisons, and adding a museum through Museum Log into Travel Planner. A phone wrapping issue, repeated provider links, and an exhibition toggle hydration warning found during this pass were corrected.
