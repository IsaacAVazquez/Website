---
target: "route:/investments"
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:/Users/isaacvazquez/Website/route:/investments"
timestamp: 2026-09-14T20-10-27Z
slug: route-investments
---
Method: re-score after remediation. A: design review subagent (post-fix) · B: computed-value sweep subagent (post-fix), synthesized in the parent. Run 2026-09-14 on branch design/reading-investments-loop.

Mode: Operate (unchanged). The baseline for this run is `2026-09-14T19-48-31Z__route-investments.md`, scored 25/40 with 8 P1 before remediation. A scored the page at `a3d3d633` on the dev server, and the remediation commit for this route is `5efd808a`. The surface is always dark inside `.terminalScope`, so light and dark captures measure the same shell.

## Design health score

| # | Heuristic | Score | Baseline | Key issue now |
|---|---|---|---|---|
| 1 | Visibility of system status | 3 | 2 | The tape, chart lag and Compare stamps now tell the truth. The chip still leads with the Aug 18 run date, and the topbar shows a red "No data" dot on an empty portfolio. |
| 2 | Match between system and real world | 3 | 3 | "52W $202–$335" still comes from a series ending Jul 17 beside a Sep 14 quote. |
| 3 | User control and freedom | 3 | 2 | Hero Add holding opens the form and focuses the symbol field, deep links keep their symbol, and remove keeps focus. Some research loads in dev still half-render. |
| 4 | Consistency and standards | 2 | 2 | Four names for the add action remain, and Compare colours the second stock amber in the tables and white in the radar legend. |
| 5 | Error prevention | 3 | 3 | Unchanged. The form validates the ticker and merges duplicates, and removing asks first. |
| 6 | Recognition rather than recall | 3 | 3 | Unchanged. |
| 7 | Flexibility and efficiency | 2 | 2 | Holdings still cannot be sorted, and the Compare selects are still 151 unsorted options. |
| 8 | Aesthetic and minimalist design | 3 | 3 | Unchanged. A large empty chart panel and a filled orange rail pill beside a paper-filled hero primary. |
| 9 | Error recovery | 2 | 2 | Your position shows "Price unavailable", but at scoring time the cost-basis state still ranked and coloured returns in the stats grid. |
| 10 | Help and documentation | 3 | 3 | Disclaimers and the CMA note are intact, and the case study no longer promises analyst ratings. |
| Total | | 27/40 | 25/40 | Acceptable (67.5%) |

All ten heuristics applied. Open P0 is 0 and open P1 is 0.

## Resolved since the pre-fix snapshot

[P1] Freshness stamps contradicted the data. Mostly resolved. The tape reads "Live quotes" when any holding has a live quote and "Last saved prices" otherwise. The chart lag check now measures against today, and the AAPL chart reads "Historical chart data ends 59 days before today." under "Historical series through Jul 17, 2026." What remains is the chip's lead date and the 52W range, now P2.

[P1] Your position valued holdings at cost under a caption promising the saved close. Partly resolved. With quotes blocked, Market value, Total return and Day P/L each read "Price unavailable". The stats grid remainder is below.

[P1] The case study promised analyst consensus ratings. Resolved. `/portfolio` and `/portfolio/investment-analytics-platform` both return 200 with no analyst match.

[P1] `--home-ink-soft` measured 3.95:1. Resolved. The soft tier is now a 55% ink mix and reads 5.31:1 on paper, 4.97:1 on paper-alt and 5.38:1 on raised paper.

[P1] Selected tab and range text was white on orange at 2.83:1. Resolved. Selected tab and range text is paper on signal at 6.5:1, with unselected ranges at 6.16:1.

[P1] The chart date-range buttons exposed no pressed state. Resolved. 1M, 3M, 6M and 1Y carry `aria-pressed` and flip correctly on click, as do the overlay toggles, and each measures 44px tall.

[P1] The performance timeframe clipped its focus ring and used tab roles with no panels. Resolved. The group is `role="group"` labelled "Performance timeframe" with `aria-pressed` buttons, its overflow is visible, and every segment paints a full 2px orange outline with nothing clipping it.

