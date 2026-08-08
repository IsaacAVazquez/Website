---
target: fantasy football
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-07T15-28-23Z
slug: route-fantasy-football
---
Method: dual-agent (A: af54eb5909673d0be · B: ad7e6b2a38e5874f7)

Target: `route:/fantasy-football` (board, redraft tracker, best ball board, best ball tracker). Mode: Operate. Dev server was already live on :3000.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | 16 `aria-live` regions across the group, and the one state that must be announced is not. The timer chip carries `aria-live="off"` and "Your pick is live" is a plain `div` with no live region (`DraftBoard.tsx:249`). |
| 2 | Match System / Real World | 3 | "Log pick", "on the clock", "Bye", "Need RB" are right. "Modeled room rank", "room-relative draft process model", and "Slots per judged pick" are internal model vocabulary shipped to a mixed-fluency audience. |
| 3 | User Control and Freedom | 2 | Multi-step undo, undo-to-pick, redo, and armed reset confirmations all exist. Undo measures y=9549 at 390px, and every filter tap calls `router.push` (`fantasy-football-client.tsx:374`), so Back never leaves the page. |
| 4 | Consistency and Standards | 2 | The same player data takes two shapes across the two boards, and the worse shape is on the surface with the clock. Duplicate `h1` across the two best ball routes. One surviving `--home-moss`. |
| 5 | Error Prevention | 3 | Armed confirms on Clear queue and Reset draft, disabled pills that state their reason, ADP surfaces suppressed when `adpSource` is null. Nothing guards logging the wrong player at the wrong pick. |
| 6 | Recognition Rather Than Recall | 3 | Tier separators, queue rail, need chips, and the still-available strip are strong. Undone by nothing being sticky, so pick context becomes recall the moment you scroll. |
| 7 | Flexibility and Efficiency | 2 | Density toggle, tier columns, URL state, three export formats. Zero keyboard shortcuts on a clock-driven surface, no next/prev in the drawer, no `Cmd+Z` despite a full undo stack in `useDraftState`. |
| 8 | Aesthetic and Minimalist Design | 2 | Four routes, four display headlines, four pitch paragraphs ahead of every control. The system is beautiful and the pages are not minimal. |
| 9 | Error Recovery | 3 | Error card with Retry, per-slice unavailable states that name the reason, empty states that name the fix. The snapshot error path is one generic line. |
| 10 | Help and Documentation | 3 | Legend, MetricTooltips, FAQ, and in-panel assumption disclosure are above average. The legend is collapsed and sits at the top rather than near the board, and the tracker carries more jargon with no legend at all. |
| **Total** | | **25/40** | **Acceptable** |

All ten heuristics apply. This is an Operate surface, so 7 and 10 are not eligible for `n/a`.

## Design Specificity Verdict

**The Working Instrument is genuinely present in the atoms and largely absent from the composition.**

The material layer is authored. Limestone paper, graphite ink, hairlines doing the separating, flat plates with tonal steps rather than shadow, Fragment Mono micro-labels, tabular numerals on every rank. The tier rail in `RankingsListRow.tsx:71-81` is the best single piece of design thinking here, because it grades signal orange by tier depth and then overrides that grade with a full-signal layer on queue or hover, so one 3px element carries three facts without spending a column. That is a system-native idea rather than a borrowed one, and `getPositionTone` derives every position chip from existing tokens instead of importing the fantasy-industry rainbow.

The composition drifts, and it drifts in one direction. All four routes open with the same template, which is a kicker, a `clamp(2.15rem, …, 4.2rem)` display headline, a four-to-seven-line pitch paragraph, and a row of CTA pills. That template is correct for a portfolio landing page and wrong for four Operate surfaces. Measured on the redraft tracker at 390px, the page is 10,757px tall, the draft board heading sits at y=1645, and the first "Log pick" button, the primary action of the whole product, sits at y=2274, which is 2.7 screens down. On that same page the largest type on screen is "Manual draft tracking that actually stays usable," and the pick clock is a gray pill visually identical to "Built Aug 6, 2026, 5:19 PM."

Could an unrelated fantasy site use this unchanged? The atoms, no. The layout, yes, almost entirely. The genuinely product-specific opportunity being missed is that a draft has a cadence, where every 90 seconds something happens and the interface should reorganize around that beat. Right now nothing is sticky, so the moment you scroll to find your guy you lose the pick number, the team on the clock, and the timer. The surface knows it is running a draft and never acts like it.

