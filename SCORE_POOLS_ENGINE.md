# Score Pools Engine

The exact-score prediction engine behind `/score-pools`, and the reference for
anyone changing it. The engine is the point of the surface: it formalizes the
process I ran by hand through a full World Cup of pool play, from de-vigging the
market to deciding when a 1-1 beats picking the favorite. The site around it is
a delivery layer, and the data adapters, the scoreline model, the scoring rules,
the field model, and the leaderboard logic are separate swappable modules so the
same core can run different sports and pools without a rewrite.

Everything lives in `src/lib/scorePools/` as pure, framework-free TypeScript
(mirroring `src/lib/retirement/`). The engine runs identically in tests, on the
server, and in the browser, and it is deterministic: no randomness, no clock
reads except the injectable `now`.

## The pipeline

`analyzeFixture` in `engine.ts` runs the whole chain for one game:

1. **De-vig** (`odds.ts`). Convert any quoted format (decimal, American,
   fractional) to decimal, take implied probabilities, and strip the bookmaker
   margin so the outcomes sum to one. Proportional is the default and matches
   the hand method; the power method is available for favorite-longshot bias.
   Two-way and three-way markets both work.
2. **Context shading** (`context.ts`). Per-fixture flags (dead rubber, draw
   suits both, must-win, rotation risk) adjust the calibration targets before
   the solve, modestly, with an audit trail. Standings with explicit
   qualified/eliminated fields produce suggested flags that the user confirms;
   the engine never applies them silently.
3. **Calibration** (`scorelineModel.ts`). A Dixon-Coles-corrected Poisson grid
   over scorelines, capped at 7 goals a side, solved so the win/draw/win masses
   match the de-vigged moneyline and the total matches the over/under target.
   The solver is three nested bisections, each equation monotone in its own
   unknown: the total drives the totals target, the home share drives the
   home/away ratio, and rho (the low-score correction that keeps 0-0, 1-0, and
   1-1 priced right) drives the draw mass. When the draw target sits outside
   the valid rho range the solve clamps, optionally trades a bounded amount of
   totals error for draw fit, and reports residuals in
   `diagnostics` rather than pretending it matched.
4. **The comparison distribution** (`scorelineModel.ts`). What the pool
   actually scores. Under 90-minute rules it is the grid itself, which is why a
   tight knockout carries real draw-after-90 probability. Under final-result
   rules in a knockout, level games extend through extra time (pro-rated,
   slightly slower tempo), and games still level after 120 go to penalties. A
   pool that counts the shootout winner as the winner splits those cells by a
   configurable shootout probability.
5. **Expected points** (`optimizer.ts`). For every candidate scoreline, sum
   over the comparison distribution weighting each possible result by the
   points the candidate earns under the pool's rules (exact / winner and goal
   difference / outcome, default 5/3/2, fully configurable in `scoring.ts`).
   The draw-beats-favorite behavior falls out of this arithmetic rather than
   being special-cased, because a draw pick collects the difference tier on
   every draw while 1-0 collects it only on one-goal home wins.
6. **The leaderboard layer** (`field.ts`, `leaderboard.ts`). The field model is
   a documented heuristic of what the pool submits (mostly the favorite with
   the modal scoreline; configurable; replaced wholesale by known rival picks).
   Each candidate is then priced against a reference opponent, the single
   nearest rival, as E[my points − theirs] and the spread of that gap. The
   recommendation maximizes `E[gap] + k·SD(gap)` where `k` comes from the
   standing: protecting a slim lead late makes `k` strongly negative (mirror
   the field, let shared games cancel), chasing makes it positive (court
   variance, surface differentiators), and the scale is the gap against a
   realistic per-game catch-up rate times the games remaining, so a one-point
   lead with two left reads very differently from ten points with ten to go.
7. **Confidence and reasons.** Confidence is descriptive, computed from how
   concentrated the distribution is and how far the pick's expected points sit
   above the field's; a coin flip reads low no matter the pick. Every
   recommendation carries a plain-language reason and a recheck list (stale
   odds, hand-entered odds, missing totals, unconfirmed lineups, unconfirmed
   suggested flags, calibration residuals).

