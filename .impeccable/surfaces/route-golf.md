---
version: 1
slug: "route-golf"
primary_target: "route:/golf"
related_targets: ["src/app/golf/golf-client.tsx","src/app/golf/leaderboard.ts","src/app/golf/golf.css","src/components/football/DetailDrawer.tsx"]
---

# PGA Tour Pulse surface brief

Written on 2026-10-12 in stage 2 of the project sovereign design (archetype Board, group G1).

## What the page is

A tournament leaderboard in the manner of the Masters' manual board and the PGA Tour's leaderboard. A compact tournament header (the h1, the event as the h2, and one line with the round status, the course and location, the dates, and the field and cut) sits over one leaderboard for the field. The board's toolbar holds the Leaderboard and Players tabs and the "last checked" time, sticky from 640px. The Leaderboard view is name slats, each player a white board on the green ground with position, the name in caps, the country, total, today, thru, R1 to R4, and movement, with every score under par in golf's red and the cut line drawn across the board when the cut is set. The Players view is a grid of player cards, which are the object. The first 20 players print, with a button for the whole field. Under 480px the country drops and a long name wraps to a second line, since one line holds about nine capitals at 320px. One source line follows.

## Decisions

The hero sheet, the course panel, "Top of the board" (the old slat signature, which printed the leaders a third time), the three readouts, "Jump to the full board", the per-view description, and the Snapshot note band are cut and are not to be restored. The brief named three views (slats, table, cards), but the slats and the table were the same rows twice, so the board view is the slat board carrying the table's columns, and the URL keeps its two `view` values. `boardRows` and its four tests were deleted along with the hero board. The drawer prints "Next round tee time" only for a player who has not teed off in the round, so it shows between rounds and never on a finished board or for a player on the course, and the status prints once, in the tags. ESPN marks the tournament complete after every round, so that flag does not decide it.

The ground is deep green (#134330 light, #0a2117 dark) and the slats are white (#fbfaf4) in light and dark green (#142c20) in dark; the drawer and the cards read the slat colours. Focus paints gold on the ground and blue on the slats. A card's ring falls on the ground between the cards, so it is gold, and a name's ring on a slat is blue and inset so that all of it stays on the slat. Archivo caps for names, Fragment Mono for scores, Newsreader for the event name. On paper the ground turns white in both themes, the dark story's inks go back to the light ones, and the selected tab prints as ink text with no fill.

## What the board works out

The snapshot keeps ESPN's movement as it is sent, which is the new place minus the old, so the board prints its negative, and a player who gained 20 places arrives as -20 and reads "Up 20". ESPN's leaderboard sends no figure for Today, so the builder works it out from the line scores, a finished round against par and a round in progress as the live total less the rounds before it. The page fills Today the same way for a committed board that still carries 0 for every player, as all 30 boards committed between 2026-10-02 and 2026-10-12 do. A player who has not started the round, or who left the field before it, prints a dash.

ESPN publishes a cut score through round two as a projection, with a count of the players inside it. Until a player carries the missed cut status the header reads "Projected cut" and the board draws no cut line, and after that the header reads "Cut X, N advanced". A feed that has not described a cut at all reads "Cut TBD", and "Cut to come" is kept for an event whose cut round is still ahead.

## Pinned, and kept

The h1 "PGA Tour Pulse"; the tournament name as an h2; the region "Full leaderboard (scrollable)" with the selected row's `aria-current`; the 20-row limit and "Show all N players" and "Show the top 20"; the tabs "Leaderboard" and "Players" in the "Golf view switcher" tablist; `.c97-golf-card` with `aria-current` (e2e); the phrase "This page is a checked-in tournament snapshot"; "Next round tee time"; the movement words "Up N", "Down N", and "Steady"; the header's "Cut X, N advanced", "Projected cut X", and "Cut TBD"; the cut row "Cut line X, N players advanced", which spans every column; the scoring split and its no-data sentence; `golf-selected-player`; `/api/golf/players/`; the `view` and `player` parameters.

## Verified state on 2026-10-12

Against a production build the contrast sweep found no failures and the layout sweep 0 fail, with reviews only for wrapped header meta items that start with their separator. The first slat sits at y421 at 1440x900 (y1245 before) and y550 at 390x844 (y1178 before). The first player was the 15th keyboard stop after the two tabs and the board's scroll region, and Enter, Escape, and Space behave as on the other boards.

The view tabs became one keyboard stop later on 2026-10-12, with the arrow keys, Home, and End moving between them, which by count makes the first player the 14th stop. That count, the focus rings, the wrapped names, and the print rules were not measured again in a browser after the change.
