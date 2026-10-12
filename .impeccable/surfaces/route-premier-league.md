---
version: 1
slug: "route-premier-league"
primary_target: "route:/premier-league"
related_targets: ["route:/la-liga","src/components/football/LeagueTableBoard.tsx","src/components/football/league-table.css","src/components/football/PointsLadderChart.tsx","src/app/premier-league/premier-league-client.tsx","src/app/la-liga/la-liga-client.tsx"]
---

# Premier League and La Liga surface brief

Written on 2026-10-11 by the project sovereign pilot (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`, archetype Board). It covers both routes, since they render one component.

## What the page is

A league table app, borrowing conventions from FotMob's league table, BBC Sport's table, and the Premier League's own table page, and none of their branding. Both routes render `LeagueTableBoard`, which takes a per-league config (title, league name, standfirst, id prefix, official stats link) and rows in one shape. Each route client keeps its own URL state, because the two state modules differ in real ways (Premier League selects by `team` with a numeric id and filters Europe to seven and relegation to positions 16 and below, La Liga selects by `club` with an alias map and filters Europe to six and relegation to the last five), and maps its snapshot into the board's props. Each page passes every club's last five results, oldest first, from the committed team snapshots on the server.

The first screen is a title row (the h1, one sentence, and one status line with the matchday, the update time, and the "checked-in football-data.org snapshot" source) with the club lookup on its right, then the table's header strip (the results ticker and the goals sparkline on one ruled line), then the board. The board is a sticky toolbar (the "Standings" heading and the four view switches) over the table, with the points ladder as a 300px companion to the right from 1100px. Under 1100px the ladder follows the table, drawn wide from 640px to 1099px and narrow below. The fixtures and top scorers tabs follow the board, and the club drawer opens on any row, ladder mark, fixture team, or the lookup.

## Decisions

The hero sheet, the poster h1, the seams, the three readouts, the ladder's plate, the Club detail tab (the six performance cards, pressure points, the top scorer card, the storyline, and the fixture card stacks), and the snapshot note band are cut. The drawer is the club detail, so the `detail` parameter dropped its `club` value and defaults to `fixtures`, and an old `?detail=club` link lands on the default tab.

The route has its own palette as `--pl-*` custom properties on `.lt-root`, a warm white (#fbfaf6) with near-black ink in light and a near-black warm surface (#15130f) with off-white ink in dark, and it points `--c97-ink`, `--c97-ink-2`, `--c97-label`, `--c97-surface`, `--c97-rule`, `--c97-field`, `--c97-panel`, `--c97-print-bone`, `--c97-positive`, `--c97-negative`, `--c97-action`, and `--c97-accent` at it, so the borrowed ticker, ledgers, and drawer print in the route's colours. The focus colour is the Champions League blue. The zones are Champions League blue, Europa orange, Conference green, and relegation red, each a 3px edge on the position cell and a tint behind the row, named in the legend and in screen-reader text on the position. Form marks are filled squares with the letter inside (green, grey, red with white letters in both themes), oldest first, with the latest one underlined through a `data-latest` attribute. The drawer's form pills read in the same direction, carry the same underline on the latest, and say "oldest first, latest last" to a screen reader. The "Last 5 reads oldest to newest" key in the legend hides with the column under 640px. Crests print bare at 22px, on a pale chip in dark so navy and black crests stay visible.

The classes use the `lt-` prefix, never `pl-`, because `pl-*` is Tailwind's padding-left family. `catalog97-closeout.test.ts` read `pl-column` as dead spacing, and a `pl-sm` or `pl-md` could compile to real padding.

No typeface was added. Headings and numbers are the body grotesque at 700 and 800 with tabular figures, Fragment Mono stays only in the results ticker, and Newsreader and Anton do not appear inside the route.

The table drops to Pos, Club, P, GD, and Pts on a phone, adds W, D, L, and Last 5 at 640px, and adds GF and GA at 768px. On a phone the view switches scroll sideways in one row. On paper the toolbar is static, only the active switch prints, the narrow ladder prints and stays whole on its sheet, and the form column prints.

## Pinned, and kept

The h1 texts "Premier League Pulse" and "La Liga Pulse"; the table names "Premier League standings" and "La Liga standings"; the "Standings" heading; the "Find a club" combobox and the "Open club" button, with choosing alone opening nothing; every row button named "Show <club> details" with `aria-pressed`; every ladder mark as an SVG group named "Show <code> details" that takes focus back after the drawer closes, with its `data-variant` and `data-ladder-hit` hooks; the `pl-selected-club` and `la-liga-selected-club` drawer test ids; the "Official" link in the Top scorers tab; the phrase "checked-in football-data.org snapshot"; the four view switches with their counts and `aria-pressed`; the Fixtures and Top scorers tabs with arrow keys; and the `view`, `team`, `club`, and `detail` parameters.

Four assertions changed with the cut Club detail tab. The two state tests expect `fixtures` as the default detail and now check that `detail=club` falls back to it. The Premier League tab test starts its Fixtures case from the scorers tab, since Fixtures is the default. The La Liga canonicalization test reads the selected club from the row button's `aria-pressed` instead of the Club detail heading.

## Verified state on 2026-10-11

Against a production build (`next build --webpack`, served with `next start`), `scripts/contrastSweep.mjs` found no contrast failures on either route in either theme, and `scripts/layoutSweep.mjs` reported 0 fail, 0 review, and 0 report across 12 sizes from 320 to 2560. The first standings row sits at y544 (Premier League) and y568 (La Liga) at 1440x900, and at y750 and y771 at 390x844, inside the first screen in both cases. A keyboard walk reaches the lookup at the 12th stop, the view switches at the 15th, and the first row at the 19th, since the table's scroll wrapper only becomes a region and a tab stop while the table is wider than its column (it measures itself with a resize observer); Enter on a row opens the drawer with focus inside, and Escape closes it with focus back on the row. Under reduced motion no animation runs and the switch transition resolves to 0.00001s. A Chromium print (Letter, backgrounds on) prints the table across two sheets with the head repeated, the ladder whole on the third, and the fixtures after it.

The drawer's backdrop is `color-mix(var(--c97-ink) 34%)`, which turns into a light wash in dark on every drawer on the site, this one included. A scrim token in `catalog97.css` would fix it everywhere, and since that file is reserved for the lead it is a proposal in the pilot's ledger.
