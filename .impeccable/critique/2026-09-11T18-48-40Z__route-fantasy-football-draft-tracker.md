---
target: fantasy football redraft draft tracker
total_score: 36
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-09-11T18-48-40Z
slug: route-fantasy-football-draft-tracker
---
Method: dual-agent re-score after the 2026-09-11 remediation; compare against route-fantasy-football-draft-tracker.md (2026-09-11T09-01-00Z). Half A opened the route in Chromium at 1440 and 390, light and dark, in setup, running at pick 1, after one keyboard pick and one drawer pick, and driven to pick 24 with "Why these picks" open, screenshots in `rescore/route-fantasy-football-draft-tracker/`, and scored the ten heuristics before comparing. Half B re-measured each of the five P1s and the four P2s in the same four cells and at source on main (`6d12f70`). Script and JSON: `rescore/dt-rescore.mjs`, `rescore/dt-rescore.json`, plus `dt-reload.mjs` and `dt-trunc.mjs` for the reload, tab-order, and strip-width probes.

# Critique: Fantasy Football Redraft Draft Tracker (/fantasy-football/draft-tracker)

Scope note: this is a post-remediation re-score. The before critique (29/40, five P1s, four P2s) was verified 5-0 by two refuters and the fix for every P1 merged in PR #423. Nothing in the season state changed between the two runs (Week 1 of 2026, snapshot stamped Sep 10, `getNflRegularSeasonWeek` returns 1). The recorded decisions still stand and are not re-scored: the compact h1 plus sticky live bar, the advisory clock, the parked-room flow, the deferred keyboard layer.

## Design Health Score

| # | Heuristic | Score | Key Issue | Before |
|---|-----------|-------|-----------|--------|
| 1 | Visibility of System Status | 4 | The phone fascia no longer clips its counter ("#24/180" fits at 94px) and a logged pick lands focus on the pinned on-the-clock tile with a 2px signal ring; "Prev · K. Walker III #23" still clips by 2px at 1440 | 3 |
| 2 | Match System / Real World | 3 | Verdict sentences are still plain; "−0.0 pts" still prints a negative zero on the wait card, and "Index 31.7" and the "At #24" column label go unexplained on the first screen | 3 |
| 3 | User Control and Freedom | 4 | Undo, redo, undo-to-here tape, U, parked rooms, and a confirm before clearing, all unchanged and re-verified through a reload at pick 25 | 4 |
| 4 | Consistency and Standards | 4 | One Log treatment for the one action, the season note inside the shell, the h1 on the DESIGN.md title ramp; the drawer's Movement line is the one stat that still leads with a bare "?" | 3 |
| 5 | Error Prevention | 4 | Confirm on a parked room, settings lock at start, disabled controls name their reason, unchanged | 4 |
| 6 | Recognition Rather Than Recall | 4 | The 390 fascia now reads whole; the disclosure adds each card's reasoning in place. Opening it at 1440 squeezes the strip to four 249px columns and truncates "Omarion Hampton" and "Ashton Jeanty" to "Omarion …" and "Ashton J…" | 3 |
| 7 | Flexibility and Efficiency | 4 | "/" focuses the board search in all four cells, a keyboard or drawer pick lands on the fascia tile, U works; Cmd+Z and drawer next/previous stay deferred product work | 2 |
| 8 | Aesthetic and Minimalist Design | 3 | The second card set is gone (three Log buttons for three players, not five) and the VORP column is ink, so the accent is back on "You", "Now", and the tier cliffs; the pick number is still printed three times and the pool twice at 1440 | 2 |
| 9 | Error Recovery | 3 | Stale-source and persistence cards with a Retry path exist in source; nothing failed in this session either, so this is still from reading | 3 |
| 10 | Help and Documentation | 3 | The "Press slash" hint is now true; the "why" line on the best-available card repeats its own sub, and the Movement line still has no visible label | 2 |
| **Total** | | **36/40** | **Excellent band (36 to 40), at the bottom of it** | **29** |

All ten heuristics apply (Operate surface). The seven-point move is concentrated where the operating loop was broken: Flexibility gained two, and Status, Consistency, Recognition, Minimalism, and Help gained one each. Match, Control, Prevention, and Recovery did not move because nothing that feeds them changed.

## Design Specificity Verdict

