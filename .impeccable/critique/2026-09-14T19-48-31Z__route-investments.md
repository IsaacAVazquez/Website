---
target: "route:/investments"
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 8
target_identity: "file:/Users/isaacvazquez/Website/route:/investments"
timestamp: 2026-09-14T19-48-31Z
slug: route-investments
closed: true
---
Method: dual-agent (A: design review subagent · B: computed-value sweep subagent), synthesized in the parent, with an adversarial refuter on every P0 and P1. Run 2026-09-14 against the dev server on main at ecd6517d, before remediation.

The prior critique of this route is `.impeccable/critique/2026-08-06T03-13-04Z__investments.md`, scored 24/40 and stored under the older slug `investments`. The trend helper will not join the two, so this snapshot starts a new trend, and the comparison against August is written out in Minor Observations.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | The quote tape stamps live Finnhub quotes "Snapshot · Aug 18, 2026", and the chart's lag check measures against its own build date, so a series ending Jul 17 shows no warning on Sep 14. |
| 2 | Match system / real world | 3 | "52W $202–$335" is the year ending Jul 17 shown beside a Sep 14 quote. When quotes fail, "Best performer AAPL 0.00%" names a winner among positions all valued at cost. |
| 3 | User control and freedom | 2 | The hero "Add holding" button leaves the form closed. In dev, 5 of 7 research deep links dropped the symbol on load. |
| 4 | Consistency and standards | 2 | Four names for one action, two Refresh controls, and Stock B amber in the Compare tables but ink in the radar legend. |
| 5 | Error prevention | 3 | The add form checks the ticker is in the curated set, merges duplicates by weighted cost, and confirms before removing a holding. |
| 6 | Recognition rather than recall | 3 | MetricTooltip definitions on research metrics, though the eight stat hints live only in `title` attributes. |
| 7 | Flexibility and efficiency | 2 | Research tab and symbol live in the URL, but holdings cannot be sorted and CSV export is the only bulk action. |
| 8 | Aesthetic and minimalist design | 3 | A disciplined terminal identity, undercut by a large empty chart panel on arrival and a filled orange "Add Holding" pill beside a paper-filled hero primary. |
| 9 | Error recovery | 2 | In the quote-failure state, Your position values AAPL at its $150 cost basis while the header above shows a $333.74 saved close. |
| 10 | Help and documentation | 3 | Both educational disclaimers are intact, the assumptions grid names every input, and the CMA source line says it is unverified. |
| Total | | 25/40 | Acceptable (62.5%) |

## Design Specificity Verdict

LLM assessment. This is one of the more specific surfaces on the site. The dataset chip that counts "125 using earlier snapshots" and "124 delayed histories" in warning tone, the "Partial snapshot" badge, the live-quote versus saved-close eyebrow in the research header, and the CMA line marked "Illustrative, re-verify" belong to this product and could not be lifted onto another tracker without the data behind them. The hero is still generic tracker furniture, a five-range timeframe row over a history that saves one point per visit. What changed since August is that the honesty layer, which was the best part of the surface, became its weakest point, because the snapshots aged a month and several stamps now measure the wrong thing.

Deterministic scan. `impeccable detect` exited 2 with 18 findings across the three surfaces in this run. On this route there are six design-system-font-size and three design-system-radius advisories in `src/app/investments/investments.module.css`, all advisory, and one side-tab warning at `src/components/investments/InvestmentsDashboard.tsx:143`, a 3px left border on the quote tape, which is the one rendered finding. No DEGRADED banner printed. The detector missed every P1 below, since the contrast, focus and state problems only show in computed values and driven states.

Visual overlays. No user-visible overlay is available. Injection was blocked by the site's enforcing CSP, which fired a securitypolicyviolation on script-src-elem. The computed-value sweep is the fallback signal. Its contrast gate reproduced 16.29:1 in light and 15.28:1 in dark, and inside the always-dark shell it found the `--home-ink-soft` labels at 3.95:1, the selected-tab text at 2.83:1, the clipped timeframe focus ring, and the missing focus indicators on Add Holding and the filter input, all of which the refuters reproduced.

