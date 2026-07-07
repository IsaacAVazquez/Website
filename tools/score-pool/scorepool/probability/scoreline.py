"""Scoreline distribution models.

The job here is to turn the market (de-vigged win/draw/win, the over/under total,
and optionally both-teams-to-score) into a full probability distribution over
exact scorelines, not just the three outcomes. We do that by fitting a small
goals model whose implied market quantities match what the book is pricing, so
the scoreline probabilities are anchored to the market rather than pulled from
nowhere.

Three models sit behind one interface:

  IndependentPoisson  home and away goals independent Poisson. Simple, but
                      systematically under-weights draws.
  BivariatePoisson    adds a shared component that lifts the draw mass; the
                      default, and the model the market is easiest to match with.
  DixonColes          independent Poisson with a low-score correction; a common
                      football choice, offered as an alternative.

Every model is *fit* to market targets rather than assumed, and every fit
reports its residuals so the caller can see how well the distribution actually
reproduces the market.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Optional, Tuple

import numpy as np
from scipy.optimize import minimize
from scipy.stats import poisson

from ..models import Score

# ---------------------------------------------------------------------------
# Targets and the fitted distribution
# ---------------------------------------------------------------------------


@dataclass
class MarketTargets:
    """The de-vigged market quantities a model tries to reproduce.

    ``p_home``/``p_draw``/``p_away`` are the fair 90-minute outcome probabilities.
    ``p_over`` (at ``ou_line``) and ``p_btts`` are optional refinements. When a
    correct-score market is supplied it is used as extra soft targets.
    """

    p_home: float
    p_draw: float
    p_away: float
    ou_line: Optional[float] = None
    p_over: Optional[float] = None
    p_btts: Optional[float] = None
    correct_score: Optional[Dict[Score, float]] = None  # scoreline -> probability
    max_goals: int = 10

    def normalised_outcomes(self) -> Tuple[float, float, float]:
        s = self.p_home + self.p_draw + self.p_away
        return self.p_home / s, self.p_draw / s, self.p_away / s


@dataclass
class ScoreDistribution:
    """A fitted distribution over scorelines.

    ``grid[h, a]`` is P(home scores h, away scores a) for h, a in 0..max_goals,
    normalised to sum to 1. Everything the optimizer and leaderboard need is
    derived from this grid.
    """

    grid: np.ndarray
    max_goals: int
    params: Dict[str, float] = field(default_factory=dict)
    residuals: Dict[str, float] = field(default_factory=dict)
    model_name: str = ""

    # --- market quantities implied by the fitted grid ---

    def p_home(self) -> float:
        return float(np.tril(self.grid, -1).sum())  # home goals > away goals

    def p_away(self) -> float:
        return float(np.triu(self.grid, 1).sum())

    def p_draw(self) -> float:
        return float(np.trace(self.grid))

    def expected_total(self) -> float:
        h = np.arange(self.grid.shape[0])
        a = np.arange(self.grid.shape[1])
        return float((self.grid.sum(axis=1) * h).sum() + (self.grid.sum(axis=0) * a).sum())

    def p_over(self, line: float) -> float:
        """P(total goals > line). For a .5 line this is unambiguous; for an
        integer line the exact total is treated as a push and excluded."""
        h = np.arange(self.grid.shape[0])[:, None]
        a = np.arange(self.grid.shape[1])[None, :]
        totals = h + a
        return float(self.grid[totals > line].sum())

    def p_btts(self) -> float:
        return float(self.grid[1:, 1:].sum())

    def fit_quality(self) -> float:
        """Root-mean-square residual across all fitted targets (0 == perfect)."""
        if not self.residuals:
            return 0.0
        return float(np.sqrt(np.mean(np.square(list(self.residuals.values())))))


# ---------------------------------------------------------------------------
# Grid builders
# ---------------------------------------------------------------------------


def _poisson_vec(mu: float, n: int) -> np.ndarray:
    return poisson.pmf(np.arange(n + 1), max(mu, 1e-9))


def independent_grid(mu_h: float, mu_a: float, max_goals: int) -> np.ndarray:
    ph = _poisson_vec(mu_h, max_goals)
    pa = _poisson_vec(mu_a, max_goals)
    grid = np.outer(ph, pa)
    return grid / grid.sum()


def bivariate_grid(mu_h: float, mu_a: float, cov: float, max_goals: int) -> np.ndarray:
    """Bivariate Poisson (Karlis & Ntzoufras).

    home = Y1 + Y3, away = Y2 + Y3 with Y1~Pois(l1), Y2~Pois(l2), Y3~Pois(l3).
    Then E[home] = l1 + l3, E[away] = l2 + l3, Cov(home, away) = l3. We
    parameterise by the means and the shared component ``cov`` (= l3), which is
    the intuitive knob: cov > 0 lifts the diagonal (more draws)."""
    cov = float(np.clip(cov, 0.0, min(mu_h, mu_a) - 1e-6))
    l1, l2, l3 = mu_h - cov, mu_a - cov, cov
    p1 = _poisson_vec(l1, max_goals)
    p2 = _poisson_vec(l2, max_goals)
    p3 = _poisson_vec(l3, max_goals)
    grid = np.zeros((max_goals + 1, max_goals + 1))
    for k in range(max_goals + 1):
        if p3[k] <= 0:
            continue
        # contribution where Y3 == k: home = k + i, away = k + j
        contrib = np.outer(p1[: max_goals + 1 - k], p2[: max_goals + 1 - k]) * p3[k]
        grid[k:, k:] += contrib
    return grid / grid.sum()


def dixon_coles_grid(mu_h: float, mu_a: float, rho: float, max_goals: int) -> np.ndarray:
    """Independent Poisson with the Dixon-Coles low-score correction on the four
    cells {0-0, 0-1, 1-0, 1-1}. ``rho`` > 0 inflates draws / deflates 1-0,0-1."""
    grid = np.outer(_poisson_vec(mu_h, max_goals), _poisson_vec(mu_a, max_goals))
    tau = np.ones_like(grid)
    tau[0, 0] = 1.0 - mu_h * mu_a * rho
    tau[0, 1] = 1.0 + mu_h * rho
    tau[1, 0] = 1.0 + mu_a * rho
    tau[1, 1] = 1.0 - rho
    grid = grid * np.clip(tau, 1e-9, None)
    return grid / grid.sum()


# ---------------------------------------------------------------------------
# The models
# ---------------------------------------------------------------------------


def _residuals(dist: ScoreDistribution, t: MarketTargets) -> Dict[str, float]:
    ph, pd, pa = t.normalised_outcomes()
    res = {
        "home": dist.p_home() - ph,
        "draw": dist.p_draw() - pd,
        "away": dist.p_away() - pa,
    }
    if t.p_over is not None and t.ou_line is not None:
        res["over"] = dist.p_over(t.ou_line) - t.p_over
    if t.p_btts is not None:
        res["btts"] = dist.p_btts() - t.p_btts
    return res


class ScorelineModel(ABC):
    """Fit a scoreline distribution to de-vigged market targets."""

    name = "abstract"

    @abstractmethod
    def _grid(self, params: np.ndarray, max_goals: int) -> np.ndarray: ...

    @abstractmethod
    def _initial(self, t: MarketTargets) -> Tuple[np.ndarray, list]: ...

    def fit(self, t: MarketTargets) -> ScoreDistribution:
        x0, bounds = self._initial(t)
        # Weights: outcome masses matter most (they carry the moneyline), the
        # total and BTTS are refinements.
        w = {"home": 1.0, "draw": 1.4, "away": 1.0, "over": 0.8, "btts": 0.5}

        def objective(x: np.ndarray) -> float:
            grid = self._grid(x, t.max_goals)
            dist = ScoreDistribution(grid, t.max_goals, model_name=self.name)
            res = _residuals(dist, t)
            err = sum(w.get(k, 1.0) * (v ** 2) for k, v in res.items())
            if t.correct_score:  # soft-pull toward any quoted exact-score prices
                for (h, a), p in t.correct_score.items():
                    if 0 <= h <= t.max_goals and 0 <= a <= t.max_goals:
                        err += 0.3 * (grid[h, a] - p) ** 2
            return err

        best = None
        # A couple of restarts guards against the optimiser stalling in a flat spot.
        for jitter in (0.0, 0.15, -0.15):
            start = np.array(x0) * (1.0 + jitter)
            start = np.clip(start, [b[0] for b in bounds], [b[1] for b in bounds])
            r = minimize(objective, start, method="L-BFGS-B", bounds=bounds)
            if best is None or r.fun < best.fun:
                best = r

        grid = self._grid(best.x, t.max_goals)
        dist = ScoreDistribution(grid, t.max_goals, model_name=self.name)
        dist.params = self._label_params(best.x)
        dist.residuals = _residuals(dist, t)
        return dist

    @abstractmethod
    def _label_params(self, x: np.ndarray) -> Dict[str, float]: ...


def _init_means(t: MarketTargets) -> Tuple[float, float]:
    """A reasonable starting split of the total into home/away expected goals,
    tilted by the moneyline so the optimiser starts near the answer."""
    total = 2.6
    if t.p_over is not None and t.ou_line is not None:
        # Nudge the assumed total toward/away from the line based on the over price.
        total = t.ou_line + (t.p_over - 0.5) * 1.6
    total = float(np.clip(total, 1.2, 5.5))
    ph, _, pa = t.normalised_outcomes()
    # supremacy: more home win prob -> larger home share
    share = float(np.clip(0.5 + 0.5 * (ph - pa), 0.2, 0.8))
    return total * share, total * (1.0 - share)


class IndependentPoisson(ScorelineModel):
    name = "independent_poisson"

    def _initial(self, t):
        mh, ma = _init_means(t)
        return np.array([mh, ma]), [(0.15, 6.0), (0.15, 6.0)]

    def _grid(self, x, max_goals):
        return independent_grid(x[0], x[1], max_goals)

    def _label_params(self, x):
        return {"mu_home": float(x[0]), "mu_away": float(x[1])}


class BivariatePoisson(ScorelineModel):
    name = "bivariate_poisson"

    def _initial(self, t):
        mh, ma = _init_means(t)
        return np.array([mh, ma, 0.12]), [(0.15, 6.0), (0.15, 6.0), (0.0, 1.5)]

    def _grid(self, x, max_goals):
        return bivariate_grid(x[0], x[1], x[2], max_goals)

    def _label_params(self, x):
        return {"mu_home": float(x[0]), "mu_away": float(x[1]), "cov": float(x[2])}


class DixonColes(ScorelineModel):
    name = "dixon_coles"

    def _initial(self, t):
        mh, ma = _init_means(t)
        return np.array([mh, ma, 0.05]), [(0.15, 6.0), (0.15, 6.0), (-0.2, 0.25)]

    def _grid(self, x, max_goals):
        return dixon_coles_grid(x[0], x[1], x[2], max_goals)

    def _label_params(self, x):
        return {"mu_home": float(x[0]), "mu_away": float(x[1]), "rho": float(x[2])}


_MODELS = {
    "independent_poisson": IndependentPoisson,
    "bivariate_poisson": BivariatePoisson,
    "dixon_coles": DixonColes,
}


def get_model(name: str) -> ScorelineModel:
    try:
        return _MODELS[name]()
    except KeyError:
        raise ValueError(f"unknown model {name!r}; choose from {sorted(_MODELS)}")
