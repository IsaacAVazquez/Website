"""Templates for ``scorepool init``: a commented config and a starter fixtures CSV.

These are the same as ``config.example.toml`` and ``fixtures.example.csv`` at the
tool root, kept here so ``init`` works without shipping data files.
"""

CONFIG_TEMPLATE = """# scorepool configuration
# The pool rules and my standing drive every pick, so this is the first thing the
# tool reads. Every value has a default; override only what your pool needs.

[scoring]
# Points for a submitted score against the actual result. The three tiers are
# exact > right-winner-and-goal-difference > right-outcome-only. Defaults match a
# 5 / 3 / 2 World Cup pool, but set them to whatever your pool pays.
exact = 5
result_and_goal_difference = 3
result_only = 2
# "regulation" scores the 90-minute result, so a 1-1 won on penalties counts as a
# 1-1 draw. "final" scores the after-extra-time result. In the knockout rounds
# this one line changes which picks are worth submitting.
result_basis = "regulation"

[standing]
# Where I sit. Leave points_above out if I lead the pool; leave points_below out
# if I am last. games_remaining counts the games still to be scored, including the
# ones being analysed now; it scales how much a lead is worth protecting.
my_points = 42
points_above = 45      # nearest competitor ahead of me (omit if I lead)
points_below = 41      # nearest competitor behind me (omit if I am last)
pool_size = 30
games_remaining = 6
# "auto" derives protect/chase from the gaps; force it with "protect", "chase",
# or "neutral".
risk = "auto"

[model]
# Scoreline model: bivariate_poisson (default, lifts draws), independent_poisson,
# or dixon_coles. De-vig method: proportional (default), shin, or additive.
type = "bivariate_poisson"
max_goals = 10
devig = "proportional"
# How the field is modelled for the leaderboard math: modal_scoreline (the single
# most likely score, the usual chalk), ep_optimal (a sharper field), or
# favorite_margin.
field_model = "modal_scoreline"

[model.context_shading]
# Modest, configurable nudges applied when a match carries a context flag. Context
# shades the distribution toward fewer goals and more draws; it does not overrule
# the market. Factors < 1 lower the expected total; draw boosts add to the draw
# probability before the model is fit.
dead_rubber_total_factor = 0.90
dead_rubber_draw_boost = 0.04
draw_suits_both_total_factor = 0.92
draw_suits_both_draw_boost = 0.06
heavy_rotation_total_factor = 0.95
low_scoring_total_factor = 0.88
high_scoring_total_factor = 1.12
must_win_total_factor = 1.05
must_win_draw_penalty = 0.03

[strategy]
# variance_price is how many expected points I will trade for one unit of
# differential standard deviation when protecting or chasing. Higher means the
# standings tilt overrides raw expected points more aggressively.
variance_price = 0.5
safer_variance_penalty = 0.5
differentiator_ep_tolerance = 1.5
reach_quantile = 1.0
pool_chase_scale = 0.08

[odds]
# manual/csv read odds straight from the fixtures file. the_odds_api pulls live
# odds and merges them onto the fixtures, keeping any hand-entered odds as a
# fallback for matches the API doesn't cover. The key is read from the named
# environment variable, never stored here.
source = "manual"           # the_odds_api | manual | csv
api_key_env = "ODDS_API_KEY"
sport_key = "soccer_fifa_world_cup"
regions = "us,uk,eu"
markets = "h2h,totals,btts"
# bookmaker = "pinnacle"    # pin one book; otherwise prices are the median
"""

FIXTURES_TEMPLATE = """match_id,home,away,commence_time,odds_format,home_odds,draw_odds,away_odds,ou_line,over_odds,under_odds,btts_yes,btts_no,home_odds_open,draw_odds_open,away_odds_open,correct_score,context,note,lineup_unconfirmed,injury_question
ESP-GER,Spain,Germany,2026-07-08T19:00:00Z,decimal,2.55,3.20,2.95,2.5,2.05,1.80,1.95,1.85,,,,1-0:7.5;0-0:9.0;1-1:8.0;2-1:9.0,draw_suits_both,"Knockout tie: level after 90 goes to extra time and penalties, but the pool scores the 90-minute result. Both sides may be content to take it deep.",true,false
BRA-KOR,Brazil,South Korea,2026-07-09T15:00:00Z,decimal,1.40,4.80,8.00,2.5,1.75,2.05,2.10,1.70,,,,,"",Clear favourite; Brazil expected to control.,false,false
FRA-POL,France,Poland,2026-07-09T19:00:00Z,american,-140,260,380,2.5,-105,-115,100,-120,,,,,dead_rubber;heavy_rotation_home,"France already through as group winners and likely to rotate heavily; Poland need the win.",true,true
ARG-NED,Argentina,Netherlands,2026-07-10T19:00:00Z,decimal,2.30,3.10,3.30,2.5,1.95,1.90,1.90,1.90,2.60,3.20,2.90,,"",Argentina has shortened since the line opened.,false,false
"""
