"""Persistent state so the tool can be re-run all tournament.

The state file (JSON) remembers, per match, the score I submitted and the score
the chalk/field was on, and -- once a result is entered -- the points each earned.
That lets the tool keep a running total against the pool's scoring rules and show
how my picks did versus just following the field, as results come in and I re-run.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .models import ActualResult, ScoringRules, Score


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def parse_score(text: str) -> Score:
    h, a = str(text).replace(":", "-").split("-")
    return (int(h), int(a))


def fmt_score(score: Score) -> str:
    return f"{score[0]}-{score[1]}"


def default_state() -> Dict[str, Any]:
    return {
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
        "scoring": None,
        "matches": {},  # match_id -> record
        "totals": {"mine": 0.0, "chalk": 0.0, "scored_games": 0},
    }


def load_state(path: str) -> Dict[str, Any]:
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        return default_state()


def save_state(path: str, state: Dict[str, Any]) -> None:
    state["updated_at"] = _now_iso()
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(state, fh, indent=2)


def scoring_to_dict(rules: ScoringRules) -> Dict[str, Any]:
    return {
        "exact": rules.exact,
        "result_and_goal_difference": rules.result_and_goal_difference,
        "result_only": rules.result_only,
        "result_basis": rules.result_basis,
    }


def upsert_pick(
    state: Dict[str, Any],
    match_id: str,
    label: str,
    pick: Score,
    chalk: Optional[Score],
    commence_time: Optional[str],
    odds_fetched_at: Optional[str],
    confidence: str = "",
) -> None:
    """Record (or update) the pick for a match, preserving any result already
    entered. Re-running recommend refreshes the planned pick until a result lands."""
    rec = state["matches"].get(match_id, {})
    rec.update(
        {
            "label": label,
            "pick": fmt_score(pick),
            "chalk": fmt_score(chalk) if chalk else None,
            "commence_time": commence_time,
            "odds_fetched_at": odds_fetched_at,
            "confidence": confidence,
        }
    )
    rec.setdefault("result", None)
    rec.setdefault("points_mine", None)
    rec.setdefault("points_chalk", None)
    # Overridden pick (if I submitted something other than the recommendation).
    rec.setdefault("submitted_override", None)
    state["matches"][match_id] = rec


def set_submitted(state: Dict[str, Any], match_id: str, pick: Score) -> None:
    """Override what I actually submitted, in case I deviated from the tool."""
    rec = state["matches"].setdefault(match_id, {})
    rec["submitted_override"] = fmt_score(pick)


def _effective_pick(rec: Dict[str, Any]) -> Optional[Score]:
    p = rec.get("submitted_override") or rec.get("pick")
    return parse_score(p) if p else None


def record_result(
    state: Dict[str, Any],
    match_id: str,
    actual: ActualResult,
    rules: ScoringRules,
) -> Dict[str, Any]:
    """Enter a finished result and score my pick (and the chalk) against it."""
    if match_id not in state["matches"]:
        raise KeyError(
            f"no pick on file for match id {match_id!r}; run recommend with --save first, "
            f"or add the pick with the submit command"
        )
    rec = state["matches"][match_id]
    rec["result"] = {
        "home_reg": actual.home_reg,
        "away_reg": actual.away_reg,
        "home_final": actual.home_final,
        "away_final": actual.away_final,
        "decided_by": actual.decided_by,
    }
    scoring_score = actual.scoring_score(rules.result_basis)
    pick = _effective_pick(rec)
    rec["points_mine"] = rules.score(pick, scoring_score) if pick else None
    chalk = parse_score(rec["chalk"]) if rec.get("chalk") else None
    rec["points_chalk"] = rules.score(chalk, scoring_score) if chalk else None
    recompute_totals(state)
    return rec


def recompute_totals(state: Dict[str, Any]) -> None:
    mine = chalk = 0.0
    scored = 0
    for rec in state["matches"].values():
        if rec.get("points_mine") is not None:
            mine += rec["points_mine"]
            scored += 1
        if rec.get("points_chalk") is not None:
            chalk += rec["points_chalk"]
    state["totals"] = {"mine": mine, "chalk": chalk, "scored_games": scored}


def render_standings(state: Dict[str, Any], rules: ScoringRules) -> str:
    """A running scorecard: what each settled game scored, and my total versus the
    chalk baseline."""
    basis = rules.result_basis
    lines = [f"RUNNING TOTAL (scoring basis: {basis})", "-" * 56]
    header = ["Match", "Pick", "Result", "Mine", "Chalk"]
    widths = [26, 6, 10, 6, 6]
    from .output.picksheet import render_table

    rows = []
    for rec in state["matches"].values():
        res = rec.get("result")
        if res:
            reg = f"{res['home_reg']}-{res['away_reg']}"
            if res.get("decided_by") and res["decided_by"] != "regulation":
                reg += f" ({res['decided_by'][:3]})"
        else:
            reg = "pending"
        rows.append(
            [
                rec.get("label", ""),
                rec.get("submitted_override") or rec.get("pick", ""),
                reg,
                "-" if rec.get("points_mine") is None else f"{rec['points_mine']:g}",
                "-" if rec.get("points_chalk") is None else f"{rec['points_chalk']:g}",
            ]
        )
    if rows:
        lines.append(render_table(header, rows, widths))
    totals = state.get("totals", {})
    mine = totals.get("mine", 0.0)
    chalk = totals.get("chalk", 0.0)
    scored = totals.get("scored_games", 0)
    lines.append("")
    lines.append(f"My points over {scored} settled game(s): {mine:g}")
    lines.append(f"Chalk baseline (if I'd copied the field): {chalk:g}")
    edge = mine - chalk
    lines.append(f"Edge vs chalk: {edge:+g}")
    return "\n".join(lines)