## What must stay true

- **The scoring basis genuinely changes the path.** Under `ninetyMinutes`, a
  knockout that finishes 1-1 and is won on penalties scores as a 1-1 draw; the
  favorite pick earns zero. Under `finalResult` the pick compares to the score
  after extra time. Tests pin both, plus the pens-count-as-win variant.
- **The optimizer prefers the draw where the draw genuinely wins on expected
  points.** `optimizer.test.ts` holds a regression where the favorite is
  likelier than the draw and 1-1 still tops the table, and where flipping the
  basis flag on a knockout moves the pick off the draw. That behavior is the
  reason this exists; treat those tests as load-bearing.
- **Calibration is honest.** Residuals, clamped rho, and every approximation
  (fair-line assumption, default totals, whole-goal lines) land in
  `diagnostics.notes` and surface in the UI. Do not silence them.
- **The engine stays pure.** Providers and fetch live outside
  (`providers/` is build-time only); `analyzeFixture` takes data in and returns
  data out.

## Data flow

Snapshot-driven, per the site pattern (`SNAPSHOT_DRIVEN_DASHBOARDS.md`):

- `scripts/buildScorePoolsSnapshot.ts` (`npm run update:score-pools`) pulls
  fixtures/results/standings/injuries/lineups from API-Football and moneyline +
  totals odds from The Odds API (keys `API_FOOTBALL_KEY` and
  `THE_ODDS_API_KEY`, both optional), merges typed manual entries
  (`scripts/data/scorePools.manual.ts`) and CSV drops
  (`scripts/data/score-pools/<league-key>.csv`), and writes
  `src/data/scorePoolsSnapshot.ts`. Leagues are configured in
  `scripts/data/scorePoolsConfig.ts`.
- **Odds history is append-only and capped** (48 entries per fixture).
  Unchanged prices refresh the latest entry's timestamp; changed prices append.
  Line movement stays queryable and `summarizeLineMovement` reads it.
- Fail-soft everywhere: a dead provider keeps the previous league snapshot, a
  missing key degrades to manual/CSV with a note, and the workflow
  (`.github/workflows/update-score-pools.yml`, every six hours) refuses to
  commit a snapshot with no leagues.
- Team matching between providers is tiered exact (normalized names plus
  per-league aliases), never fuzzy, mirroring the fantasy ADP matcher's
  philosophy.

The browser side keeps pools, rules, standings, submissions, rival picks,
per-fixture flags, hand-entered odds, and manual results in localStorage
(`src/lib/scorePools/persistence.ts`, `src/hooks/useScorePools.ts`), decoded
defensively per the personal-tools pattern. `poolAnalysis.ts` is the one glue
point between a stored pool, the snapshot, and the engine.

## Extending it

- **New league**: add a row to `scripts/data/scorePoolsConfig.ts` (and
  `teamAliases` if the odds book spells names differently), run the update, and
  point a pool at it in the UI. No engine changes.
- **New sport**: two-way markets already de-vig and calibrate (the ratio solve
  runs on decisive outcomes and rho stays at its default). The Poisson grid
  fits low-scoring sports; a higher `maxGoals` handles hockey-like ranges. A
  fundamentally different score process would implement a new scoreline model
  behind the same `ScorelineDistribution` shape and leave everything downstream
  alone.
- **New pool rules**: `ScoringRules` is plain data. A scheme beyond
  exact/difference/outcome means extending `scorePickAgainstCell` and its
  tests; the optimizer and leaderboard consume whatever it returns.

## Honesty constraints

This is a decision aid for prediction pools, not a betting edge. The model is
anchored to the market, so it inherits the market's uncertainty; the UI stamps
every number with its as-of time, labels hand-entered odds and sample data,
shows calibration residuals, and describes confidence as a read on
concentration rather than a calibrated probability. Keep all of that intact
when touching the surface.
