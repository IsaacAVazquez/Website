# scorepool

A command-line assistant for exact-score prediction pools. I built it to do the
whole matchday job I used to run in my head: pull the odds, convert them to fair
probabilities, build a distribution over scorelines, and then pick the score that
earns the most expected points under my pool's rules, adjusted for where I sit on
the leaderboard. It cares far more about getting the decision logic right than
about looking fancy, and it tries to stay honest about how much it actually knows.

The core insight it automates is the one that kept costing or saving me points at
the World Cup. In a pool that scores the 90-minute result, a draw pick collects
the result-and-goal-difference tier on *every* draw, not only on the exact score,
so a 1-1 can be worth more in expected points than backing the favourite outright
even when the favourite is more likely to win the game. And a game that finishes
level after 90 but is won on penalties still scores as a draw, which is why a lot
of favourite-to-win picks banked zero while the draw picks kept scoring.

## Installing

It needs Python 3.11+ and numpy and scipy. From this directory:

```bash
pip install -r requirements.txt
# or, to get the `scorepool` command on your path:
pip install -e .
```

`requests` is optional and only used for live odds. Everything works without it
if you enter odds by hand or from a CSV.

## Quickstart

```bash
python -m scorepool init                 # writes scorepool.toml + fixtures.csv
# edit scorepool.toml: set your scoring rules and your standing
python -m scorepool recommend --fixtures fixtures.csv
```

That prints a pick sheet (one row per match), a copyable submission table, a list
of things to revisit before each game locks, and a short honesty note. To try it
immediately against the shipped examples:

```bash
python -m scorepool --config config.example.toml recommend --fixtures fixtures.example.csv
```

## How it works

The pipeline is four stages, and each one is a swappable piece so the same logic
can point at a different sport or a different pool whose markets and rules don't
match.

**De-vigging.** Whatever odds format comes in (decimal, American, or fractional)
is converted to implied probabilities, and then the bookmaker's margin is removed
so the probabilities across a market sum to one. Proportional de-vigging is the
transparent default; Shin's method, which corrects some favourite-longshot bias,
and a plain additive method are available too. None of these is the one true
answer, they are different assumptions about where the margin sits, so the tool
reports which one it used rather than pretending otherwise.

**The scoreline model.** From the de-vigged three-way prices, the over/under
total, and both-teams-to-score when it is there, the tool fits a goals model whose
implied market quantities match what the book is pricing. The default is a
bivariate Poisson, which adds a shared component that lifts the draw mass the way
real football does; independent Poisson and Dixon-Coles are also available. The
key point is that the model is *fit* to the market, so the win, draw, and win
masses line up with the de-vigged moneyline and the implied total lines up with
the over/under, which anchors the scoreline probabilities to what the market is
actually saying instead of pulling them from nowhere. Every fit reports its
residuals so you can see how well it matched. Where I have flagged tournament
context in a match's notes, that shades the distribution toward fewer goals and
more draws, modestly, and the shading is always disclosed on the sheet.

**The expected-points optimizer.** For every candidate scoreline the tool sums
over the full distribution, weighting each possible actual result by the points
that candidate would earn under my scoring rules, and ranks them. This is where
the 1-1-beats-the-favourite effect falls out of the arithmetic rather than out of
intuition. Alongside expected points it computes each pick's variance and its
floor, meaning the chance of a goal-difference-or-better hit, because the
leaderboard layer needs both. Under 90-minute scoring the optimizer treats a game
that ends level after 90 as a draw even when the favourite advances on penalties.

**The leaderboard tilt.** Expected points on its own is the right answer only when
I am not managing a lead. So on top of it the tool models what the field is likely
to submit, which in practice is the chalk, and then works out a single risk tilt
from the gap to the people I am racing, the games remaining, and the pool size. A
one-point lead with two games left and a ten-point lead with ten games left land
in very different places because the swing the standings can still take scales with
the square root of the games remaining. When I am protecting a lead the tilt
favours low-variance picks that move with the field, since I win by not diverging
from whoever is chasing me and letting the shared games cancel out, even when that
means we both score zero on a game that goes to penalties. When I am behind it
favours the differentiators the field will be off, and it surfaces the best
high-quality contrarian, meaning a pick with real expected points that decorrelates
from the chalk, rather than a random long shot. The sheet shows the plain
expected-points pick, the tilted pick, a safer higher-floor alternative, and the
differentiator, so you can see the trade instead of just being handed a label.

## The pick sheet

One row per match:

| Column | What it holds |
| --- | --- |
| Match | the fixture |
| Pick | the recommended exact score, after the standings tilt |
| Conf | high, medium, or low, deliberately conservative |
| xEP | the optimizer's expected points for that pick |
| Safer alt | the higher-floor, lower-variance version |
| Differentiator | the best contrarian pick for catching up |
| Why | a short plain-language reason |

Underneath it prints a clean submission table with only the match and score to
paste into the pool, and a before-lock list of unconfirmed lineups, open injury
questions, and standings that are close enough to shift the picture, each with the
lock time and the timestamp on the odds it used.

