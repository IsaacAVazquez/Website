"""Field model, differential math, the protect/chase tilt, and its effect on the pick."""

import numpy as np

from scorepool.config import StrategyConfig
from scorepool.leaderboard.field import differential_stats, field_pick
from scorepool.leaderboard.strategy import Tilt, derive_tilt, select_picks
from scorepool.models import ScoringRules, Standing
from scorepool.optimizer.expected_points import evaluate_pick, rank_candidates
from scorepool.probability.scoreline import (
    BivariatePoisson,
    MarketTargets,
    ScoreDistribution,
)

RULES = ScoringRules(5, 3, 2)
GRID = np.array([[0.30, 0.20], [0.25, 0.25]])
DIST = ScoreDistribution(GRID, max_goals=1)
CFG = StrategyConfig()


def test_field_pick_is_modal_scoreline():
    assert field_pick(DIST, RULES, "modal_scoreline") == (0, 0)


def test_differential_zero_against_identical_pick():
    d = differential_stats((1, 0), (1, 0), DIST, RULES)
    assert d.mean == 0.0
    assert d.std == 0.0


def test_differential_mean_equals_ep_gap():
    # E[my points - their points] == EP(mine) - EP(theirs).
    mine, theirs = (1, 0), (0, 0)
    d = differential_stats(mine, theirs, DIST, RULES)
    gap = evaluate_pick(mine, GRID, RULES).ep - evaluate_pick(theirs, GRID, RULES).ep
    assert abs(d.mean - gap) < 1e-9
    assert d.std > 0


def test_tilt_protect_when_lead_is_thin():
    st = Standing(my_points=50, points_below=49, pool_size=10, games_remaining=2)
    tilt = derive_tilt(st, sigma0=1.5, games_remaining=2, cfg=CFG)
    assert tilt.mode == "protect"
    assert tilt.tau < 0


def test_tilt_chase_when_behind():
    st = Standing(my_points=40, points_above=45, pool_size=10, games_remaining=2)
    tilt = derive_tilt(st, sigma0=1.5, games_remaining=2, cfg=CFG)
    assert tilt.mode == "chase"
    assert tilt.tau > 0


def test_tilt_neutral_when_lead_is_safe():
    st = Standing(my_points=100, points_below=50, pool_size=10, games_remaining=2)
    tilt = derive_tilt(st, sigma0=1.5, games_remaining=2, cfg=CFG)
    assert tilt.mode == "neutral"


def test_tilt_scales_with_games_remaining():
    # Same one-point lead is safer with fewer games left (less reachable swing).
    st = Standing(my_points=50, points_below=49, pool_size=10)
    thin_short = derive_tilt(st, 1.5, games_remaining=2, cfg=CFG)
    thin_long = derive_tilt(st, 1.5, games_remaining=12, cfg=CFG)
    assert thin_long.protect_pressure > thin_short.protect_pressure


def test_risk_override_forces_posture():
    st = Standing(my_points=40, points_above=45, risk="protect")
    assert derive_tilt(st, 1.5, 3, CFG).mode == "protect"


def _even_setup():
    dist = BivariatePoisson().fit(
        MarketTargets(p_home=0.37, p_draw=0.30, p_away=0.33, ou_line=2.5, p_over=0.5)
    )
    cands = rank_candidates(dist, RULES)
    fp = field_pick(dist, RULES, "modal_scoreline")
    return dist, cands, fp


def test_chase_takes_more_differential_variance_than_protect():
    dist, cands, fp = _even_setup()
    st = Standing(my_points=40, points_above=44, pool_size=20, games_remaining=4)
    protect = Tilt(-1.0, "protect", 1.0, 0.0, 3.0, "")
    chase = Tilt(1.0, "chase", 0.0, 1.0, 3.0, "")
    sel_p = select_picks(cands, dist, RULES, fp, st, protect, 1.5, 4, CFG)
    sel_c = select_picks(cands, dist, RULES, fp, st, chase, 1.5, 4, CFG)
    var_p = sel_p.diffs[sel_p.featured.score].std
    var_c = sel_c.diffs[sel_c.featured.score].std
    assert var_c >= var_p


def test_protect_featured_moves_with_field():
    # Under a protect tilt the featured pick should be low differential variance,
    # i.e. close to (often equal to) the field's chalk.
    dist, cands, fp = _even_setup()
    st = Standing(my_points=50, points_below=49, pool_size=20, games_remaining=3)
    protect = Tilt(-1.0, "protect", 1.0, 0.0, 2.0, "")
    sel = select_picks(cands, dist, RULES, fp, st, protect, 1.5, 3, CFG)
    assert sel.diffs[sel.featured.score].std <= sel.diffs[sel.differentiator.score].std


def test_selection_reports_raw_best():
    dist, cands, fp = _even_setup()
    st = Standing(my_points=40, points_above=44, games_remaining=4)
    chase = Tilt(1.0, "chase", 0.0, 1.0, 3.0, "")
    sel = select_picks(cands, dist, RULES, fp, st, chase, 1.5, 4, CFG)
    assert sel.raw_best.ep == max(c.ep for c in cands)
