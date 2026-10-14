# Project audit, October 12, 2026

I checked 37 project surfaces across 46 tool routes against the current source and committed data. Every route rendered at 360 and 1440 pixels wide with one page heading, one main landmark, and no page-wide horizontal overflow. I found ten further P2 issues. These include existing problems outside PR #595.

The shared match ledger date fix and MLB wild card explanation are correct. The soccer club drawers have a separate fixture renderer that still needs dates.

## Verified issues

### P2. Compare the same payment channel in Interchange IQ

The model ranks Square's in-person rate against Stripe and other online rates, then declares one processor the winner. With $1,000 monthly volume and a $5 average transaction, the real calculation returns Square at $46 and Stripe at $89. Applying the model's stated Square online rate also gives $89. The headline comparison changes because it compares different payment channels. Add a channel choice and compare rates for that channel. Square's [fee page](https://squareup.com/us/en/payments/our-fees) separates in-person, online, and API payments.

The rate definitions are in [interchangeIq.ts](/Users/isaacvazquez/Website/src/lib/interchangeIq.ts:26), and the winner is selected in [interchange-iq-client.tsx](/Users/isaacvazquez/Website/src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx:111). The numerical example uses the model's saved rates.

### P2. Keep expense dates within their budget month

While September is selected, the expense form accepts an October 1 date. The expense is saved in September's record, and its $100 amount changes September's balance and export. October has no corresponding entry. Validate the date against the selected month when adding or editing an expense, and define how an expense should move between months.

The date input has no month bounds in [budget-planner-client.tsx](/Users/isaacvazquez/Website/src/app/fintech-tools/budget-planner/budget-planner-client.tsx:510). The submission passes the entered date through at line 254, and [useBudgetPlanner.ts](/Users/isaacvazquez/Website/src/hooks/useBudgetPlanner.ts:153) writes it into the active month. A synthetic September record containing an October expense returned a September spent total of $100 from the real summary function.

### P2. Use the visitor's calendar for budget defaults

The default budget month and expense date use Los Angeles time. At October 1, 2026, 00:30 in New York, the helpers return September and September 30. The budget page describes an expense date as the visitor's own date and displays it in that visitor's zone. Read the local calendar after the page mounts, with a stable initial server render, as the Travel Planner already does.

The fixed zone is set in [budgetPlanner.ts](/Users/isaacvazquez/Website/src/lib/budgetPlanner.ts:39). The real helpers reproduced the September defaults for the instant `2026-10-01T04:30:00Z`.

### P2. Preserve candidate removals during a save conflict

If sourcing changes the candidate file while a user promotes or removes a candidate, the server rejects the stale save. The retry combines the server list with the edited list. Because the server still has the removed candidate, that combination restores it and writes it back. Replay the user's removal against the latest revision, or track removals explicitly.

The retry is in [useMBAApplications.ts](/Users/isaacvazquez/Website/src/hooks/useMBAApplications.ts:477). Passing one synthetic server candidate and an empty edited list to the real merge helper returned one candidate. This affects the development-only candidate workflow.

### P2. Reject impossible imported application dates

An imported follow-up date of February 30, 2026 passes validation and keeps that string. JavaScript interprets it as March 2. The application card compares the February string when deciding whether it is due, while the attention calculation compares the normalized March date. Those views can disagree on March 1. Require the parsed date to round-trip to the original calendar date.

The validator is in [mba-applications.ts](/Users/isaacvazquez/Website/src/lib/mba-applications.ts:126). A synthetic application passed through the real import function with `2026-02-30` intact.

### P2. Preserve the actual interval in weekly star gains

GitHub Trending Pulse and Agent Build Index can label an eight-day gain as seven-day measured growth. If the October 5 observation is missing, a seven-day query on October 12 accepts the October 4 baseline. The real helper returned 100 weekly stars with measured status for a rise from 100 stars on October 4 to 200 on October 12. This changes the comparison interval after a missed observation. Require the target date for a seven-day measured label, or display the actual interval.