## Configuration

Config is TOML. Run `init` for a fully commented starter, or see
`config.example.toml`. The keys that matter most:

| Key | Meaning |
| --- | --- |
| `scoring.exact` / `result_and_goal_difference` / `result_only` | points for the three tiers (default 5 / 3 / 2) |
| `scoring.result_basis` | `regulation` scores the 90-minute result, `final` scores after extra time |
| `standing.my_points` | my current total |
| `standing.points_above` / `points_below` | the nearest competitor on each side (omit if I lead or trail the field) |
| `standing.pool_size` | number of players |
| `standing.games_remaining` | games still to be scored, which scales how much a lead is worth protecting |
| `standing.risk` | `auto` derives protect/chase from the gaps, or force `protect` / `chase` / `neutral` |
| `model.type` | `bivariate_poisson`, `independent_poisson`, or `dixon_coles` |
| `model.devig` | `proportional`, `shin`, or `additive` |
| `model.field_model` | how the field is modelled: `modal_scoreline`, `ep_optimal`, or `favorite_margin` |
| `odds.source` | `manual`, `csv`, or `the_odds_api` |

Most standing fields can also be overridden per run with flags like
`--my-points`, `--above`, `--below`, `--pool`, `--games`, and `--risk`, which is
handy for what-ifs without editing the file.

## Fixtures and odds

The match list, with the context and notes I attach, always comes from a fixtures
file, and an odds source fills in the prices. This keeps the injuries, likely
lineups, and tournament situation I note independent of where the odds come from.

A CSV is the simplest input. One row per match, with columns for the teams, the
kickoff, the three-way prices, the over/under, both-teams-to-score, optional
opening lines for movement, an `odds_format` of decimal, american, or fractional,
a `context` field, and a free-text `note`. See `fixtures.example.csv`. A JSON
fixtures file is also supported and handles correct-score markets and opening
lines more cleanly.

The `context` field takes any of these flags, separated by semicolons, and they
either shade the model or are surfaced next to the pick: `dead_rubber`,
`draw_suits_both`, `heavy_rotation_home`, `heavy_rotation_away`, `low_scoring`,
`high_scoring`, `must_win_home`, `must_win_away`, `lineup_unconfirmed`,
`injury_question`.

For live odds, set `odds.source = "the_odds_api"` and put your key in the
environment variable named by `odds.api_key_env` (default `ODDS_API_KEY`). The API
enriches the fixtures and keeps any hand-entered odds as a fallback for matches it
doesn't cover, and it time-stamps everything so you always know how stale the
numbers are. `scorepool fetch` pulls a snapshot to JSON without computing picks.

## Re-running through the tournament

Because I run this the same way all tournament, it keeps state so I can re-run as
results come in, odds move, and team news breaks.

```bash
# save the planned picks
python -m scorepool recommend --fixtures fixtures.csv --save state.json

# enter a result (this one went to penalties after a 1-1)
python -m scorepool result --state state.json --match ESP-GER --score 1-1 --final 2-1 --decided-by penalties

# if I submitted something other than the recommendation
python -m scorepool submit --state state.json --match ESP-GER --score 2-1

# see the running total against the pool's rules, and my edge over the chalk
python -m scorepool standings --state state.json
```

The running total scores each settled game under the pool's rules, including the
90-minute-versus-final distinction, and tracks how my picks did versus just
following the field.

## Commands

| Command | What it does |
| --- | --- |
| `recommend` | build and print the pick sheet, optionally `--save` and `--json` |
| `fetch` | pull live odds and snapshot them to JSON |
| `explain` | deep-dive one or more matches with the full candidate table |
| `submit` | record the score I actually submitted |
| `result` | enter a finished result and update the running total |
| `standings` | show the running total and my edge over the chalk |
| `init` | scaffold a commented config and a starter fixtures file |

## Extending it

The odds source, the scoreline model, the de-vig method, the field model, and the
scoring rules are all separate, swappable pieces, because the whole value is that
the domain logic stays the same while those change underneath it. To point it at
another sport or pool, adjust the scoring in config, retune the context-shading
factors, and if the markets differ, add an odds source under `scorepool/odds/` or
a model under `scorepool/probability/scoreline.py` behind the existing interfaces.

## Honesty

This is for prediction pools and my own analysis, so it tries not to present the
model as sharper than it is. The scoreline distribution is only as good as the
prices it is fit to and the assumptions behind the goals model, the leaderboard
tilt is a Gaussian approximation of how the standings can move rather than a full
simulation of the field, and the context shading is a set of deliberately modest
heuristics. The confidence labels are conservative on purpose, and genuine coin
flips are marked down rather than up. The point is better decisions on the close
calls, not false confidence.

## Tests

```bash
pip install pytest
python -m pytest
```

The suite pins down the parts that have to be right: the scoring tiers including
the draw goal-difference subtlety and the penalties-count-as-a-draw rule, the
de-vig math, the model reproducing the market it was fit to, the expected-points
arithmetic on a hand-computable distribution, and the protect-versus-chase tilt.
