"""The expected-points optimizer.

For every candidate scoreline we sum over the full scoreline distribution,
weighting each possible actual result by the points that candidate would earn
under the pool's rules, and rank the candidates by expected points. This is the
calculation that surfaces why a 1-1 often beats picking the favourite outright:
a draw pick banks the result-and-goal-difference tier on *every* draw, not only
on the exact 1-1, so its expected points can clear a narrow favourite even when
the favourite is more likely to win the game.

Alongside expected points we compute the variance and the floor of each pick,
because the leaderboard layer trades expected points against variance and needs
both.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List

import numpy as np

from ..models import Score, ScoringRules
from ..probability.scoreline import ScoreDistribution


@dataclass
class Candidate:
    """One candidate scoreline, fully evaluated against the distribution."""

    score: Score
    ep: float  # expected points under the pool's rules
    variance: float  # variance of points earned
    std: float
    floor: float  # P(a goal-difference-or-better hit): the reliable, meaningful score
    hit_any: float  # P(any points at all, including the outcome-only tier)
    prob: float  # model probability of this exact scoreline occurring
    p_exact: float  # P(actual == this pick)
    p_result_gd: float  # P(same outcome & goal difference, not exact)
    p_result_only: float  # P(same outcome, different goal difference)

    @property
    def label(self) -> str:
        return f"{self.score[0]}-{self.score[1]}"


def _outcome_and_gd(n: int):
    """Precompute, for an (n+1)x(n+1) grid, the outcome sign and goal difference
    of every cell. Cached-free but cheap."""
    h = np.arange(n + 1)[:, None]
    a = np.arange(n + 1)[None, :]
    gd = h - a
    out = np.sign(gd)
    return out, gd


def points_grid(pick: Score, rules: ScoringRules, n: int, out=None, gd=None) -> np.ndarray:
    """Points this pick earns against every possible actual scoreline, as an
    (n+1)x(n+1) array. Used by the leaderboard layer to build the distribution of
    my-points-minus-a-competitor's-points for a game."""
    if out is None or gd is None:
        out, gd = _outcome_and_gd(n)
    ph, pa = pick
    p_out = np.sign(ph - pa)
    p_gd = ph - pa
    same_outcome = out == p_out
    pts = np.zeros((n + 1, n + 1))
    pts[same_outcome & (gd != p_gd)] = rules.result_only
    pts[same_outcome & (gd == p_gd)] = rules.result_and_goal_difference
    if ph <= n and pa <= n:
        pts[ph, pa] = rules.exact
    return pts


def evaluate_pick(
    pick: Score, grid: np.ndarray, rules: ScoringRules, out=None, gd=None
) -> Candidate:
    """Evaluate a single candidate scoreline against the actual-result grid."""
    n = grid.shape[0] - 1
    if out is None or gd is None:
        out, gd = _outcome_and_gd(n)
    ph, pa = pick
    p_out = np.sign(ph - pa)
    p_gd = ph - pa

    same_outcome = out == p_out
    same_gd = gd == p_gd

    exact_mask = np.zeros_like(grid, dtype=bool)
    if ph <= n and pa <= n:
        exact_mask[ph, pa] = True

    m_exact = grid[exact_mask].sum()
    m_result_gd = grid[same_outcome & same_gd].sum() - m_exact
    m_result_only = grid[same_outcome & ~same_gd].sum()

    m_exact = float(max(m_exact, 0.0))
    m_result_gd = float(max(m_result_gd, 0.0))
    m_result_only = float(max(m_result_only, 0.0))

    ep = (
        rules.exact * m_exact
        + rules.result_and_goal_difference * m_result_gd
        + rules.result_only * m_result_only
    )
    ex2 = (
        rules.exact ** 2 * m_exact
        + rules.result_and_goal_difference ** 2 * m_result_gd
        + rules.result_only ** 2 * m_result_only
    )
    variance = max(ex2 - ep * ep, 0.0)

    # Floor is the chance of a *meaningful* hit -- exact or right goal difference,
    # the tiers that reward actually reading the game. It deliberately excludes the
    # outcome-only tier, because otherwise a lopsided winning scoreline like 6-0
    # would look "safe" purely from banking 2 points on every win. hit_any keeps
    # the P(any points) number for reference. Both respect a pool that zeroes a tier.
    floor = 0.0
    if rules.exact > 0:
        floor += m_exact
    if rules.result_and_goal_difference > 0:
        floor += m_result_gd
    hit_any = floor + (m_result_only if rules.result_only > 0 else 0.0)

    return Candidate(
        score=(ph, pa),
        ep=float(ep),
        variance=float(variance),
        std=float(np.sqrt(variance)),
        floor=float(floor),
        hit_any=float(hit_any),
        prob=float(grid[ph, pa]) if (ph <= n and pa <= n) else 0.0,
        p_exact=m_exact,
        p_result_gd=m_result_gd,
        p_result_only=m_result_only,
    )


def rank_candidates(
    dist: ScoreDistribution, rules: ScoringRules, candidate_max: int = 6
) -> List[Candidate]:
    """Evaluate every candidate scoreline (up to ``candidate_max`` goals a side)
    against the full distribution and return them sorted by expected points."""
    grid = dist.grid
    n = grid.shape[0] - 1
    cmax = min(candidate_max, n)
    out, gd = _outcome_and_gd(n)

    cands = [
        evaluate_pick((ch, ca), grid, rules, out, gd)
        for ch in range(cmax + 1)
        for ca in range(cmax + 1)
    ]
    cands.sort(key=lambda c: c.ep, reverse=True)
    return cands


def modal_scoreline(dist: ScoreDistribution) -> Score:
    """The single most likely exact scoreline -- the naive 'chalk' pick."""
    idx = np.unravel_index(np.argmax(dist.grid), dist.grid.shape)
    return (int(idx[0]), int(idx[1]))


def safest_pick(cands: List[Candidate], ep_tolerance: float = 0.6) -> Candidate:
    """Highest-floor pick among those within ``ep_tolerance`` points of the best
    expected-points pick: the higher-floor version of the recommendation."""
    if not cands:
        raise ValueError("no candidates")
    best_ep = cands[0].ep
    pool = [c for c in cands if c.ep >= best_ep - ep_tolerance]
    return max(pool, key=lambda c: (c.floor, c.ep))
