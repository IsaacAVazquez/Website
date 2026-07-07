"""Plain, readable output: the pick sheet, the copyable submission table, and the
before-lock revisit list.

No table library -- a small wrapping renderer keeps it dependency-light and gives
full control over the layout, including a Why column that wraps cleanly.
"""

from __future__ import annotations

import textwrap
from typing import List, Optional

from ..config import AppConfig
from ..engine import MatchAnalysis


def render_table(headers: List[str], rows: List[List[str]], widths: List[int]) -> str:
    """Render a grid table, wrapping each cell to at most its column width."""
    all_rows = [headers] + rows
    colw = [
        min(widths[i], max(len(str(r[i])) for r in all_rows)) for i in range(len(headers))
    ]

    def wrap(cell: str, w: int) -> List[str]:
        lines: List[str] = []
        for para in str(cell).split("\n"):
            lines.extend(textwrap.wrap(para, w) or [""])
        return lines or [""]

    def render_row(cells: List[str]) -> str:
        wrapped = [wrap(c, colw[i]) for i, c in enumerate(cells)]
        height = max(len(c) for c in wrapped)
        out = []
        for h in range(height):
            parts = []
            for i, col in enumerate(wrapped):
                text = col[h] if h < len(col) else ""
                parts.append(" " + text.ljust(colw[i]) + " ")
            out.append("|" + "|".join(parts) + "|")
        return "\n".join(out)

    sep = "+" + "+".join("-" * (w + 2) for w in colw) + "+"
    lines = [sep, render_row(headers), sep]
    for r in rows:
        lines.append(render_row(r))
    lines.append(sep)
    return "\n".join(lines)


def _fmt_score(score) -> str:
    return f"{score[0]}-{score[1]}"


def _global_header(cfg: AppConfig, analyses: List[MatchAnalysis]) -> str:
    s = cfg.scoring
    st = cfg.standing
    lines = [
        "SCORE-PREDICTION POOL  --  PICK SHEET",
        "=" * 72,
        f"Scoring        : exact {s.exact:g} / result+GD {s.result_and_goal_difference:g} "
        f"/ result {s.result_only:g}   (basis: {s.result_basis})",
        f"Model          : {cfg.model.type}, de-vig {cfg.model.devig}, "
        f"field = {cfg.model.field_model}",
    ]
    stand_bits = [f"my points {st.my_points:g}"]
    if st.points_above is not None:
        stand_bits.append(f"leader-side {st.points_above:g} (gap {st.gap_above:g})")
    else:
        stand_bits.append("no one ahead")
    if st.points_below is not None:
        stand_bits.append(f"chaser {st.points_below:g} (cushion {st.gap_below:g})")
    else:
        stand_bits.append("no one behind")
    stand_bits.append(f"pool {st.pool_size}")
    lines.append("Standing       : " + ", ".join(stand_bits))

    # Posture comes from the first analysed match (it's a global tilt).
    posture = None
    for a in analyses:
        if a.ok and a.selection is not None:
            posture = a.selection.tilt
            break
    if posture is not None:
        lines.append(
            f"Posture        : {posture.mode.upper()} (tilt {posture.tau:+.2f}); {posture.rationale}"
        )
    return "\n".join(lines)


def render_pick_sheet(analyses: List[MatchAnalysis], cfg: AppConfig) -> str:
    headers = ["Match", "Pick", "Conf", "xEP", "Safer alt", "Differentiator", "Why"]
    widths = [22, 5, 6, 6, 12, 14, 46]
    rows: List[List[str]] = []
    for a in analyses:
        if not a.ok or a.selection is None:
            continue
        sel = a.selection
        safer = f"{_fmt_score(sel.safer.score)} ({sel.safer.floor:.0%})"
        if sel.differentiator is not None:
            d = sel.differentiator
            diff_cell = f"{_fmt_score(d.score)} ({d.ep:.1f}xEP)"
        else:
            diff_cell = "-- (chalk)"
        rows.append(
            [
                a.match.label,
                _fmt_score(sel.featured.score),
                a.confidence.upper(),
                f"{sel.featured.ep:.2f}",
                safer,
                diff_cell,
                a.why,
            ]
        )
    if not rows:
        return "No matches had enough odds to produce a pick."
    return render_table(headers, rows, widths)


