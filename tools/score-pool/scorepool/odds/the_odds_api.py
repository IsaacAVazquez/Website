"""The Odds API client (https://the-odds-api.com).

Fetches live odds and merges them onto a fixtures list, matching by team name.
The API key is read from an environment variable (never hard-coded). Anything the
API doesn't cover keeps whatever hand-entered odds the fixture already had, so
the API is a convenience layer over the manual path, not a hard dependency --
``requests`` is imported lazily so the rest of the tool works without it.

Prices across books are combined by median (robust to one book being off), or a
single book can be pinned in config. Everything is time-stamped so I always know
how stale the numbers are.
"""

from __future__ import annotations

import statistics
import unicodedata
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..config import OddsConfig
from ..models import BTTS, Match, MarketOdds, OverUnder, ThreeWay

API_ROOT = "https://api.the-odds-api.com/v4"


class OddsAPIError(RuntimeError):
    pass


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _norm(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return "".join(ch for ch in s.lower() if ch.isalnum())


def fetch_events(cfg: OddsConfig, timeout: float = 20.0) -> List[Dict[str, Any]]:
    """Pull raw events for the configured sport. Raises OddsAPIError on failure."""
    key = cfg.api_key
    if not key:
        raise OddsAPIError(
            f"no API key: set the {cfg.api_key_env} environment variable, or use a "
            f"manual/CSV odds source"
        )
    try:
        import requests  # lazy: only needed on the API path
    except ImportError as exc:  # pragma: no cover
        raise OddsAPIError("the 'requests' package is required for the odds API") from exc

    url = f"{API_ROOT}/sports/{cfg.sport_key}/odds"
    params = {
        "apiKey": key,
        "regions": cfg.regions,
        "markets": cfg.markets,
        "oddsFormat": "decimal",
    }
    try:
        resp = requests.get(url, params=params, timeout=timeout)
    except Exception as exc:  # network error
        raise OddsAPIError(f"request to The Odds API failed: {exc}") from exc
    if resp.status_code != 200:
        raise OddsAPIError(
            f"The Odds API returned {resp.status_code}: {resp.text[:200]}"
        )
    return resp.json()


def _collect_prices(event: Dict[str, Any], only_book: Optional[str]):
    """Gather prices per market across bookmakers into lists we can median."""
    home_team = event.get("home_team", "")
    away_team = event.get("away_team", "")
    h2h = {"home": [], "draw": [], "away": []}
    totals: Dict[float, Dict[str, list]] = {}
    btts = {"yes": [], "no": []}

    for book in event.get("bookmakers", []):
        if only_book and book.get("key") != only_book and book.get("title") != only_book:
            continue
        for market in book.get("markets", []):
            mkey = market.get("key")
            outs = market.get("outcomes", [])
            if mkey in ("h2h", "h2h_3_way"):
                for o in outs:
                    name, price = o.get("name"), o.get("price")
                    if name == "Draw":
                        h2h["draw"].append(price)
                    elif name == home_team:
                        h2h["home"].append(price)
                    elif name == away_team:
                        h2h["away"].append(price)
            elif mkey == "totals":
                for o in outs:
                    point = o.get("point")
                    if point is None:
                        continue
                    slot = totals.setdefault(float(point), {"over": [], "under": []})
                    if o.get("name") == "Over":
                        slot["over"].append(o.get("price"))
                    elif o.get("name") == "Under":
                        slot["under"].append(o.get("price"))
            elif mkey in ("btts", "both_teams_to_score"):
                for o in outs:
                    if o.get("name") in ("Yes",):
                        btts["yes"].append(o.get("price"))
                    elif o.get("name") in ("No",):
                        btts["no"].append(o.get("price"))
    return h2h, totals, btts


def _median(xs) -> Optional[float]:
    xs = [x for x in xs if x]
    return float(statistics.median(xs)) if xs else None


def event_to_odds(event: Dict[str, Any], cfg: OddsConfig) -> Optional[MarketOdds]:
    h2h, totals, btts = _collect_prices(event, cfg.bookmaker)

    three_way = None
    if h2h["home"] and h2h["draw"] and h2h["away"]:
        three_way = ThreeWay(_median(h2h["home"]), _median(h2h["draw"]), _median(h2h["away"]))

    over_under = None
    if totals:
        # Prefer the line with the most quotes; tie-break to the one nearest 2.5.
        line = sorted(
            totals,
            key=lambda p: (len(totals[p]["over"]) + len(totals[p]["under"]), -abs(p - 2.5)),
        )[-1]
        o, u = _median(totals[line]["over"]), _median(totals[line]["under"])
        if o and u:
            over_under = OverUnder(line, o, u)

    btts_odds = None
    if btts["yes"] and btts["no"]:
        btts_odds = BTTS(_median(btts["yes"]), _median(btts["no"]))

    if not (three_way or over_under or btts_odds):
        return None

    return MarketOdds(
        three_way=three_way,
        over_under=over_under,
        btts=btts_odds,
        fetched_at=_now_iso(),
        bookmaker=cfg.bookmaker or "median",
        source="the_odds_api",
    )


def enrich_with_api(matches: List[Match], cfg: OddsConfig) -> List[str]:
    """Fill in each match's odds from the API where a matching event exists.

    Matches keep any hand-entered odds as a fallback. Returns the list of match
    labels that were *not* found in the API feed, so the caller can report which
    ones are running on manual odds.
    """
    events = fetch_events(cfg)
    index = {}
    for ev in events:
        index[(_norm(ev.get("home_team", "")), _norm(ev.get("away_team", "")))] = ev

    unmatched = []
    for m in matches:
        ev = index.get((_norm(m.home), _norm(m.away)))
        if ev is None:  # try swapped home/away just in case
            ev = index.get((_norm(m.away), _norm(m.home)))
        odds = event_to_odds(ev, cfg) if ev else None
        if odds is not None:
            if ev.get("commence_time") and not m.commence_time:
                m.commence_time = ev["commence_time"]
            m.odds = odds
        elif m.odds is None:
            unmatched.append(m.label)
    return unmatched
