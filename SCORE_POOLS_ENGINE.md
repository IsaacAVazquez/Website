# Score Pools Engine

**Last updated:** 2026-11-16

The exact-score prediction engine behind `/score-pools`, and the reference for
anyone changing it. The engine is the point of the surface: it formalizes the
process I ran by hand through a full World Cup of pool play, from de-vigging the
market to deciding when a 1-1 beats picking the favorite. The site around it is
a delivery layer, and the data adapters, the scoreline model, the scoring rules,
the field model, and the leaderboard logic are separate swappable modules so the
same core can run different sports and pools without a rewrite.

The engine lives in `src/lib/scorePools/` as pure, framework-free TypeScript
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
   home/away ratio, and rho (the low-score correction that keeps 0-0, 1-0, 0-1,
   and 1-1 priced right) drives the draw mass. When the draw target sits outside
   the valid rho range the solve clamps, trades a bounded amount of totals error
   for draw fit when the totals target is anything other than a priced half-goal
   line, and reports what it missed as residuals in `diagnostics`.
4. **The comparison distribution** (`scorelineModel.ts`). What the pool
   actually scores. Under 90-minute rules it is the grid itself, which is why a
   tight knockout carries real draw-after-90 probability. Under final-result
   rules in a knockout, level games extend through extra time (the 90-minute
   scoring rate pro-rated to 30 minutes at 85% tempo, up to four extra-time
   goals a side), and games still level after 120 go to penalties. A
   pool that counts the shootout winner as the winner splits those cells by a
   shootout probability (`penaltyHomeWinProbability` in the extra-time config,
   0.5 by default).
5. **Expected points** (`optimizer.ts`). For every candidate scoreline, sum
   over the comparison distribution weighting each possible result by the
   points the candidate earns under the pool's rules (exact / winner and goal
   difference / outcome, default 5/3/2 from `DEFAULT_SCORING_RULES` in
   `defaults.ts`, set per pool, and scored by `scorePickAgainstCell` in
   `scoring.ts`).
   The draw-beats-favorite behavior falls out of this arithmetic rather than
   being special-cased, because a draw pick collects the difference tier on
   every draw while 1-0 collects it only on one-goal home wins.