def render_submission(analyses: List[MatchAnalysis]) -> str:
    """A clean two-column table with only match and score, easy to paste."""
    headers = ["Match", "Score"]
    rows = [
        [a.match.label, _fmt_score(a.selection.featured.score)]
        for a in analyses
        if a.ok and a.selection is not None
    ]
    if not rows:
        return ""
    width = max(len(r[0]) for r in rows + [headers])
    lines = ["SUBMISSION (copyable)", "-" * (width + 12)]
    for r in rows:
        lines.append(f"{r[0].ljust(width)}   {r[1]}")
    return "\n".join(lines)


def render_revisit(analyses: List[MatchAnalysis], cfg: AppConfig) -> str:
    lines = ["BEFORE EACH GAME LOCKS", "-" * 40]
    any_flag = False
    for a in analyses:
        reasons = list(a.revisit)
        if not a.ok:
            reasons.append(a.reason)
        if not reasons:
            continue
        any_flag = True
        lock = a.match.commence_time or "lock time unknown"
        stamp = a.fetched_at or "no timestamp"
        lines.append(f"- {a.match.label}")
        lines.append(f"    {', '.join(reasons)}")
        lines.append(f"    locks {lock}; odds pulled {stamp}")

    # A standings caveat when the margin is thin enough to flip the picture.
    st = cfg.standing
    thin = False
    if st.gap_below is not None and st.gap_below <= max(cfg.scoring.exact, 5):
        thin = True
    if st.gap_above is not None and st.gap_above <= max(cfg.scoring.exact, 5):
        thin = True
    if thin:
        any_flag = True
        lines.append("- Standings are close enough that a single result can change the tilt;")
        lines.append("    re-run after other players' games settle.")

    if not any_flag:
        lines.append("- Nothing flagged. Still re-check lineups near kickoff.")
    return "\n".join(lines)


def render_disclaimer() -> str:
    return (
        "NOTE  These are model estimates anchored to the betting market, not "
        "predictions.\n      The scoreline model is fit to the de-vigged prices, "
        "so it is only as good as\n      those prices and the assumptions behind "
        "it. Treat the numbers as a decision\n      aid for close calls, not as "
        "certainty. Confidence labels are conservative on\n      purpose."
    )


def render_full_report(analyses: List[MatchAnalysis], cfg: AppConfig) -> str:
    blocks = [
        _global_header(cfg, analyses),
        "",
        render_pick_sheet(analyses, cfg),
        "",
        render_submission(analyses),
        "",
        render_revisit(analyses, cfg),
        "",
        render_disclaimer(),
    ]
    return "\n".join(b for b in blocks if b is not None)


def render_match_detail(a: MatchAnalysis, cfg: AppConfig, top_n: int = 8) -> str:
    """A deep look at one match: the top candidate scorelines with their expected
    points, floor, and how likely the exact score is."""
    if not a.ok or a.selection is None:
        return f"{a.match.label}: {a.reason}"
    lines = [f"{a.match.label}  ({a.confidence.upper()} confidence)"]
    d = a.dist
    lines.append(
        f"  de-vigged  home {d.p_home():.0%} / draw {d.p_draw():.0%} / away {d.p_away():.0%}"
        f"   expected goals {d.expected_total():.2f}   fit rms {d.fit_quality():.4f}"
    )
    lines.append(f"  model params: {d.params}")
    lines.append(f"  field is modelled on {_fmt_score(a.selection.field_pick)}")
    headers = ["Scoreline", "xEP", "P(this exact)", "Floor", "diff sd vs field"]
    rows = []
    for c in a.candidates[:top_n]:
        diff = a.selection.diffs.get(c.score)
        rows.append(
            [
                _fmt_score(c.score),
                f"{c.ep:.3f}",
                f"{c.prob:.1%}",
                f"{c.floor:.1%}",
                f"{diff.std:.2f}" if diff else "-",
            ]
        )
    lines.append(render_table(headers, rows, [10, 8, 14, 8, 16]))
    lines.append(f"  why: {a.why}")
    return "\n".join(lines)
