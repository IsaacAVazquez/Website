"""Per-match assembly: odds -> targets -> distribution -> optimizer -> leaderboard.

This wires the swappable pieces together and produces the ``MatchAnalysis`` the
output layer renders. Two things are deliberately global to the slate rather than
per match: the risk tilt (protect vs chase) and the typical per-game swing that
feeds the standings model, because my stance depends on my standing and the
schedule, not on any one game. Everything it does stays honest about what it
knows: it discloses when context shaded the model, when a market was missing, and
how well the distribution actually matched the market.
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from .config import AppConfig
from .leaderboard import field as field_mod
from .leaderboard.strategy import PickSelection, Tilt, derive_tilt, select_picks
from .models import Match
from .optimizer.expected_points import Candidate, rank_candidates
from .probability import market as market_mod
from .probability.scoreline import MarketTargets, ScoreDistribution, get_model


@dataclass
class MatchAnalysis:
    match: Match
    ok: bool
    reason: str = ""  # why analysis was not possible, when ok is False
    dist: Optional[ScoreDistribution] = None
    targets: Optional[MarketTargets] = None
    shaded: bool = False
    candidates: List[Candidate] = field(default_factory=list)
    selection: Optional[PickSelection] = None
    confidence: str = "n/a"
    why: str = ""
    line_move: Optional[dict] = None
    revisit: List[str] = field(default_factory=list)

    @property
    def fetched_at(self) -> Optional[str]:
        return self.match.odds.fetched_at if self.match.odds else None


_CONTEXT_FLAG_LABELS = [
    "dead_rubber",
    "draw_suits_both",
    "low_scoring",
    "high_scoring",
    "heavy_rotation_home",
    "heavy_rotation_away",
    "must_win_home",
    "must_win_away",
]


def _active_context_flags(match: Match) -> List[str]:
    return [f for f in _CONTEXT_FLAG_LABELS if getattr(match.context, f)]


def compute_confidence(
    dist: ScoreDistribution, cands: List[Candidate], targets: MarketTargets
) -> str:
    """A deliberately conservative high/medium/low read. It rewards a clear
    expected-points winner, a high floor, a decisive market, and good calibration,
    and it marks genuine coin flips down rather than up -- the point is honest
    uncertainty, not false confidence."""
    top = cands[0]
    clarity = top.ep - (cands[1].ep if len(cands) > 1 else 0.0)
    peak = max(dist.p_home(), dist.p_draw(), dist.p_away())
    fitq = dist.fit_quality()

    score = 0.0
    score += min(clarity / 0.8, 1.0)  # clear EP winner: up to +1.0
    score += min(top.floor / 0.5, 1.0) * 0.6  # high meaningful floor: up to +0.6
    score += 0.4 if targets.p_over is not None else 0.0  # more markets, more anchored
    score += max(min((peak - 0.34) / 0.3, 1.0), -1.0) * 0.5  # decisive vs coin-flip
    score -= min(fitq / 0.05, 1.0) * 0.6  # poor calibration drags it down

    if score >= 1.6:
        return "high"
    if score >= 0.9:
        return "medium"
    return "low"


def _line_move_phrase(match: Match, line_move: dict) -> Optional[str]:
    """Describe the biggest fair-probability move since the open, in team terms."""
    biggest_key, biggest_val = max(line_move.items(), key=lambda kv: abs(kv[1]))
    if abs(biggest_val) < 0.035:
        return None
    who = {"home": match.home, "away": match.away, "draw": "the draw"}[biggest_key]
    # A rising outcome probability means that price has shortened.
    if biggest_key == "draw":
        moved = "shortened" if biggest_val > 0 else "drifted out"
        return f"The draw has {moved} since the open ({biggest_val:+.0%})."
    moved = "shortened" if biggest_val > 0 else "drifted out"
    return f"{who} has {moved} since the open ({biggest_val:+.0%})."


def build_why(
    match: Match,
    dist: ScoreDistribution,
    sel: PickSelection,
    line_move: Optional[dict],
) -> str:
    ph, pd, pa = dist.p_home(), dist.p_draw(), dist.p_away()
    total = dist.expected_total()
    raw = sel.raw_best
    feat = sel.featured
    field = f"{sel.field_pick[0]}-{sel.field_pick[1]}"
    bits: List[str] = []

    # Describe the plain expected-points winner first, honestly.
    if raw.score[0] == raw.score[1]:
        bits.append(
            f"Raw expected points favour the draw {raw.label} at {raw.ep:.2f}, because a "
            f"draw pick banks the result-and-goal-difference tier on every draw "
            f"({pd:.0%} de-vigged), not just the exact score."
        )
    else:
        home_side = raw.score[0] > raw.score[1]
        name = match.home if home_side else match.away
        p = ph if home_side else pa
        bits.append(
            f"Raw expected points favour {raw.label} at {raw.ep:.2f}, with {name} at {p:.0%}."
        )

    # Then, if the standings tilt moved the pick, say so and name the trade.
    if feat.score != raw.score:
        give = raw.ep - feat.ep
        if sel.tilt.mode == "chase":
            bits.append(
                f"Chasing, the pick moves to {feat.label} ({feat.ep:.2f} xEP, about "
                f"{give:.2f} less) to decorrelate from the field's {field}."
            )
        elif sel.tilt.mode == "protect":
            bits.append(
                f"Protecting, the pick moves to {feat.label} ({feat.ep:.2f} xEP) to move "
                f"with the field and cut variance."
            )
        else:
            bits.append(f"The pick is {feat.label} at {feat.ep:.2f} xEP.")

    if total < 2.3:
        bits.append(f"The market points to a low-scoring game, about {total:.1f} goals.")
    elif total > 3.1:
        bits.append(f"The market points to an open game, about {total:.1f} goals.")

    mode = sel.tilt.mode
    if mode == "protect" and sel.p_protect is not None:
        bits.append(
            f"Protecting the lead, this pick holds about {sel.p_protect:.0%} to stay "
            f"ahead of the chaser, versus about {sel.p_protect_mirror:.0%} from mirroring "
            f"the chalk, so it leans low-variance."
        )
    elif mode == "chase" and sel.p_catch is not None:
        bits.append(
            f"Chasing, with variance the lever now, this gives about {sel.p_catch:.0%} to "
            f"catch the leader against about {sel.p_catch_mirror:.0%} from copying the field."
        )

    if line_move:
        phrase = _line_move_phrase(match, line_move)
        if phrase:
            bits.append(phrase)

    flags = _active_context_flags(match)
    if flags:
        bits.append(
            "Context factored in was " + ", ".join(f.replace("_", " ") for f in flags) + "."
        )

    if match.context.note:
        bits.append(match.context.note.strip())

    return " ".join(bits)


# ---------------------------------------------------------------------------
# Two-pass analysis: build every match's model, then apply one slate-wide tilt
# ---------------------------------------------------------------------------


@dataclass
class _MatchModel:
    targets: MarketTargets
    shaded: bool
    dist: ScoreDistribution
    cands: List[Candidate]
    field_pick: tuple
    sigma0: float


def _build_model(match: Match, cfg: AppConfig) -> Optional[_MatchModel]:
    if match.odds is None or match.odds.three_way is None:
        return None
    targets = market_mod.targets_from_odds(
        match.odds, method=cfg.model.devig, max_goals=cfg.model.max_goals
    )
    shaded = bool(_active_context_flags(match))
    if shaded:
        targets = market_mod.apply_context_shading(targets, match.context, cfg.model.shading)

    dist = get_model(cfg.model.type).fit(targets)
    cands = rank_candidates(dist, cfg.scoring, candidate_max=min(6, cfg.model.max_goals))
    field_pick = field_mod.field_pick(dist, cfg.scoring, cfg.model.field_model)
    sigma0 = field_mod.typical_game_swing(dist, cfg.scoring, field_pick)
    return _MatchModel(targets, shaded, dist, cands, field_pick, sigma0)


def _finish(
    match: Match,
    model: _MatchModel,
    tilt: Tilt,
    cfg: AppConfig,
    sigma0_global: float,
    games_remaining: int,
) -> MatchAnalysis:
    selection = select_picks(
        model.cands,
        model.dist,
        cfg.scoring,
        model.field_pick,
        cfg.standing,
        tilt,
        sigma0_global,
        games_remaining,
        cfg.strategy,
    )
    line_move = market_mod.line_movement(match.odds, cfg.model.devig)
    confidence = compute_confidence(model.dist, model.cands, model.targets)
    why = build_why(match, model.dist, selection, line_move)
    return MatchAnalysis(
        match=match,
        ok=True,
        dist=model.dist,
        targets=model.targets,
        shaded=model.shaded,
        candidates=model.cands,
        selection=selection,
        confidence=confidence,
        why=why,
        line_move=line_move,
        revisit=match.context.revisit_reasons(),
    )


def analyze_all(matches: List[Match], cfg: AppConfig) -> List[MatchAnalysis]:
    games_remaining = cfg.standing.games_remaining or max(len(matches), 1)

    models: Dict[int, Optional[_MatchModel]] = {}
    for i, m in enumerate(matches):
        models[i] = _build_model(m, cfg)

    swings = [mm.sigma0 for mm in models.values() if mm is not None]
    sigma0_global = float(statistics.median(swings)) if swings else 1.5
    tilt = derive_tilt(cfg.standing, sigma0_global, games_remaining, cfg.strategy)

    analyses: List[MatchAnalysis] = []
    for i, m in enumerate(matches):
        mm = models[i]
        if mm is None:
            analyses.append(
                MatchAnalysis(
                    match=m, ok=False, reason="no three-way (home/draw/away) odds supplied"
                )
            )
        else:
            analyses.append(_finish(m, mm, tilt, cfg, sigma0_global, games_remaining))
    return analyses


def analyze_match(match: Match, cfg: AppConfig) -> MatchAnalysis:
    """Analyse a single match as a one-match slate (tilt derived from it alone)."""
    return analyze_all([match], cfg)[0]
