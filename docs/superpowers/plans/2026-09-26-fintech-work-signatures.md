# Fintech and work tools signatures implementation plan

This plan ships PR 4 of `docs/superpowers/specs/2026-09-25-project-specific-ui-design.md`, meaning the seven fintech and work tools rebuilt around their signatures and moved onto the Catalog 97 tokens, on branch `design/fintech-work-signatures`. The branch started from `design/personal-tools-signatures` (PR 2). PR 2 re-landed as #477 and the sports PR merged as #478 on 2026-09-27, so this branch merges `origin/main` and opens against `main`.

The shape is the same as PR 1 and PR 2. Each route reads its inks from `PROJECT_PRESS`, opens on `Catalog97ProjectHero`, and passes its signature in as the child. Signature geometry and formatting live in a pure, unit-tested helper beside the route, and the component only draws what the helper returns. Each route keeps its own CSS in a route-local stylesheet, so the tasks touch no shared file except the ones named below.

Everything under "Global Constraints" in `docs/superpowers/plans/2026-09-25-project-ui-foundation-and-data-dashboards.md` applies, and so do the traps in the `project-specific-ui-2026-09-25` memory. On top of those, the compliance copy on the three money tools and Investments stays word for word and always visible. That means it never goes into `.c97-disclosure`, which collapses, and never into the hero's `meta` line, which prints in caps. `HomeStatsPanel` comes out of every route here, but the component and the `.tool-*` styles stay until the close-out, since PR 3 changes consumers this branch can't see.

## Task 0: Groundwork

The seven press rows join `src/constants/projectPress.ts`, which are Budget Planner green and saffron, Interchange IQ blue and saffron, Rent vs. Buy teal and vermilion, Investments blue and saffron, Decision Lab pink and blue, the Enablement Assistant blue and saffron, and Job Search teal and vermilion.

The Decision Lab blank body gets fixed at its cause before any redesign. A page-wide Framer Motion wrapper started at `opacity: 0`, so the server sent every word of the page invisible and the page only appeared once the script hydrated and the fade ran. With scripts off, or in a screenshot taken before hydration, the body stayed blank. Budget Planner, Rent vs. Buy, Job Search, Travel Planner, and Food Map wrap their pages the same way. A test renders the pages on the server with the real Framer Motion (the route tests mock it, which is how this went unseen) and fails while the h1 ships at opacity 0, and a Playwright probe with JavaScript disabled measures the same thing in the browser. The fix drops the page-level fades.

## Task 1: Budget Planner (green, saffron)

Helper `src/app/fintech-tools/budget-planner/envelopes.ts`, tested beside it. `envelope(spent, budgeted)` returns the fill fraction, clamped at one, and whether the envelope is over budget and torn open, and it handles a zero budget without dividing by it. The signature is a row of envelopes, one per category, each filled by what was spent against what was budgeted and drawn torn open once it goes over. The expenses ledger reads as a check register with a running balance. The panel and the meta chip that repeats it go. The month stepper, CSV export, and `data-testid="budget-planner-shell"` stay.

## Task 2: Interchange IQ (blue, saffron)

Helper `src/app/fintech-tools/interchange-iq/feeStatement.ts`, tested beside it. `feeStatement(results)` puts every processor's monthly fee on one shared scale set by the most expensive, marks the cheapest, and keeps an outlier from flattening the rest. The signature is the statement, one bar per processor, and the breakeven bar moves out of the body text into its own figure. `calcProcessorResults` returns totals only, so nothing is stacked. The panel goes. The note that the interchange-plus totals leave out network and assessment fees, the educational note, and `data-testid="interchange-iq-shell"` stay.

## Task 3: Rent vs. Buy (teal, vermilion)

The existing `NetWorthChart` leaves the narrow rail and becomes the hero, on a paper plate since it draws data lines. Its helper moves into `src/app/fintech-tools/rent-vs-buy/netWorthChart.ts` with a test covering the break-even marker and a result where buying never pulls ahead. The three input cards sit under it. "Educational only, not financial or tax advice.", the assumptions and limits text, and the tax note stay word for word, and the assumptions move out of the collapsed `details` so they are always visible.

## Task 4: Investments (blue, saffron)

This is unification family 6. The module's own dark palette in `investments.module.css` (`.terminalScope` and its hex values) goes, and the terminal prints on espresso and chocolate sheets through the `--c97-*` tokens with mono numerals. The instrument tape, the allocation chart, and the retirement fan chart are the signature already. `PortfolioPerformanceChart` and `ComparisonRadarChart` read `--c97-*` names from their own element with no hex fallback. Both disclaimers stay word for word, `RetirementDisclaimer` renders on every planner state, and `data-testid="investments-shell"`, the "Investments" h1, `#research-section`, the `symbol=` and `section=` parameters, the stale-price fallback copy, and a shell width that holds across section navigation all stay for `e2e/investments.spec.ts`.

## Task 5: Decision Lab (pink, blue)

Helper `src/app/decision-lab/verdictStamp.ts`, tested beside it. `verdictStamp(evaluation)` maps ship, test, and hold to the stamp's word and its mark, and returns the weighted contributions in the order the list prints them. The signature is `DecisionMatrix` as the hero, with the verdict printed across it like a rubber stamp and the "Why this verdict" list beside it. The panel and the duplicate meta chip go.

## Task 6: Automation Enablement Assistant (blue, saffron)

A light print shop pass. The h1 becomes poster type, section h2s take `.c97-poster-sm`, and every surface change gets a seam. The model boundary note and the seed-data note stay.

## Task 7: Job Search (teal, vermilion)

Helper `src/app/mba-internship-notifications/pipelineStages.ts`, tested beside it. `pipelineStages(insights)` returns applied, responded, interview, and offer with the count in each and the conversion rate from the stage before, and a dash where the stage before is empty. The signature is the pipeline as stage columns with the needs-attention list pinned beside it. The panel goes. `live-jobs-grid`, `manual-checks-grid`, and the funnel and attention text the client tests pin stay.

## Task 8: Verification and review

Full Jest, `tsc --noEmit`, and ESLint on the touched directories. `e2e/investments.spec.ts` and `e2e/product-surfaces.spec.ts` against the dev server on port 3200. The contrast sweep over the seven routes, empty and with seeded localStorage. A probe at 390, 640, 820, and 1440 for horizontal overflow, hero icon size, rendered SVG text size, page errors, and Decision Lab's body in a headless screenshot, plus screenshots in both themes at 1440 and 390. One fresh review of the branch diff, fixes for Critical and Important findings, then a merge of `origin/main`, a sitemap regeneration, and the PR against `main`.
