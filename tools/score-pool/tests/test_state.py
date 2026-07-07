"""Running-total bookkeeping, including the regulation-vs-final settlement rule."""

from scorepool.models import ActualResult, ScoringRules
from scorepool.state import (
    default_state,
    fmt_score,
    parse_score,
    record_result,
    upsert_pick,
)

RULES = ScoringRules(5, 3, 2, result_basis="regulation")
RULES_FINAL = ScoringRules(5, 3, 2, result_basis="final")


def test_score_roundtrip():
    assert parse_score("2-1") == (2, 1)
    assert parse_score("2:1") == (2, 1)
    assert fmt_score((3, 0)) == "3-0"


def test_penalties_score_as_draw_under_regulation():
    state = default_state()
    upsert_pick(state, "M1", "A vs B", pick=(1, 1), chalk=(1, 0),
                commence_time=None, odds_fetched_at=None)
    actual = ActualResult(home_reg=1, away_reg=1, home_final=2, away_final=1, decided_by="penalties")
    rec = record_result(state, "M1", actual, RULES)
    assert rec["points_mine"] == 5  # nailed the 1-1
    assert rec["points_chalk"] == 0  # 1-0 pick busts on a draw
    assert state["totals"]["mine"] == 5
    assert state["totals"]["chalk"] == 0


def test_final_basis_scores_after_extra_time():
    state = default_state()
    upsert_pick(state, "M1", "A vs B", pick=(1, 1), chalk=(2, 1),
                commence_time=None, odds_fetched_at=None)
    actual = ActualResult(home_reg=1, away_reg=1, home_final=2, away_final=1, decided_by="extra_time")
    rec = record_result(state, "M1", actual, RULES_FINAL)
    assert rec["points_mine"] == 0  # the 1-1 is void once ET counts
    assert rec["points_chalk"] == 5  # 2-1 nails the after-ET score


def test_submitted_override_is_scored():
    from scorepool.state import set_submitted

    state = default_state()
    upsert_pick(state, "M1", "A vs B", pick=(1, 1), chalk=(1, 0),
                commence_time=None, odds_fetched_at=None)
    set_submitted(state, "M1", (2, 0))  # I actually submitted 2-0
    actual = ActualResult(home_reg=2, away_reg=0)
    rec = record_result(state, "M1", actual, RULES)
    assert rec["points_mine"] == 5  # scored against 2-0, not the recommended 1-1


def test_running_total_accumulates_edge():
    state = default_state()
    upsert_pick(state, "M1", "A vs B", (1, 1), (1, 0), None, None)
    upsert_pick(state, "M2", "C vs D", (2, 1), (2, 1), None, None)
    record_result(state, "M1", ActualResult(0, 0), RULES)  # mine 3, chalk 0
    record_result(state, "M2", ActualResult(2, 1), RULES)  # mine 5, chalk 5
    assert state["totals"]["mine"] == 8
    assert state["totals"]["chalk"] == 5
    assert state["totals"]["scored_games"] == 2
