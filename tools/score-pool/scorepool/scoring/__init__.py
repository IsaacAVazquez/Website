"""Scoring rules live on ``ScoringRules`` in ``scorepool.models``.

Re-exported here so the scoring logic can be imported as its own swappable piece
(``from scorepool.scoring import ScoringRules``) and so an alternative pool's
scorer can be dropped in alongside it.
"""

from ..models import ActualResult, ScoringRules

__all__ = ["ScoringRules", "ActualResult"]
