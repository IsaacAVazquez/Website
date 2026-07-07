"""The odds-source contract.

A match list (with my per-match context and notes) always comes from a fixtures
file. An odds source then fills in prices. This keeps the context I attach --
injuries, likely lineups, tournament situation -- independent of where the odds
come from, so switching between the API and hand-entered odds never loses it.

Concrete sources:
  scorepool.odds.manual        load fixtures + hand/CSV/JSON odds
  scorepool.odds.the_odds_api  enrich fixtures with live odds from The Odds API
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from ..models import Match


class OddsSource(ABC):
    @abstractmethod
    def load(self) -> List[Match]:
        """Return the matches with whatever odds this source can supply."""
        raise NotImplementedError