Mechanical state, from the four cells. Zero horizontal overflow at 1440 and 390 in every state. One `main` and one visible `h1` in every state. Six live regions in the running state, unchanged. Body scroll still `visible` behind the open drawer (not a finding, noted below). Contrast on the board column: every one of the 40 rendered VORP values is `rgb(25,24,19)` in light (ink), 14px at 1440 and 12.2px at 390, `tabular-nums`; my own ratios from the canvas-resolved tokens are 16.29:1 on paper, 15.71:1 on the composited hover wash `rgb(242,241,235)`, and 14.31:1 on the keyboard highlight `rgb(242,228,220)`. Signal on the hover wash is still 4.41:1, which is why the value had to leave it. Dark is 15.28, 14.77, 13.72. The four Index values in the decision panel are ink on their cards, including the most-at-risk card on its warning wash `rgb(239,232,222)`. The only signal-colored text in the board region at pick 3 is the four avg-rank cliff labels; on the user's turn "You", "Now", and the "Best available" label join them. Focus ring on the on-the-clock tile after a pick: `outline solid 2px rgb(201,63,25)` light, `rgb(255,107,59)` dark, `:focus-visible` true. The one console error my main run logged in every cell was a React hydration attribute mismatch on `<html>` caused by my own script setting `documentElement.style.scrollBehavior` before hydration; the clean control runs (`dt-reload.mjs`, `dt-hydration.mjs`) logged zero errors through start, 24 picks, and a reload, so it is set aside as a measurement artifact.

What changed visually. The strip is now a row of outlined paper cards (1px `signal 20%` mixed into rule) instead of tiles on a tinted grid, and the disclosure widens that same row rather than mounting a second one under it, so at 1440 the open state is four cards on one line and at 390 it is four stacked cards with the "Fills RB1" card last. The board reads quieter: with VORP in ink the two accent numerals on the first screen are "You" and "Now" in the fascia, which is the design system's intent. The phone fascia is three fixed columns, two rows, no Pool tile, with "Next turn", "First pick", "90s advisory", and "K. Walker III" as the compact copy. The season note sits inside the shell with the same gutters as the h1. The room otherwise looks as it did.

## What closed

1. [P1] The documented "/" shortcut opened the site search. Closed. In all four cells, pressing "/" from `body` focused `#draft-board-search` (active element `INPUT#draft-board-search`), the site search overlay was not visible and no "Site search" dialog existed, typing "Nacua" put "Nacua" in the board field and the count read "1 of 559 available". Source: `src/components/StaticHeader.tsx:84` now guards on `!event.defaultPrevented`, with a comment naming the draft boards; the board handler at `src/app/fantasy-football/draft-tracker/components/DraftBoard.tsx:158-189` is unchanged and still prevents default first.

2. [P1] Logging a pick from the keyboard or the drawer dropped focus to `body`. Closed. Focused "Log Ja'Marr Chase" in the Draft board region and pressed Enter: the kicker advanced to "Pick #2", `document.activeElement` was the fascia's "On the clock" `div` (`tabIndex=-1`, text "On the clock Slot 2 J. Chase Prev · J. Chase #1") with a visible 2px signal ring, in all four cells. Opened the first row's detail and clicked "Log this pick" (183x44 at 1440, 170x44 at 390): dialog gone, active element the same tile ("Slot 3 J. Gibbs"). Logged "Ashton Jeanty" from the open strip with Enter at pick 24: same tile ("You A. Jeanty"). At 390 the tile is the sticky fascia's second cell at y=73, directly under the site header, so the landing spot is on screen at every scroll position. Source: `draft-tracker-client.tsx:325-326` (`onClockRef`, `loggedPickRequests`) and the post-commit effect at `:952-964`, which yields when something else already holds focus outside a modal.

3. [P1] "Why these picks" rendered a second copy of the recommendations. Closed. At pick 24 with the disclosure closed, two buttons named "Log … as pick 24" sat above the Draft board region (Josh Allen and Omarion Hampton, both y=583 at 1440; y=914 and y=1012 at 390). Open, three: the same two plus "Log Ashton Jeanty as pick 24" (y=583 at 1440; y=1202 at 390), and `#draft-decision-detail` contains zero Log buttons. Every Log is the same 50x44 round "Log". The card text changed in place: the most-at-risk sub "RB Tier 2 has 1 left" became "VORP 168 · Index 27.2 · RB Tier 2 has 1 left · waiting to #25 costs 14 consensus spots", and the "Fills RB1" card joined the row. Source: `StripPlayerCard` at `:152-225`, `recByPlayerId`/`extraRecs` at `:712-715`, the removed grid at the former `:1377-1427`. It introduced one new P2 (strip name truncation at 1440, below).

