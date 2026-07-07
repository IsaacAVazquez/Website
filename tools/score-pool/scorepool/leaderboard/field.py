"""Model what the rest of the field is likely to submit.

A pick is not only a bet on a game; it is a move in the standings that only pays
off relative to what everyone else does. To reason about that we need a model of
the field's submission for each game. In practice the field piles onto the
favourites and the chalk, so the default model is the single most likely
scoreline. Two alternatives are offered: the expected-points-optimal pick (a
sharper field) and the favourite's most likely winning margin.

From the field's pick we derive, for any candidate of mine, the distribution of
the point *differential* between me and that competitor on the game -- its mean
and variance -- which is what the strategy layer needs.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple

import numpy as np

from ..models import Score, ScoringRules
from ..optimizer.expected_points import (
    _outcome_and_gd,
    modal_scoreline,
    points_grid,
    rank_candidates,
)
from ..probability.scoreline import ScoreDistribution


def field_pick(dist: ScoreDistribution, rules: ScoringRules, model: str = "modal_scoreline") -> Score:
    """The scoreline a typical opponent is expected to submit."""
    if model == "modal_scoreline":
        return modal_scoreline(dist)
    if model == "ep_optimal":
        return rank_candidates(dist, rules)[0].score
    if model == "favorite_margin":
        return _favorite_margin_pick(dist)
    raise ValueError(f"unknown field model {model!r}")


def _favorite_margin_pick(dist: ScoreDistribution) -> Score:
    """Most likely scoreline *within the favoured outcome*. Captures the casual
    player who backs the favourite to win by a plausible margin even when the
    single most likely scoreline is a draw."""
    grid = dist.grid
    n = grid.shape[0] - 1
    out, _ = _outcome_and_gd(n)
    masses = {1: dist.p_home(), 0: dist.p_draw(), -1: dist.p_away()}
    fav = max(masses, key=masses.get)
    mask = out == fav
    masked = np.where(mask, grid, -1.0)
    idx = np.unravel_index(np.argmax(masked), grid.shape)
    return (int(idx[0]), int(idx[1]))


@dataclass
class Differential:
    """Mean and standard deviation of (my points - a competitor's points) on a
    single game, for a given pick of mine against a fixed competitor pick."""

    mean: float
    std: float


def differential_stats(
    my_pick: Score, competitor_pick: Score, dist: ScoreDistribution, rules: ScoringRules
) -> Differential:
    n = dist.grid.shape[0] - 1
    out, gd = _outcome_and_gd(n)
    mine = points_grid(my_pick, rules, n, out, gd)
    theirs = points_grid(competitor_pick, rules, n, out, gd)
    delta = mine - theirs
    mean = float((dist.grid * delta).sum())
    ex2 = float((dist.grid * delta * delta).sum())
    var = max(ex2 - mean * mean, 0.0)
    return Differential(mean=mean, std=float(np.sqrt(var)))


def typical_game_swing(dist: ScoreDistribution, rules: ScoringRules, field: Score) -> float:
    """A rough per-game standard deviation of the differential the field could run
    up against me, used as the stand-in for the *other* remaining games in the
    Gaussian standings model. Estimated as the spread of differentials across
    plausible picks I might make, so it scales with how live the game is."""
    from ..optimizer.expected_points import rank_candidates

    cands = rank_candidates(dist, rules, candidate_max=4)[:8]
    stds = [differential_stats(c.score, field, dist, rules).std for c in cands]
    return float(np.median(stds)) if stds else 1.0
