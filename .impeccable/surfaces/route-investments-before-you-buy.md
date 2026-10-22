---
version: 1
slug: "route-investments-before-you-buy"
primary_target: "route:/investments/before-you-buy"
related_targets: ["src/app/investments/before-you-buy/before-you-buy-client.tsx","src/app/investments/before-you-buy/before-you-buy.css","src/lib/beforeYouBuy.ts"]
---

# Before You Buy surface brief

The scope is `/investments/before-you-buy`, rendered by `before-you-buy-client.tsx` and `purchase-comparison.tsx`, with the comparison model in `src/lib/beforeYouBuy.ts`. The route reads closing-price snapshots through `getClientInvestmentSnapshot` and can start from the holdings saved on `/investments`. Its model and storage contract are documented in `docs/BEFORE_YOU_BUY.md`.

The visitor mode is operate. Someone plans a purchase, edits the starting portfolio, and compares what the same amount of additional money would change across two possible purchases. A professional peer can also read it as an independent product concept for Google Finance. I want the result to explain the tradeoff before the visitor has to interpret the historical measures.

## Authority and visual world

The 2026-10-21 extension follows Isaac's approval to add editable holdings on the page, compare purchases from the same starting portfolio, lead with an interpretation, and make historical and coverage limits visible. That approval supersedes the 2026-10-12 brief's pins on result wording, metric placement, the holdings editor order, and the absence of local editing. The saved `/investments` holdings remain read only, while edits here create a separate draft.

This extends the route's neutral brokerage panel inside the Catalog 97 frame. It borrows the restrained quote-page conventions of Google Finance and the before and after comparisons of Portfolio Visualizer, without adopting their branding. The route follows the project-route section of `DESIGN_CHECKLIST.md` and `docs/superpowers/specs/2026-10-11-project-sovereign-design.md`. The shared header, single main landmark, footer, and build-note strip remain the shell's responsibility.

The route has a near-white surface, neutral text, blue actions, small rounded selection controls, and a dark palette under `.dark .byb`. Its `--byb-*` properties are defined in `before-you-buy.css`, and the root passes those values to the Catalog 97 properties consumed by the shared stock search. Sector colours come from the investments tool's `HOLDING_PALETTE` and describe data. The route uses Archivo with tabular numerals and adds no typeface or image assets. These are local decisions, so this extension does not change `PRODUCT.md`, `DESIGN.md`, or `.impeccable/design.json`.

## First screen and result

The title row holds “Before You Buy”, one orienting sentence, and the independent-concept disclosure. At 960px and wider the purchase controls and starting portfolio occupy the left column, and the result occupies the right. Under 960px the controls precede the result in both visual and DOM order. The holdings editor starts collapsed, so a long portfolio does not push the result down until the visitor chooses to edit it.

The worked example compares $5,000 of NVDA with $5,000 of SPY against a $50,000 sample portfolio across seven holdings. The alternative can be changed or removed. When both choices match, the page explains that they are the same and shows one proposed mix.

The result starts with the resulting share of the purchased stock, explains whether it adds to an existing position, then states how the direct sector share changes and how the alternative differs. The comparison table shows the current portfolio and each proposed purchase together, with rows for the largest holding, the primary purchase's direct sector share when known, historical beta, and the average return on SPY's five worst days in the shared history. Proposed columns have a light tint. Beta has a plain definition beside its value.

The sector bars follow the table and use the same categories and colours across the current and proposed mixes. The legend includes categories present in any of those mixes. Fund holdings and unclassified holdings are explicit, and the nearby disclosure names their share in the current portfolio and after each purchase, including a category introduced only by the alternative. Funds are not broken down into their underlying sectors.

“Prices through …”, the shared daily-return count, and “Not investment advice.” sit beside the result. A disclosure holds the complete sector table, the longer model summary, and each purchase's correlation with the starting portfolio. The five worst market days remain a separate table below the calculator. The final disclosure explains the calculation and links to Investments.

## Editing and persistence

“Sample portfolio”, “Your saved holdings”, and “Your draft” identify the starting source with `aria-pressed`. Saved holdings are disabled when none exist, and the draft choice appears after a draft exists. A valid restored draft takes priority on reload, followed by saved holdings, then the sample.