**Deterministic scan.** `detect.mjs --json src/app/fantasy-football src/components/fantasy` returned `[]`, exit 0, across 57 scannable files. That zero was proven to mean "nothing matchable" rather than "clean", with a positive control. A planted `.tsx` carrying a `#667eea→#764ba2` gradient, `borderRadius: 24px`, a 40px glow, `fontFamily: Inter`, `transition: all`, and `backdropFilter: blur(12px)` also returned 0 findings, while the identical declarations in a `.css` file and in a styled-components literal each fired `overused-font`. The regex engine does not read JSX inline style objects, and this surface styles entirely through Tailwind utilities plus inline style objects referencing custom properties. `src/app/globals.css` produced 5 findings, all inside `.prose-writing` selectors that these routes never reach, so they are false positives for this target. URL mode was skipped because puppeteer is not installed, which means the detector's browser-engine visual rules never ran at all.

**Where the two assessments met.** The detector found nothing, and the browser sweep found plenty, so the browser measurements are carrying this run. The design review and the evidence agreed independently that the draft tracker is the weak route. The evidence caught four things the review missed entirely, which are the skip link, the light-mode status-token contrast, the heading-level collapse, and the surviving `--home-moss`. The review caught the composition problem, which no detector can see.

**Visual overlays.** None. No user-visible overlay was injected, and no live server was started for this run.

## Overall Impression

The restraint in this tool is real and it is the credibility of the whole thing. `valueSignalAvailable` suppresses the Value/Reach chip on position boards because `rankEcr` is position-scoped there and not comparable to an overall ADP, and that gate is threaded consistently through the row, the drawer, and the compare modal. ADP surfaces disappear when `adpSource` is null. Tier count reads "Not published" rather than zero. Most tools would have shipped the number and let the user sort it out.

What is wrong is that the pages are still shaped like marketing and the work is buried underneath. The single biggest opportunity is to let the draft tracker stop introducing itself once a draft is running, and put the clock, the board, and undo where a thumb can reach them.

## What's Working

**Freshness is treated as data rather than decoration.** `getSnapshotStaleness` buckets against the actual weekly refresh cadence, under 8 days current, 8 to 14 aging, over 14 stale, and returns "stale" for any missing or unparseable date, so the failure mode is a visible warning rather than a silently confident timestamp. The ADP card goes further and explains prior-season carryover in plain language.

**The refusal to render what the data cannot support.** Described above. It is enforced in code rather than left to convention, which is why it holds.

**Theming discipline.** Zero hardcoded hex values, zero legacy `--surface-*` or `--color-*` tokens, zero `transition-all`, zero `color-mix` toward literal white or black, zero arbitrary `text-[Npx]`, and all four Framer Motion consumers call `useReducedMotion`. Radii resolve to 8px and below on plates. One legacy accent survives out of 57 files.

## Priority Issues

**[P0] The skip link is keyboard-reachable and never becomes visible**

`src/app/layout.tsx:139` uses `sr-only focus:not-sr-only`, but `src/app/globals.css:723` declares a second, unlayered `.sr-only`. Unlayered CSS outranks anything inside a cascade layer, and Tailwind's `focus:not-sr-only` lives in `@layer utilities`, so it can never win. Verified with a real Tab press from a fresh load, where the focus background and color did apply while computed geometry stayed `width: 1px; height: 1px; clip: rect(0,0,0,0)`.

*Why it matters:* this is the first tab stop of every page on the site, not just these four. A keyboard user tabs into a control they cannot see, and the site's own accessibility commitment in PRODUCT.md says these standards are preserved rather than optional.

*Fix:* delete the unlayered `.sr-only` at `globals.css:723` and let Tailwind's layered utility own it, or move that block into `@layer utilities`. One line. Check `.skip-link:focus` at `globals.css:717` at the same time, since it references the legacy `--color-primary` token and no element on this path uses that class.

*Suggested command:* `/impeccable audit`

**[P0] On the draft tracker, the primary action, the recovery action, and the clock all carry the lowest weight on the page**

At 390px the page is 10,757px tall, the first "Log pick" is at y=2274, and Undo is at y=9549. On desktop that Undo sits inside `aside[aria-label="Draft outlook"]`, which holds 1873px of content in a 788px scroll container, so it needs a nested scrollbar to reach. Meanwhile "81s on the clock" renders as the fifth gray pill in a row of gray metadata pills, styled like "Built Aug 6, 2026, 5:19 PM", and only changes appearance after it has already expired. `DraftBoard.tsx:249` renders "Your pick is live" as a non-interactive `div` with `rounded-full border` and the same paper tint as the segmented toggle beside it, so it impersonates a control and reads as chrome.

*Why it matters:* someone drafting on a phone scrolls almost three screens to make a pick and eleven screens to fix a mistake, against a clock. Nothing is sticky, so the pick number, the team on the clock, and the timer all leave the screen as soon as they scroll the board.

*Fix:* collapse the hero to a single line of live state when `!showSetup`, move the board above the rail on mobile, and give the clock its own row in tabular Fragment Mono at display size with `--home-signal` engaging under 15 seconds rather than only at zero. Promote Undo and Redo out of the Actions card into a persistent bottom bar. Make "Your pick is live" a signal-bordered banner with `aria-live="polite"` and strip the pill styling.

