"""Odds conversion and vig removal."""

import math

import pytest

from scorepool.probability import devig


def test_decimal_passthrough():
    assert devig.to_decimal(2.5, "decimal") == 2.5


def test_american_conversion():
    assert devig.to_decimal(150, "american") == pytest.approx(2.5)
    assert devig.to_decimal(-200, "american") == pytest.approx(1.5)


def test_fractional_conversion():
    assert devig.to_decimal("3/2", "fractional") == pytest.approx(2.5)
    assert devig.to_decimal("1/1", "fractional") == pytest.approx(2.0)


def test_invalid_decimal_rejected():
    with pytest.raises(ValueError):
        devig.to_decimal(0.9, "decimal")


def test_proportional_sums_to_one():
    p = devig.devig([2.1, 3.4, 3.6], "proportional")
    assert math.isclose(sum(p), 1.0, abs_tol=1e-12)
    # favourite keeps the largest probability
    assert p[0] == max(p)


def test_shin_sums_to_one_and_corrects_longshot_bias():
    decs = [1.5, 4.5, 7.0]
    prop = devig.devig(decs, "proportional")
    shin = devig.devig(decs, "shin")
    assert math.isclose(sum(shin), 1.0, abs_tol=1e-9)
    # Shin corrects the favourite-longshot bias: it lifts the favourite and trims
    # the longshots relative to plain proportional de-vigging.
    assert shin[0] >= prop[0] - 1e-9
    assert shin[-1] <= prop[-1] + 1e-9


def test_additive_sums_to_one():
    p = devig.devig([1.8, 3.7, 4.5], "additive")
    assert math.isclose(sum(p), 1.0, abs_tol=1e-9)
    assert all(0.0 <= x <= 1.0 for x in p)


def test_two_way_complementary():
    p_over = devig.devig_two_way(1.91, 1.91, "proportional")
    assert p_over == pytest.approx(0.5, abs=1e-9)


def test_overround_positive_with_margin():
    assert devig.overround([1.91, 1.91]) > 0
