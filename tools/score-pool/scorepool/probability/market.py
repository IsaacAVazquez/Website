"""Turn a match's raw odds into de-vigged model targets, and shade those targets
with tournament context.

This is the bridge between the odds (``MarketOdds``) and the scoreline model
(``MarketTargets``). Keeping it separate means the model never has to know about
vig or context -- it only ever sees clean, fair targets.
"""

from __future__ import annotations

from dataclasses import replace
from typing import Optional, Tuple

import numpy as np

from ..config import ContextShading
from ..models import MarketOdds, MatchContext
from . import devig
from .scoreline import MarketTargets


def targets_from_odds(
    odds: MarketOdds, method: str = "proportional", max_goals: int = 10
) -> MarketTargets:
    """Build fair-probability targets from a market snapshot."""
    if odds.three_way is None:
        raise ValueError("need at least a three-way (home/draw/away) market to build targets")

    ph, pd, pa = devig.devig(
        [odds.three_way.home, odds.three_way.draw, odds.three_way.away], method
    )

    p_over = ou_line = None
    if odds.over_under is not None:
        p_over = devig.devig_two_way(odds.over_under.over, odds.over_under.under, method)
        ou_line = odds.over_under.line

    p_btts = None
    if odds.btts is not None:
        p_btts = devig.devig_two_way(odds.btts.yes, odds.btts.no, method)

    correct_score = None
    if odds.correct_score:
        # De-vig the correct-score market as a whole (it carries a large margin).
        scores = list(odds.correct_score.keys())
        prices = [odds.correct_score[s] for s in scores]
        fair = devig.devig(prices, method)
        correct_score = {s: p for s, p in zip(scores, fair)}

    return MarketTargets(
        p_home=ph,
        p_draw=pd,
        p_away=pa,
        ou_line=ou_line,
        p_over=p_over,
        p_btts=p_btts,
        correct_score=correct_score,
        max_goals=max_goals,
    )


def _rebalance_draw(ph: float, pd: float, pa: float, new_draw: float) -> Tuple[float, float, float]:
    """Set the draw mass to ``new_draw`` and rescale home/away to keep the sum 1,
    preserving the home/away ratio."""
    new_draw = float(np.clip(new_draw, 0.01, 0.97))
    rest = 1.0 - new_draw
    hw = ph + pa
    if hw <= 0:
        return rest / 2, new_draw, rest / 2
    return rest * ph / hw, new_draw, rest * pa / hw


def apply_context_shading(
    targets: MarketTargets, ctx: MatchContext, cfg: ContextShading
) -> MarketTargets:
    """Nudge the targets to reflect tournament context.

    The two levers are the expected number of goals (moved via the over target)
    and the draw mass (moved directly). A game both teams are content to draw, or
    a dead rubber with heavy rotation, pulls toward fewer goals and more draws.
    These are heuristic shades on top of the market, applied modestly and always
    disclosed on the pick sheet.
    """
    ph, pd, pa = targets.p_home, targets.p_draw, targets.p_away
    total_factor = 1.0
    draw_boost = 0.0

    if ctx.dead_rubber:
        total_factor *= cfg.dead_rubber_total_factor
        draw_boost += cfg.dead_rubber_draw_boost
    if ctx.draw_suits_both:
        total_factor *= cfg.draw_suits_both_total_factor
        draw_boost += cfg.draw_suits_both_draw_boost
    if ctx.heavy_rotation_home:
        total_factor *= cfg.heavy_rotation_total_factor
    if ctx.heavy_rotation_away:
        total_factor *= cfg.heavy_rotation_total_factor
    if ctx.low_scoring:
        total_factor *= cfg.low_scoring_total_factor
    if ctx.high_scoring:
        total_factor *= cfg.high_scoring_total_factor
    if ctx.must_win_home or ctx.must_win_away:
        total_factor *= cfg.must_win_total_factor
        draw_boost -= cfg.must_win_draw_penalty

    if draw_boost != 0.0:
        ph, pd, pa = _rebalance_draw(ph, pd, pa, pd + draw_boost)

    new = replace(targets, p_home=ph, p_draw=pd, p_away=pa)

    # Shift the over/under target in the direction of the total factor. Fewer
    # goals => lower P(over). We move the over probability toward 0/1 modestly.
    if new.p_over is not None:
        # total_factor < 1 lowers overs, > 1 raises them; scale the deviation.
        shift = (total_factor - 1.0) * 0.9
        new.p_over = float(np.clip(new.p_over + shift, 0.02, 0.98))

    return new


def line_movement(odds: MarketOdds, method: str = "proportional") -> Optional[dict]:
    """Compare current three-way to the opening line, if both are present.

    Returns the change in each fair outcome probability (current minus open), so
    a positive ``home`` means the home side has shortened since the open."""
    if odds.three_way is None or odds.three_way_open is None:
        return None
    cur = devig.devig(
        [odds.three_way.home, odds.three_way.draw, odds.three_way.away], method
    )
    opn = devig.devig(
        [odds.three_way_open.home, odds.three_way_open.draw, odds.three_way_open.away], method
    )
    labels = ("home", "draw", "away")
    return {k: cur[i] - opn[i] for i, k in enumerate(labels)}