*Suggested command:* `/impeccable layout`

**[P1] The status tokens fail contrast as text in light mode**

42 failing nodes on `/fantasy-football/best-ball`, all ADP delta values at 18px/600 desktop and 14.26px/600 mobile, both needing 4.5:1. `--home-warning: #D97706` on paper measures 2.92:1 and `--home-positive: #059669` measures 3.45:1, both defined at `globals.css:284-285`. `--home-negative: #DC2626` is 4.43:1, also under, and currently only escapes because it appears as `borderColor` and never as text. Dark mode passes cleanly because `#34D399` and `#FBBF24` are far lighter. One more failure on the tracker, where `--home-ink-muted` reads 4.25:1 on the signal-tinted tile at `DraftAnalyticsPanel.tsx:140`, against 4.88:1 on plain paper.

I trust these numbers because the parser was sanity-checked first. Ink on paper measured 16.29:1 against an expected 16.5:1, which is the check that catches the `color(srgb …)` misparse this palette invites.

*Why it matters:* this is a design-system defect surfacing on a fantasy route, so it is failing everywhere the light-mode status tokens carry text. Gains and losses are exactly the values people squint at.

*Fix:* darken the light-mode values of `--home-positive`, `--home-warning`, and `--home-negative` until each clears 4.5:1 on both `--home-paper` and `--home-paper-alt`, then re-sweep the surfaces that use them as text. Do not fix this locally in the fantasy components.

*Suggested command:* `/impeccable audit`

**[P1] Fifty touch targets on the draft board sit at 36px, and compare is unreachable on mobile**

`DraftBoard.tsx:471, :490, :503` all set `h-9 w-9`, which renders 36×36, eight pixels short on both axes of the 44px floor that CLAUDE.md and PRODUCT.md both state. 53 undersized targets at 1440 and 56 at 390 on that one route, against 1 elsewhere. Separately, `RankingsListRow.tsx:166` sets the compare toggle to `hidden … sm:inline-flex`, so 58 compare buttons exist in the DOM at 390px and zero are visible, and `DraftBoard.tsx:490` swaps its compare button for a details button below `sm`. Yet the compare tray, once populated, is a permanent fixed 100px band across the bottom of the viewport, where it overlapped the row beneath it and clipped "Brock Bowers" to "ck Bowers."

*Why it matters:* the surface brief records touch targets as verified at `min-h-[48px]`, which is true of the routes it measured and not of the draft board. Mobile pays the tray's cost for a feature it cannot use.

*Fix:* raise the three action buttons to 44px. Show the compare toggle on mobile, or if compare is desktop-only by intent, stop rendering the tray below `sm` and give it a collapse control so it can be minimized without clearing the selection.

*Suggested command:* `/impeccable adapt`

**[P1] The compare modal encodes the winner in background alone, and treats noise as signal**

`CompareModal.tsx:271` reads `color: winner === index ? "var(--home-ink)" : "var(--home-ink)"`, an identical ternary, so the only cue is an 18% signal wash with no text, no icon, and no accessible name. The grid is a `display: grid` of `div`s rather than a table, so a screen reader gets a flat run of label-value-value with no column association to the player names. The win logic highlights every row with a distinct value, so "Rostered 99.3% vs 99.2%" gets the same weight as "Consensus rank 1 vs 2", which in a two-player test produced four full-width orange bands stacked on one side and blew the accent budget inside the panel.

*Why it matters:* meaning by color alone fails the site's own accessibility floor, and manufacturing significance out of a 0.1-point difference is the opposite of the restraint the rest of this tool is built on.

*Fix:* mark the winning cell with a text or icon token carrying an accessible name, keep the tint as reinforcement. Rebuild the grid as a real `<table>` with `<th scope="col">` on the player headers. Add a minimum meaningful delta per row.

*Suggested command:* `/impeccable harden`

## Persona Red Flags

**Casey (distracted mobile)** fails hardest, on the route where stakes are highest. Logging a first pick means scrolling 2,274px and undoing a mis-tap means scrolling 9,549px. Nothing is sticky, so pick number, team on the clock, and timer all leave the screen. The compare tray occupies the thumb zone permanently while the feature it belongs to is hidden below `sm`, so it is pure cost. Back-swipe does not work either, because `updateRouteState` at `fantasy-football-client.tsx:374` uses `router.push` for every filter change, and clicking four position pills took `history.length` from 5 to 9.

