# Project tool workflows

The six following and research workflows added on October 25, 2026 are documented in [Project following workflows](PROJECT_FOLLOWING_WORKFLOWS.md).

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

## Frontier workload comparisons on October 24, 2026

I added a workload calculator to Frontier Model Tracker. A visitor enters monthly requests and input and output tokens per request, selects up to four models, and compares their monthly text-token costs. The table shows the monthly total beside the model, followed by the input and output costs and the capability checks. Vision, audio, and reasoning requirements are optional, and the calculator also checks input plus output against the context window and output against its published limit. Missing prices and unpublished limits remain unknown.

The visitor can save up to 20 named comparisons under `frontier-workload-comparisons-v1`. Each record keeps the inputs, model identifiers, save time, and dataset build time. Loading recalculates against the displayed dataset. A model removed from that dataset remains visible as unavailable. The shared browser adapter preserves other tabs' saved records and reports when writes can only remain in memory.

The estimate uses the dataset's dated text-token prices and keeps the page's existing review disclosure. It excludes image and audio charges, tools, caching, batch discounts, usage tiers, taxes, and retries. Entered output includes billed reasoning tokens. Listed modalities describe the catalog's capabilities, so the provider documentation is still needed to confirm a particular input or output format.

The Node 22 full Jest run covered 522 suites and 4,968 tests. Its only failure was the new saved-date formatter missing the required annotation for using the visitor's calendar after hydration. After that was corrected, all 11 focused suites and 78 tests passed, including the date and sitemap checks. Lint, standalone TypeScript, and the production build passed. A deliberately broken missing-price check failed two regression tests, and the original implementation was restored and checked again.

Chromium verified saving and reloading comparisons, capability checks, invalid inputs, the four-model limit, and keyboard navigation. The populated page kept one page heading, one main landmark, and no page-wide overflow at 320, 768, 1024, and 1440 pixels in both themes. The production browser pass reported no application errors, and the contrast sweep found no failures in either theme. The browser retained two framework CSS preload warnings. Firefox and WebKit were not part of this pass.

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


## Additional comparisons and personal views on October 23, 2026

I added these workflows to six existing routes.

| Project | Workflow | Browser storage |
| --- | --- | --- |
| Rent versus buy | Save up to 20 named scenarios, load their inputs, compare up to four, and vary mortgage rate, appreciation, and holding period independently | `rent-vs-buy-scenarios-v1` |
| Food Map | Save restaurants, mark visits, keep notes, filter personal collections, and add dated restaurant stops to existing trips | `food-map-records-v1`, plus Travel Planner records |
| Travel Deal Lab | Save up to 30 flight options with route, dates, people, stops, base fare, fees, baggage, and points | `travel-flight-quotes-v1` |
| Fantasy Formula 1 | Enter race-specific game prices, save up to 30 complete lineups per season, and record actual point totals | `fantasy-formula-1-prices-v1-<season>-<round>`, `fantasy-formula-1-results-v1-<season>` |
| NBA and NFL | Save up to 10 favorite teams, show their published schedules, download calendars, and compare up to eight observed standings snapshots | `<league>-favorite-teams-v1`, `<league>-observed-standings-v1` |

The stores use the shared browser adapter and validate restored records. Edits read the latest save. The trip loader now also reads the latest browser value before an edit, so a restaurant addition preserves trip edits made in another tab before its storage event arrives. Failed storage writes stay in memory and show a notice.

Rent scenarios keep every entered input and recalculate through the existing engine. Each compared result uses its own holding period and assumptions. The sensitivity table varies one input at a time, respects the input bounds, and assigns no probabilities.

Restaurant stops have no price until the visitor enters one in Travel Planner. The same restaurant is added once per trip date. I checked four official sources on October 23, 2026, covering [Franklin Barbecue’s location and hours](https://franklinbbq.com/home), [Di Fara’s listed locations](https://www.difarapizzany.com/restaurants), [Staplehouse’s counter service](https://www.staplehouse.com/staplehouseabout), and [Noma’s published Copenhagen season](https://noma.dk/da/reservation/). Each checked listing shows its source, date, and the facts covered. The checks do not validate curator attributions, approximate map pins, or the rest of the catalog. The catalog keeps its earlier review date and unverified flag.

Flight quotes are entered by the visitor. Amounts cover the entire party and itinerary. Cash outlay includes the base fare for a cash booking, plus fees and baggage; for a points booking it includes fees and baggage. The comparison cost adds the visitor’s chosen value of the points. The starting 1.4 cents per point remains an estimate. Quotes can have different routes, dates, and party sizes, so the tool shows those details and does not rank them as equivalent offers.

Formula 1 entered prices replace model prices in the builder and optimizer for the upcoming round. Blank prices keep their model values, and each price has a source label. The planning budget stays at $100m. A recorded lineup keeps its seven picks, prices, source timestamp, save timestamp, and point estimates. An unknown actual result stays separate from zero. The estimates still use the existing model, which does not implement official game scoring, so a recorded difference does not establish prediction accuracy.

Team schedules come from the existing per-team snapshot APIs. Calendar files use UTC start times and stable game identifiers, omit unconfirmed dates and postponed or cancelled games, and share the Travel Planner’s text escaping and line folding. Downloads contain the published upcoming schedule, and a changed schedule needs another download. Standings history contains snapshots seen in that browser, with source timestamps, and compares conference rank and records within the same season. Differences can include provider corrections.

The full Jest run passed 520 suites and 4,946 tests. Lint, standalone TypeScript, and the Node 22 production build passed. Moving the rent comparison below the calculator was then checked with the five rent suites and another production build. Chromium passed 64 browser checks in light and dark mode, including saved scenario reloads, restaurant notes and trip additions, cash and points quote restoration, recorded Formula 1 results, restored favorite teams, and NBA and NFL calendar downloads. Populated phone views passed at 390 pixels, and all six routes passed overflow checks at 320, 768, 1440, and 1920 pixels. The browser reported no application errors. The 320 pixel pass found long team buttons extending the page; the final stylesheet wraps those buttons and contains the list grid. Firefox and WebKit were not part of this pass.
