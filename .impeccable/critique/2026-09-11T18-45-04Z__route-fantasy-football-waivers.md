---
target: fantasy football waiver targets
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-09-11T18-45-04Z
slug: route-fantasy-football-waivers
---
Method: dual-agent re-score after the 2026-09-11 remediation; compare against route-fantasy-football-waivers.md (A: design review in Chromium at 1440 and 390 in both themes, PPR / Half PPR / Standard driven through the pills, plus the table region focused by keyboard at 768, scored before the earlier scores were re-read · B: each before P0/P1 checked at source and in the browser with one measurement, the sweep's measure.js re-run on the remediated page at 390/768/1440 in both themes; merged at synthesis. Scripts and 38 screenshots in rescore/route-fantasy-football-waivers/, measurements in measure.json there.)

# Critique: Fantasy Football Waiver Targets (/fantasy-football/waivers)

Scope note: this is a post-remediation re-score. The before critique (30/40, 0 P0, 2 P1, both upheld 2-0) was written against the route as split on 2026-09-09; the remediation merged in commit 6d12f70 ("weekly board and waiver targets clarify, adapt, and layout passes") and the dev server serves it. Same data as the before pass, 2026 Week 1 built 2026-09-10, so every row count and stamp is directly comparable. Everything here is the `view="waivers"` path of `src/app/fantasy-football/weekly/weekly-client.tsx` and the shared header; the rankings view is the sibling agent's.

## Design Health Score

| # | Heuristic | Score | Key Issue | Before |
|---|-----------|-------|-----------|--------|
| 1 | Visibility of System Status | 4 | Both boards stamped with their own time and expert count, the chip is the worse of the two, and a visible count line ("17 players clear the gap in Half PPR scoring") is a live region that follows every scoring tap; the price is a 138px, six-line stamp on the phone's first screen | 3 |
| 2 | Match System / Real World | 3 | Gap now leads the numbers on both layouts and every value on the phone carries its label; the two rank spaces are still sorted into one list on a derived number with no sentence saying so, and Percentile still prints unitless beside a 10.4% | 3 |
| 3 | User Control and Freedom | 3 | Unchanged. replace not push, scoring in the URL; no sort, no cut, inert rows (search and position filter are recorded product work) | 3 |
| 4 | Consistency and Standards | 3 | The h2 no longer repeats the h1 and both boards get a source link like the rankings footnote; the same file still pins the rankings header row and leaves this one static, and the lead sentence is still printed twice | 2 |
| 5 | Error Prevention | 4 | Unchanged. Every gate is printed with its live number, no bid is invented; the 20-row cap is still unstated | 4 |
| 6 | Recognition Rather Than Recall | 3 | At 390 the table is gone and a stacked list puts Gap 66.6, Board, Rank, Percentile and Rostered under each name with nothing off screen; from md up the column labels still scroll away under the site header before the last rows arrive | 2 |
| 7 | Flexibility and Efficiency | 2 | Unchanged, and the new focusable region is a tab stop that never scrolls at any width where it exists | 2 |
| 8 | Aesthetic and Minimalist Design | 3 | One title, one count line, a clean mono ledger from md up and a quiet list below; the hero clause is still repeated as the card's first sentence and the phone stamp got bulkier | 3 |
| 9 | Error Recovery | 4 | Unchanged. role="alert" with Try again, warning-toned not-published note, honest empty sentence now in a status role | 4 |
| 10 | Help and Documentation | 4 | Method paragraph intact with live denominators, footnote names both boards and links both source pages, tests now assert the stamps, the count, the region and the header order; the cap is still the one thing the copy does not say | 4 |
| **Total** | | **33/40** | **Good band (28 to 35): solid foundation, address the weak areas** | **30** |

All ten heuristics applied (Operate surface). Per-heuristic deltas: H1 +1, H4 +1, H6 +1, the rest 0. The three that moved are the three the two P1s and the closed P2s touched; nothing dropped.

## Design Specificity Verdict

Mechanically, the sweep's own measure.js on the remediated page reads clean on every cell: contrast 0 failures across 178 to 267 measured text elements per cell (floor 5.35 light on the 16.35px hero paragraph, 5.99 dark on the 11px "Quarterback source board" link), zero document overflow at 390/768/1440 (scrollWidth equals clientWidth on all six cells), zero targets under 44px across 23 to 32 checked with three exempt inline links, one main, one visible h1, zero unnamed sections, zero heading skips, and one live region on every cell where there were zero before. Console still carries the one Chrome preload warning and the network still shows two `weekly.json` requests (`other` then `fetch`), unchanged.

Visually, the page reads as the same authored instrument with the two half-truths removed. The stamp line now says "2026 Week 1 · Flex updated Sep 10, 2026, 7:26 PM, 157 experts · QB updated Sep 10, 2026, 7:02 PM, 142 experts · Current" on one line at 1440, and the flex expert count changes with scoring (160 on Half PPR, 157 on Standard at 7:23 PM) while the QB stamp holds, which is the honest shape. The card is retitled "This week's list", a mono count line sits between the method and the rows, Gap moved to the second column in bold ink so the eye lands on 66.6 right after the name, and the footnote names 457 flex and 100 quarterback rows with two underlined source links. On the phone the ledger is gone; each of the nineteen entries is a name over a two-line mono readout, Gap first and emphasized, and nothing is clipped. Dark mode is at parity in every screenshot. What the fix cost is on the same first phone screen, where the stamp that was three lines is now six with a separator dot sitting alone on a line, and one new keyboard stop that leads nowhere.

## What closed

1. [P1] On a phone the table shows names and nothing else. **Closed.** At 390 in both themes `useTableLayout` (`weekly-client.tsx:77-111`, `(min-width: 768px)`) renders the `ol` (`:660-706`) and no `table` exists in the DOM; document scrollWidth is 390; the first item reads "Michael Mayer TE LV vs. MIA" with the pairs Gap=66.6, Board=Flex, Rank=106, Percentile=77.0, Rostered=10.4% (`liPairs` in measure.json), and the screenshots show all five values under every name. At 768 the table renders inside a `role="region"` with `tabindex="0"` and `aria-label="Waiver targets table"` (`:588-593`), scrollWidth 678 equals clientWidth 678, the Gap header sits at x 357 to 418 directly after Player, and a keyboard Tab from the Standard pill lands on the region with the 2px signal outline (`light-768-default-region-focus.png`). At 1440 the six columns run Player 53 to 672, Gap 672 to 794, Board, Rank, Percentile, Rostered 1245 to 1387, no min-width on the table (`:594`).

2. [P1] The freshness stamp describes only the flex board, and the table is one third quarterbacks. **Closed.** `weekly-client.tsx:260-267` computes `flexStaleness` and `quarterbackStaleness` and, for the waivers view, `pickWorseFantasySnapshotStaleness` (`fantasyWeeklySnapshot.ts:93-98`, unit-tested at `fantasyWeeklySnapshot.test.ts:193-200`); the header (`:382-405`) prints both stamps. Rendered on every cell: "Flex updated Sep 10, 2026, 7:26 PM, 157 experts · QB updated Sep 10, 2026, 7:02 PM, 142 experts · Current", and the driven toggles read 160 flex experts on Half PPR and 7:23 PM / 157 on Standard with the QB stamp fixed at 7:02 PM / 142, matching the snapshot. The QB row count is still six of nineteen, and `weekly-client.test.tsx:271-284` asserts both stamps and that a stale quarterback board alone flips the chip.

3. [P2] A scoring tap changes the list silently. **Closed.** `:582-586` renders `<p role="status">` with "19 players clear the gap in PPR scoring"; the driven sequence recorded "17 players clear the gap in Half PPR scoring" then "18 players clear the gap in Standard scoring" then back to 19, with the URL following (`?scoring=half_ppr`, `?scoring=standard`, `?scoring=ppr`). The empty sentence also carries `role="status"` now (`:570-576`). One live region on every cell.

4. [P2] The sibling's sticky header and scroll box did not cross over. **Still open.** `STICKY_HEADER_CLASS` is applied to the rankings `th`s at `:825-854` and to none of the waivers `th`s at `:597-616`; every waivers header cell measures `position: static`. See Priority Issues 1.

5. [P2] The list is capped at 20 and the copy says everyone who clears the gap is listed. **Still open.** `getFantasyWeeklyWaiverCandidates(board, limit = 20)` (`fantasyWeeklySnapshot.ts:280-283`) still slices at `:310`, and the sentence at `weekly-client.tsx:564-565` still reads "clear a gap of at least 20 to be listed at all". Counts are 19/17/18, one short of biting.

6. [P2] The snapshot preload is not reused. **Still open.** `waivers/page.tsx:44-46` still preloads with `as: "fetch"` and no `crossOrigin`; the Chrome warning reproduced on all twelve cells and the network shows the `other` request followed by the `fetch`.

7. [P2] The title and the lead sentence are each printed twice. **Partially closed.** The h2 is "This week's list" (`:546`), so the title duplication is gone. The card paragraph still opens "Players the experts rank ahead of where the rostering rate puts them." (`:549-550`) under a hero that opens "The players the experts rank ahead of where the rostering rate puts them" (`:364-365`). The paragraph is unchanged at 159 words, and with the count line added the distance from the h2 to the first row at 390 is now 516px (h2 at y=707, first item at y=1223), up from about 430.

## Priority Issues

1. **[P2] The waivers header row still scrolls away under the site header, while the rankings header row in the same file is pinned.** Measured at 1440 light and dark: with the last row centered (scrollY 1160) the first `th` sits at y=-318 and the site header is `position: sticky` at 73px; `light-1440-default-scrolled.png` shows eleven rows and no column labels. The region is 788px tall against a 900px viewport, so the labels are gone before the reader reaches row twelve. `:597-616` uses none of `STICKY_HEADER_CLASS` / `STICKY_HEADER_STYLE` (`:69-74`) that `:825-854` applies on the rankings view; the commit message's "the header row sticks under the site header in page flow" is true of that view only. Fix is the same six classNames and style on the waivers `th`s. Suggested pass, layout.

2. **[P2] The two-board stamp is six lines and 138px tall on the phone, with a separator sitting alone on a line.** New, introduced by the stamp fix. At 390 in both themes the stamp block (`:377-424`) measures 358 x 138px at y=419 to 557 (it was three lines before), and the screenshot reads "2026 WEEK 1 ·" / "FLEX UPDATED SEP 10, 2026, 7:26 PM, 157" / "EXPERTS" / "·" / "QB UPDATED SEP 10, 2026, 7:02 PM, 142 EXPERTS" / "· CURRENT". The `aria-hidden` dots are their own flex items in a `flex-wrap` row with `gap-y-2`, so the row-gap doubles the wrap cost and a dot can wrap alone. At 768 the block is two lines with a trailing dot orphaned at the end of line one. The date is printed twice when both boards share it. Fix is to wrap each label with its trailing dot in one `whitespace-nowrap` span (or move the dot to a `::before` on every item after the first, which never wraps alone), and on the phone reading print the shared date once in the Week span, "Flex 7:26 PM, 157 experts · QB 7:02 PM, 142 experts", which fits in two lines at 390. Suggested pass, polish.

3. **[P2] The labeled table region is a keyboard stop that never scrolls.** New. `:590` sets `tabIndex={0}` on the `overflow-x-auto` wrapper, but the table no longer has a min-width (`:594`) and below md it is replaced by the list, so at every width where the region exists it fits: scrollWidth equals clientWidth at 768 (678) and 1440 (1334) in both themes. At 768 the Tab order runs Standard pill, region (ring drawn, nothing to scroll), then the footnote links, so every keyboard user pays one stop for nothing on every visit. The role and label are fine to keep for the table's name. Fix is to drop the `tabIndex`, or set it only when a ResizeObserver reports `scrollWidth > clientWidth`. Suggested pass, harden.

4. **[P2] The hero clause is still the card's first sentence, and the method now sits 516px above the first row on a phone.** Carried over from before issue 7. `:364-365` and `:549-550` open with the same clause; the paragraph is 159 words and 432px tall at 390 (`cardPRect`), and the count line, correctly added, pushed the first item to y=1223 under an h2 at y=707. The method is protected framing and keeps every number; the repeated clause is not. Fix is to start the card paragraph at "The gap is". Suggested pass, distill.

5. **[P2] The 20-row cap is still unstated.** `fantasyWeeklySnapshot.ts:280-283, 310` and `weekly-client.tsx:564-565`, unchanged from before issue 5; PPR sits at 19 rows against a cap of 20 with no sentence that says a twenty-first would be dropped. Fix is one clause ("the twenty widest of those, if more clear it") or dropping the cap. Suggested pass, clarify.

6. **[P2] The preload is still fetched twice.** `waivers/page.tsx:44-46`, unchanged from before issue 6; the Chrome credentials-mode warning and the `other` plus `fetch` pair for `weekly.json` reproduced on every cell in this pass. Fix is `crossOrigin: "anonymous"` on the preload in both page files. Suggested pass, optimize.

## Minor Observations

- The h1 still uses `clamp(2.25rem,1.7rem+2.5vw,4.2rem)` (`weekly-client.tsx:343`), measured 63.2px at 1440 and 36.95px at 390 against the DESIGN.md ramp; shared with weekly, note once.
- The list is one ordering across two rank spaces (`fantasyWeeklySnapshot.ts:310`) and the paragraph still stops at "means something different in each of the two rank spaces" without saying the rows are interleaved on the gap anyway. One clause would close it.
- Percentile still prints 77.0 beside Rostered 10.4% with no unit on the first; the arithmetic the paragraph describes is not visible in the row.
- On the phone list the second mono line starts at Percentile on flex rows and at Rostered on QB rows, because "Flex" is wider than "QB" and the wrap point moves with it. Fixing Board to a two-character width, or putting Board on the name line, would make every item break in the same place.
- The footnote sentence names FantasyPros three times ("457 players on the FantasyPros weekly flex board and 100 on the FantasyPros weekly quarterback board at fantasypros.com"). The two source links at its end are 11px text, 86 x 14 and 128 x 14 at 1440; the sweep exempts them as inline links in 205ch prose, and they sit in a `p`, so this is inside the recorded 2.5.8 decision, but they are the smallest interactive text on the page.
- The "More fantasy tools" strip (`:1002-1027`) still sends an in-season visitor to Rankings board, Draft tracker and Best ball with no note that those are frozen draft surfaces; the weekly hero carries that sentence and the waivers hero does not.
- The "weekly board" link keeps the signal underline while the strip links are plain ink with an arrow glyph; two link treatments on one short page, unchanged.
- `weekly-client.test.tsx:271-300` now covers the two stamps, the worse-of-two chip, the h2, the count line, the labeled region and the header order, which closes the test gap noted before.
- Stamp wrap at 768 leaves one dot orphaned at the end of line one (covered by issue 2).
- The shared Contact CTA h2 (44px at 1440) still outsizes the waivers h2 (22px); shared shell, inherited, not filed.
- Dark mode is at parity in all nineteen dark screenshots; dark contrast floor 5.99, light 5.35, both from measure.js.
