"""Core data model for the score-prediction-pool tool.

Everything downstream (probability engine, optimizer, leaderboard, output) speaks
in terms of these small, framework-free dataclasses so the odds source, the
scoreline model, the scoring rules, and the leaderboard logic all stay swappable.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Optional, Tuple

# A scoreline is always (home_goals, away_goals).
Score = Tuple[int, int]


def sign(x: float) -> int:
    """Return -1, 0, or +1. Used everywhere to reduce a scoreline to an outcome."""
    return (x > 0) - (x < 0)


# ---------------------------------------------------------------------------
# Scoring rules
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ScoringRules:
    """How a pool pays out a submitted scoreline against an actual result.

    The three tiers are mutually exclusive and strictly ranked:

      exact                      -> the submitted score is exactly right
      result_and_goal_difference -> right winner (or draw) AND right goal margin
      result_only                -> right winner (or draw) but wrong margin

    Note the asymmetry that makes draws valuable: for a draw pick the goal
    difference is always 0, so any actual draw automatically clears the middle
    tier. A draw pick therefore never lands on ``result_only`` -- it scores
    ``exact`` on the nailed draw and ``result_and_goal_difference`` on every
    other draw, and nothing otherwise.

    ``result_basis`` decides which score is scored:
      "regulation" -> the 90-minute score (a 1-1 won on penalties scores as 1-1)
      "final"      -> the score after extra time
    """

    exact: float = 5.0
    result_and_goal_difference: float = 3.0
    result_only: float = 2.0
    result_basis: str = "regulation"  # "regulation" | "final"

    def score(self, pick: Score, actual: Score) -> float:
        """Points a ``pick`` earns against a fully-decided ``actual`` scoreline."""
        ph, pa = pick
        ah, aa = actual
        if ph == ah and pa == aa:
            return self.exact
        if sign(ph - pa) != sign(ah - aa):
            return 0.0  # wrong outcome (this also rules out a draw-vs-decisive mix)
        if (ph - pa) == (ah - aa):
            return self.result_and_goal_difference
        return self.result_only

    def validate(self) -> None:
        if self.result_basis not in ("regulation", "final"):
            raise ValueError(
                f"result_basis must be 'regulation' or 'final', got {self.result_basis!r}"
            )
        # A sane pool pays exact >= result_and_gd >= result_only, but we don't
        # enforce it -- a pool is free to pay however it likes, and the optimizer
        # simply follows the numbers.


# ---------------------------------------------------------------------------
# Standing / leaderboard position
# ---------------------------------------------------------------------------


@dataclass
class Standing:
    """Where I sit in the pool. Drives the protect-vs-chase tilt."""

    my_points: float = 0.0
    points_above: Optional[float] = None  # nearest competitor ahead (None if I lead)
    points_below: Optional[float] = None  # nearest competitor behind (None if last)
    pool_size: int = 20
    games_remaining: Optional[int] = None  # incl. the ones being analysed now
    risk: str = "auto"  # "auto" | "protect" | "chase" | "neutral"

    @property
    def gap_above(self) -> Optional[float]:
        """How far I trail the nearest competitor ahead (>=0), or None if I lead."""
        if self.points_above is None:
            return None
        return self.points_above - self.my_points

    @property
    def gap_below(self) -> Optional[float]:
        """My cushion over the nearest competitor behind (>=0), or None if last."""
        if self.points_below is None:
            return None
        return self.my_points - self.points_below


# ---------------------------------------------------------------------------
# Match context (the things odds don't capture)
# ---------------------------------------------------------------------------


@dataclass
class MatchContext:
    """Qualitative context that either shades the model or is surfaced next to the
    pick. The boolean flags nudge the scoreline distribution; the free-text and
    revisit fields are surfaced verbatim so odds-invisible information stays in
    front of me at decision time."""

    # Distribution-shading flags
    dead_rubber: bool = False
    draw_suits_both: bool = False
    heavy_rotation_home: bool = False
    heavy_rotation_away: bool = False
    low_scoring: bool = False
    high_scoring: bool = False
    must_win_home: bool = False
    must_win_away: bool = False

    # Surfaced-but-not-modelled
    note: str = ""  # free text: injuries, likely lineup, tournament situation
    lineup_unconfirmed: bool = False
    injury_question: bool = False

    def revisit_reasons(self) -> list[str]:
        reasons = []
        if self.lineup_unconfirmed:
            reasons.append("lineups unconfirmed")
        if self.injury_question:
            reasons.append("open injury/suspension question")
        return reasons


# ---------------------------------------------------------------------------
# Odds
# ---------------------------------------------------------------------------


@dataclass
class ThreeWay:
    """Home / draw / away prices as decimal odds (90-minute market)."""

    home: float
    draw: float
    away: float


@dataclass
class OverUnder:
    line: float  # e.g. 2.5
    over: float  # decimal odds
    under: float


@dataclass
class BTTS:
    yes: float  # decimal odds both teams to score
    no: float


@dataclass
class MarketOdds:
    """A snapshot of the markets for one match, plus provenance.

    Prices are stored as decimal odds regardless of the format they arrived in,
    so the rest of the system never has to think about American/fractional.
    """

    three_way: Optional[ThreeWay] = None
    over_under: Optional[OverUnder] = None
    btts: Optional[BTTS] = None
    correct_score: Optional[Dict[Score, float]] = None  # scoreline -> decimal odds

    # Opening lines, if supplied, so we can report line movement.
    three_way_open: Optional[ThreeWay] = None
    over_under_open: Optional[OverUnder] = None

    fetched_at: Optional[str] = None  # ISO-8601 timestamp of when these were pulled
    bookmaker: Optional[str] = None  # source book, or "median"/"consensus"
    source: Optional[str] = None  # "the_odds_api" | "manual" | "csv"


@dataclass
class Match:
    match_id: str
    home: str
    away: str
    commence_time: Optional[str] = None  # ISO-8601 kickoff / lock time
    odds: Optional[MarketOdds] = None
    context: MatchContext = field(default_factory=MatchContext)

    @property
    def label(self) -> str:
        return f"{self.home} vs {self.away}"


# ---------------------------------------------------------------------------
# Actual results (for re-running and keeping a running total)
# ---------------------------------------------------------------------------


@dataclass
class ActualResult:
    """A finished match. We always keep the 90-minute score; the after-ET score
    and how it was decided are optional so a penalties game can be scored either
    way depending on the pool's ``result_basis``."""

    home_reg: int  # goals at 90 minutes
    away_reg: int
    home_final: Optional[int] = None  # after extra time (None => same as reg)
    away_final: Optional[int] = None
    decided_by: str = "regulation"  # "regulation" | "extra_time" | "penalties"

    def scoring_score(self, basis: str) -> Score:
        """Reduce to the score that actually counts under the pool's rules.

        Under "regulation" this is always the 90-minute score, so a 1-1 that was
        won on penalties counts as a 1-1 draw. Under "final" it is the after-ET
        score when there was extra time.
        """
        if basis == "final" and self.home_final is not None and self.away_final is not None:
            return (self.home_final, self.away_final)
        return (self.home_reg, self.away_reg)