**Sam (screen reader, keyboard only)** cannot tell who won any comparison, because the only cue is a background color and the grid has no table semantics. Sam also never learns it is their turn, since the timer chip is explicitly `aria-live="off"`, "Your pick is live" has no live region, and no announcement fires when a pick logs. The skip link is Sam's first tab stop and it is invisible. Positively, the drawer and modal focus traps are correct with focus restore, and full-row buttons carry proper labels, though two of those labels ship em dashes into spoken output at `RankingsListRow.tsx:91` and `PositionFilterBar.tsx:83`.

**Alex (impatient power user)** gets a keyboard-free interface on a timed task. No shortcuts anywhere, no `/` to focus board search, no type-ahead-to-draft, no `Cmd+Z` despite the full undo stack. The player drawer has no next or previous, so evaluating five candidates means five open-close cycles. The draft board's `BOARD_PAGE_SIZE` of 25 forces a "Load more" click that the rankings board does not require, so the two boards disagree about how fast Alex is allowed to move.

**The search arrival (project-specific, derived from the surface brief).** Someone landing from a Google query on fantasy rankings has no idea who Isaac is and no reason to read a positioning statement. They get one anyway, on all four routes, before any control. They also meet "Modeled room rank 3 of 3" three picks into a draft, captioned "Ahead of 0% of same-progress teams," in 40px display type with the qualifying "Early read" chip at 10px. That is noise rendered as a verdict, and the verdict is that they are losing.

## Minor Observations

The mobile position filter hides three of its eight options. `PositionFilterBar.tsx:43` sets `overflow-x-auto` with `[scrollbar-width:none]` and `[&::-webkit-scrollbar]:hidden`, and at 390px `scrollWidth` is 502 against `clientWidth` 309, so 193px is off screen, which is Flex, K, and DST. There is no fade and no chevron. The best ball contest lens does show its scroll track, so the site contradicts itself on the same interaction. Eight pills at 44px wrap comfortably into two rows at 390px.

A heading level collapses on the draft tracker. `DraftBoard.tsx:210` is an `h2` and `draft-tracker-client.tsx:415` is an `h3`, and both carry `text-2xl font-semibold`, so both render at 34px desktop and 24.875px mobile. The level change is announced to a screen reader and invisible on the page.

One legacy accent survives. `best-ball/draft-tracker/best-ball-draft-board.tsx:21` returns `var(--home-moss)` for TE, inside a `positionColor()` switch whose other branches are already migrated. Worth noting that the rest of that switch spends `--home-signal`, `--home-positive`, and `--home-warning` on position identity, so a green RB chip and an amber TE chip read as "good" and "caution" to anyone who learned those colors elsewhere on this site.

Two em dashes ship in visible copy against the binding voice rule, at `DraftAnalyticsPanel.tsx:141` and `DraftSetup.tsx:219`. Both become commas. The `—` used as a null-value marker elsewhere is a different thing and is fine.

The board search placeholder is broken on six of eight boards. `fantasy-football-client.tsx:827` calls `.toLowerCase()` on `FANTASY_POSITION_LABELS[position]`, which renders "Search te board…", and the same for qb, rb, wr, k, and dst.

Best ball's board and its draft tracker carry an identical `h1`, so the headline cannot tell you which page you are on.

One unnamed `<section>` per tracker route, the `section.home-page.home-dash` wrapper, is not exposed as a landmark. Every `<nav>` is named, and every route has exactly one `<main>` and one `<h1>`.

Zero console errors and zero failed network requests on all four routes. Zero horizontal overflow at 390px in either theme. On a position board every row repeats the same position chip, so the TE board carries 149 chips reading "TE".

Riley's edge cases hold up better than average. `formatRankValue` returns "--", `formatOwnership` returns "Not listed", `getSnapshotStaleness` defaults to stale on a bad date, and the `localToolsMemoryOnly` banner covers blocked storage. The gap is the compare tray chip at `max-w-[8rem]`, which truncates two long names into near-identical stubs.

Out of scope, noted once: the "FANTASY FOOTBALL" kicker, the footer "Now" link at 34.8×44, and the ContactCta heading all come from site-wide furniture rather than these routes.

## Questions to Consider

If the visitor is on the clock, what is the display headline for? Would anything be lost by rendering the `h1` only when `showSetup` is true, and replacing it with live pick state the moment a draft is running?

The Draft Outlook tells you that you rank 3 of 3 after three picks. What is the smallest number of picks at which that ranking is worth showing, and why is it showing before then instead of holding the space and saying so?

Two surfaces present the same player data in two different shapes, and the worse shape is on the surface with the clock. Which one is the real design, and why has the other not converged on it?

The compare modal highlights a 0.1-point difference in rostered percentage with the same emphasis as a rank difference of one. What is the smallest difference on each row that should change a decision, and where does that threshold live in the code?

If the detector cannot see a single line of this surface's styling, what is the actual mechanical check for this codebase, and should it be a Playwright assertion on computed values rather than a regex over source?