[P1] Add Holding and the filter input showed no visible focus. Resolved. Add Holding paints a 2px paper ring plus an orange ring, the filter label paints a 2px orange outline, and focused and blurred captures differ for both.

[P2] Compare claimed one shared snapshot. Resolved. Each side is dated under its selector ("Snapshot as of Jul 20, 2026"), and the intro reads "from each company's curated snapshot, dated under its name."

[P2] The hero Add holding button opened nothing. Resolved. Clicking it takes the form from 0 inputs to 4 with focus on `#add-symbol`.

[P2] Focus dropped to the body after remove. Resolved. Remove moves focus to "Cancel remove", and Cancel returns focus to "Remove AAPL" with the holding kept.

[P3] Deep links dropped the symbol in dev. Resolved. `?symbol=MSFT` held through 9 seconds, and all seven section URLs kept `symbol=AAPL`.

Both educational disclaimers render.

## Remaining priority issues

[P2] The tape said "Last saved prices" when nothing was saved. Applied after measurement in `c6c38900`, not re-swept. The label now has a third state, "Prices unavailable", when no holding is live or saved.

[P2] The cost-basis state ranked and coloured returns. Partly applied after measurement in `c6c38900`, not re-swept. The stats grid now ignores cost-basis holdings when naming the top holding, the best performer and the top-three share. The green tone on "$0.00" P/L rows and on the all-time return was not part of that change and is still open.

[P2] The dataset chip divider dot was the only text under 4.5:1 left on the route, at 2.46:1. Applied after measurement in `c6c38900`, not re-swept. It was half-opacity muted ink and now uses the soft ink tier.

[P2] A failed research fetch reads "NO PRICE DATA / Unavailable" over a snapshot that has price data, and in dev it happened on 3 of about 10 research loads. Not confirmed against a production build.

[P2] Freshness residue. The chip leads with the Aug 18 run date and does not show the price date range first, and the 52W range comes from a series 59 days old. The data itself stays weeks old until the refresh fixed in PR #434 runs.

[P2] Compare colours the second stock amber in the tables and white in the radar legend, and marks FCF YoY of −9.23% with a green better arrow.

[P3] The hero Add holding opens the form by clicking the form's own button found by `aria-label="Add holding"`, so renaming that label would silently break it, and no test covers it.

[P3] One sub-44px target the pre-fix sweep did not list, the AAPL rail mover in the seeded state, measured 38.8px tall (hit box 161 by 40).

[P3] Em dashes remain in retirement UI copy, for example `RetirementPlanner.tsx:44`.

## Deliberate decisions

MetricTooltip keeps its Escape blur because it is shared with fantasy football. The h1 size is unchanged. The four names for the add action were left. The hero Add holding depends on the form button's `aria-label`, recorded above as P3.

## False positives

The in-page overlay is blocked by the enforcing CSP in `src/proxy.ts`. One-run contrast blips on the Valuation tab did not reproduce, since repeated reads at 1.5 and 9 seconds in both themes found only the divider dot. A's longer walk logged the hero Add holding click as failing after tabbing through other controls first, and a clean probe showed the form opening, so that failure came from the script.

## Regression sweep

Across 56 combinations at 390, 768, 1024 and 1440 in light and dark, every page had one `main` and one `h1`, no horizontal overflow, 0 console errors, 0 failed requests and CLS 0. The sub-44px targets on the empty portfolio (the timeframe segments at 34px, the ghost links at 40px, the retirement Reset at 32px) are the same at every width, and the brief records that this surface raises targets under `pointer: coarse` only.

## What was not checked

Touch devices, a production build, Cmd-K, the retirement form, the 1512px layout, zoom and a screen reader were not checked. A saw "Your position" in the quote-failure state only through the source, and B confirmed it with quotes blocked. The three `c6c38900` changes were checked only by a targeted check in the parent, not by the sweep or the re-score.
