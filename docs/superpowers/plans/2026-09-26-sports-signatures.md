# Sports signatures implementation plan

**Goal:** Ship PR 3 of `docs/superpowers/specs/2026-09-25-project-specific-ui-design.md`, the ten sports routes rebuilt around their signatures and moved onto the Catalog 97 tokens, on branch `design/sports-signatures`, stacked on `design/personal-tools-signatures` (PR #474).

**Architecture:** The same shape as PRs 1 and 2. Each route reads its inks from `PROJECT_PRESS`, opens on `Catalog97ProjectHero`, and passes its signature in as the child. Signature geometry lives in a pure, unit-tested helper, and the component only draws what the helper returns. The two signatures that more than one route uses, the points ladder for the two football leagues and the seed ladder for the NBA and the NFL, live in `src/components/football/` beside the kit those routes already share. Every other signature stays inside its route with a route-local stylesheet.

**Global Constraints:** Everything under "Global Constraints" in `docs/superpowers/plans/2026-09-25-project-ui-foundation-and-data-dashboards.md` applies. On top of it, team colours that arrive in a snapshot are data and print only as swatches, stripes, and marks with the text in ink, since as small text they fail 4.5:1. New shared components are imported by their own path, so `src/components/football/index.ts` stays untouched while routes are built in parallel.

## Task 0: Shared groundwork (done before the routes)

The ten PR 3 rows join `src/constants/projectPress.ts` with the spec's inks. The football kit in `src/components/football/` moves onto the `--c97-*` names with `scripts/migrateHomeTokens.mjs`, loses its Tailwind radius and shadow utilities, and the crest plate paints `--c97-print-bone`, the constant cream the old `--home-dark-ink` stood for, so a crest still sits on a light plate in dark mode. Under the bridge every one of those changes paints the same as before, which is why it can land before the routes.

## Task 1: Premier League and La Liga (green with blue, green with vermilion)

Helper `src/components/football/pointsLadder.ts`, tested in `src/components/football/__tests__/pointsLadder.test.ts`. `leagueZone(position, clubCount)` returns the zone the two routes already use (one to four Champions League, five Europa League, six Conference League, the bottom three relegation), and `pointsLadder(rows)` places each club on a vertical points axis, nudging clubs level on points apart so their labels never overlap, and returns the zone lines as points gaps. The signature is `PointsLadder.tsx`, the ladder on a paper plate in the hero, with the gap from the leader, from the last Champions League place, and from the drop written at the lines. The standings table is set like a matchday programme with the zones printed as bands behind the rows. `HomeStatsPanel` and `StatFascia` go. `GoalsPulseStrip`, `ResultsTape`, `ClubDrawer`, the "Premier League standings" and "La Liga standings" table names, the `pl-selected-club` and `la-liga-selected-club` test ids, and the "Show … details" buttons stay.

## Task 2: MLB (green, vermilion)

Helper `src/app/mlb/scoreboard.ts`, tested beside it. `divisionBoard(standings)` returns the six divisions in American then National League order, each team with its W-L, games back, and ten last-ten squares. The spec asked for squares from `MlbFormSummary.sequence` in each team's `primaryColor`, but the committed snapshot carries `primaryColor: null` for all 30 teams and only five games in each sequence, and the summary the page reads carries neither. The squares therefore come from each standings row's `last10` count, wins filled and losses hollow, printed in ink and read as a count. The signature is the out-of-town scoreboard in the hero. The panel and the four `StatCard`s go, and the standings, team detail, and leaders stay.

## Task 3: NBA and NFL (saffron with blue, vermilion with blue)

Helper `src/components/football/seedLadder.ts`, tested in `src/components/football/__tests__/seedLadder.test.ts`. `seedLadder(teams, bands)` orders a conference by seed, splits it into bands (NBA one to six in, seven to ten play-in, the rest out, and NFL one to seven in, the rest out), and returns the games-clear gap at each line as `((Wa - Wb) + (Lb - La)) / 2`, with ties counted as half a win and half a loss. `nflSeeds(teams)` derives the seeds the NFL snapshot leaves null, with division leaders taking one to four in conference-rank order and the next three by conference rank taking five to seven, labelled as the picture if the season ended today. The shared `SeedLadder.tsx` draws both conferences with a team chip in the team's colour. The NBA page reads colours from the team snapshots, which hold them as hex without the leading `#`. The NFL page adds its eight divisions as a grid striped in each team's `primaryColor` and `secondaryColor`, and keeps the "through week" stamp. The panels and the stat card rows go.

## Task 4: World Cup (teal, vermilion)

Helper `src/app/world-cup-2026/bracketTree.ts`, tested beside it. `bracketTree(rounds)` lays out the knockout rounds from the round of 32 to the final as columns, links each fixture to the one it feeds, and returns the champion. The signature is the bracket in the hero, which scrolls inside its own plate at phone width and never scrolls the page. The tournament finished on 2026-07-19, so the page reads as a final record, the group tables sit below the bracket, and the countdown renders only while a kickoff is still ahead.

## Task 5: PGA Tour (green, saffron)

Helper `src/app/golf/leaderboard.ts`, tested beside it. `leaderboardSlats(entries, cutLine)` returns the slats with each round score, the to-par tone, and where the cut line falls. The signature is the manual leaderboard, names on slats, rounds in columns, the cut drawn across, and under-par numbers in `--c97-negative`, golf's red. The snapshot has no hole-by-hole scores, so the player scorecard shows rounds and the birdie, bogey, par, and eagle counts and no holes. The panel goes, and the table, mobile cards, and player rail stay.

## Task 6: Formula 1 (vermilion, blue)

Helper `src/app/formula-1/timingTower.ts`, tested beside it. `timingTower(standings)` returns each driver or constructor with the gap to the leader, the interval to the car ahead, and the round's movement from `previousPosition` and `pointsDelta`. The signature is the timing tower in team livery on a paper plate. The panel goes, and the start lights, countdown, livery bars, podium, and the Drivers button's `aria-pressed` stay.

## Task 7: Fantasy Formula 1 (saffron, vermilion)

Helper `src/app/fantasy-formula-1/garage.ts`, tested beside it. `garageSlots(summary)` maps a lineup onto five driver boxes and two constructor boxes, empty boxes included, and returns the budget bar's spent, remaining, and over-budget segments. The signature is the garage, with the budget meter as the cost bar across the pit boxes. The panel at the bottom goes, and the optimizer, lock toggles, and `data-testid="fantasy-formula-1-lineup"` stay.

## Task 8: March Madness (blue, vermilion)

Helper `src/app/march-madness-2026/bracketLayout.ts`, tested beside it. `regionBracket(region)` turns a region's `r1`, `r2`, `s16`, and `e8` into positioned games from the first round to the Elite Eight and flags each upset pick, meaning a winner seeded below its opponent. The signature is one region's bracket in the hero with the upsets marked. The editorial stays, and so does everything `e2e/march-madness.spec.ts` pins, from the headings, deep links, CTA links, companion article link, and JSON-LD blocks to "San Jose, CA (PT)" and "Vanderbilt +5".

## Task 9: Verification and review

Full Jest, `tsc --noEmit`, and ESLint on the touched directories. `e2e/product-surfaces.spec.ts` and `e2e/march-madness.spec.ts` against the dev server on port 3100. The contrast sweep over the ten routes plus the March Madness bracket view, the F1 constructors view, and a selected club. A probe at 390, 640, 820, and 1440 for horizontal overflow, hero icon size, and rendered SVG text size, and screenshots in both themes at 1440 and 390. One fresh review of the branch diff, fixes for Critical and Important findings, then merge main if it merges cleanly, regenerate the sitemap, push, and open the PR against `design/personal-tools-signatures`.
