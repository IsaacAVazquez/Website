"""Expected-points arithmetic, on a hand-computable distribution.

The distribution over the 2x2 grid {0,1} x {0,1}:
    P(0-0)=0.30  P(0-1)=0.20  P(1-0)=0.25  P(1-1)=0.25
so draws total 0.55, home win 0.25, away win 0.20.

By hand, under 5 / 3 / 2 scoring:
    EP(0-0) = 5*0.30 + 3*0.25            = 2.25   (exact 0-0, plus GD-tier on 1-1)
    EP(1-1) = 5*0.25 + 3*0.30            = 2.15
    EP(1-0) = 5*0.25                     = 1.25   (no other home-win cells here)
    EP(0-1) = 5*0.20                     = 1.00
This is the headline case: the draw picks beat the more-likely-per-outcome home
pick, because a draw pick collects on every draw.
"""

import numpy as np
import pytest

from scorepool.models import ScoringRules
from scorepool.optimizer.expected_points import evaluate_pick, rank_candidates
from scorepool.probability.scoreline import ScoreDistribution

RULES = ScoringRules(5, 3, 2)
GRID = np.array([[0.30, 0.20], [0.25, 0.25]])
DIST = ScoreDistribution(GRID, max_goals=1)


def test_grid_outcome_masses():
    assert DIST.p_draw() == 0.55
    assert DIST.p_home() == 0.25
    assert DIST.p_away() == 0.20


def test_expected_points_exact_values():
    assert evaluate_pick((0, 0), GRID, RULES).ep == pytest.approx(2.25)
    assert evaluate_pick((1, 1), GRID, RULES).ep == pytest.approx(2.15)
    assert evaluate_pick((1, 0), GRID, RULES).ep == pytest.approx(1.25)
    assert evaluate_pick((0, 1), GRID, RULES).ep == pytest.approx(1.00)


def test_draw_beats_the_favourite_pick():
    best = rank_candidates(DIST, RULES)[0]
    assert best.score == (0, 0)
    assert best.ep > evaluate_pick((1, 0), GRID, RULES).ep


def test_floor_excludes_outcome_only_tier():
    # 1-0's only positive-scoring cell here is the exact 1-0, so floor == 25%.
    c = evaluate_pick((1, 0), GRID, RULES)
    assert c.floor == 0.25
    assert c.hit_any == 0.25
    # The draw pick has a broad meaningful floor: exact plus the other draw.
    d = evaluate_pick((0, 0), GRID, RULES)
    assert d.floor == 0.55


def test_lopsided_winning_score_has_low_floor_not_high():
    # On a heavy-favourite distribution, a 5-0 pick collects the outcome tier on
    # most results but almost never the goal difference, so its floor stays low
    # even though it 'scores something' often.
    from scorepool.probability.scoreline import BivariatePoisson, MarketTargets

    dist = BivariatePoisson().fit(
        MarketTargets(p_home=0.80, p_draw=0.12, p_away=0.08, ou_line=2.5, p_over=0.6)
    )
    five_nil = evaluate_pick((5, 0), dist.grid, RULES)
    assert five_nil.hit_any > 0.5  # it does score *something* often (the 2-tier)
    # A meaningful (goal-difference-or-better) hit is a small fraction of that.
    assert five_nil.floor < 0.2 * five_nil.hit_any


def test_variance_is_nonnegative_and_zero_when_certain():
    certain = np.zeros((2, 2))
    certain[1, 0] = 1.0  # home always wins 1-0
    d = ScoreDistribution(certain, max_goals=1)
    assert evaluate_pick((1, 0), certain, RULES).variance == 0.0
    assert evaluate_pick((1, 0), certain, RULES).ep == 5.0
