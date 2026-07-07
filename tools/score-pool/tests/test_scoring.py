"""The scorer is the heart of the tool, so its tiers are pinned down exactly,
including the draw goal-difference subtlety and the 90-minute-vs-final rule."""

from scorepool.models import ActualResult, ScoringRules

RULES = ScoringRules(exact=5, result_and_goal_difference=3, result_only=2)


def test_exact():
    assert RULES.score((2, 1), (2, 1)) == 5


def test_result_and_goal_difference_home_win():
    # Right winner, right margin (+1), wrong exact score.
    assert RULES.score((2, 1), (3, 2)) == 3
    assert RULES.score((2, 1), (1, 0)) == 3


def test_result_only_home_win():
    # Right winner, wrong margin.
    assert RULES.score((2, 1), (3, 1)) == 2  # margin +2, not +1
    assert RULES.score((2, 1), (2, 0)) == 2


def test_wrong_outcome_scores_zero():
    assert RULES.score((2, 1), (0, 1)) == 0  # picked home, away won
    assert RULES.score((1, 1), (2, 1)) == 0  # picked draw, home won


def test_draw_pick_banks_gd_on_every_draw():
    # A draw pick never lands on the outcome-only tier: every actual draw matches
    # the zero goal difference, so it is always at least the middle tier.
    assert RULES.score((1, 1), (1, 1)) == 5  # exact
    assert RULES.score((1, 1), (0, 0)) == 3  # other draw -> result + GD
    assert RULES.score((1, 1), (2, 2)) == 3
    assert RULES.score((0, 0), (3, 3)) == 3


def test_regulation_basis_counts_ninety_minutes():
    # 1-1 after 90, won on penalties. Under regulation scoring it is a 1-1 draw.
    actual = ActualResult(home_reg=1, away_reg=1, home_final=2, away_final=1, decided_by="penalties")
    assert actual.scoring_score("regulation") == (1, 1)
    assert RULES.score((1, 1), actual.scoring_score("regulation")) == 5  # nailed the draw
    # A "favourite to win" pick scores zero even though that team advanced.
    assert RULES.score((2, 1), actual.scoring_score("regulation")) == 0


def test_final_basis_counts_after_extra_time():
    final_rules = ScoringRules(exact=5, result_and_goal_difference=3, result_only=2, result_basis="final")
    actual = ActualResult(home_reg=1, away_reg=1, home_final=2, away_final=1, decided_by="extra_time")
    assert actual.scoring_score("final") == (2, 1)
    assert final_rules.score((1, 1), actual.scoring_score(final_rules.result_basis)) == 0
    assert final_rules.score((2, 1), actual.scoring_score(final_rules.result_basis)) == 5


def test_configurable_points():
    rules = ScoringRules(exact=10, result_and_goal_difference=4, result_only=1)
    assert rules.score((2, 1), (2, 1)) == 10
    assert rules.score((2, 1), (3, 2)) == 4
    assert rules.score((2, 1), (4, 0)) == 1
