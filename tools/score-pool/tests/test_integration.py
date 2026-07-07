"""End-to-end: the example config and fixtures should produce a full pick sheet."""

import os

from scorepool.config import load_config
from scorepool.engine import analyze_all
from scorepool.odds.manual import load_fixtures
from scorepool.output.picksheet import render_full_report, render_submission
from scorepool.probability.market import apply_context_shading
from scorepool.probability.scoreline import MarketTargets
from scorepool.config import ContextShading
from scorepool.models import MatchContext

HERE = os.path.dirname(__file__)
ROOT = os.path.join(HERE, "..")


def _load():
    cfg = load_config(os.path.join(ROOT, "config.example.toml"))
    matches = load_fixtures(os.path.join(ROOT, "fixtures.example.csv"))
    return cfg, matches


def test_examples_load():
    cfg, matches = _load()
    assert cfg.scoring.exact == 5
    assert cfg.scoring.result_basis == "regulation"
    assert len(matches) == 4


def test_full_pipeline_produces_picks():
    cfg, matches = _load()
    analyses = analyze_all(matches, cfg)
    assert len(analyses) == 4
    for a in analyses:
        assert a.ok
        h, w = a.selection.featured.score
        assert isinstance(h, int) and isinstance(w, int)
        assert a.confidence in ("low", "medium", "high")


def test_report_and_submission_render():
    cfg, matches = _load()
    analyses = analyze_all(matches, cfg)
    report = render_full_report(analyses, cfg)
    assert "PICK SHEET" in report
    assert "SUBMISSION" in report
    sub = render_submission(analyses)
    assert "Spain vs Germany" in sub


def test_american_odds_row_parses():
    # France-Poland is entered in American format; it must still yield a pick.
    cfg, matches = _load()
    fra = next(m for m in matches if m.match_id == "FRA-POL")
    assert fra.odds is not None and fra.odds.three_way is not None
    assert fra.odds.three_way.home > 1.0


def test_context_shading_raises_draws_and_lowers_scoring():
    t = MarketTargets(p_home=0.40, p_draw=0.30, p_away=0.30, ou_line=2.5, p_over=0.55)
    ctx = MatchContext(draw_suits_both=True)
    shaded = apply_context_shading(t, ctx, ContextShading())
    assert shaded.p_draw > t.p_draw
    assert shaded.p_over < t.p_over


def test_missing_three_way_is_flagged_not_crashed():
    from scorepool.models import Match

    cfg, _ = _load()
    blank = Match(match_id="X", home="A", away="B")
    analyses = analyze_all([blank], cfg)
    assert not analyses[0].ok
    assert "three-way" in analyses[0].reason
