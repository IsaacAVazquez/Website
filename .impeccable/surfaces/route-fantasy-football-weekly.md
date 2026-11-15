---
version: 1
slug: "route-fantasy-football-weekly"
primary_target: "route:/fantasy-football/weekly"
related_targets: ["src/app/fantasy-football/weekly/weekly-client.tsx","src/app/fantasy-football/weekly/page.tsx","src/app/fantasy-football/waivers/page.tsx","src/lib/fantasyWeeklySnapshot.ts","src/hooks/useFantasyWeeklySnapshot.ts","scripts/buildFantasyWeeklySnapshot.ts"]
---

Updated on 2026-10-13 by the fantasy football redesign. All eight fantasy routes were rebuilt as one product on a kit of their own, `src/components/fantasy/fantasy.css`. `docs/FANTASY_FOOTBALL_KIT.md` is the kit's reference and `docs/superpowers/specs/2026-10-13-fantasy-football-redesign-design.md` is the spec. Every route renders inside `src/app/fantasy-football/layout.tsx`, which sets the kit's root and the product bar, and all eight are wide tool routes. The weekly board draws with kit classes and `fantasy-weekly.css`. Every item under "Decisions not to re-litigate" stands, including the not-published state before Week 1 and flex and quarterback ranks never reading as one list.

That supersedes these layout notes below and leaves the rest of the record as it was written. The 2026-09-27 status note's sentence that the route reads `--c97-*` tokens directly under `data-c97-surface` describes the page before the kit. In "Frame removal, 2026-10-12" the section heads set in the body face at `text-xl` semibold, the header description, and every y position are superseded, and so is the note that the first board row sits under the My team workspace. My team sits in a rail beside the board from 1200px up and after it below that. That order was the lead's call, and the spec says it is one change to put back if the earlier order was Isaac's. I did not measure the new positions for this note.

Updated on 2026-09-28 by the responsive pass. The page uses the site gutter through `SHELL_CLASS`, and the 96px scroll margins on the section headings and on `MyTeamPanel`, sized for the deleted sticky header, are gone, since nothing is pinned above them.

# Fantasy Football Weekly Board

Checked against the code on 2026-11-02.

**Status note, 2026-09-27.** This route renders inside `Catalog97ToolShell` and reads `--c97-*` tokens directly under `data-c97-surface`. `DESIGN.md` now describes Catalog 97 and governs this route. The old site header was sticky at 73px and was deleted on 2026-09-16, and `Catalog97Header` is `position: relative`, so every measurement below that assumes a 73px sticky header predates that change. Contrast figures below were measured against Working Instrument values carried through the since-removed bridge and may need re-measuring against the shipped `--c97-*` colors.

## Mode

Operate. The visitor is deciding a lineup or a waiver claim on a Tuesday, so scanability and
a stable, predictable table outrank expression. This is the one fantasy board that stays true
after the season opens. The page's own lead said so directly until 2026-09-15, when the My team
lead replaced that sentence (77b572bbd), and as of 2026-11-02 the season notes on the draft
pages say it instead, each with a link here.

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

As of 2026-11-02 the file has been committed since 2026-09-09 (782c79e85) and holds 2026 Week 8,
so the 404 and the not-published state described above belong to the stretch before that date.

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

As of 2026-11-02 the preload runs only once Week 1 of the calendar year's season has opened,
which 7a88f4bac added on 2026-08-30 so a preseason visit does not request a file that 404s.
Since 2026-09-25 (1aa84da0d) `page.tsx` also reads the committed file on the server through
`loadFantasyWeeklySeed` and hands the client the requested scoring format's board, so the first
rows are in the HTML before the bundle runs and the client's fetch fills in the other formats.
Until hydration the source stamp prints in UTC with "UTC" after it, and after hydration
`formatUpdatedAt` prints it in Pacific time with the zone. `e2e/fantasy-football.spec.ts`
("ships the weekly board's first rows in the HTML") pins the rows, and `weekly-client.test.tsx`
pins the UTC stamp. The waiver page seeds its rows the same way.

## Deliberately deferred

Search and a position filter on the table are product work rather than remediation, and were
left alone on purpose. Both weekly panels use `.home-card`, which carries an always-on
treatment that may not suit this surface; that is a visual decision for whoever owns the
card, not a defect with a threshold.

