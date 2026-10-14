---
version: 1
slug: "route-mlb"
primary_target: "route:/mlb"
related_targets: ["src/app/mlb/mlb-client.tsx","src/app/mlb/MlbScoreboard.tsx","src/app/mlb/scoreboard.ts","src/app/mlb/mlb.css","src/components/football/sports-board.css","src/components/football/DetailDrawer.tsx"]
---

# MLB Pulse surface brief

Written on 2026-10-12 in stage 2 of the project sovereign design (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Board, group G1).

## What the page is

The out-of-town scoreboard at the ballpark, with the conventions of MLB.com's standings page, and none of either's branding. The scoreboard is the page. A title row (the h1, one sentence, and a status strip with the season state, the source, the season, and the update date) sits over the board, and the board is a toolbar (the heading and the All divisions, American League, National League, and Wild card switch, sticky from 640px) over one ruled table per race. From 1000px the six divisions split by league the way a ballpark's board does, the AL East, Central, and West down the left and the NL down the right, and a phone stacks them; the single-league views flow two across. The wild card view swaps them for the AL and NL wild card races, with an amber dashed line under the third slot. Each row is the team code, the club name (dropped on a phone and on paper), a Leads or WC mark in words, W-L, GB, the last ten as lit squares, and the streak, and every team is a button into the drawer. A one-sentence summary under the toolbar carries the best record, the closest division, and the longest win streak, which were the hero's three readouts. Its three clauses are joined as a list with "and" before the last, the streak prints as a count of games ("at 5 games") and not as the feed's code, and once postseason games are on the slate every clause reads as a finish ("finished with the best record", "finished closest", "ended the regular season on the longest win streak"). The Games and League leaders tabs follow, then one source line.

## Decisions

The hero sheet, the three readouts, "Jump to standings", the duplicate standings table and its division switch, the Team detail tab (pressure points, the home park line, and the team game cards), and the Snapshot note band are cut and are not to be restored. The drawer is the team detail now, holding the W%, GB, runs, run differential, L10, offense and defense ranks, the last five, the home park, and the team's three recent and three upcoming games. Its tag line leaves the division place out when the feed sent no rank.

A team's row is tinted and its button reads as pressed only while that team's drawer is open, since nothing else on the page shows a selected team. A plain visit presses no row. A view switch never opens the drawer, and a bracket placeholder in the games ledger (an "NL Champion" that is no club yet) prints as plain text and not as a button. A bare `/mlb` is always All divisions with no drawer, so Back from a drawer or a view switch lands there. Each button's label replaces the mark printed inside it, so the row repeats "Leads the division" or "Holds a wild card slot" in screen reader text after the button.

On the wild card view the plus is a slot holder's lead over the last wild card slot, the third one, and the legend and the GB column title say so.

The board keeps one surface in both themes, scoreboard green (#173f2c) with cream lettering, as a display board may, while the shell still switches. Amber (#f2b632) is the lamp colour for the last-ten wins and the Leads mark. Fragment Mono prints every figure and the team codes. No typeface was added. The snapshot carries no MLB team colours (`primaryColor` is null for all 30 clubs), so the squares light in the board's amber. Club logos sit on a cream chip in the games ledger and the drawer, since they are drawn for a white ground. On paper the board flips to black on white, and a last-ten win keeps its fill through `print-color-adjust: exact`, because browsers drop backgrounds on paper by default and the fill is all that tells a win from a loss.

Games print on the shared `FixtureLedgerSection` grouped by round (Wild Card Series, Division Series, League Championship Series, World Series, or Regular season). The shared row dates itself, so the route adds no date. A result prints its day under the score, an upcoming game prints its day over its time, a game whose start time is a placeholder prints its day and "time TBD", and an unplayed game the series may not need prints "if necessary" on a line of its own. The group label carries no game count. The leaders are six `LeaderLedger` lists of the top five places, so players tied for fifth all print and a list can run past five rows.

## Pinned, and kept

The h1 "MLB Pulse"; the board's region name "MLB standings"; the "American League" switch and the `view` and `team` parameters; every team button named "Show <club> details"; the tablist "Team and league details" with the Games and League leaders tabs; the "updated <date>" text; the round labels on the Games tab; the dialog "<club> detail" with "Runs allowed"; Escape returning focus to the opener; `mlb-selected-team`; and the second "Show ... details" button fetching `/api/mlb/teams/`. The client test that asserted one division table at a time now asserts all six division tables, and the postseason test expects "Regular season" where it expected "League fixture".

## Verified state on 2026-10-12

Against a production build, `scripts/contrastSweep.mjs` found no failures in either theme and `scripts/layoutSweep.mjs` reported 0 fail across 12 sizes, with reviews only for the status dot that sits ahead of the "Postseason" word. The first board row sits at y540 at 1440x900 (y986 before) and y697 at 390x844 (y1064 before). A keyboard walk reaches the switch at the 12th stop and the first team at the 16th; Enter opens the drawer with focus inside, Escape closes it with focus back on the team, and Space presses a switch. Under reduced motion the drawer's entrance resolves to 0.00001s.