4. [P1] At 390 the sticky fascia was 192px tall and clipped its own numbers. Partially closed. The section is still `position: sticky; top: 72px`, now 147.8px tall (was 192.05), so with the 73px header the pinned band is 220 of 844px, 26.0% (was 31.3%). Grid `118px 118px 118px`, four tiles plus a two-column actions cell, every tile 72px. Zero clipped values or sub lines at pick 1 and pick 24 in both themes: "#24/180" measures 94 of 94px, "K. Walker III" 94, "90s advisory" 94, "then #25" 94. Source: `:1201` (`grid-cols-3` below `sm`), the compact copy at `:863`, `:873`, `:891`, `:923-929`, `phoneHidden` on Pool at `:939`. What did not land: the fascia is still two rows, not the one-row band the fix asked for, and at 1440 "Prev · K. Walker III #23" still clips by 2px (scrollWidth 144 in a 142px cell). Filed as a P2 below.

5. [P1] Signal orange on every VORP value, and the light-mode AA failure. Closed. 40 of 40 VORP spans are ink at 1440 and 390 in light and dark; ratios 16.29, 15.71, 14.31 in light on paper, hover, and highlight; the Index values in the four decision-panel articles are `rgb(25,24,19)` in light, including the RB card on its warning wash. Source: `DraftBoard.tsx:447-455` (ink for positive VORP, ink-muted otherwise, with a comment carrying the 4.41 and 4.01 measurements) and `RedraftDecisionPanel.tsx:99-104` (ink, `tabular-nums`).

6. [P2] The seasonal note was outside the shell. Closed. At 1440 the note plate spans x=237 to 1203 with the h1 at 505 inside the same shell; at 390 the plate sits at 33 to 357 with the 16px gutter on both sides. Source: `draft-tracker-client.tsx:1094-1098` wraps `SeasonalScopeNote` in `SHELL_CLASS`. The copy also lost the "rather than" reversal ("so it is here for next summer. This week's ranks are on the weekly board.").

7. [P2] Pick number stated three times, pool twice. Still open. At pick 24 and 1440: kicker "Draft assistant · Live · Pick #24" (`:726`), fascia "#24 / 180", strip header "Pick #24 of 180 · 1:28 advisory · your next turn #25" (`:1394-1396`), and "536 left / of 559 ranked" beside "536 of 536 available". At 390 the Pool tile is hidden so the pool prints once there, and the strip header line wraps to two lines with "#25" alone on the second.

8. [P2] "−0.0 pts". Still open. The wait card at pick 24 reads "−0.0 pts / to #25 · J. Allen likely lasts" in all four cells; `waitCellReading` at `:118-121` still prints `toFixed(1)` for a drop under one point.

9. [P2] The drawer's Movement line has no visible label. Still open. The line reads "?: rank ±0 in 7d · ±0 in 14d · ADP ↑0.1 in 7d · ↑0.1 in 14d" in all four cells; `PlayerDetailDrawer.tsx:338-342` renders the childless `MetricTooltip` followed by a literal `": "`.

Minor items from the before file that also closed: the h1 is on the title ramp (`clamp(1.55rem, 1.3rem + 1.25vw, 2.1rem)` at `:1066`, measured 33.6px at 1440 and 25.7px at 390), and the "rather than" and "not just" voice items in the note copy are gone. Still as before: body scroll unlocked behind the drawer, the Rostered cell without a definition trigger, the 24-pick tape clipping mid-chip (scrollWidth 1496 in a 1080px row at 1440), the `Intl` time stamp with no zone, and the "ADP current" chip beside a note that says the board stopped refreshing.

## Priority Issues

No P0 or P1 remains.

