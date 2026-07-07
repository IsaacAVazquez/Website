"""The leaderboard layer: turn a standing into a pick.

Expected points on its own is the right answer only when I am not managing a
lead. This module adds the standings tilt on top. The core idea is that a pick's
value is not just its expected points but its effect on where I finish relative
to the people I am racing, and that effect depends on the gap and how many games
are left.

Two mechanisms:

  1. A single risk tilt ``tau`` in [-1, +1] derived from the gaps, the games
     remaining, and the pool size. tau < 0 means protect (favour low-variance
     picks that move with the field); tau > 0 means chase (favour differentiators
     the field will be off); tau near 0 means just maximise expected points. A
     one-point lead with two games left and a ten-point lead with ten games left
     land in very different places because the reachable swing scales with the
     square root of the games remaining.

  2. Candidates are ranked by expected points traded against the variance of the
     differential versus the field: U(pick) = EP + variance_price * tau * sd.
     When protecting, variance is penalised; when chasing, it is rewarded, which
     is what pushes the recommendation toward the high-quality contrarian spots
     (good expected points *and* decorrelated from the chalk) rather than a random
     long shot.

We also report the honest Gaussian probabilities -- of protecting the lead and of
catching the leader -- so the trade is visible as numbers, not a label.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Dict, Optional

from scipy.stats import norm

from ..config import StrategyConfig
from ..models import Score, ScoringRules, Standing
from ..optimizer.expected_points import Candidate
from ..probability.scoreline import ScoreDistribution
from .field import Differential, differential_stats


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


@dataclass
class Tilt:
    tau: float
    mode: str  # "protect" | "chase" | "neutral"
    protect_pressure: float
    chase_pressure: float
    reachable: float
    rationale: str


@dataclass
class PickSelection:
    featured: Candidate
    safer: Candidate
    differentiator: Optional[Candidate]
    raw_best: Candidate  # the plain expected-points winner, before any tilt
    field_pick: Score
    tilt: Tilt
    diffs: Dict[Score, Differential] = field(default_factory=dict)
    p_protect: Optional[float] = None  # P(stay ahead of chaser) with featured pick
    p_catch: Optional[float] = None  # P(overtake leader) with featured pick
    p_protect_mirror: Optional[float] = None  # baseline if I just copy the chalk
    p_catch_mirror: Optional[float] = None


def _reachable(sigma0: float, games_remaining: int, quantile: float) -> float:
    return quantile * sigma0 * math.sqrt(max(games_remaining, 1))


def derive_tilt(
    standing: Standing, sigma0: float, games_remaining: int, cfg: StrategyConfig
) -> Tilt:
    """Map my standing to a risk tilt in [-1, +1]."""
    if standing.risk in ("protect", "chase", "neutral"):
        tau = {"protect": -1.0, "chase": 1.0, "neutral": 0.0}[standing.risk]
        return Tilt(
            tau=tau,
            mode=standing.risk,
            protect_pressure=1.0 if tau < 0 else 0.0,
            chase_pressure=1.0 if tau > 0 else 0.0,
            reachable=_reachable(sigma0, games_remaining, cfg.reach_quantile),
            rationale=f"risk posture forced to '{standing.risk}' in config",
        )

    reachable = _reachable(sigma0, games_remaining, cfg.reach_quantile)
    gb, ga = standing.gap_below, standing.gap_above

    protect_pressure = 0.0
    if gb is not None and reachable > 0:
        protect_pressure = _clamp(1.0 - gb / reachable, 0.0, 1.0)

    chase_pressure = 0.0
    if ga is not None and reachable > 0:
        chase_pressure = _clamp(ga / reachable, 0.0, 1.0)
        # A bigger pool raises the bar for winning outright, so lean a little more
        # into differentiation.
        pool_bump = 1.0 + cfg.pool_chase_scale * math.log2(max(standing.pool_size / 8.0, 1.0))
        chase_pressure = _clamp(chase_pressure * pool_bump, 0.0, 1.0)

    tau = _clamp(chase_pressure - protect_pressure, -1.0, 1.0)
    mode = "chase" if tau > 0.15 else "protect" if tau < -0.15 else "neutral"

    parts = []
    if gb is not None:
        parts.append(f"cushion {gb:g} over the chaser")
    else:
        parts.append("leading the pool")
    if ga is not None:
        parts.append(f"{ga:g} behind the leader")
    else:
        parts.append("no one ahead")
    parts.append(
        f"reachable swing ~{reachable:.1f} pts over {games_remaining} game(s)"
    )
    rationale = "; ".join(parts)

    return Tilt(
        tau=tau,
        mode=mode,
        protect_pressure=protect_pressure,
        chase_pressure=chase_pressure,
        reachable=reachable,
        rationale=rationale,
    )


def _gaussian_ahead(gap_signed: float, mu: float, sigma_game: float, sigma0: float, games_remaining: int) -> float:
    """P(final margin over the competitor > 0), Gaussian-approximating the sum of
    per-game differentials. ``gap_signed`` is my current lead over them (negative
    if I trail); ``mu``/``sigma_game`` are this game's differential; the other
    games contribute mean 0 and variance sigma0^2 each."""
    var_total = sigma_game ** 2 + max(games_remaining - 1, 0) * sigma0 ** 2
    sd = math.sqrt(max(var_total, 1e-9))
    return float(norm.cdf((gap_signed + mu) / sd))


def select_picks(
    cands: list[Candidate],
    dist: ScoreDistribution,
    rules: ScoringRules,
    field_pick: Score,
    standing: Standing,
    tilt: Tilt,
    sigma0: float,
    games_remaining: int,
    cfg: StrategyConfig,
) -> PickSelection:
    """Choose the featured pick, the safer alternative, and the differentiator,
    given the field's likely submission, my standing, and the slate-wide tilt.

    The tilt is derived once for the whole slate (see ``derive_tilt``) because my
    protect-vs-chase stance is a property of my standing and the schedule, not of
    any single game. What varies per game is the differential variance -- the lever
    the tilt acts on."""
    lam = cfg.variance_price
    diffs = {c.score: differential_stats(c.score, field_pick, dist, rules) for c in cands}
    best_ep = max(c.ep for c in cands)
    raw_best = max(cands, key=lambda c: c.ep)
    cap = cfg.differentiator_ep_tolerance

    # Three points on one expected-points-versus-variance frontier:
    #
    #   safer        higher-floor pick: maximise EP penalised by the pick's OWN
    #                points variance, so it trades upside for a reliable score.
    #   featured     the standings-tilted pick: EP plus the tilt times the variance
    #                of the differential against the field. Capped so it never gives
    #                up more than `cap` expected points -- a high-quality pick, not a
    #                wild swing.
    #   differentiator  the best catch-up pick: the chase end of the frontier, among
    #                picks that diverge from the chalk and keep real expected points.
    safer = max(cands, key=lambda c: c.ep - cfg.safer_variance_penalty * c.std)

    eligible = [c for c in cands if c.ep >= best_ep - cap]
    featured = max(eligible, key=lambda c: c.ep + lam * tilt.tau * diffs[c.score].std)

    diff_pool = [c for c in eligible if diffs[c.score].std > 1e-9 and c.score != field_pick]
    differentiator = (
        max(diff_pool, key=lambda c: c.ep + lam * diffs[c.score].std) if diff_pool else None
    )

    sel = PickSelection(
        featured=featured,
        safer=safer,
        differentiator=differentiator,
        raw_best=raw_best,
        field_pick=field_pick,
        tilt=tilt,
        diffs=diffs,
    )

    # Honest standings probabilities for the featured pick, plus the mirror baseline.
    fdiff = diffs[featured.score]
    if standing.gap_below is not None:
        sel.p_protect = _gaussian_ahead(
            standing.gap_below, fdiff.mean, fdiff.std, sigma0, games_remaining
        )
        sel.p_protect_mirror = _gaussian_ahead(
            standing.gap_below, 0.0, 0.0, sigma0, games_remaining
        )
    if standing.gap_above is not None:
        sel.p_catch = _gaussian_ahead(
            -standing.gap_above, fdiff.mean, fdiff.std, sigma0, games_remaining
        )
        sel.p_catch_mirror = _gaussian_ahead(
            -standing.gap_above, 0.0, 0.0, sigma0, games_remaining
        )

    return sel
