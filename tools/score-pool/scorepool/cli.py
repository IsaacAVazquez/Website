"""Command-line interface.

Subcommands:
  recommend   load odds, build picks, print the pick sheet + submission table
  fetch       pull live odds from the API and write a timestamped fixtures snapshot
  explain     deep-dive one or more matches (full candidate table)
  submit      record the score I actually submitted for a match
  result      enter a finished result and update the running total
  standings   show my running total versus the pool
  init        scaffold an example config and fixtures file

Config supplies the scoring rules, my standing, model, and odds source; most
standing fields can be overridden with flags for quick what-ifs.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import List, Optional

from . import __version__
from .config import AppConfig, load_config
from .engine import analyze_all
from .models import ActualResult, Match, MatchContext
from .odds.manual import load_fixtures
from .output.picksheet import render_full_report, render_match_detail
from .state import (
    load_state,
    parse_score,
    record_result,
    render_standings,
    save_state,
    scoring_to_dict,
    set_submitted,
    upsert_pick,
)


def _resolve_config_path(path: Optional[str]) -> Optional[str]:
    if path:
        return path
    for candidate in ("scorepool.toml", "config.toml"):
        if os.path.exists(candidate):
            return candidate
    return None


def _apply_standing_overrides(cfg: AppConfig, args) -> None:
    st = cfg.standing
    if getattr(args, "my_points", None) is not None:
        st.my_points = args.my_points
    if getattr(args, "above", None) is not None:
        st.points_above = args.above
    if getattr(args, "below", None) is not None:
        st.points_below = args.below
    if getattr(args, "pool", None) is not None:
        st.pool_size = args.pool
    if getattr(args, "games", None) is not None:
        st.games_remaining = args.games
    if getattr(args, "risk", None):
        st.risk = args.risk
    if getattr(args, "model", None):
        cfg.model.type = args.model
    if getattr(args, "devig", None):
        cfg.model.devig = args.devig


def _load_matches(cfg: AppConfig, fixtures: Optional[str]) -> tuple[List[Match], List[str]]:
    """Return (matches, warnings). Applies the configured odds source."""
    warnings: List[str] = []
    matches = load_fixtures(fixtures) if fixtures else []

    if cfg.odds.source == "the_odds_api":
        from .odds.the_odds_api import (
            OddsAPIError,
            enrich_with_api,
            event_to_odds,
            fetch_events,
        )

        try:
            if matches:
                unmatched = enrich_with_api(matches, cfg.odds)
                if unmatched:
                    warnings.append(
                        "no API odds for (using any manual odds instead): "
                        + ", ".join(unmatched)
                    )
            else:
                events = fetch_events(cfg.odds)
                for ev in events:
                    odds = event_to_odds(ev, cfg.odds)
                    if odds is None:
                        continue
                    matches.append(
                        Match(
                            match_id=f"{ev.get('home_team')}-{ev.get('away_team')}",
                            home=ev.get("home_team", "?"),
                            away=ev.get("away_team", "?"),
                            commence_time=ev.get("commence_time"),
                            odds=odds,
                            context=MatchContext(),
                        )
                    )
        except OddsAPIError as exc:
            warnings.append(f"odds API unavailable ({exc}); falling back to fixtures odds")

    if not matches:
        warnings.append(
            "no matches loaded -- supply --fixtures, or configure the_odds_api with a key"
        )
    return matches, warnings


# ---------------------------------------------------------------------------
# Subcommands
# ---------------------------------------------------------------------------


def cmd_recommend(args) -> int:
    cfg = load_config(_resolve_config_path(args.config))
    _apply_standing_overrides(cfg, args)
    matches, warnings = _load_matches(cfg, args.fixtures)
    for w in warnings:
        print(f"[warn] {w}", file=sys.stderr)
    if not matches:
        return 2

    if args.match:
        wanted = set(args.match)
        matches = [m for m in matches if m.match_id in wanted or m.label in wanted]

    analyses = analyze_all(matches, cfg)

    print(render_full_report(analyses, cfg))

    if args.detail:
        print("\nMATCH DETAIL")
        print("=" * 72)
        for a in analyses:
            print()
            print(render_match_detail(a, cfg))

    if args.save:
        state = load_state(args.save)
        state["scoring"] = scoring_to_dict(cfg.scoring)
        for a in analyses:
            if a.ok and a.selection is not None:
                upsert_pick(
                    state,
                    a.match.match_id,
                    a.match.label,
                    a.selection.featured.score,
                    a.selection.field_pick,
                    a.match.commence_time,
                    a.fetched_at,
                    a.confidence,
                )
        save_state(args.save, state)
        print(f"\n[saved planned picks to {args.save}]", file=sys.stderr)

    if args.json:
        _dump_json(analyses, args.json)
        print(f"[wrote structured output to {args.json}]", file=sys.stderr)

    return 0


def cmd_fetch(args) -> int:
    cfg = load_config(_resolve_config_path(args.config))
    cfg.odds.source = "the_odds_api"
    matches, warnings = _load_matches(cfg, args.fixtures)
    for w in warnings:
        print(f"[warn] {w}", file=sys.stderr)
    if not matches:
        return 2

    snapshot = [_match_to_json(m) for m in matches]
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump({"matches": snapshot}, fh, indent=2)
    print(f"wrote {len(snapshot)} matches with live odds to {args.out}")
    return 0


def cmd_explain(args) -> int:
    cfg = load_config(_resolve_config_path(args.config))
    _apply_standing_overrides(cfg, args)
    matches, warnings = _load_matches(cfg, args.fixtures)
    for w in warnings:
        print(f"[warn] {w}", file=sys.stderr)
    if not matches:
        print("no matches loaded", file=sys.stderr)
        return 2
    # Analyse the whole slate so the tilt reflects every remaining game, then show
    # detail only for the requested matches.
    analyses = analyze_all(matches, cfg)
    if args.match:
        wanted = set(args.match)
        analyses = [a for a in analyses if a.match.match_id in wanted or a.match.label in wanted]
    if not analyses:
        print("no matching matches", file=sys.stderr)
        return 2
    for a in analyses:
        print(render_match_detail(a, cfg))
        print()
    return 0


def cmd_submit(args) -> int:
    state = load_state(args.state)
    set_submitted(state, args.match, parse_score(args.score))
    save_state(args.state, state)
    print(f"recorded submitted pick {args.score} for {args.match}")
    return 0


def cmd_result(args) -> int:
    cfg = load_config(_resolve_config_path(args.config))
    state = load_state(args.state)
    reg = parse_score(args.score)
    final = parse_score(args.final) if args.final else None
    actual = ActualResult(
        home_reg=reg[0],
        away_reg=reg[1],
        home_final=final[0] if final else None,
        away_final=final[1] if final else None,
        decided_by=args.decided_by,
    )
    try:
        rec = record_result(state, args.match, actual, cfg.scoring)
    except KeyError as exc:
        print(f"[error] {exc}", file=sys.stderr)
        return 2
    save_state(args.state, state)
    print(
        f"{rec['label']}: result {args.score}"
        + (f" (final {args.final}, {args.decided_by})" if final else "")
        + f" -> my pick {rec.get('submitted_override') or rec['pick']} scored "
        f"{rec['points_mine']:g}"
    )
    print()
    print(render_standings(state, cfg.scoring))
    return 0


def cmd_standings(args) -> int:
    cfg = load_config(_resolve_config_path(args.config))
    state = load_state(args.state)
    print(render_standings(state, cfg.scoring))
    return 0


def cmd_init(args) -> int:
    from .scaffold import CONFIG_TEMPLATE, FIXTURES_TEMPLATE

    wrote = []
    for name, content in (
        ("scorepool.toml", CONFIG_TEMPLATE),
        ("fixtures.csv", FIXTURES_TEMPLATE),
    ):
        path = os.path.join(args.dir, name)
        if os.path.exists(path) and not args.force:
            print(f"[skip] {path} exists (use --force to overwrite)")
            continue
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(content)
        wrote.append(path)
    for p in wrote:
        print(f"wrote {p}")
    if wrote:
        print("\nEdit scorepool.toml (scoring + standing), then run:")
        print("  python -m scorepool recommend --fixtures fixtures.csv")
    return 0


# ---------------------------------------------------------------------------
# JSON serialisation of results
# ---------------------------------------------------------------------------


def _match_to_json(m: Match) -> dict:
    o = m.odds
    odds = None
    if o:
        odds = {"format": "decimal", "fetched_at": o.fetched_at, "bookmaker": o.bookmaker}
        if o.three_way:
            odds["three_way"] = {
                "home": o.three_way.home,
                "draw": o.three_way.draw,
                "away": o.three_way.away,
            }
        if o.over_under:
            odds["over_under"] = {
                "line": o.over_under.line,
                "over": o.over_under.over,
                "under": o.over_under.under,
            }
        if o.btts:
            odds["btts"] = {"yes": o.btts.yes, "no": o.btts.no}
    ctx = m.context
    context = {"note": ctx.note} if ctx.note else {}
    for flag in (
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
    ):
        if getattr(ctx, flag):
            context[flag] = True
    return {
        "match_id": m.match_id,
        "home": m.home,
        "away": m.away,
        "commence_time": m.commence_time,
        "odds": odds,
        "context": context,
    }


def _dump_json(analyses, path: str) -> None:
    out = []
    for a in analyses:
        if not a.ok or a.selection is None:
            out.append({"match": a.match.label, "ok": False, "reason": a.reason})
            continue
        sel = a.selection
        out.append(
            {
                "match": a.match.label,
                "match_id": a.match.match_id,
                "ok": True,
                "pick": f"{sel.featured.score[0]}-{sel.featured.score[1]}",
                "expected_points": round(sel.featured.ep, 3),
                "confidence": a.confidence,
                "safer_alternative": f"{sel.safer.score[0]}-{sel.safer.score[1]}",
                "differentiator": (
                    f"{sel.differentiator.score[0]}-{sel.differentiator.score[1]}"
                    if sel.differentiator
                    else None
                ),
                "field_pick": f"{sel.field_pick[0]}-{sel.field_pick[1]}",
                "posture": sel.tilt.mode,
                "tilt": round(sel.tilt.tau, 3),
                "p_protect": sel.p_protect,
                "p_catch": sel.p_catch,
                "devigged": {
                    "home": a.dist.p_home(),
                    "draw": a.dist.p_draw(),
                    "away": a.dist.p_away(),
                },
                "expected_goals": a.dist.expected_total(),
                "fit_rms": a.dist.fit_quality(),
                "why": a.why,
                "odds_fetched_at": a.fetched_at,
                "lock_time": a.match.commence_time,
                "revisit": a.revisit,
            }
        )
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)


# ---------------------------------------------------------------------------
# Parser
# ---------------------------------------------------------------------------


def _add_standing_flags(p: argparse.ArgumentParser) -> None:
    p.add_argument("--my-points", type=float, help="override my points total")
    p.add_argument("--above", type=float, help="points of the nearest competitor ahead")
    p.add_argument("--below", type=float, help="points of the nearest competitor behind")
    p.add_argument("--pool", type=int, help="pool size")
    p.add_argument("--games", type=int, help="games remaining (incl. these)")
    p.add_argument(
        "--risk", choices=["auto", "protect", "chase", "neutral"], help="override risk posture"
    )
    p.add_argument("--model", help="override scoreline model")
    p.add_argument("--devig", help="override de-vig method")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="scorepool",
        description="Exact-score prediction pool assistant: de-vig odds, build a "
        "scoreline distribution, optimise expected points, and tilt for the leaderboard.",
    )
    parser.add_argument("--version", action="version", version=f"scorepool {__version__}")
    parser.add_argument("--config", help="path to config TOML (default: scorepool.toml)")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("recommend", help="build and print the pick sheet")
    p.add_argument("--fixtures", help="fixtures CSV or JSON")
    p.add_argument("--save", help="persist planned picks to this state JSON")
    p.add_argument("--json", help="also write structured picks to this path")
    p.add_argument("--detail", action="store_true", help="print per-match candidate tables")
    p.add_argument("--match", action="append", help="limit to match id/label (repeatable)")
    _add_standing_flags(p)
    p.set_defaults(func=cmd_recommend)

    p = sub.add_parser("fetch", help="pull live odds and snapshot to JSON")
    p.add_argument("--fixtures", help="fixtures file for the match list + context")
    p.add_argument("--out", default="fixtures.snapshot.json", help="output JSON path")
    p.set_defaults(func=cmd_fetch)

    p = sub.add_parser("explain", help="deep-dive one or more matches")
    p.add_argument("--fixtures", help="fixtures CSV or JSON")
    p.add_argument("--match", action="append", help="match id/label (repeatable)")
    _add_standing_flags(p)
    p.set_defaults(func=cmd_explain)

    p = sub.add_parser("submit", help="record the score I actually submitted")
    p.add_argument("--state", required=True)
    p.add_argument("--match", required=True, help="match id")
    p.add_argument("--score", required=True, help="submitted score, e.g. 1-1")
    p.set_defaults(func=cmd_submit)

    p = sub.add_parser("result", help="enter a finished result and update totals")
    p.add_argument("--state", required=True)
    p.add_argument("--match", required=True, help="match id")
    p.add_argument("--score", required=True, help="90-minute score, e.g. 1-1")
    p.add_argument("--final", help="score after extra time, e.g. 2-1")
    p.add_argument(
        "--decided-by",
        choices=["regulation", "extra_time", "penalties"],
        default="regulation",
    )
    p.set_defaults(func=cmd_result)

    p = sub.add_parser("standings", help="show the running total")
    p.add_argument("--state", required=True)
    p.set_defaults(func=cmd_standings)

    p = sub.add_parser("init", help="scaffold an example config and fixtures")
    p.add_argument("--dir", default=".", help="directory to write into")
    p.add_argument("--force", action="store_true", help="overwrite existing files")
    p.set_defaults(func=cmd_init)

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