1. [P2] Opening "Why these picks" at 1440 truncates two of three player names. The strip grid is `repeat(auto-fit, minmax(240px, 1fr))` (`draft-tracker-client.tsx:1417`), so three cards measure 332px each closed and four measure 249px open, and inside a 249px card the name button gets 88px after the rank, chip, and 50px Log: "Omarion Hampton" needs 152px and renders "Omarion …", "Ashton Jeanty" needs 116px and renders "Ashton J…" (measured light and dark; Josh Allen at 82px fits). Closed, both names fit. Why it matters: the disclosure exists to make the pick legible, and the one thing it now hides is the name of the player it is recommending, at the desktop width Alex drafts at. At 390 the cards stack at 356px and nothing clips. Fix: raise the open-state minimum to 280px so the fourth card wraps to a second row at 1440 (the shell is 1000px), or let the name wrap to two lines inside the card instead of truncating. Suggested pass: layout.

2. [P2] The phone fascia is still two rows and pins 26% of the viewport. 147.8px sticky under a 73px header, 220px pinned at every scroll position at 390, the first strip Log at y=914 on the user's turn (was 940) and the first board row at y=2950 with the disclosure open. The clipping half of the before P1 is closed and this is the layout half the fix described (one row, clock inside the pick tile, Undo as a glyph) and did not take. The 1440 sub line "Prev · K. Walker III #23" also still ellipsizes by 2px (`:871`). Fix: the one-row band as specified, or at least fold "Next turn" into the pick tile's sub line so the phone grid is one row of three plus the actions. Suggested pass: adapt.

3. [P2] The pick number is printed three times and the pool twice at 1440 (before issue 7, measurements above). Fix: the strip header keeps "Your pick is live" and the toggle and drops the numbers; the kicker can drop "Pick #N" once the fascia carries it. Suggested pass: distill.

4. [P2] "−0.0 pts" (before issue 8, `:118-121`). Fix: below 0.05 print "under 1 pt". Suggested pass: polish.

5. [P2] The Movement line leads with a bare "?:" (before issue 9, `PlayerDetailDrawer.tsx:338-342`). Fix: print "Movement" before the trigger like "Points per game" and "Market ADP" do, and drop the colon. Suggested pass: polish.

## Minor Observations

- The best-available card's "why" line is "Board #24 · Tier 3 · VORP 74 · Index 31.7", which is the closed sub "Tier 3 · VORP 74 · Index 31.7" with the rank already printed beside the name added to the front. On that card the disclosure changes nothing a reader can use; the most-at-risk card's line ("waiting to #25 costs 14 consensus spots") is the model for what the "why" should carry.
- After a pick lands on the on-the-clock tile, my count found 24 focusable controls between it and the first board row at pick 24 (Undo, New room, the tape's undo-to-here chips, the strip's buttons, the toggle, eight position pills, the search field). The fixed "/" shortcut is the practical path from the tile to the next row, and the room now advertises it truthfully; a keyboard user drafting sequentially does "/", type, ArrowDown, Enter. Worth stating in the hint.
- The "Best available" label is still signal at 10px on paper (4.57:1, passing by 0.07); its siblings are warning and ink-muted. It is a label, not data or state, and it is now the only non-state accent text on the user's turn besides the cliff labels.
- At 768 the fascia is four columns of 175px and 195px tall with nothing clipped; the phone grid stops at `sm` (640), so a 640 to 767 viewport gets the auto-fit grid, which I did not measure.
- The strip header at 390 wraps "Pick #24 of 180 · 1:30 advisory · your next turn #25" onto two lines with "#25" orphaned; dropping the numbers (issue 3) also fixes the wrap.
- The strip cards' outline is `color(srgb 0.539 0.192 0.090 / 0.313)` in light, a visible warm rule, and `0.971 0.615 0.488 / 0.329` in dark; both read as the strip's own edge rather than a tint, which is an improvement on the tinted grid.
- Reload at pick 25 came back at pick 25 in the control runs (`fantasy-draft-tracker-v3-2026`, 24 picks stored); the main run's three "Setup" readings were taken 600ms after `networkidle`, before hydration swapped the server-rendered setup for the room, and are not a finding.
- Body scroll behind the open drawer, the Rostered cell without a trigger, the tape clip, the unzoned time stamp, "ADP current" beside "stops refreshing", and the "2026 Week 1" chip repeating the note are unchanged from the before file and still minor.
- Still open and deliberately deferred as product work: Cmd+Z, next/previous in the drawer, and the below-sm h1/h2 inversion decision.