The baseline selection is in [githubTrending.ts](/Users/isaacvazquez/Website/src/lib/githubTrending.ts:125). The committed October 12 snapshot has exact baselines, so the issue appears when an observation is missing.

### P2. Count calendar days for the election label

The Polling Aggregator rounds the elapsed time to November 3 at UTC midnight. At November 2, 2026, 08:00 Pacific, it reports election day. At November 3, 08:00 Pacific, it treats the target as past and drops that label. Compare calendar dates in the intended US display zone.

The calculation is in [polling-aggregator-client.tsx](/Users/isaacvazquez/Website/src/app/polling-aggregator/polling-aggregator-client.tsx:500). Direct evaluation returned zero and minus one for those two instants.

### P2. Add calendar dates to soccer club drawers

Premier League and La Liga club drawers print scores without dates, and upcoming fixtures with only a weekday and time. Arsenal's drawer shows Nottingham as Sunday at 11:30 EDT and Liverpool as Sunday at 11:30 EST, but the underlying dates are October 18 and November 1. The main ledger fix does not reach this separate row component. Include the date for every drawer fixture.

The row is in [ClubDrawer.tsx](/Users/isaacvazquez/Website/src/components/football/ClubDrawer.tsx:64). I verified the loaded Arsenal drawer in the browser and compared it with the committed team fixtures.

### P2. Calculate NBA games back from wins and losses

The NBA team explanation subtracts wins and calls the result games back. That is correct only when the teams have played the same number of games. A 30-20 team behind a 31-18 sixth seed is 1.5 games back, while the real explanation function prints one game back. Use the same record-based calculation the seed ladder uses. The completed season's equal game counts hide this error; it affects the live season when schedules differ.

The calculation is in [nba-client.tsx](/Users/isaacvazquez/Website/src/app/nba/nba-client.tsx:577). I executed that function with the two synthetic records above.

### P2. Distinguish a typical fare from its band

Travel Deal Lab calls a fare 10% below the typical price below the typical band. For Western Europe, the typical price is $780 and the band is $450 to $1,500. A $702 quote earns that message while remaining inside the band shown on the gauge. Describe the comparison as below the typical price, or base the band claim on the lower bound.

The message is in [travelDeals.ts](/Users/isaacvazquez/Website/src/lib/travelDeals.ts:214). The real scoring function reproduced the contradictory message for $702.

## Other observations

The committed investment data has 151 price histories dated October 1, 2026, which the current health helper correctly classifies as delayed on October 12. The browser disclosure prints 151 delayed histories. The data refresh needs attention, and the page is disclosing the delay correctly.

The Enablement Assistant displays its additive recommendation score as percent confidence. I would call it a fit score out of 100, since the calculation has no probability calibration. This is a wording recommendation for the disclosed simulation.

Interchange IQ also includes assumed custom contract prices in its cheapest-plan verdict. I would mark those comparisons as conditional on getting that contract. Stripe's [pricing page](https://stripe.com/pricing) describes custom packages for large volume or particular business models; the code's typical volume figure does not establish a hard eligibility cutoff.

## Coverage and checks

The browser pass checked initial rendering, page headings, main landmarks, and horizontal overflow at phone and desktop widths. The code pass checked date handling, metric labels and units, calculation inputs, saved state, and source disclosures. The candidate and invalid-date reproductions used synthetic records. This pass did not exercise every control or verify every live provider fact.

The existing verification for the current fixes passed 439 Jest suites with 4,163 tests, lint, typecheck, and the Node 22 production build. Supporting audit suites passed as well. The additional findings above have direct code or calculation evidence even though the existing tests pass.

