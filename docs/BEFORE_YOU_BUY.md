# Before You Buy model and state

This document describes the comparison shipped on `/investments/before-you-buy` as of October 21, 2026. The route is an independent product concept for Google Finance. The visual and interaction decisions live in `.impeccable/surfaces/route-investments-before-you-buy.md`.

I built this around one question, which is what the same amount of new money changes when someone adds one stock or another to the portfolio they already hold. Every option uses the same starting holdings, purchase amount, and historical observations. The result describes the allocation and historical behaviour of each mix, and the page does not say whether to buy.

## Inputs and portfolio state

`src/app/investments/before-you-buy/before-you-buy-client.tsx` loads closing-price snapshots through `getClientInvestmentSnapshot`. It accepts only date keys in `YYYY-MM-DD` form and positive finite closing prices, then sorts the rows by date. Symbol searches use the curated Investments index. The benchmark is SPY.

The starting portfolio can be the seven-holding $50,000 sample, the holdings saved by `/investments`, or a separate dollar-value draft. On reload, a validated draft takes priority over saved holdings, and saved holdings take priority over the sample. The purchase starts at $5,000 of NVDA with an optional $5,000 SPY alternative. Matching purchase symbols produce one scenario.

Saved holdings are valued as shares multiplied by each symbol's latest available closing price. Those latest dates can differ between symbols. If a saved holding has no usable price history, the route names it as excluded from the valued portfolio. Entering a dollar value in the editor includes it in the allocation, but historical measures still require its prices. If every saved holding is unvalued, the route asks for values or another source instead of treating the account as empty.

Edits create a separate draft under `before-you-buy-portfolio-v1`. This route reads and never writes `portfolio_holdings`. `decodeBuyPositions` rejects an entire restored draft if it has more than 100 rows, malformed or duplicate symbols, a nonpositive or nonfinite value, or a nonfinite total. An empty draft is valid. Adding an existing symbol increases its dollar value, and the interface limits the editor to 100 holdings. Invalid edits remain visible for correction and do not replace the last valid persisted draft. If storage is unavailable, the page explains that the working values stay in the tab.

## Allocation

`src/lib/beforeYouBuy.ts` owns the pure comparison functions. `mixOf` merges positions with matching symbols, totals their dollar values, and calculates each holding's share as its value divided by that total. Each proposed mix contains all the starting holdings plus that option's purchase. The purchase adds money, so it does not sell or reduce any existing holding's dollar value.

Sector weights sum those holding weights. The benchmark symbol belongs to `Fund holdings`. SPY is the only fund in the curated research universe and the provider sends no quote type, so a fund added to the universe later would read as `Unclassified` until the builder carries one. A stock without sector metadata belongs to `Unclassified`. The model has no breakdown of the holdings inside funds, so direct sector totals cannot describe all of a portfolio's sector exposure. The interface names fund and unclassified shares for the starting portfolio and every proposed mix. Its chart categories and legend consider all the mixes.

## Shared daily returns

`compareBuys` calls `analyzeBuy` with every proposed symbol included in the required histories. The required set contains the benchmark, all holdings, and every purchase choice. A comparison gives both options the same observations.

The model walks consecutive dates from the benchmark history. It accepts an interval only when both endpoint closes are positive and finite for every required symbol. A symbol missing a close removes both intervals touching that date. It never bridges that gap and calls the resulting multi-day movement a daily return.

For an accepted interval, a symbol's return is its ending close divided by its starting close, minus one. A mix's return is the sum of each symbol's return multiplied by its allocation weight. The weights stay fixed across the window. These values describe how that fixed mix would have moved on those days, and they do not reconstruct a person's account history.

`window.from` is the base close for the first accepted interval, `window.to` is the ending close for the last accepted interval, and `window.days` counts accepted daily returns. That span can contain omitted intervals. The interface prints the ending date and daily-return count, and the worst-day table prints the full span.

## Historical measures and limits

Beta is the covariance of a mix's daily returns with SPY divided by SPY's daily-return variance. A beta of 1 means equal historical sensitivity to SPY over the selected observations. Correlation compares the purchased symbol's daily returns with the starting portfolio's daily returns. A flat series, a benchmark with zero variance, or an empty starting portfolio can leave a measure unavailable.

The five worst days are the five lowest SPY daily returns in the shared observations, sorted from worst to best. The route shows each mix's daily return on those same dates and their average in the main comparison table. It does not search for each portfolio's own worst dates.

The route calls `compareBuys`, which withholds beta, correlation, and worst-day results when fewer than 30 daily returns are shared. Allocation remains available with a warning. `analyzeBuy` is the lower-level calculation and does not enforce that display threshold on its own, so new consumers should use `compareBuys` for the route's historical-comparison contract.

The inputs are closing prices, with no dividends, taxes, fees, fund holdings breakdown, or prediction of future returns. The date window depends on available snapshots and can change when either purchase or a starting holding changes. Missing data and a different period can change the result. “Not investment advice.” remains beside the output.

## Rendering and verification

`purchase-comparison.tsx` renders the position-share interpretation, comparison table, sector bars, coverage disclosures, detailed sector weights, correlation, and worst-day table. `before-you-buy.css` owns the neutral light and dark palette and the responsive layout. The shared `StockSearch` has per-instance IDs and labels for the primary purchase, alternative, and add-holding field, plus viewport-bounded suggestions and keyboard selection.

`src/lib/__tests__/beforeYouBuy.test.ts` covers weights, shared observations, missing dates, the historical threshold, validation, and formatting. The route tests cover edits and restoration, independent saved holdings, equal purchase scenarios, alternative-only fund coverage, invalid and unavailable states, and printing. `e2e/before-you-buy.spec.ts` covers the default comparison, an alternative search, saved-draft restoration, local editing, the collapsed mobile editor, and design captures in light, dark, mobile, expanded-editor, and print states. The surface brief records which checks were run and any remaining verification.
