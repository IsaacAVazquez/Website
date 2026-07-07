"""Configuration: scoring rules, my standing, model choices, and odds source.

The pool rules and my standing drive everything else, so this is the first thing
the tool reads. Config is TOML (read with the stdlib ``tomllib``); every value
has a sensible default so a minimal file still works.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

try:  # Python 3.11+
    import tomllib
except ModuleNotFoundError:  # pragma: no cover
    import tomli as tomllib  # type: ignore

from .models import ScoringRules, Standing


@dataclass
class ContextShading:
    """How much each tournament-context flag nudges the market targets before the
    scoreline model is fit. These are deliberately modest heuristics -- context
    shades the distribution, it does not overrule the market -- and every value
    is configurable so a different sport or pool can retune them."""

    dead_rubber_total_factor: float = 0.90
    dead_rubber_draw_boost: float = 0.04
    draw_suits_both_total_factor: float = 0.92
    draw_suits_both_draw_boost: float = 0.06
    heavy_rotation_total_factor: float = 0.95  # applied per rotating side
    low_scoring_total_factor: float = 0.88
    high_scoring_total_factor: float = 1.12
    must_win_total_factor: float = 1.05  # a must-win side pushes the game open
    must_win_draw_penalty: float = 0.03


@dataclass
class ModelConfig:
    type: str = "bivariate_poisson"  # independent_poisson | bivariate_poisson | dixon_coles
    max_goals: int = 10
    devig: str = "proportional"  # proportional | shin | additive
    field_model: str = "modal_scoreline"  # modal_scoreline | ep_optimal | favorite_margin
    shading: ContextShading = field(default_factory=ContextShading)


@dataclass
class StrategyConfig:
    """Knobs for the leaderboard tilt. ``variance_price`` is how many expected
    points I am willing to trade for one unit of differential standard deviation
    when protecting or chasing -- the price of the expected-points-vs-variance
    trade. The rest tune how the gap and pool size map onto that trade."""

    variance_price: float = 0.5  # expected points traded per unit differential std
    safer_variance_penalty: float = 0.5  # own-variance penalty defining the higher-floor pick
    differentiator_ep_tolerance: float = 1.5  # most EP a featured/differentiator pick may give up
    reach_quantile: float = 1.0  # SDs of reachable swing used to gauge precariousness
    pool_chase_scale: float = 0.08  # how much a larger pool raises chase pressure


@dataclass
class OddsConfig:
    source: str = "manual"  # the_odds_api | manual | csv
    api_key_env: str = "ODDS_API_KEY"
    sport_key: str = "soccer_fifa_world_cup"
    regions: str = "us,uk,eu"
    markets: str = "h2h,totals,btts"
    bookmaker: Optional[str] = None  # prefer one book; else consensus median

    @property
    def api_key(self) -> Optional[str]:
        return os.environ.get(self.api_key_env)


@dataclass
class AppConfig:
    scoring: ScoringRules = field(default_factory=ScoringRules)
    standing: Standing = field(default_factory=Standing)
    model: ModelConfig = field(default_factory=ModelConfig)
    odds: OddsConfig = field(default_factory=OddsConfig)
    strategy: StrategyConfig = field(default_factory=StrategyConfig)


def _as_float(d: Dict[str, Any], key: str, default):
    v = d.get(key, default)
    return None if v is None else float(v)


def _as_int(d: Dict[str, Any], key: str, default):
    v = d.get(key, default)
    return None if v is None else int(v)


def load_config(path: Optional[str]) -> AppConfig:
    """Load config from a TOML file. A missing path yields all-defaults so the
    tool is usable before any config exists."""
    raw: Dict[str, Any] = {}
    if path:
        with open(path, "rb") as fh:
            raw = tomllib.load(fh)
    return config_from_dict(raw)


def config_from_dict(raw: Dict[str, Any]) -> AppConfig:
    sc = raw.get("scoring", {})
    scoring = ScoringRules(
        exact=float(sc.get("exact", 5.0)),
        result_and_goal_difference=float(sc.get("result_and_goal_difference", 3.0)),
        result_only=float(sc.get("result_only", 2.0)),
        result_basis=str(sc.get("result_basis", "regulation")),
    )
    scoring.validate()

    st = raw.get("standing", {})
    standing = Standing(
        my_points=float(st.get("my_points", 0.0)),
        points_above=_as_float(st, "points_above", None),
        points_below=_as_float(st, "points_below", None),
        pool_size=int(st.get("pool_size", 20)),
        games_remaining=_as_int(st, "games_remaining", None),
        risk=str(st.get("risk", "auto")),
    )

    md = raw.get("model", {})
    shading_raw = md.get("context_shading", {})
    shading = ContextShading(
        **{k: float(v) for k, v in shading_raw.items() if k in ContextShading().__dict__}
    )
    model = ModelConfig(
        type=str(md.get("type", "bivariate_poisson")),
        max_goals=int(md.get("max_goals", 10)),
        devig=str(md.get("devig", "proportional")),
        field_model=str(md.get("field_model", "modal_scoreline")),
        shading=shading,
    )

    od = raw.get("odds", {})
    odds = OddsConfig(
        source=str(od.get("source", "manual")),
        api_key_env=str(od.get("api_key_env", "ODDS_API_KEY")),
        sport_key=str(od.get("sport_key", "soccer_fifa_world_cup")),
        regions=str(od.get("regions", "us,uk,eu")),
        markets=str(od.get("markets", "h2h,totals,btts")),
        bookmaker=od.get("bookmaker") or None,
    )

    stcfg = raw.get("strategy", {})
    strategy = StrategyConfig(
        **{k: float(v) for k, v in stcfg.items() if k in StrategyConfig().__dict__}
    )

    return AppConfig(
        scoring=scoring, standing=standing, model=model, odds=odds, strategy=strategy
    )