## Overall Impression

Adding three positions is a strong moment. Live quotes land within seconds, the tape, donut and movers fill in, and the research view with eight quarters of statements and metric-aware valuation colouring is real decision support. The page then undercuts its own honesty. The tape says Aug 18 on quotes from Sep 14, the chart says nothing about a history two months old, a failed quote values a position at cost under a caption promising the saved close, and the case study sells analyst ratings that do not exist. Underneath that sits an accessibility layer that fails in the dark shell, from 77 labels under 4.5:1, to white on orange tabs, to controls with no visible focus. The single biggest opportunity is one shared freshness model that every stamp on the route reads from, so the dates pass the build note's own promise of market dates over build time by construction.

## What's Working

The dataset chip is still the most honest freshness statement on the site. It names 125 of 151 securities as using earlier snapshots and 124 as delayed histories in warning tone (`InvestmentsDashboard.tsx:304-356`), and the refuters did not contest it.

The research header separates a live quote from a saved close and flags a partial or stale snapshot, with a title explaining that the quote is sourced separately (`ResearchAssetHeader.tsx:275-290`). Valuation and industry badges colour Above or Below by whether that direction is good for the metric.

The August retirement fix holds. "Example numbers" is the caption, the example note sits above the gauge, and the sweep confirmed both educational disclaimers render intact, one under the research band and one closing the retirement planner.

## Priority Issues

[P1] Freshness stamps contradict the data they label.
This finding has two parts, and the refuters upheld both. The quote tape prefixes live Finnhub quotes stamped 2026-09-14 with "Snapshot · Aug 18, 2026" (`InvestmentsDashboard.tsx:292-297`), so build time is printed on quotes that did not come from the build. The price chart's lag check in `src/lib/investmentsHistory.ts` compares the last price row against the per-symbol snapshot date from `useStockData` (`PriceChartPanel.tsx:117`), so AAPL's history ending Jul 17 is judged three days behind its Jul 20 build and the warning at `PriceChartPanel.tsx:433-437` never rendered, 59 days later. The dataset chip's headline date is the last run, which the refuter judged honest and at most P2. This contradicts the build note rendered at the bottom of the route, which promises "relevant market dates rather than treating build time as data freshness."
Fix: label the tape with the quote source and time, for example "Finnhub · 2:58 PM ET". Compare history against today in `investmentsHistory.ts` and let the warning read "Price history ends Jul 17, 2026, 59 days ago."
Suggested command: /impeccable clarify

[P1] With quotes failing, Your position values holdings at cost under a caption promising the last saved close.
In the first walk every quote failed. Your position for AAPL read "Market value $1,500 · Total return $0.00 · 0.00%" under "Latest market quote when available, else last saved close" (`ResearchPosition.tsx:90`), while the research header directly above read "Price as of Jul 17, 2026 $333.74". `buildEnhanced` falls back to `averageCost` (`useInvestments.ts:495`, `501`), and the stats grid then names "Best performer AAPL 0.00%" and "Top-3 concentration 100.0%" from cost basis.
Fix: value non-live holdings at the saved close the header already loads and label it "Saved close Jul 17", or change the caption to "else your cost basis" and hide Best performer and Top holding while every holding is on cost basis.
Suggested command: /impeccable harden

[P1] The portfolio case study promises analyst consensus ratings nothing provides.
`src/constants/caseStudies.ts:62` and `:66` list "Analyst consensus ratings" as a feature and metric of this tool. A search of `src/components/investments`, `useStockData.ts` and `src/types/investment.ts` for analyst, consensus or recommendation returns nothing, and no snapshot section holds them. PRODUCT.md makes never-fabricate a principle, and the case study is what a peer reads before opening the tool.
Fix: remove the claim from both lines, or build the panel before keeping it.
Suggested command: /impeccable clarify

