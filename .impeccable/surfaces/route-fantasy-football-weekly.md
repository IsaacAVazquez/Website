---
version: 1
slug: "route-fantasy-football-weekly"
primary_target: "route:/fantasy-football/weekly"
related_targets: ["src/app/fantasy-football/weekly/weekly-client.tsx","src/app/fantasy-football/weekly/page.tsx","src/app/fantasy-football/waivers/page.tsx","src/lib/fantasyWeeklySnapshot.ts","src/hooks/useFantasyWeeklySnapshot.ts","scripts/buildFantasyWeeklySnapshot.ts"]
---

# Fantasy Football Weekly Board

## Mode

Operate. The visitor is deciding a lineup or a waiver claim on a Tuesday, so scanability and
a stable, predictable table outrank expression. This is the one fantasy board that stays true
after the season opens, and the copy says so directly.

## Audience

Isaac, plus fantasy players arriving from search in season. Same standing as the rest of the
tool fleet in PRODUCT.md, meaning credible and available rather than staged as the pitch.

## First critique, 2026-08-23

This surface shipped without ever being critiqued and had no brief until today. It scored
25/40, the lowest of the seven fantasy surfaces, which is a function of never having had a
pass rather than of being badly built.

## Decisions not to re-litigate

The preseason empty state is deliberate and correct. `useFantasyWeeklySnapshot.ts` documents
it in a comment, and the builder refuses to publish before Week 1, so between now and kickoff
`/data/fantasy/weekly.json` legitimately does not exist and the 404 resolves to
`notPublished` rather than to `error`. The browser still logs the 404 as a console error,
which is unavoidable for a fetch that 404s and is not a defect. Do not treat that console
line as a finding, and do not weaken the empty-state copy, which explains that rostered
percentages before leagues have drafted describe the preseason rather than a waiver wire.
It already links "draft rankings" through to `/fantasy-football`.

FantasyPros publishes no single overall board in season, so FLEX stands in for the Overall
tab. Flex and quarterback ranks live in separate rank spaces, because a flex rank of 12 and a
quarterback rank of 12 are not comparable. No UI here may let a visitor read them as one list.

The waiver reading is a published rank percentile minus a published rostered percentage. It
models no bid, no projection and no points total, and copy must never imply otherwise.

## Two findings the verifiers refuted, 2026-08-23

Do not re-raise. "The board toggle changes nothing in the panel directly beneath it" and
"the scoring toggle is inert on the quarterback board" were both refuted 2 to 0 by
independent verification against the source.

## Verified state, 2026-08-23

Mechanical sweep in both themes at 390, 768, 1024 and 1440, with the parser sanity gate
reproducing ink on paper at 16.29:1 light and 15.28:1 dark: zero AA contrast failures, zero
horizontal overflow, zero non-exempt sub-44px targets, exactly one `main`, exactly one `h1`,
and zero unnamed `section` landmarks. The one flagged target is the site footer's "Now" link
at 34.8px, which is shared shell code rather than weekly code.

## Passes landed, 2026-08-23

A `layout` pass gave the rankings table a sticky header row so the column meanings survive a
150-row scroll, and put it in its own scroll container. A second `layout` step grouped the
scoring and board choices, which had been rendering as six loose pills separated only by a
4px gap, and gave each group a real accessible name. A `clarify` pass named the denominator
behind the waiver percentile, since the copy invites hand-checking rows and the reader could
not previously reproduce the number. A `harden` pass moved scoring and board selection into
the URL, matching every sibling board, so a weekly view can be linked and restored. An
`optimize` pass preloaded the snapshot so its fetch no longer waits on the JS bundle.

## Deliberately deferred

Search and a position filter on the table are product work rather than remediation, and were
left alone on purpose. Both weekly panels use `.home-card`, which carries an always-on
treatment that may not suit this surface; that is a visual decision for whoever owns the
card, not a defect with a threshold.

## The doc line is fixed

`CLAUDE.md` used to say no route rendered the weekly snapshot. It now describes the route,
so that item is closed.

## First live-data critique, 2026-09-11

Every prior sweep of this surface measured the preseason empty state. The season opened
2026-09-09 and `weekly.json` published for the first time (season 2026, week 1, 457 flex rows
and 100 quarterbacks), and on 2026-09-09 the waiver list split onto its own route at
`/fantasy-football/waivers`, which shares this client with `view="waivers"` and now has its
own brief at `route-fantasy-football-waivers.md`. The critique scored 29 of 40 with zero P0
and three P1, all upheld two to zero. Snapshot at
`.impeccable/critique/2026-09-11T08-56-17Z__route-fantasy-football-weekly.md`. The group
record for the loop is in `route-fantasy-football.md` under "Full-group loop, 2026-09-11".

The footnote under the table was the draft builder's boilerplate. `FANTASY_PROS_PUBLIC_SOURCE`
is copied into every `weekly.json` source by the weekly builder, so the page printed "Flex is
derived locally from the published overall board., 157 contributing experts" at 11px directly
under the panel note that says FantasyPros publishes no in-season overall board. The client
now builds the label from the board and the source host (the way the best ball builder maps
providers), so it is correct before the next refresh, and `toSource` in
`scripts/buildFantasyWeeklySnapshot.ts` keys its provider string on the requested board so the
next build carries a true string; that builder's `main()` sits behind the same module guard
the redraft builder uses and has its first tests.

The phone table clipped three of five columns. At 390 the table was 608px inside a 316px
`overflow-auto` box with no hint and no sticky column, so the default paint showed only the
rank and the name, and the scrolled paint showed opponent, range and rostered with no name.
Both verifiers preferred a stacked row over sticky-left, since the Player column alone is 295px
of the box, and that is what shipped: below `md` each row is a list item with rank, name and
position rank on line one and a description list of labeled pairs under it, one layout in the
DOM at a time through a `matchMedia` store, measured at 390 as a 316px list with no nested
scroll box.

The 70vh box was built for 150 rows and held 457. Measured at 1440 it was an 18,239px scroll
inside a 630px box with `overscroll-behavior: auto`, no depth cap, no count and no jump, while
`FANTASY_WEEKLY_STARTABLE_DEPTH` already encoded 120 flex and 24 quarterbacks and was used only
by the waiver list. The board now windows at that depth after search and position filtering
over the full board, states "Showing 120 of 457 players" with Load more and Show all at 44px,
and the scroll box is retired at every width with the header row sticking under the 73px site
header in page flow. After a 3,310px scroll at 1440 the header row's top measured 73 with row
66 under it.

The count line is a polite status region now, which closes the zero-live-region P2 on this
surface, and "Expert range" and "Rostered" still have no definition anywhere on the page,
which stays open as a help-layer item. Search and a position filter, listed above as
deferred, have shipped since that section was written.

## Verified state, 2026-09-11

Both themes at 390, 768, 1024 and 1440, default, quarterback board and scrolled states, parser
gate at 16.29:1 light and 15.28:1 dark: zero AA contrast failures, zero horizontal overflow,
zero sub-44px targets, one `main`, one `h1`, zero unnamed `section` landmarks, 90 of 90 focus
rings at 1440. One instrument note for the next run: the sweep's "scrolled" driver looked for a
`region` role containing a table, which matched nothing here, so it scrolled the window rather
than the box; the box is gone now, so the window scroll is the right measurement.
