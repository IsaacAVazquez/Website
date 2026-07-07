"""Load matches, context, and hand-entered / CSV / JSON odds from a fixtures file.

This is the always-present input and the fallback for any match the odds API
doesn't cover. Two formats are supported, picked by file extension:

  .csv   one row per match, flat columns (see fixtures.example.csv)
  .json  a list of match objects with a nested ``odds`` block (richer: supports
         correct-score markets and opening lines cleanly)
"""

from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..models import (
    BTTS,
    Match,
    MatchContext,
    MarketOdds,
    OverUnder,
    Score,
    ThreeWay,
)
from ..probability.devig import to_decimal

_CONTEXT_FLAGS = {
    "dead_rubber",
    "draw_suits_both",
    "heavy_rotation_home",
    "heavy_rotation_away",
    "low_scoring",
    "high_scoring",
    "must_win_home",
    "must_win_away",
    "lineup_unconfirmed",
    "injury_question",
}
_CONTEXT_ALIASES = {
    "rotation_home": "heavy_rotation_home",
    "rotation_away": "heavy_rotation_away",
    "deadrubber": "dead_rubber",
    "mutual_draw": "draw_suits_both",
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _f(v) -> Optional[float]:
    if v is None or v == "":
        return None
    return float(v)


def _b(v) -> bool:
    return str(v).strip().lower() in ("1", "true", "yes", "y", "t")


def parse_context_tokens(tokens: str) -> Dict[str, bool]:
    out: Dict[str, bool] = {}
    for raw in tokens.replace(";", ",").replace("|", ",").split(","):
        tok = raw.strip().lower()
        if not tok:
            continue
        tok = _CONTEXT_ALIASES.get(tok, tok)
        if tok in _CONTEXT_FLAGS:
            out[tok] = True
    return out


def _context_from_dict(d: Dict[str, Any]) -> MatchContext:
    ctx = MatchContext()
    for flag in _CONTEXT_FLAGS:
        if flag in d:
            setattr(ctx, flag, _b(d[flag]))
    if "note" in d and d["note"]:
        ctx.note = str(d["note"])
    return ctx


def _parse_correct_score(raw) -> Optional[Dict[Score, float]]:
    """Accept either a dict {"1-0": 7.5} or a string "1-0:7.5;1-1:8.0"."""
    if not raw:
        return None
    items = {}
    if isinstance(raw, dict):
        pairs = raw.items()
    else:
        pairs = (chunk.split(":") for chunk in str(raw).replace(";", ",").split(",") if chunk.strip())
    for k, v in pairs:
        h, a = str(k).split("-")
        items[(int(h), int(a))] = float(v)
    return items or None


# ---------------------------------------------------------------------------
# CSV
# ---------------------------------------------------------------------------


def _match_from_csv_row(row: Dict[str, str]) -> Match:
    fmt = (row.get("odds_format") or "decimal").strip() or "decimal"

    def dec(key: str) -> Optional[float]:
        v = _f(row.get(key))
        return None if v is None else to_decimal(v, fmt)

    three_way = None
    if dec("home_odds") and dec("draw_odds") and dec("away_odds"):
        three_way = ThreeWay(dec("home_odds"), dec("draw_odds"), dec("away_odds"))

    three_way_open = None
    if dec("home_odds_open") and dec("draw_odds_open") and dec("away_odds_open"):
        three_way_open = ThreeWay(
            dec("home_odds_open"), dec("draw_odds_open"), dec("away_odds_open")
        )

    over_under = None
    if _f(row.get("ou_line")) is not None and dec("over_odds") and dec("under_odds"):
        over_under = OverUnder(_f(row["ou_line"]), dec("over_odds"), dec("under_odds"))

    btts = None
    if dec("btts_yes") and dec("btts_no"):
        btts = BTTS(dec("btts_yes"), dec("btts_no"))

    odds = None
    if three_way or over_under or btts:
        odds = MarketOdds(
            three_way=three_way,
            over_under=over_under,
            btts=btts,
            correct_score=_parse_correct_score(row.get("correct_score")),
            three_way_open=three_way_open,
            fetched_at=(row.get("fetched_at") or "").strip() or _now_iso(),
            bookmaker=(row.get("bookmaker") or "").strip() or None,
            source="csv",
        )

    ctx = _context_from_dict(
        {**parse_context_tokens(row.get("context", "")),
         "note": row.get("note", ""),
         "lineup_unconfirmed": row.get("lineup_unconfirmed", ""),
         "injury_question": row.get("injury_question", "")}
    )
    home, away = row["home"].strip(), row["away"].strip()
    return Match(
        match_id=(row.get("match_id") or f"{home}-{away}").strip(),
        home=home,
        away=away,
        commence_time=(row.get("commence_time") or "").strip() or None,
        odds=odds,
        context=ctx,
    )


def load_csv(path: str) -> List[Match]:
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        return [_match_from_csv_row(row) for row in reader if row.get("home")]


# ---------------------------------------------------------------------------
# JSON
# ---------------------------------------------------------------------------


def _match_from_json(obj: Dict[str, Any]) -> Match:
    o = obj.get("odds") or {}
    fmt = (o.get("format") or "decimal")

    def three(key: str) -> Optional[ThreeWay]:
        tw = o.get(key)
        if not tw:
            return None
        return ThreeWay(to_decimal(tw["home"], fmt), to_decimal(tw["draw"], fmt), to_decimal(tw["away"], fmt))

    def ou(key: str) -> Optional[OverUnder]:
        d = o.get(key)
        if not d:
            return None
        return OverUnder(float(d["line"]), to_decimal(d["over"], fmt), to_decimal(d["under"], fmt))

    btts = None
    if o.get("btts"):
        btts = BTTS(to_decimal(o["btts"]["yes"], fmt), to_decimal(o["btts"]["no"], fmt))

    cs = _parse_correct_score(o.get("correct_score"))
    if cs:
        cs = {k: to_decimal(v, fmt) for k, v in cs.items()}

    odds = None
    if o:
        odds = MarketOdds(
            three_way=three("three_way"),
            over_under=ou("over_under"),
            btts=btts,
            correct_score=cs,
            three_way_open=three("three_way_open"),
            over_under_open=ou("over_under_open"),
            fetched_at=o.get("fetched_at") or _now_iso(),
            bookmaker=o.get("bookmaker"),
            source="json",
        )

    ctx = _context_from_dict(obj.get("context", {}))
    home, away = obj["home"], obj["away"]
    return Match(
        match_id=obj.get("match_id") or f"{home}-{away}",
        home=home,
        away=away,
        commence_time=obj.get("commence_time"),
        odds=odds,
        context=ctx,
    )


def load_json(path: str) -> List[Match]:
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    if isinstance(data, dict):
        data = data.get("matches", [])
    return [_match_from_json(obj) for obj in data]


def load_fixtures(path: str) -> List[Match]:
    """Load a fixtures file, dispatching on extension."""
    if path.lower().endswith(".json"):
        return load_json(path)
    return load_csv(path)
