---
version: 1
slug: "route-fantasy-football-trade-calculator"
primary_target: "route:/fantasy-football/trade-calculator"
related_targets: ["src/app/fantasy-football/trade-calculator/page.tsx","src/app/fantasy-football/trade-calculator/trade-calculator-client.tsx"]
---

# Fantasy Football Trade Calculator

## Scope and mode

- Primary target is `route:/fantasy-football/trade-calculator`.
- Mode is Operate. A user should be able to enter league settings, build both sides of a trade, understand the evidence, and revise the offer without leaving the workspace.

## Audience and job

The primary user is managing a one-quarterback redraft league and wants to compare an unequal player trade against sourced market and expert inputs while accounting for scoring, league size, lineup, roster depth, and any required roster cuts.

The main action is to add players to You give and You get, then read a plain verdict with its evidence and limits. The result must never imply projected points, win probability, dynasty value, or a guarantee.

## Proof and constraints

- Every source has an as-of date and a visible coverage state.
- The result is withheld when a required input is stale, unsupported, or materially incomplete.
- Player selection is keyboard operable and prevents duplicates across both sides.
- Private player selections persist as IDs in versioned browser storage. League settings live in the URL.
- The page uses the existing Working Instrument system, one page-level `h1`, no nested `main`, 44px controls, dark mode, and no required motion.
- The first version supports PPR, Half PPR, and Standard managed redraft. Unsupported formats are stated plainly.

## Approved direction

The approved composition is the operational deal desk in `.impeccable/mocks/trade-calculator-comp-c-deal-desk.png`, approved August 13, 2026.

A narrow settings rail sits left, the Give and Get ledger owns the center, and a pinned verdict rail sits right on large screens. Mobile stacks settings, Give, Get, then verdict. The memorable moment is the calibrated balance scale moving as a player is added while the source mix and roster-cut cost remain visible beside it.

## Implementation inventory

| Ingredient | Commitment | Medium |
| --- | --- | --- |
| Compact task header | Breadcrumb, one `h1`, plain orientation copy, source freshness | Semantic HTML and existing navigation components |
| League settings rail | Scoring, teams, starting QB, lineup, roster size | Semantic fieldsets, radio groups, and number controls |
| Give and Get ledger | Two visible fieldsets, independent comboboxes, ordered selected-player rows, swap and reset | React, semantic HTML, existing fantasy tokens |
| Verdict rail | Calibrated balance scale, textual verdict, coverage, sources, limits | HTML, CSS, and authored SVG for the scale |
| Evidence mix | Market, expert, and league-fit readings with dates and coverage | Mono readout rows and accessible tooltips |
| Roster impact | Before and after starter and bench impact, including required cuts | Responsive semantic table or ledger rows |
| Persistence | IDs and versioned settings only, cross-tab safe | Existing browser-storage helpers |
| Responsive behavior | Three-column desk at large sizes, single-column task order on mobile | CSS Grid and container-aware wrapping |

## Source decision at approval

The existing snapshot has draft consensus and mock-draft ADP but no rest-of-season projections, observed trade market, or named creator outputs. The source adapter and model must keep those inputs separate. If a defensible licensed in-season source is unavailable, the shipped promise must narrow to a preseason redraft balance estimate instead of relabeling draft ranks as trade market data.

## Implemented state, August 13, 2026

The approved deal desk is implemented in the existing Working Instrument world. On large screens, the workspace uses a 15rem settings rail, a flexible center ledger, and a 20rem evaluation rail. Both side rails stay pinned below the site header, while the Give and Get fieldsets share the center only at the widest breakpoint. On smaller screens, the DOM and visual order is league settings, You give, You get, evaluation, then package fit.

The first view contains the breadcrumb, one `h1`, the preseason scope, dated source status, league settings, both trade ledgers, and the evaluation rail. Signal Orange is limited to selection, focus, balance position, and status. Hairlines, small-radius plates, muted paper layers, and mono tabular readouts carry the rest of the hierarchy in light and dark themes.

The source decision is closed. This route is a preseason one-quarterback redraft estimate built from overall expert consensus and current mock-draft ADP, with league-specific replacement lines. It does not claim rest-of-season projections, completed-trade market data, named creator values, win probability, dynasty value, or injury advice.

## Route-specific invariants

- Keep expert consensus, draft market, and league fit visible as separate evidence rows with dates or a plain unavailable state.
- Withhold exact values and the verdict unless both required sources cover every selected player with usable data. Keep sensitivity ranges and coverage warnings next to the verdict.
- Keep the balance scale, both package values, roster-slot effect, evidence mix, and model limits together in the evaluation rail.
- Keep league settings in the URL and player IDs in versioned browser storage. A scoring change selects the saved trade for that scoring model instead of copying a calculated result.
- Keep player search keyboard operable, prevent duplicates across both sides, cap each side at six players, and preserve swap plus confirm-to-clear controls.
- Keep the package-fit table below the desk and describe only the assets in the offer against league-specific starter and roster lines. Do not present it as a projection of either full roster.
- Keep the balance marker's short transition behind the reduced-motion guard, and keep the methodology disclaimer as the surface's single Instrument Serif italic gesture.

## Finish review

Final review passed on August 13, 2026, after all four findings were resolved. The checked states cover empty and populated deals, the methodology disclosure, light and dark themes, and desktop and mobile layouts. The composition is complete and should not be reopened without a new product or data requirement.
