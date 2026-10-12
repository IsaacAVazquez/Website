---
version: 1
slug: "route-nfl"
primary_target: "route:/nfl"
related_targets: ["src/app/nfl/nfl-client.tsx","src/app/nfl/NflDivisionGrid.tsx","src/app/nfl/nfl.css","src/components/football/SeedLadderPanel.tsx","src/components/football/seedLadder.ts","src/components/football/sports-board.css"]
---

# NFL Pulse surface brief

Written on 2026-10-12 in stage 2 of the project sovereign design (archetype Board, group G1).

## What the page is

The playoff picture as it would stand if the season ended today, the same genre as NBA with seven seeds and one line. The status strip leads with "If the season ended today" (or "Regular season over") and prints the source, season, "through week N of 18" or "week 1 in progress", and the snapshot date, with a second line saying the seeds come from each team's division and conference rank. The board is a toolbar (Both conferences, AFC, NFC, Playoff field) over AFC and NFC ladders side by side, all sixteen teams each, the In band (seeds one to seven) and the Out band (a dash for the seed, in tiebreak order), with "Playoff line, N games clear" on the dashed line. The division grid follows as the second screen, eight ruled lists striped in each team's primary and secondary colours with the leader marked "Leads", every row a button into the drawer. Then the Schedule and Stat leaders tabs and one source line.

## Decisions

The hero sheet, the readouts, the separate table, the Performance cards, Pressure points, the four leader cards, the Team detail tab, and the source band are cut and are not to be restored. The ladder now prints the out band, which the old signature hid. The postseason result moved into the drawer's notes. Games print on `FixtureLedgerSection` grouped as "Week N", and the four leader categories keep their switch over two `LeaderLedger` lists (first to fifth, sixth to tenth).

The palette is `--sb-*` on `.nfl-root`, a cool sheet with navy rules, blue for the In band and grey for out. No added typeface.

## Pinned, and kept

The h1; the region "NFL standings"; the AFC switch; "/snapshot <date>/" and "· week 1 in progress ·"; the tablist with Schedule; "Show <team> details"; the dialog with "Points against"; Escape returning focus; `nfl-selected-team`; the `view` and `team` parameters. The division grid's buttons are named by their visible text, not "Show ... details", so they never collide with the ladder's buttons in tests or for a screen reader.

## Verified state on 2026-10-12

Against a production build the contrast sweep found no failures and the layout sweep 0 fail. The first ladder row sits at y578 at 1440x900 (y966 before) and y713 at 390x844 (y1068 before). The first team is the 16th keyboard stop, and the drawer opens, closes, and returns focus by keyboard.
