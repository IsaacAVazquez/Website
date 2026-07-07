"""scorepool -- an exact-score prediction pool assistant.

The pipeline, in one line: odds -> de-vigged market -> fitted scoreline
distribution -> expected-points optimiser -> leaderboard tilt -> pick sheet.

Every stage is a small, swappable piece so the same decision logic can point at a
different sport or a different pool whose markets and rules don't match.
"""

from __future__ import annotations

__version__ = "0.1.0"

from .config import AppConfig, load_config  # noqa: E402
from .engine import MatchAnalysis, analyze_all, analyze_match  # noqa: E402
from .models import (  # noqa: E402
    ActualResult,
    Match,
    MatchContext,
    ScoringRules,
    Standing,
)

__all__ = [
    "__version__",
    "AppConfig",
    "load_config",
    "analyze_all",
    "analyze_match",
    "MatchAnalysis",
    "Match",
    "MatchContext",
    "ScoringRules",
    "Standing",
    "ActualResult",
]