[P1] `--home-ink-soft` measured 3.95:1 on about 77 labels in the dark shell.
The sweep measured `rgb(118,116,112)` on `rgb(21,20,18)` at 3.95:1 across about 77 text nodes, from the topbar "No data" state, to "Snapshot as of Jul 20, 2026" in research, to table headers and valuation labels, all under the 4.5:1 AA floor for text this size. The token is a 45% ink mix in `investments.module.css`.
Fix: move the mix at `investments.module.css:54` to 55%, which clears 4.5:1 on paper, paper-alt and raised paper while staying below muted.
Suggested command: /impeccable harden

[P1] Selected tab and range text is white on #FF6B3B at 2.83:1.
The selected tab and range buttons put white text on Signal Orange, which the sweep measured at 2.83:1 on the selected "1Y" range button and the refuter reproduced, under 4.5:1 for text this size. It is the element that tells a user which range they are looking at.
Fix: use ink text on the orange fill, or mark the selected state with an orange rule under ink text on paper.
Suggested command: /impeccable harden

[P1] The chart date-range buttons expose no pressed state.
The overlay toggles in `PriceChartPanel.tsx` carry `aria-pressed`, but the date-range buttons beside them do not, so a screen reader user cannot tell which range is selected (WCAG 4.1.2).
Fix: add `aria-pressed` to each range button, or group them as a radio group with `aria-checked`.
Suggested command: /impeccable harden

[P1] The performance timeframe clips its focus ring and uses tab roles with no tab panels.
The five timeframe buttons render a 2px orange outline with a 2px offset, but `div.invest-timeframe` has `overflow: hidden`, so the ring is cut off. The sweep found the clip and the refuter captured it at each of the five positions. The group is `role="tablist"` with five `role="tab"` buttons and no `aria-controls`, tabpanel or roving tabindex (`PortfolioHeroCard.tsx:351-364`), so it announces a tab interface that does not exist. The statements tablist in `FinancialStatementsPanel.tsx` has the same role gap, while the research tablist does it properly.
Fix: remove `overflow: hidden` or move the ring inside with a negative offset, and make the group a set of pressed toggle buttons, since nothing swaps a panel.
Suggested command: /impeccable harden

[P1] Add Holding and the filter input show no visible focus.
The module sets `--shadow-sm: none`, which invalidates the Tailwind ring the Add Holding button relies on, so its computed outline and shadow are both none on focus-visible. The filter input is `all: unset`, which wipes the base focus style, and neither the input nor its label draws an indicator. The refuter confirmed both with focused and blurred captures in the dark shell.
Fix: give both an explicit `:focus-visible` outline in `--home-signal`, and draw the filter's indicator on its label with `:focus-within`.
Suggested command: /impeccable harden

[P2] Compare claims one shared snapshot while the two sides were built on different days.
`ComparisonTab.tsx:346` says the tool uses "the same curated data snapshot for both companies", but AAPL was built Jul 20 and JPM Jul 16, and no as-of date shows for either side. A rated this P1, and the refuter set it at P2.
Fix: print "AAPL data as of Jul 20 · JPM data as of Jul 16" under the selectors from `freshness.snapshotBuiltAt`, and reword the line to "using each company's latest curated snapshot."
Suggested command: /impeccable clarify

[P2] The hero Add holding button scrolls but never opens the form.
`focusAddHolding` (`InvestmentsDashboard.tsx:187-195`) scrolls to `#add-holding` and focuses the first input, but that input only exists once `AddStockForm`'s own `open` state is true, so the click leaves the form closed and focus on the hero button. It is the first thing a visitor does on an empty portfolio.
Fix: lift `open` into the dashboard or pass an open request to `AddStockForm`, so the button opens and then focuses, and settle on "Add holding" for every entry point.
Suggested command: /impeccable harden

