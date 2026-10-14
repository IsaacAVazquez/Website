---
version: 1
slug: "route-investments-before-you-buy"
primary_target: "route:/investments/before-you-buy"
related_targets: ["src/app/investments/before-you-buy/before-you-buy-client.tsx","src/app/investments/before-you-buy/before-you-buy.css","src/lib/beforeYouBuy.ts"]
---

# Before You Buy surface brief

Scope. The `/investments/before-you-buy` route, rendered by `src/app/investments/before-you-buy/before-you-buy-client.tsx` over the analysis in `src/lib/beforeYouBuy.ts`, reading a year of daily closes per symbol through `getClientInvestmentSnapshot` and the holdings `/investments` saved in this browser through `loadHoldings`, read only.

Visitor mode. Operate. The visitor picks a stock and an amount and reads what the buy would do to a portfolio, either a $50,000 sample or their own saved holdings.

Audience. Someone who keeps holdings on `/investments`, or a reviewer reading the page as a product concept for Google Finance. The not-affiliated line and "Not investment advice." are compliance text.

Visual world. Since 2026-10-12 the route owns its design inside the site frame (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Calculator), so judge it against the "Project routes" section of `DESIGN_CHECKLIST.md`. The header, the footer, and the build-note strip are the shell's.

## Redesign, 2026-10-12

The route left Catalog 97's print shop layout in stage 2 of the project-sovereign work (branch `design/g4-fintech-calculators`). Its genre is a brokerage what-if panel, with a quote page's restraint (borrowing conventions from Google Finance and never its branding) and Portfolio Visualizer's before and after comparison as the references.

### Decisions

The page is a title row (the h1, one orienting sentence, and the not-affiliated line on its own), then the calculator, then the five worst days, then one short "How this works" paragraph. At 960px and wider the left column holds "The buy" (the stock search, the amount, and the NVDA, XOM, and KO chips) and under it "Portfolio" (the sample or saved switch, its note, and the holdings as a plain table), and the right column is the one result, meaning the summary sentence (`role="status"`), the now and with-the-buy sector bars with their legend, the three figures (sector share, beta, correlation, each with what it was) as the bars' caption, one line with the price date and "Not investment advice.", and a "Before and after, sector by sector" disclosure holding the full table and the correlation sentence. Under 960px and on paper it is one column in DOM order, buy, portfolio, result, so the visual order and the tab order agree. The first build moved the result above the portfolio with CSS `order`, which made Tab jump down to the portfolio switch and back up, and the 2026-10-12 review took that out. Because the result then sits under the portfolio, the holdings region is capped at 22rem on screens under 960px and scrolls inside itself past that, which keeps the summary within a screen of the stock field however many holdings are saved. The seven-row sample comes to about 325px at the 41px a row measured below, so it fits under the 352px cap without scrolling, and it still fits at 959px wide, where the wider cell padding brings it to about 335px. The cap was 21rem at first, and I raised it because 336px ended almost exactly on a row boundary, so a longer list looked finished on a phone where the scrollbar is an overlay and takes no gutter. At 352px the eighth row is cut through its text, which is the only cue at rest that the list goes on. For a print the closed disclosure opens on `beforeprint` and closes again on `afterprint`, the way Rent vs Buy opens its groups, so paper carries the sector table and the correlation sentence.

The five worst days stay as the second screen, a plain table held to 48rem. "How this works" is the old three paragraphs folded into one, ending "The page describes what a buy would change and doesn't say whether to make it." "Not investment advice." prints once, beside the figures it qualifies, and the not-affiliated line prints once, under the title.

