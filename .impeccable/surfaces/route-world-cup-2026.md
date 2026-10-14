---
version: 1
slug: "route-world-cup-2026"
primary_target: "route:/world-cup-2026"
related_targets: ["src/app/world-cup-2026/world-cup-client.tsx","src/app/world-cup-2026/WorldCupBracket.tsx","src/app/world-cup-2026/world-cup.css","src/components/football/FixtureLedger.tsx"]
---

# World Cup Pulse surface brief

Written on 2026-10-12 in stage 2 of the project sovereign design (archetype Reference and Board, group G1).

## What the page is

A tournament record, borrowing the bracket poster and Wikipedia's knockout stage page. A display title in Newsreader, one sentence, a meta line (the tournament, the dates, the host nations, the phase), and the record as a small definition list (Champion, Final, Matches) form the title row. The bracket follows full width with no plate, ending at the champion and scaled to the column from 1100px. Under it the explore section keeps its three tabs (Group stage, Knockout bracket, Match schedule) with the team lookup and its card beside the view from 1280px and above it on smaller screens. The twelve group tables print as a ruled grid, two across from 1024px, then the third-place race as a ruled table; the knockout tab lists every round as a ledger of ties under a label for each day, which is the bracket's keyboard path; the schedule lists the latest results under a label of day and stage ("Jul 7 · Round of 16"). Then the Golden Boot table when the snapshot has scorers, the host venues as a plain list by nation, and one source line saying the tournament ended on July 19, 2026 and the tables, fixtures, and bracket are ESPN's.

## Decisions

The hero sheet, the bracket's plate, the "Find a team" jump link, the "How 2026 worked" card, the venue box grid, the Snapshot note band, and the boxes around each group table, the race, and each knockout round are cut and are not to be restored. The team card is the one box on the page, since the card is the team. `FixtureGroupSection` was only used here and was deleted. The shared fixture ledger now prints a penalty shootout under the score when a fixture carries one, which the league pages never do.

The ledger's group labels carry the dates on this page, so both tabs pass `dayInLabel` and no row prints its day again. The page is sent only the latest twelve results, which stop halfway through the Round of 16, so the schedule's label leads with the day and its description says "The latest results, day by day." A stage name alone over four of eight ties read as the whole round. In the knockout tab the pinned team's ties take the tint its group row has and a W, D, or L beside the score, through the ledger's `contextTeamId`. The heavier winner's name the old cards printed is cut there, since the ledger prints both names at one weight, and the bracket above still prints the winner heavier. On a screen under 375px the ledger rows on both tabs print without their flags, because a flag and its gap take 30px from each name and "Bosnia-Herz" and "Switzerland" were cut at 320 and 360px. The group tables keep their crests at every width.

The three tabs are one stop in the Tab order and the arrow keys move between them, the same pattern `SegmentedTabs` gives MLB, NBA, and NFL. From 1280px the pinned column is capped at the window's height less its top offset twice and scrolls inside itself, because the team card with seven stats, form, and three results adds up to more than a 768px window by the stylesheet's arithmetic. On paper every group table prints and the "Show all 12 groups" button does not, since a sheet is narrower than `lg`.

The source line names only what ESPN supplied, and the builder collects no scorers from any feed, so the line no longer says ESPN's scorer feed was empty.

The palette is `--wcup-*` on `.wcup-root` (tournament paper in light, near-black in dark), with pitch green for the qualifying places and amber for the third-place race as data, named in the legend and in screen-reader text on each position. Newsreader for the title, the record, and the section headings; Archivo for the tables; Fragment Mono for the bracket's scores. Flags sit on a pale chip in dark.

## Pinned, and kept

The h1; the record's dt labels with the champion, the final score line, the venue, and the match count; the tabs and the `view` and `team` parameters; twelve "Group X standings" tables and the third-place race; "Show <team> details" buttons with `aria-pressed`; the lookup "Find a team"; `world-cup-selected-team` with `aria-live`; the phone hold of groups past the fourth (`hidden lg:block print:block` on each table's parent) and its toggle, whose wrapper is `lg:hidden print:hidden`; the knockout rounds' "16 ties" and "1 tie" counts; the schedule's "Jul 19 · Final" label shape; the source line's two sentences; the scroll to the card on a far pick; "June 11 to July 19, 2026" and the raw-date fallback; "16 stadiums · 3 nations"; the bracket's region and its `c97-bracket-*` classes. The client test lost its two assertions about the cut format card.

## Verified state on 2026-10-12

Against a production build the contrast sweep found no failures and the layout sweep 0 fail; its reviews are the lookup's scroll margin and sticky offset, which are deliberate, and the venues' two-and-one row at two tablet sizes. The bracket starts at y495 at 1440x900 (y939 before) and y556 at 390x844 (y1017 before). The bracket's region is the 12th keyboard stop, the tabs follow, and the first team button was the 17th; Enter pins the team card. With the tabs as one stop the first team button is the 15th by count, which has not been measured again in a browser, and neither has the pinned column's scroll at 1366x768.