The editor changes each holding's current dollar value and adds or removes holdings without leaving the page. Adding an existing symbol increases its dollar value. A portfolio can have up to 100 holdings, and an intentionally empty portfolio is supported. Invalid values receive an explanation and are not persisted.

Valid drafts are validated and saved under `before-you-buy-portfolio-v1`. The route never writes to `/investments`'s `portfolio_holdings`. If browser storage is unavailable, the editor says that changes stay in the tab. Saved holdings use shares multiplied by each symbol's latest available closing price; a saved holding without prices is named as excluded, and the visitor can enter its dollar value to include it. An entirely unvalued saved portfolio is not treated as an empty account.

The expanded holdings table scrolls within a 22rem cap. Purchase and holdings fields retain 44px minimum targets. Each stock-search instance has its own label, input, listbox, and option IDs. Suggestions inherit the route palette, stay within the viewport above or below the field, and support keyboard selection and click activation.

## Historical limits and unavailable states

Every proposed purchase starts from the same portfolio and adds new money. The historical calculation keeps the resulting weights fixed and uses the same consecutive SPY trading-date intervals for every holding, both purchase choices, and SPY. A missing close removes both adjacent intervals, so the model never joins across a missing day and reports that multi-day move as a daily return.

At least 30 shared daily returns are required for beta, correlation, and the worst-day comparison. Allocation remains visible below that threshold, with an explanation. Missing prices are named, and a retry action is available. Loading, invalid purchase values, invalid holding values, an empty portfolio, and an entirely unvalued saved portfolio each have a visible state. “Not investment advice.” stays visible through those states.

These are closing-price comparisons, with no dividends, taxes, fees, fund holdings breakdown, forecast, or account performance history. A different period can produce different results. The page describes what the purchase changes and does not recommend a purchase.

## Pinned for later changes

Keep one h1, “Before You Buy”, the independent-concept framing, and the exact disclosure “An independent concept by Isaac Vazquez, not affiliated with or endorsed by Google.” Keep “Not investment advice.” beside the result and retain the historical, fund, unclassified, and excluded-holding disclosures wherever the corresponding data is present.

Keep the same starting portfolio, equal purchase amount, additional-money assumption, common historical observations, 30-return minimum, and separate validated draft. The route's editable state must not overwrite saved Investments holdings. Keep the stock-search keyboard paths, distinct search labels, pressed source states, named scroll regions, and explanatory unavailable states covered by the route tests.

Keep the controls before the result in DOM order, the editor collapsed initially, and the result at the top of its own column on desktop. Printing opens closed disclosures, restores their previous state afterward, removes scrolling limits, and retains the data and disclosures. Reduced-motion preferences stop the local transitions.

The poster hero, enclosing plates, separate summary-metric strip, repeated metadata bands, and torn seams removed on 2026-10-12 remain cut. The rounded controls, route type scale, and neutral palette are permitted project-route choices inside the frame.

## Verified state, 2026-10-21

The initial full Jest run passed 491 of 494 suites, with 4,853 tests passing. The remaining three suites passed on retry with 38 tests after sandbox access and sitemap regeneration. The final focused run passed all 35 tests, including the regression for fund exposure introduced only by the alternative. Full lint is clean.

The final production build passed in `/private/tmp/before-you-buy-preview`, isolated from concurrent work in the shared `.next` directory. The implementation files in that build were compared with the workspace copies and matched. All six Chromium tests in `e2e/before-you-buy.spec.ts` passed against that build. The layout sweep reported 0 fail and 0 review across 12 sizes from 320px to 2560px, and the final contrast sweep reported no contrast failures in either theme.

The design detector reported 26 advisories, covering the local type scale and rounded controls, with no other findings. Those advisories describe permitted project-route decisions. The finish review inspected the source and six final captures, including light desktop, dark desktop, mobile, expanded editor, viewport preview, and print, and found no remaining material issue. The disabled add button uses full-opacity field and secondary-text colours, and the coverage note includes categories introduced only by an alternative.

Browser verification in this pass used Chromium. WebKit, Gecko, screen-reader use, and physical touch devices have not been verified.
