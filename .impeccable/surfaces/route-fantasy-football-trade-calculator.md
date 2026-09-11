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


## Full-group loop, 2026-08-23

First time this surface was critiqued as part of the fantasy group. The whole record is in
`.impeccable/surfaces/route-fantasy-football.md` under "Full-group loop, 2026-08-23"; only
what is specific to the trade calculator is repeated here.

It scored 29/40. Six findings landed. The `h1` had read "Build a Trade Calculator", naming
the tool as the thing being built rather than the trade, and both verifiers upheld it. The
package-fit table drew its interior rules in `currentColor` instead of `var(--home-rule)`, so
the rules took the text colour. The idle coverage chip borrowed the warning tone, so an
untouched page opened looking like it was already warning about something. An armed "Confirm
clear" never disarmed, degrading a two-step guard on an unrecoverable action to one step. The
player combobox announced its no-results state to nobody and reported `aria-expanded` as
collapsed while the listbox was open. And the warnings panel silently truncated the model's
own limits at six, which is the one thing this surface must never do, since those limits are
the honesty framing.

Two findings were refuted 2 to 0 and should not be raised again: "both disclosures in the
evaluation rail have no expand affordance" and "the freshness row reports stale sources
during the initial load".

Measured after, in both themes at 390, 768, 1024 and 1440: zero AA contrast failures, zero
horizontal overflow, one `main`, one `h1`, zero unnamed `section` landmarks. The three 16x16
scoring radios flagged by a naive target sweep are visually paired with 324x44 labels, which
are the real targets, so they are not a defect.

## Full-group loop, 2026-09-11

First critique of this surface with the season open, part of the loop recorded in
`route-fantasy-football.md` under "Full-group loop, 2026-09-11". It scored 30 of 40 with one
P0 and two P1, all upheld two to zero. Snapshot at
`.impeccable/critique/2026-09-11T09-00-19Z__route-fantasy-football-trade-calculator.md`.

The P0 was a promise the code did not keep. The scope note said that from kickoff the tool
"declines a verdict rather than reading a frozen market", but `evaluateFantasyTrade`'s gate is
the four-day ADP age check and nothing else, and the ADP feed was still sampling real drafts
daily (the window moved from 09-09 to 09-10, 4,588 to 3,631 drafts, with ADP changing for 214
of 236 players), so Chase for Gibbs rendered "Supported coverage, Balanced offer" under a
"fresh sources" stamp, and the model doc described a Week 1 rule the engine never had. Both
verifiers said the note and the doc should change, not the engine, because the staleness gate
tracks the data and already withholds when the feed stops (verified with a five-day-old
stamp). So the note is rewritten in the true tense with two branches, feed still sampling as of
the printed date or feed stopped and verdict withheld, and the doc describes the age gate. One
engine addition came from verifier A: from Week 1 a warning caps coverage at `limited`, so a
clear edge and the green chip cannot appear in season. Chase for Watson went from "Clear edge
to the other side" to "You are giving more". Four engine tests and three client tests pin it,
and the client suite now fakes the date because a real-date snapshot silently flipped to
in-season on 2026-09-09.

The two P1s were routing and the scale. This was the only scope note in the group without the
weekly-board link, so the sibling sentence and links to weekly and waivers are in the note and
"View rankings" stays the header action. The balance scale marker sat at 0px for a 3.9% gap
and moved 11px of a 100px range for a 12% lean, and at 390 the rail landed at 856px in an
844px viewport after the second add with focus still in the combobox. The track is scaled to
the verdict thresholds now, with a drawn plus or minus five percent band and a fifteen percent
line, so the 12% lean moves 42px and a 90% gap reaches the outer tick; and a sticky verdict
strip under the site header carries the verdict, coverage, and a 44px link to the rail on
phones, where auto-scrolling would have fought the combobox.

Two P2s fell out of the same files: the idle rail reads "Waiting for players" instead of "Not
current" under a header that says fresh, and a balanced verdict wears ink rather than the
warning tone, which is reserved for withheld. Still open: the minute-precision timestamps in
the rail (`formatUpdatedAt` in shared `fantasyUtils.ts`) and verifier B's thinning-sample
caveat, recorded in the doc as model work. The three 16x16 scoring radios still flag in a naive
target sweep at 390 and 768 for the reason recorded above, with one more detail: `html` sets
`scroll-behavior: smooth`, so a sweep that calls `scrollIntoView` and hit-tests immediately is
measuring mid-animation. Set it to `auto` before measuring.

Verified after in both themes at 390, 768, 1024 and 1440, idle and populated: zero AA contrast
failures, zero horizontal overflow, one `main`, one `h1`, zero unnamed sections.

One CI lesson from the same day. The narrow-screen e2e test on this route walks every visible
anchor in the shell and holds it to 44px, and the two links the clarify pass put inside the
note's prose measured 18px, so CI's second shard went red while the same spec had passed four
times against the dev server here. The links now carry `inline-flex min-h-touch` with negative
vertical margins so the sentence keeps its line rhythm, measured at 94x44 and 93x44. The
sibling notes on the other surfaces keep their inline links under the 2.5.8 prose exemption,
because their specs do not hold anchors to the floor and their briefs recorded the exemption;
this route's brief says 44px controls, so here the floor wins.