As of 2026-11-02 the `.home-card` item is moot. The weekly client stopped using the class on
2026-09-27 (9fe9858bf), its rule left `globals.css` the same day (486ea70cb), and the board and
My team draw with the kit.

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

As of 2026-11-02 the rankings view has neither layout, since it moved to tiers on 2026-10-16
(see "Tiers, 2026-10-16" below), and the `matchMedia` store now serves only the waiver list.

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

## Frame removal, 2026-10-12

Part of the project sovereign design's fantasy group (G3), frame removal only, and the decisions above stand (the preseason empty state, the separate flex and quarterback rank spaces, the waiver reading). The weekly and waiver routes share `weekly-client.tsx`, so both lost the green lead-ink hero with the Anton h1, the paper plate around the source line, and the torn seam. They now open on the shared compact header (`src/components/fantasy/FantasyRouteHeader.tsx`), with the existing orienting copy and the week, source, staleness, and expert counts as one muted line. The "Flex rankings", "Quarterback rankings", "This week’s list", and "My team" heads moved from `c97-poster-sm` to the body face at `text-xl` semibold, and `weekly-client.test.tsx` changed with them, from asserting the poster class to asserting it is gone and the heading is semibold.

As of 2026-11-02 that test asserts that the "This week’s list" heading carries the kit's section heading class, `ffb-h2`, and not `c97-poster-sm`, which ecdc01bd5 changed on 2026-10-13 when the heads moved onto the kit.

Verified on a production build on 2026-10-12. The scoring toggle is at y343 at 1440 (from y818) and y441 at 390 (from 726), and the first board row at y1314 at 1440 (from 1819), still under the My team workspace, whose place above the list was already settled. No contrast failures, 0 layout fails, the scoring toggle works with Space, and the `project-workflows.spec.ts` weekly test passes on dev and production.

## Tiers, 2026-10-16

PR #610, merged on 2026-10-16, redrew the rankings view in tiers the way the draft board draws them, through the shared `TierSection` and `ExpertSpread` in `src/components/fantasy/TierSection.tsx`. FantasyPros publishes no tiers for a weekly board, so `computeWeeklyTiers` in `src/lib/fantasyWeeklyTiers.ts` splits each board at its widest jumps in expert average, weighed against how much the experts disagree, until no tier holds more than ten players, and a split never leaves a tier of one. The note under the heading says the grouping is mine. The tiers are drawn on the list the position filter leaves, so the RB view has running back tiers, and a search hides rows without changing a tier's count or range.

The rankings view renders no table at any width. Each tier is a section of kit rows with the rank, the position chip, the name, the team, the opponent, the rostered rate, the expert spread plot, and the expert average, all under one set of pinned column heads, and the spread's key prints in the head from 1280px. Below 768px a row is two lines, the plot drops out, and the expert range prints as text beside the opponent. The waiver list still switches between its table from `md` up and its stacked list below. `weekly-client.test.tsx` pins the tiers at both widths, a tier's count and range under a search, and the running back tiers. I checked this against the code and the unit tests and did not measure it in a browser.

## My team, 2026-09-15

`MyTeamPanel` (`src/components/fantasy/MyTeamPanel.tsx`) landed on 2026-09-15 (77b572bbd), and this route and the waiver route both render it. It is a saved team with three views on one switch, "Weekly lineup", "Roster", and "League settings", and it opens on the lineup once a player is saved and on the roster before that. The roster view imports the redraft draft tracker's picks from the same browser, searches the weekly board, marks a player available in the visitor's league, and adds by hand a player the weekly board does not rank. The lineup fills the league's starting slots from the weekly consensus, with QB and flex ranks read off their own boards, and the add and drop comparison works only from players marked available. This route puts the lineup first and the waiver route puts the comparison first, through the panel's `lead` prop. The team saves in browser storage under `fantasy-my-team-v1-<season>`. When either weekly source is stale, the lineup gives way to a warning that recommendations are paused and the comparison prints no result. The copy says the comparison covers one week and estimates no season-long value, points gained, or waiver bid, and that the lineup has no live injury feed. Below 1200px the toolbar has a "My team, N players" link to it. `src/components/fantasy/__tests__/MyTeamPanel.test.tsx` pins the views, the order on each route, the stale pause, the draft import, and where focus goes after an action removes its own button. I checked this against the code and the unit tests and did not run it in a browser.