6. **The leaderboard layer** (`field.ts`, `leaderboard.ts`). The field model is
   a documented heuristic of what the pool submits (mostly the favorite with
   the modal scoreline, with the shares set per pool). By default 30% of the
   field sits on the favorite's modal scoreline and 65% on a small chalk set
   that includes it (the favorite's three likeliest scorelines, plus the
   likeliest draw when the draw is at least 26% and the underdog's likeliest
   scoreline when the underdog is at least 35%), and the rest spreads across the
   other scorelines in proportion to the model. The engine replaces it
   wholesale with known rival picks passed as `field.overrides`, but the app
   passes none, so rival picks entered in the tracker score only the rival
   table. Each candidate is then priced against a reference opponent standing
   in for the single nearest rival (those known picks when given, otherwise the
   field's modal pick), as E[my points − theirs] and the spread of that gap. The
   recommendation maximizes `E[gap] + k·SD(gap)` where `k` comes from the
   standing: protecting a slim lead late makes `k` strongly negative (mirror
   the field, let shared games cancel), chasing makes it positive (court
   variance, surface differentiators), and the scale is the gap against a
   realistic per-game catch-up rate (40% of the exact-score points by default)
   times the games remaining, so a one-point
   lead with two left reads very differently from ten points with ten to go.
   "My points" (`standing.myPoints`) is the entrant's full current total in the
   pool, typed in on the settings page, and both the engine's gaps and the
   tracker's rival gaps read it as entered.
   The posture is `auto` unless a pool pins it to `protect`, `chase`, or
   `neutral`, and `auto` weighs the deficit to the rival above against the
   cushion over the rival below, damping the protect side while anyone sits
   above. Beside the recommended pick the engine names a higher-floor pick, the
   one within 0.35 expected points of the top that is likeliest to score
   anything, and, when one exists, a differentiator that at most 5% of the field
   holds, sits within half a point of the top expected points, and has the most
   upside against the field.
7. **Confidence and reasons.** Confidence is descriptive, computed from how
   concentrated the distribution is and how far the pick's expected points sit
   above the field's, and it reads high, medium, or low; a coin flip reads low
   no matter the pick. Every recommendation carries a plain-language reason and
   a recheck list (odds more than 12 hours old or without a timestamp,
   hand-entered odds, missing totals, unconfirmed lineups, unconfirmed
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
- **Calibration is honest.** Residuals land in `diagnostics.residuals`, a
  clamped rho in `diagnostics.rhoClamped`, and every approximation (fair-line
  assumption, default totals, whole-goal lines) in `diagnostics.notes`, and all
  of them surface in the UI. Do not silence them.
- **The engine stays pure.** Providers and fetch stay out of the engine.
  `providers/` and `src/lib/scorePoolsData.ts` run only inside the snapshot
  builder, and `analyzeFixture` takes data in and returns data out.

## Data flow

Snapshot-driven, per the site pattern (`SNAPSHOT_DRIVEN_DASHBOARDS.md`):

- `scripts/buildScorePoolsSnapshot.ts` (`npm run update:score-pools`) runs
  `buildScorePoolsSnapshotData` in `src/lib/scorePoolsData.ts`, which pulls
  fixtures/results/standings/injuries/lineups from API-Football and moneyline +
  totals odds from The Odds API (keys `API_FOOTBALL_KEY` and
  `THE_ODDS_API_KEY`), merges typed manual entries
  (`scripts/data/scorePools.manual.ts`) and CSV drops
  (`scripts/data/score-pools/<league-key>.csv`, a folder that does not exist
  until the first drop), and writes
  `src/data/scorePoolsSnapshot.json`. Leagues are configured in
  `scripts/data/scorePoolsConfig.ts`. The builder runs without either key, but
  the quality check below then refuses to write, and the workflow's `config` job
  skips the refresh until both repository secrets are set. The manual file also
  carries the fictional Sample Cup league, labeled as a sample on the page, so
  the tool has fixtures before a live league is wired up. As of 2026-11-02 the
  committed snapshot was generated on 2026-07-20 and holds the Sample Cup
  fixtures and a Premier League entry with no fixtures.
- **Odds history is append-only and capped** (48 entries per fixture).
  Unchanged prices refresh the latest entry's timestamp; changed prices append.
  Line movement stays queryable and `summarizeLineMovement` reads it.
- Fail-soft everywhere: a dead provider keeps the previous league snapshot, a
  missing key degrades to manual/CSV with a note, and the builder refuses to
  write a snapshot with no provider-backed leagues, fixtures, or odds, or with a
  live league generated more than eight hours earlier
  (`scripts/verifyScorePoolsSnapshot.ts`), so the six-hourly
  `.github/workflows/update-score-pools.yml` lane commits nothing degraded and a
  failed run opens a `score-pools-refresh-failure` issue.
- Team matching between providers is tiered exact (normalized names plus
  per-league aliases), never fuzzy, mirroring the fantasy ADP matcher's
  philosophy. An odds event attaches to the fixture with the same teams and the
  nearest kickoff within 48 hours, and a manual entry matches by fixture id
  first, then by teams within the same 48 hours.
- Each page hands its client the committed snapshot from
  `getScorePoolsSnapshotData` in `src/lib/scorePoolsSnapshot.ts`, the module
  that also maps a fixture's latest odds entry into the engine's input, so no
  route calls a provider at request time.

The browser side keeps pools, rules, standings, submissions, rival picks,
per-fixture flags, hand-entered odds, and manual results in localStorage under
`score_pools_store_v1` (`src/lib/scorePools/persistence.ts`,
`src/hooks/useScorePools.ts`), decoded
defensively per the personal-tools pattern. `poolAnalysis.ts` is the one glue
point between a stored pool, the snapshot, and the engine. Pool settings change
the scoring rules, the standing and posture, the field shares, the de-vig
method, and the lock offset, while every pool runs on `DEFAULT_MODEL_CONFIG`
and `DEFAULT_RISK_PARAMS` from `defaults.ts`. Picks lock 60 minutes before
kickoff unless the pool sets another offset. A pool's hand-entered odds replace
the snapshot's latest odds for that fixture, a fixture with neither is set
aside as missing odds, and a stored manual result counts only when the snapshot
has no result for that game. The store backs three pages, the pick sheet at
`/score-pools`, pool settings at `/score-pools/settings`, and the running score
tracker at `/score-pools/tracker`.

## Extending it

- **New league**: add a row to `scripts/data/scorePoolsConfig.ts` (and
  `teamAliases` if the odds book spells names differently, plus a
  `knockoutRoundPattern` when the default does not recognize the league's
  knockout round names), run the update with both keys set, and
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