| Project | Routes checked | Result |
| --- | --- | --- |
| Investment Analytics Platform | `/investments` | Render checks passed; delayed histories disclosed |
| Before You Buy | `/investments/before-you-buy` | Render checks passed; no additional verified issue |
| Fantasy Football Analytics Platform | `/fantasy-football`, `/fantasy-football/best-ball`, `/fantasy-football/best-ball/draft-tracker`, `/fantasy-football/draft-tracker`, `/fantasy-football/mock-draft`, `/fantasy-football/trade-calculator`, `/fantasy-football/waivers`, `/fantasy-football/weekly` | Render checks passed; no additional verified issue |
| Interchange IQ | `/fintech-tools/interchange-iq` | Payment channel comparison issue |
| Budget Planner | `/fintech-tools/budget-planner` | Cross-month expense and calendar default issues |
| Rent vs. Buy Calculator | `/fintech-tools/rent-vs-buy` | Render checks passed; no additional verified issue |
| News Pulse Dashboard | `/news-pulse` | Render checks passed; no additional verified issue |
| Decision Lab | `/decision-lab` | Render checks passed; no additional verified issue |
| Automation Enablement Assistant | `/enablement-assistant` | Render checks passed; score wording recommendation |
| Food Map | `/food-map` | Render checks passed; no additional verified issue |
| March Madness 2026 Bracket Analysis | `/march-madness-2026` | Render checks passed; no additional verified issue |
| La Liga Pulse | `/la-liga` | Club drawer dates missing |
| Job Search | `/mba-internship-notifications` | Candidate conflict and imported date issues |
| SpaceX Mission Control | `/spacex-mission-control` | Render checks passed; no additional verified issue |
| Premier League Pulse | `/premier-league` | Club drawer dates missing |
| Frontier Model Tracker | `/frontier-models` | Render checks passed; no additional verified issue |
| AI Dev Tool Ecosystem | `/ai-dev-tools` | Render checks passed; no additional verified issue |
| GitHub Trending Pulse | `/github-trending-pulse` | Weekly measurement interval issue |
| Tech Startup Tracker | `/tech-startup-tracker` | Render checks passed; no additional verified issue |
| Formula 1 Pulse | `/formula-1` | Render checks passed; no additional verified issue |
| Fantasy Formula 1 Optimizer | `/fantasy-formula-1` | Render checks passed; no additional verified issue |
| PGA Tour Pulse | `/golf` | Render checks passed; no additional verified issue |
| Earthquake Pulse | `/earthquake-pulse` | Render checks passed; no additional verified issue |
| World Cup Pulse | `/world-cup-2026` | Shared ledger date fix verified |
| Bay Area Transit Pulse | `/bay-area-transit` | Render checks passed; no additional verified issue |
| MLB Pulse | `/mlb` | Existing date and legend fixes verified |
| NBA Pulse | `/nba` | Unequal-game-count gap issue |
| NFL Pulse | `/nfl` | Render checks passed; no additional verified issue |
| Polling Aggregator | `/polling-aggregator` | Election calendar issue |
| Museum Log | `/museum-log` | Render checks passed; no additional verified issue |
| Wine Cellar | `/wine-cellar` | Render checks passed; no additional verified issue |
| Recipe Finder | `/recipe-finder` | Render checks passed; no additional verified issue |
| Travel Planner | `/travel` | Render checks passed; no additional verified issue |
| Travel Deal Lab | `/travel-deals` | Fare band description issue |
| Score Pools | `/score-pools`, `/score-pools/settings`, `/score-pools/tracker` | Render checks passed; no additional verified issue |
| Agent Build Index | `/agent-build-index` | Weekly measurement interval issue |
| Reactor Arcade | `/arcade` | Render checks passed; no additional verified issue |

The additional issues in this report remain open. This audit added this report and preserved the earlier uncommitted fixes.

## Status on October 14, 2026

Nine of the ten verified issues above were fixed in PR #596, which merged on October 14, 2026. The same PR carried the uncommitted fixes this audit preserved, and it reworked the ledger's dates so the day and the time print on lines of their own. The tenth issue, comparing one payment channel at a time in Interchange IQ, needs a product decision, so it is open in `docs/TODO.md`, and that entry also covers the custom contract prices under other observations. The Enablement Assistant still labels its recommendation score as percent confidence. I did not recheck the delayed investment histories, which depend on the investments data refresh.
