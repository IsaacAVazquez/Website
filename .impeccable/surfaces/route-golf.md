---
version: 1
slug: "route-golf"
primary_target: "route:/golf"
related_targets: ["src/app/golf/golf-client.tsx","src/app/golf/leaderboard.ts","src/app/golf/golf.css","src/components/football/DetailDrawer.tsx"]
---

# PGA Tour Pulse surface brief

Written on 2026-10-12 in stage 2 of the project sovereign design (archetype Board, group G1).

## What the page is

A tournament leaderboard in the manner of the Masters' manual board and the PGA Tour's leaderboard. A compact tournament header (the h1, the event as the h2, and one line with the round status, the course and location, the dates, and the field and cut) sits over one leaderboard for the field. The board's toolbar holds the Leaderboard and Players tabs and the "last checked" time, sticky from 640px. The Leaderboard view is name slats, each player a white board on the green ground with position, the name in caps, the country, total, today, thru, R1 to R4, and movement, with every score under par in golf's red and the cut line drawn across the board when the cut is set. The Players view is a grid of player cards, which are the object. The first 20 players print, with a button for the whole field. One source line follows.

## Decisions

The hero sheet, the course panel, "Top of the board" (the old slat signature, which printed the leaders a third time), the three readouts, "Jump to the full board", the per-view description, and the Snapshot note band are cut and are not to be restored. The brief named three views (slats, table, cards), but the slats and the table were the same rows twice, so the board view is the slat board carrying the table's columns, and the URL keeps its two `view` values. `boardRows` and its four tests were deleted along with the hero board. A finished event no longer prints a stale "next round tee time" in the drawer.

The ground is deep green (#134330 light, #0a2117 dark) and the slats are white (#fbfaf4) in light and dark green (#142c20) in dark; the drawer and the cards read the slat colours. Focus paints gold on the ground and blue on the slats. Archivo caps for names, Fragment Mono for scores, Newsreader for the event name. On paper the ground turns white.

## Pinned, and kept

The h1 "PGA Tour Pulse"; the tournament name as an h2; the region "Full leaderboard (scrollable)" with the selected row's `aria-current`; the 20-row limit and "Show all N players" and "Show the top 20"; the tabs "Leaderboard" and "Players" in the "Golf view switcher" tablist; `.c97-golf-card` with `aria-current` (e2e); the phrase "This page is a checked-in tournament snapshot"; "Next round tee time"; the scoring split and its no-data sentence; `golf-selected-player`; `/api/golf/players/`; the `view` and `player` parameters.

## Verified state on 2026-10-12

Against a production build the contrast sweep found no failures and the layout sweep 0 fail, with reviews only for wrapped header meta items that start with their separator. The first slat sits at y421 at 1440x900 (y1245 before) and y550 at 390x844 (y1178 before). The first player is the 15th keyboard stop after the two tabs and the board's scroll region, and Enter, Escape, and Space behave as on the other boards.
