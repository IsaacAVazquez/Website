---
target: fantasy football rankings
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-09-11T18-50-38Z
slug: route-fantasy-football
---
Method: dual-agent re-score after the 2026-09-11 remediation; compare against route-fantasy-football.md (A: design review in Chromium at 1440 and 390, both themes, default, drawer in consensus and VORP mode, queued, phone search, scored before the before scores were re-read · B: each before P1 reproduced in the browser against the merged code at `src/app/fantasy-football/fantasy-football-client.tsx` (now 2287 lines), plus a 40-row hover contrast sweep in both modes and themes that the round1 sweep never had · synthesis after both. Probe scripts and 30 screenshots sit in `rescore/route-fantasy-football/` beside this file.)

# Critique: Fantasy Football Rankings board (/fantasy-football)

Scope note: this is a post-remediation re-score of the rankings board alone, still in its first in-season state (Week 1 of 2026, `getNflRegularSeasonWeek` returns 1). The remediation is the rankings part of commit `6d12f70` (PR #423), which the dev server on :3000 now serves. The before critique scored 30/40 with three P1s, all upheld 2-0 by the verifiers. Everything below was measured fresh; nothing is copied from the before file.

## Design Health Score

| # | Heuristic | Score | Key Issue | Before |
|---|-----------|-------|-----------|--------|
| 1 | Visibility of System Status | 3 | Season note, dated chips, and the count line are strong; the FAQ still promises a FantasyPros date the fresh state never shows, and the VORP count still reads "40 of 490 shown" and then "1 of 559 shown" once a search or the queue filter lands | 3 |
| 2 | Match System / Real World | 3 | The note now points at both live surfaces; the kicker still reads "Draft rankings" and the drawer still says "Take him on schedule" in Week 1 | 3 |
| 3 | User Control and Freedom | 3 | Esc, focus restore, URL state, and the compact select all verified; the phone drawer's Close still leaves with the content, and it leaves by more now that the panel is taller | 3 |
| 4 | Consistency and Standards | 4 | The VORP drawer, the VORP column color, and the hover contrast are all reconciled with the board; what remains is a five-card grid with a blank cell in both modes | 2 |
| 5 | Error Prevention | 4 | Verdict gates, unavailable slices, disabled VORP options in the compact select, "69 without a published VORP" surfaced | 4 |
| 6 | Recognition Rather Than Recall | 3 | The neighborhood now names its own columns ("VORP rank · VORP" or "Rank · avg"); the plate still recomputes to "Tier 1, 1 player, ranks 3 to 3" in a filtered view | 3 |
| 7 | Flexibility and Efficiency | 3 | One native select carries ranking and league size on phones; the pinned chrome is 188px, down from 225, and still 22% of the viewport; no keyboard layer (deferred) | 3 |
| 8 | Aesthetic and Minimalist Design | 4 | 3 signal text nodes above the fold at 1440 against 44 before; the six-chip row is gone; "12-team" still prints six times in VORP view and six of 40 desktop rows still break rhythm at 64px | 2 |
| 9 | Error Recovery | 4 | Unchanged: plain-words error card with retry, slice-unavailable card, filter-only empty states, fail-soft snapshot | 4 |
| 10 | Help and Documentation | 3 | The VORP card carries the "What is VORP?" term; the FAQ still has no VORP or league-size entry | 3 |
| **Total** | | **34/40** | **Good band (28 to 35): solid foundation, address the weak areas** | **30** |

All ten heuristics applied (Operate surface). The four points come from heuristics 4 and 8, which is where the three P1s lived. Nothing regressed on the heuristics that stayed level; the two carried P2s that got heavier (the phone drawer's Close and the five-card grid) were not enough to move a row down.

## Design Specificity Verdict

Mechanical state, from my own probes on the merged code in both themes at 1440 and 390 across default, drawer (both modes), queued, phone search, and hover. Zero horizontal overflow, exactly one `main` and one visible `h1` in every state, zero console errors. A 40-row hover sweep at 1440 in both ranking modes and both themes measured 458 to 464 text nodes per pass with zero AA failures, and the light floor on a hovered row is now 5.13:1 (the 14px "+6.7" vs-ADP value) against the 4.41:1 the before critique measured on the VORP value. The keyboard-highlighted row floors at 5.39:1 light and 6.25:1 dark. Focus rings hold on the new compact select (2px solid signal plus a 3px halo). Enter opens the drawer, a neighborhood click swaps the player inside the same dialog in both modes, and Esc returns focus to "Open Ja'Marr Chase detail".

What changed visually. The desktop board is quieter and the accent means something again: on the consensus board the VORP column reads in ink, and in VORP mode it takes the 72% signal-toward-ink mix while the plate rail goes full signal, so the color now follows the sort the way the h2 and the plate already did. The drawer in VORP mode leads with "VORP #19 · 12-team", carries "R57 overall · Tier 5 of 16" as the muted second line, puts a "VORP · 12-team 154" card first in the grid, labels the verdict "Market read against the consensus rank", and renders a neighborhood that reads 17 Breece Hall 167, 18 Travis Etienne Jr. 154, 19 Cam Skattebo 154, 20 Javonte Williams 153, 21 CeeDee Lamb 152, which is monotonic. On the phone the six link chips are gone, the sticky bar is two rows instead of three, and the first player row now sits inside the arrival viewport in both modes. The page still reads as authored rather than templated; the season note, the tier plates, and the drawer's first-person verdicts are intact.

False positives set aside. The `nextjs-portal` dev badge at bottom left is dev-only. My first pass reported the count line as absent at 390 in the queued state because the probe looked for a hidden md-and-up button; the visible badge reads "Show only queued players (1 on this board)" and the count line renders "1 of 559 shown". The "12-team" mention count includes the CSS-uppercased chip text, which is one string rendered twice, not a seventh instance.

## What closed

1. [P1] In VORP mode the drawer does not know the board is sorted by VORP. Closed. Measured at 1440 in both themes on `?ranking=vorp&teams=12`, row 19 (Cam Skattebo): kicker "VORP #19 · 12-team", second line "R57 overall · Tier 5 of 16", stat grid "VORP · 12-team 154, Consensus avg 57.3, Expert range 28–99, Market ADP 36.1, vs ADP −20.9", verdict prefixed "Market read against the consensus rank", neighborhood header "VORP rank · VORP", neighborhood 17/167, 18/154, 19/154, 20/153, 21/152, and four occurrences of "VORP" in the dialog text against zero before. Source: `DraftPlayerDrawerProps` now carries `vorpMode`, `vorpTeams`, and `vorpIndex` (`:517-522`), the kicker branches at `:718`, the card mounts at `:745` and `:781`, the neighborhood prints `vorpIndex.get(neighbor.id)?.rank` and `formatVorpValue` at `:969-979`, and the mount passes all three at `:2276-2278`. Both verifiers' additions landed too: the consensus rank stays visible as the second line, and the verdict says which rank it reads against.

2. [P1] At 390 the pinned chrome is 225px and the first player row starts below the viewport. Partially closed. Measured at 390x844 in both themes: site header 73px, bar 116px (row one 62px, the select-plus-count row 52px), pinned total 188px at scroll 1500, 22.3% of the viewport against 26.6% before. Above the bar on arrival the page header is 263px, the note 121px, and the `nav[aria-label="Fantasy tools"]` no longer renders, so the first `li` (Ja'Marr Chase, 112px) starts at document y=677 and is fully inside the 844px viewport, with the second row's top visible too; in VORP mode the five header chips push it to y=719, still inside. The headline claim (zero rows on arrival) is closed. The pinned share is not: the bar is still two rows, and 188px of pinned chrome is nearly three times the 64px the 2026-08-22 adapt pass measured. Filed below as a P2.

3. [P1] A hovered row fails AA on its VORP value in light mode. Closed. Measured at 1440 on the Ja'Marr Chase row with every ancestor background composited. Consensus board, light: the VORP value is now ink, 16.44:1 at rest and 15.74:1 on hover. VORP board, light: the value is `color-mix(in srgb, var(--home-signal) 72%, var(--home-ink))` (`SIGNAL_TEXT_COLOR`, `:97`), 6.85:1 at rest and 6.56:1 on hover, against 4.61 and 4.41 before. Queued rank digit, light: 6.85:1 rest, 6.56:1 hover. Dark: 8.16:1 rest and 7.82:1 hover for both. The 40-row hover sweep found no failure in either mode or theme.

Carried P2s, for the record. Issue 4 (VORP column orange in both modes) closed: zero signal-colored VORP nodes on the consensus board, three signal text nodes above the fold in all. Issue 10 (two heading sizes above the h1) half closed: the drawer h2 is 26px now (`text-xl`, `:726`); the shared `ProjectBuildNote` h2 still measures 34px (`src/components/ProjectBuildNote.tsx:30`). Issues 5, 6, 7, 8, and 9 are unchanged and re-listed below with fresh measurements, and issue 8 got heavier.

## Priority Issues

1. [P2] The second row of the phone bar is still pinned. At 390 the bar measures 116px (`:1780` sticky at `top-[4.5rem]`), row one 62px with the position select, PPR/Half/Std, search, and star, row two 52px with the `CompactRankingSelect` (`:366-408`, 128x44) and the count line (`:2018-2034`). Under the 73px site header that pins 188px, 22.3% of an 844px viewport, on every screen after the first. Why it matters: the brief's mode is Operate and a phone reader still gives up a fifth of every screen to controls, most of which she touches once. Fix: keep row one sticky and let row two scroll with the page, or move the ranking select into the phone search sheet the way the count already yields to it, so the pinned bar is the 62px line the 2026-08-22 pass had. The count line can stay a visible live region either way. Suggested pass: layout.

2. [P2] The drawer's stat grid now has five cards in two columns, so a blank 176px cell sits in the grid in both modes. Measured at 1440: five children, three rows, the last card 176px wide in a 359px grid, in consensus mode ("Consensus avg, Expert range, Market ADP, vs ADP, VORP · 12-team", the VORP card last at `:781`) and in VORP mode (VORP first at `:745`, vs ADP alone last). At 390 the same gap shows in the phone drawer. Why it matters: this is new since the fix, it is the first thing under the player's name, and an empty cell in a two-by-three grid reads as a card that failed to load. Fix: let the lead card span both columns in VORP mode (the VORP rank is the headline there) and drop the VORP card from the consensus drawer's grid into the neighborhood header or the kicker line, or make the grid three-up inside the 400px panel. Suggested pass: polish.

3. [P2] On a phone the drawer's Close leaves with the content, and the panel is taller now. The `aside` is the scroller (`overflow-y-auto`, `:705`) and its header is static (`:712-741`). Measured at 390x844 after scrolling the panel to its end: consensus mode overflows by 198px and the Close button sits at y=-178; VORP mode overflows by 337px and Close sits at y=-273, its bottom edge at -273 too, against y=-122 before. The VORP card and the verdict label added about 120px to the panel. The backdrop button is the only other way out and at 390 it is the 23px strip beside a 367px panel. Fix: make the drawer header sticky inside the panel or dock Close at the bottom beside the queue button on touch. Suggested pass: adapt.

4. [P2] Plate metadata is still recomputed from the filtered subset. `firstRank` and `lastRank` come from `group.rows` (`:1417-1418`) and the count from `group.rows.length` (`:1448`, `:1503`), so a search for Nacua renders "Tier 1, 1 player, ranks 3 to 3" on the consensus board and "12-team VORP rankings, 1 player, VORP ranks 7 to 7" on the VORP board, and the queued view "Tier 1, 1 player, ranks 1 to 1". The count line switches denominator with `hasMore` (`:1377-1379`), so the VORP view reads "40 of 490 shown · 69 without a published VORP" and then "1 of 559 shown" after a search or the queue filter, which drops the VORP note as well. Fix: carry the tier's published count and range from the unfiltered board and use one denominator per ranking mode. Suggested pass: clarify.

5. [P2] The freshness copy still makes three different claims. FAQ (`fantasy-faq.ts:5`) says the rankings show when FantasyPros last updated; the fresh header chip has no FantasyPros date; the footer line reads "Refreshes daily through draft season, weekly after · snapshot Sep 10" (`:2224`) under a note that says the boards are kept as a reference rather than refreshed (`:1757-1758`). Fix: give the FantasyPros chip its date in every state and rewrite the footer line's in-season branch. Suggested pass: clarify.

6. [P2] "12-team" prints six times on one VORP screen at 1440 (orienting sentence, chip, "12 teams" select, h2, plate, footer line), and now a seventh in the drawer card label. On the consensus board the drawer card also says "VORP · 12-team" (`:680-687`) when nothing on that board has named a league size, since `routeState.teams` defaults to 12; that is honest about what the column is, but a first-time reader has no control to trace it to. Suggested pass: distill.

7. [P2] Chip-bearing rows still break the row rhythm at 1440. 6 of the first 40 rows measure 64px against 45px for the rest (Trey McBride, Lamar Jackson, Colston Loveland, Derrick Henry, Breece Hall, Jeremiyah Love) because the Value or Reach chip wraps under a long name. Suggested pass: layout.

8. [P2] The shared `ProjectBuildNote` h2 "What I use it for" still renders at 34px under the 33.6px h1 at 1440 (`src/components/ProjectBuildNote.tsx:30`, `text-2xl`). Shared code with this route as one consumer; at 768 it is 29.6px under a 30.4px h1, so the inversion is desktop-only. Suggested pass: polish.

## Persona Red Flags

Alex (impatient power user, desktop mid-season): he switches to VORP, opens a player, and the drawer now speaks his sort, with the consensus rank one line below so the gap is the reading. Hover no longer costs him contrast. What he still meets is the blank card cell in every drawer and a count line whose denominator changes under him when he searches.

Sam (screen reader and keyboard): the compact select is a native control with a real name ("Ranking method") and a visible ring, and the count line stays a polite live region on phones. The plate label still announces "Tier 1, 1 player, ranks 3 to 3" for a search result, and the drawer's blank cell is silent, which is the one place the visual defect is not his problem.

Casey (distracted phone arrival, one thumb): she sees the first player on arrival now, which she did not before. Once she scrolls she still loses a fifth of every screen to the bar, and if she opens a drawer in VORP mode and reads to the bottom, Close is 273px above the top of the screen.

## Minor Observations

- At 768 the md bar renders 205px tall because the Consensus/VORP pair, the league-size select, and the search wrap onto a second line and the queue button onto a third, and the identity column wraps "ATL · Bye 11" under the name so rows 2 to 4 are 92px against 64px for row 1. Not in this run's states; worth a look in the next layout pass.
- The compact select's options read "VORP 10-team", "VORP 12-team", "VORP 14-team", and switching to 14 rewrites the h2, the chip, and the URL (`?ranking=vorp&teams=14`) in one step.
- The note now links the weekly board and the waiver targets, and each is linked exactly twice on the page (note and footer nav), down from three for weekly.
- The footer nav still lists the two live in-season surfaces fifth and sixth.
- The hover tint on the row (`:1518`, paper-alt at 55%) is unchanged; it no longer trips anything because the text moved, so any future 14px pure-signal text on a row would fail again. A hover cell in the sweep would catch it.
- "kept as a reference once games begin rather than refreshed for weekly starts" (`:1757-1758`) is still the "X rather than Y" shape; protected framing, meaning intact.
- No em dashes, colons as connectors, or model vocabulary in rendered strings or aria-labels, including the new "Market read against the consensus rank" and "Ranking method". Instrument Serif appears once. The h1 is on the title ramp.
- The FAQ still has no entry for VORP or league size.
- The `SIGNAL_TEXT_COLOR` comment at `:89-96` records the measurements that justified it, which is the right way to leave a contrast repair for the next reader.
- Dark mode is at parity in every state captured; every dark contrast floor is above its light counterpart.

## Questions to Consider

1. With the drawer now carrying a VORP card in both modes, is the consensus board's VORP column a 12-team number by default forever, or should the consensus view drop the card and keep VORP as a column-only hint until the reader picks a league size?
2. The phone bar went from three rows to two by merging controls. Is the remaining second row worth pinning at all, given the count line is a live region whether or not it is on screen?
3. The drawer grew by about 120px on phones to close the VORP finding, and the Close button problem grew with it. Is the sticky header the next small fix, or is a bottom-docked Close on touch the shape the trackers should share too?