[P2] Focus drops to the body after Remove and Confirm, and after Escape on MetricTooltip.
Focus dropped to the body after Remove and after Confirm, and MetricTooltip blurs deliberately on Escape across 18 call sites, so a keyboard user is sent back to the top of the tab order each time.
Fix: after removal move focus to the next row or the holdings heading, and on Escape return focus to the tooltip trigger instead of blurring.
Suggested command: /impeccable harden

## Persona Red Flags

Dana, a VC peer from the Haas network checking whether the numbers can be trusted, adds a position and sees live quotes, then opens research and meets Aug 18 on the tape, Jul 20 on the badge, a 52-week range and chart that end Jul 17 with no warning, "Refreshed just now" in the header corner, and a Compare view claiming one shared snapshot across companies built on different days. Each stamp is defensible alone, but together they read as a page that does not know how old its own data is, and the analyst ratings the case study promised are the first thing Dana would ask about.

Sam (screen reader, keyboard) tabs into a timeframe row announced as tabs with no panels and a focus ring cut off by its container, cannot hear which chart range is selected, loses sight of focus entirely on Add Holding and the filter input, and is dropped to the top of the page after removing a holding or pressing Escape on a tooltip. The eight stat definitions are `title` attributes only.

Casey (390, one hand) sees Asset, Price, Day and Holdings in the holdings table, with Allocation cut at the edge and P/L and actions off screen. The working Add button sits below the whole table, and the hero button above it opens nothing. Holdings persist in localStorage, so an interruption loses nothing.

Alex (power user) cannot sort holdings by any column, picks Compare symbols from two unsorted 151-option native selects, and in dev lost the symbol on 5 of 7 direct research deep links.

## Minor Observations

[P2] Form placeholders measured 3.70:1. Every field has a visible label, so the placeholder carries no information alone, and the refuter held it at P2.

[P2] The h1 "Investments" is 24px under a 34px h2, so the page's top heading is smaller than a section heading.

[P3] Dev only. The unmount cleanup at `investments-client.tsx:47-56` rewrites the URL without `symbol`, which drops `?symbol=` deep links under React Strict Mode's double mount. It was seen in dev, and no production build was checked.

The topbar shows a red "No data" dot on first arrival, and "All-time return $0.00" renders in the positive tone because `gainPositive` is `>= 0`. The research empty state says "Click Research on any holding above" on an empty portfolio. The hero empty chart says "A point is saved each day you visit", but no point is saved on a visit where any quote fails. Compare marks FCF YoY of −9.23% with a green better arrow because it beats −251.76%. The educational note sits after the research band in 11px muted type, about 1,600px below the portfolio figures at 1440. In light theme the route is three bands, a light header, the always-dark shell and a light build-note band, and the theme toggle changes nothing inside the shell. Em dashes remain in shipped retirement copy and at `PriceChartPanel.tsx:439`. Signal Orange carries the tape tag, the snapshot dot, a filled Add Holding pill, the held badge, the allocation bar, Stock A and the chart line within one viewport, which is the clearest case against DESIGN.md's One Signal Rule.

Against the 2026-08-06 critique (24/40, slug `investments`), the score moves to 25. The Cmd-K conflict, the retirement "Your numbers" caption on sample data and the stats footer dead links are fixed, and the touch-reachability fix for row actions is in code but was not re-verified on a touch device. Still open are the fake performance tablist, the freshness told several ways (now sharper, since the dates diverge by a month), two Refresh controls, the no-op theme toggle, the empty chart panel and accent overload. New since August are the freshness and comparison claims, where aging data meets copy that was accurate when the snapshots were fresh, and the dark-shell contrast and focus findings from the sweep. A did not check real touch devices, the 1512px layout, a production build, CSV export or edits inside the retirement form.

## Questions to Consider

The quote tape is the only live thing on the page, so why does it carry the dataset's date?

If 125 of 151 symbols sit on July data, should the chip lead with the oldest price date?

What would one shared freshness model look like, so every stamp on the route passes the build note's test by construction?
