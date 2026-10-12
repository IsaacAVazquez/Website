---
version: 1
slug: "route-nba"
primary_target: "route:/nba"
related_targets: ["src/app/nba/nba-client.tsx","src/app/nba/nba-state.core.ts","src/app/nba/nba.css","src/components/football/SeedLadderPanel.tsx","src/components/football/seed-ladder.css","src/components/football/sports-board.css"]
---

# NBA Pulse surface brief

Written on 2026-10-12 in stage 2 of the project sovereign design (archetype Board, group G1).

## What the page is

The playoff picture, borrowing ESPN's standings with the play-in line and NBA.com's seeding page. The seed ladders are the standings. A title row (the h1, one sentence, and a status strip that leads with Off-season, Final, or In season and then prints the source, season, final flag, team count, and snapshot date, plus a plain sentence in the off-season) sits over the board. The board is a toolbar with five switches (Both conferences, the default, then Eastern Conference, Western Conference, Playoff seeds, Play-in race) over the East and West ladders side by side from 1100px. Each ladder is one ruled table split into In, Play-in, and Out bands, each band named in its own row and marked by a colour bar on the seed cell, with "Playoff line, N games clear" and "Play-in line, N games clear" printed on the dashed line between bands. Columns are seed, team (a chip in team colour and the name), W-L, GB, and from 640px W%, L10, streak, and point differential per game. Every team opens the drawer. The Schedule and Stat leaders tabs follow, then one source line.

## Decisions

The hero sheet, the three readouts, the separate standings table (the ladders carry its columns now), the six Performance cards, Pressure points, the three team leader cards, the Team detail tab, and the snapshot note are cut and are not to be restored. The drawer is the team detail. `NbaView` gained a `league` value, which is the default, so the first screen shows both conferences; `east`, `west`, `playoff`, and `play-in` stay as filters on the same ladders, and a plain `/nba` link that used to open the East alone now opens both.

The palette is the route's own `--sb-*` set on `.nba-root`, a near-white stats sheet in light and a near-black one in dark, and the only colour that means anything is data, meaning green for the top six, amber for the play-in, grey for out, and the team colours on the chips. Archivo with tabular figures runs throughout, and no typeface was added. Games print on `FixtureLedgerSection` grouped by stage, leaders on three `LeaderLedger` lists of per-game averages.

## Pinned, and kept

The h1; the board's region name "NBA standings"; the switch names and counts; the exact status string "ESPN · Season 2025-26 · final regular season standings · 30 teams · snapshot Jun 20, 2026" (and its in-season twin); the tablist "Team and league details" with the Schedule tab; "Show <team> details" buttons; the dialog with "Diff/g"; Escape returning focus; a link naming a team opening its drawer; `nba-selected-team`; the `view` and `team` parameters. The drawer test now expects the default view in the href, and the state test checks the new default.

## Verified state on 2026-10-12

Against a production build, the contrast sweep found no failures and the layout sweep reported 0 fail, with reviews only for the status dot ahead of "Off-season". The first ladder row sits at y554 at 1440x900 (y966 before, in the hero plate) and y736 at 390x844 (y1068 before). The first team is the 17th keyboard stop; Enter, Escape, and Space behave as on MLB, and reduced motion holds the drawer still.
