"""The scoreline model must be anchored to the market: its implied outcome and
total probabilities should reproduce the de-vigged prices it was fit to."""

import numpy as np

from scorepool.probability.scoreline import (
    BivariatePoisson,
    IndependentPoisson,
    MarketTargets,
    bivariate_grid,
    independent_grid,
)


def test_grid_normalised():
    g = bivariate_grid(1.4, 1.1, 0.3, 10)
    assert abs(g.sum() - 1.0) < 1e-9
    assert (g >= 0).all()


def test_bivariate_lifts_draws_over_independent():
    ind = independent_grid(1.3, 1.1, 10)
    biv = bivariate_grid(1.3, 1.1, 0.4, 10)
    assert np.trace(biv) > np.trace(ind)


def test_fit_reproduces_outcome_masses():
    t = MarketTargets(p_home=0.50, p_draw=0.27, p_away=0.23, ou_line=2.5, p_over=0.50)
    dist = BivariatePoisson().fit(t)
    assert abs(dist.p_home() - 0.50) < 0.03
    assert abs(dist.p_draw() - 0.27) < 0.03
    assert abs(dist.p_away() - 0.23) < 0.03


def test_fit_reproduces_total_line():
    t = MarketTargets(p_home=0.45, p_draw=0.28, p_away=0.27, ou_line=2.5, p_over=0.60)
    dist = BivariatePoisson().fit(t)
    assert abs(dist.p_over(2.5) - 0.60) < 0.05
    # A 60% over-2.5 market should push the expected total above 2.5.
    assert dist.expected_total() > 2.5


def test_fit_quality_reported():
    t = MarketTargets(p_home=0.40, p_draw=0.30, p_away=0.30, ou_line=2.5, p_over=0.50)
    dist = BivariatePoisson().fit(t)
    assert dist.fit_quality() < 0.03  # residual small on a coherent market


def test_away_edge_survives_into_scoreline_masses():
    # Targets favour the away side; the fitted grid should keep that ordering.
    t = MarketTargets(p_home=0.32, p_draw=0.30, p_away=0.38, ou_line=2.5, p_over=0.45)
    dist = BivariatePoisson().fit(t)
    assert dist.p_away() > dist.p_home()


def test_independent_model_also_fits_outcomes():
    t = MarketTargets(p_home=0.55, p_draw=0.24, p_away=0.21, ou_line=2.5, p_over=0.55)
    dist = IndependentPoisson().fit(t)
    assert abs(dist.p_home() - 0.55) < 0.04