Colour is the route's own `--byb-*` properties on `.byb`, a near-white page, a neutral ink, and a blue for links, chips, and focus, with a dark story under `.dark .byb`. The sector colours stay `HOLDING_PALETTE` (the `--c97-chart-*` ramp shared with `/investments`), since they are data colours. The root redeclares `--c97-ink`, `--c97-ink-2`, `--c97-label`, `--c97-surface`, `--c97-panel`, `--c97-field`, `--c97-rule`, and `--c97-accent`, which `StockSearch` reads. The search's suggestion list portals to the element marked `data-stock-search-portal`, which is this root (StockSearch falls back to `.c97-page` everywhere else, so /investments is unchanged), and because the list wraps itself in a paper surface, the route CSS hands that surface the route palette again, so the list matches the field in both themes. No added typeface, Archivo with tabular numerals.

### Cut, and not to be restored

The poster hero and its meta line, the plate around the inputs and the summary, the readout trio as a separate row (it is the bars' caption now), the separate "The portfolio", "Before and after", and "How this works" bands, and the seams.

### Pinned, and kept

The h1 "Before You Buy", the not-affiliated text, the summary sentences from `describeBuy` and the loading, unavailable, and invalid-amount messages, "Prices through …", "Not investment advice.", "Sample portfolio" and "Your saved holdings" with `aria-pressed` and the disabled state while nothing is saved, the example chips, "Amount in dollars" with its error, the scrollable region labels, "The market's five worst days" as the last table with five rows, the holdings as the first table, and the read-only use of saved holdings. Two tests changed. `e2e/before-you-buy.spec.ts` selected `.c97-project-hero [role="status"]` at lines 12, 20, and 39 and now selects `.byb-result [role="status"]`, because the hero is gone. In the route test the readout helper reads `.byb-figure` with `.byb-figure-value` and `.byb-figure-was` instead of `.c97-stat`, and the "on the plate with the summary" test became "in the calculator ahead of the summary", since the inputs and the summary now sit in two columns of one calculator.

### Verified state, 2026-10-12

The route suite (14 tests) passes with the shared suites. `tsc --noEmit` and eslint on the changed files are clean. In Chromium, the three tests in `e2e/before-you-buy.spec.ts` and the route's `all-projects` and `project-routes` tests pass against the dev server and a production build. `contrastSweep.mjs` reports no failures in either theme and `layoutSweep.mjs` reports 0 fail, with the two-column calculator as its orphan-row review. On the production build at 1440x900 the stock field sits at y420 against y616 before, the summary at y334 against y952, and the first holdings row at y814 against y1832; at 390x844 the stock field is at y530 against y625, the first holdings row at y884, and the summary at y1199 against y1015, still inside the 1266px budget. A keyboard walk from the top reaches the stock search, the amount, the three chips, the portfolio switch, the holdings region, and the sector disclosure; Enter on XOM rewrites the summary, and Enter opens the disclosure. A Chromium print keeps the result, the figures, and both tables.

The review fixes of 2026-10-12 came after that state. The route suite (18 tests) passes, and `e2e/before-you-buy.spec.ts` gained two tests that have not been run yet, one that types in the stock search and checks the list paints the field's colour inside `.byb`, and one that saves fourteen holdings at 390x844 and checks the summary stays within 844px of the stock field. The holdings cap, the print with the disclosure open, and the spacing inside the open disclosure (margins now, since a flex gap on the details never reached the correlation note) have not been seen in a browser.

A browser pass on a production build then measured the 21rem cap at 390x844 with twelve saved holdings. The region showed seven whole rows, then 11.7px of the eighth row and 0.2px of its text, with no scrollbar gutter and five rows out of sight. The cap is 22rem now. By arithmetic from those figures the eighth row shows about 28px and about 16px of its text, and the summary sits 16px lower, at about y1205 against the 1266px budget. I have not measured the 22rem cap in a browser. The route suite is 19 tests with the new case that a disclosure the reader opened stays open after a print.

Not checked: WebKit and Gecko prints, a screen reader, touch devices. In the light theme the palette's fourth and fifth steps (the fourth sector and "Other") are both dark and sit close together on the bars, which is the shared palette and not this route's to change.
