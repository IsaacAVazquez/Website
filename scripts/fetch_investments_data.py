#!/usr/bin/env python3
"""
Investment data pipeline using defeatbeta-api.
Reads symbols from scripts/investments_symbols.txt, fetches financial data,
and writes raw per-ticker JSON files to data/investments-raw/{SYMBOL}/
before the snapshot builder compacts them into snapshot.json artifacts under
public/data/investments/{SYMBOL}/. Only the compacted snapshots and the
index are deployed; the raw files stay out of public/ so they never ship
with the site.

Usage:
    .venv/bin/python3 scripts/fetch_investments_data.py
    (or: npm run update:investments, which also builds curated snapshots)

Requirements:
    .venv/bin/pip install defeatbeta-api
"""

import json
import os
import signal
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Import
# ---------------------------------------------------------------------------
try:
    from defeatbeta_api.data.ticker import Ticker  # type: ignore
except ImportError:
    print("Error: defeatbeta-api is not installed.")
    print("Install it with:  .venv/bin/pip install defeatbeta-api")
    sys.exit(1)

import pandas as pd  # type: ignore  # noqa: E402 — guaranteed by defeatbeta-api

# Fix for pandas 2.x datetime64 precision mismatch (e.g. 'datetime64[us]' vs 'datetime64[s]')
# AMZN has data back to 1997; different-vintage DataFrames get different datetime64 precisions.
_orig_merge = pd.merge
def _safe_merge(left, right, *args, **kwargs):
    for obj in [left, right]:
        if isinstance(obj, pd.DataFrame):
            for col in obj.select_dtypes(include="datetime64").columns:
                obj[col] = obj[col].astype("datetime64[s]")
        if hasattr(obj, "index") and pd.api.types.is_datetime64_any_dtype(obj.index):
            obj.index = obj.index.astype("datetime64[s]")
    return _orig_merge(left, right, *args, **kwargs)
pd.merge = _safe_merge
pd.DataFrame.merge = lambda self, right, *args, **kwargs: _safe_merge(self, right, *args, **kwargs)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
SYMBOLS_FILE = SCRIPT_DIR / "investments_symbols.txt"
COMPANY_NAMES_FILE = PROJECT_ROOT / "src" / "data" / "investmentCompanyNames.json"
# Raw per-section fetch output. Script-only input for the snapshot builder —
# intentionally outside public/ so it is never deployed (~300 MB).
OUTPUT_DIR = PROJECT_ROOT / "data" / "investments-raw"
# Deployed artifacts: index.json + per-symbol snapshot.json live here.
PUBLIC_DIR = PROJECT_ROOT / "public" / "data" / "investments"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def read_symbols() -> list[str]:
    if not SYMBOLS_FILE.exists():
        print(f"Error: symbols file not found at {SYMBOLS_FILE}")
        sys.exit(1)
    lines = SYMBOLS_FILE.read_text().strip().splitlines()
    return [line.strip().upper() for line in lines if line.strip() and not line.startswith("#")]


def symbol_price_freshness(symbol: str) -> str:
    """Sortable freshness stamp for a symbol, read from its prior *public*
    snapshot rather than its filesystem mtime — CI checks the repo out fresh
    each run, which resets mtimes, so an mtime sort would be a no-op on the
    runner. Prefers the price as-of date, then the snapshot build time, then
    lastUpdated. Returns "" when the symbol has never been fetched or its
    snapshot is unreadable, so it sorts first (stalest). ISO date/datetime
    strings sort lexicographically in chronological order, so no parsing needed.
    """
    snapshot_path = PUBLIC_DIR / symbol / "snapshot.json"
    if not snapshot_path.exists():
        return ""
    try:
        with open(snapshot_path, "r", encoding="utf-8") as f:
            snapshot = json.load(f)
    except (OSError, json.JSONDecodeError):
        return ""
    freshness = snapshot.get("freshness")
    if isinstance(freshness, dict):
        sections = freshness.get("sections")
        if isinstance(sections, dict) and sections.get("price"):
            return str(sections["price"])
        if freshness.get("snapshotBuiltAt"):
            return str(freshness["snapshotBuiltAt"])
    return str(snapshot.get("lastUpdated") or "")


def sort_symbols_stalest_first(symbols: list[str]) -> list[str]:
    """Order symbols by ascending prior-snapshot freshness so each budget-limited
    run advances the stalest (and never-fetched) symbols first. The fetch loop
    stops dispatching once GLOBAL_BUDGET_SECONDS is exhausted, so in fixed file
    order the tail of the list would never refresh (~24 of 151 symbols fit the
    22-minute budget); rotating the stalest to the front lets the cursor sweep
    the whole universe across successive runs. Python's sort is stable, so
    symbols with equal freshness keep their original file order.
    """
    return sorted(symbols, key=symbol_price_freshness)


def read_company_names() -> dict[str, str]:
    if not COMPANY_NAMES_FILE.exists():
        return {}

    with open(COMPANY_NAMES_FILE, "r", encoding="utf-8") as file:
        raw_data = json.load(file)

    if not isinstance(raw_data, dict):
        return {}

    normalized: dict[str, str] = {}
    for symbol, name in raw_data.items():
        if isinstance(symbol, str) and isinstance(name, str) and name.strip():
            normalized[symbol.strip().upper()] = name.strip()
    return normalized


CURATED_COMPANY_NAMES = read_company_names()


def safe_call(fn):
    """Call fn(), returning {"error": ...} on failure."""
    try:
        return fn()
    except Exception as exc:
        return {"error": str(exc)}


def df_to_json(obj) -> object:
    """Convert DataFrames / Series / nested objects to JSON-safe values."""
    if isinstance(obj, pd.DataFrame):
        return json.loads(obj.to_json(orient="records", date_format="iso"))
    if isinstance(obj, pd.Series):
        return json.loads(obj.to_json(date_format="iso"))
    if isinstance(obj, dict):
        return {k: df_to_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [df_to_json(v) for v in obj]
    if isinstance(obj, datetime):
        return obj.isoformat()
    try:
        import numpy as np  # type: ignore
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
    except ImportError:
        pass
    return obj


def write_json(path: Path, data) -> None:
    """Atomically write `data` as JSON to `path`.

    Writes to a sibling ``<path>.tmp`` first, then ``os.replace`` over the
    destination. ``os.replace`` is atomic on POSIX and (since Python 3.3)
    on Windows, so a crash mid-write can never leave a half-written file
    in place — which the previous direct-open implementation could.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    os.replace(tmp_path, path)


def pick_string(record: dict, keys: list[str]) -> str | None:
    for key in keys:
        value = record.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def resolve_company_name(
    symbol: str,
    preferred_name: str | None,
    fallback_name: str | None = None,
) -> str:
    normalized_symbol = symbol.strip().upper()
    for candidate in [preferred_name, fallback_name]:
        if (
            isinstance(candidate, str)
            and candidate.strip()
            and candidate.strip().upper() != normalized_symbol
        ):
            return candidate.strip()

    curated_name = CURATED_COMPANY_NAMES.get(normalized_symbol)
    return curated_name or normalized_symbol


def build_index_entry(symbol: str, info_payload) -> dict[str, str]:
    record = {}
    if isinstance(info_payload, list) and info_payload and isinstance(info_payload[0], dict):
        record = info_payload[0]
    elif isinstance(info_payload, dict) and "error" not in info_payload:
        record = info_payload

    short_name = resolve_company_name(symbol, pick_string(record, [
        "short_name",
        "shortName",
        "display_name",
        "displayName",
        "company_name",
        "companyName",
        "name",
        "long_name",
        "longName",
        "symbol",
    ]))
    long_name = resolve_company_name(symbol, pick_string(record, [
        "long_name",
        "longName",
        "company_name",
        "companyName",
        "display_name",
        "displayName",
        "name",
        "short_name",
        "shortName",
        "symbol",
    ]), short_name)

    search_text = " ".join([symbol, short_name, long_name]).lower()

    return {
        "symbol": symbol,
        "shortName": short_name,
        "longName": long_name,
        "searchText": search_text,
    }


def stale_entry_from_prior_snapshot(symbol: str) -> dict | None:
    """Recover an index entry from a previously-built snapshot on disk.

    When this run's fetch fails for a symbol, a good snapshot from an earlier
    run usually still sits in ``PUBLIC_DIR/<symbol>/snapshot.json`` (snapshots
    are never deleted). Rather than dropping the symbol from the index entirely
    — which makes it vanish from search *and* 404 on deep-link — we keep it
    servable by re-emitting its entry flagged ``stale`` with the date it was
    last built.

    Returns ``None`` when there is no usable prior snapshot (no file, parse
    error, or empty ``sections``), in which case the symbol stays in ``failed``.
    """
    snapshot_path = PUBLIC_DIR / symbol / "snapshot.json"
    if not snapshot_path.exists():
        return None
    try:
        with open(snapshot_path, "r", encoding="utf-8") as f:
            snapshot = json.load(f)
    except (OSError, json.JSONDecodeError):
        return None

    sections = snapshot.get("sections")
    if not isinstance(sections, dict) or not sections:
        return None

    info_payload = None
    info_path = OUTPUT_DIR / symbol / "info.json"
    if info_path.exists():
        try:
            with open(info_path, "r", encoding="utf-8") as f:
                info_payload = json.load(f)
        except (OSError, json.JSONDecodeError):
            info_payload = None

    entry = build_index_entry(symbol, info_payload)
    freshness = snapshot.get("freshness")
    as_of = freshness.get("snapshotBuiltAt") if isinstance(freshness, dict) else None
    entry["stale"] = True
    entry["asOf"] = as_of or snapshot.get("lastUpdated")
    return entry


# ---------------------------------------------------------------------------
# Fetch helpers — map real API methods to output file names
# ---------------------------------------------------------------------------
def fetch_info(t: Ticker, out: Path):
    print("  info...")
    payload = df_to_json(safe_call(lambda: t.info()))
    write_json(out / "info.json", payload)
    return payload


def fetch_officers(t: Ticker, out: Path) -> None:
    print("  officers...")
    write_json(out / "officers.json", df_to_json(safe_call(lambda: t.officers())))


def fetch_price(t: Ticker, out: Path) -> None:
    print("  price...")
    result = df_to_json(safe_call(lambda: t.price()))
    if isinstance(result, list):
        result = result[-252:]
    write_json(out / "price.json", result)


def fetch_beta(t: Ticker, out: Path) -> None:
    print("  beta...")
    write_json(out / "beta.json", df_to_json(safe_call(lambda: t.beta())))


def fetch_fundamentals(t: Ticker, out: Path) -> None:
    print("  fundamentals...")
    data = {}
    for key, fn in [
        ("ttmEps",    lambda: t.ttm_eps()),
        ("ttmPe",     lambda: t.ttm_pe()),
        ("marketCap", lambda: t.market_capitalization()),
        ("psRatio",   lambda: t.ps_ratio()),
        ("pbRatio",   lambda: t.pb_ratio()),
        ("pegRatio",  lambda: t.peg_ratio()),
    ]:
        result = safe_call(fn)
        data[key] = df_to_json(result)
    write_json(out / "fundamentals.json", data)


def fetch_profitability(t: Ticker, out: Path) -> None:
    print("  profitability...")
    data = {}
    for key, fn in [
        ("roe",              lambda: t.roe()),
        ("roa",              lambda: t.roa()),
        ("roic",             lambda: t.roic()),
        ("equityMultiplier", lambda: t.equity_multiplier()),
        ("assetTurnover",    lambda: t.asset_turnover()),
    ]:
        result = safe_call(fn)
        data[key] = df_to_json(result)
    write_json(out / "profitability.json", data)


def fetch_margins(t: Ticker, out: Path) -> None:
    print("  margins...")
    data = {}
    for key, fn in [
        ("quarterly_gross",     lambda: t.quarterly_gross_margin()),
        ("annual_gross",        lambda: t.annual_gross_margin()),
        ("quarterly_operating", lambda: t.quarterly_operating_margin()),
        ("annual_operating",    lambda: t.annual_operating_margin()),
        ("quarterly_net",       lambda: t.quarterly_net_margin()),
        ("annual_net",          lambda: t.annual_net_margin()),
        ("quarterly_ebitda",    lambda: t.quarterly_ebitda_margin()),
        ("annual_ebitda",       lambda: t.annual_ebitda_margin()),
        ("quarterly_fcf",       lambda: t.quarterly_fcf_margin()),
        ("annual_fcf",          lambda: t.annual_fcf_margin()),
    ]:
        result = safe_call(fn)
        data[key] = df_to_json(result)
    write_json(out / "margins.json", data)


def fetch_growth(t: Ticker, out: Path) -> None:
    print("  growth...")
    data = {}
    for key, fn in [
        ("quarterly_revenue",          lambda: t.quarterly_revenue_yoy_growth()),
        ("annual_revenue",             lambda: t.annual_revenue_yoy_growth()),
        ("quarterly_operating_income", lambda: t.quarterly_operating_income_yoy_growth()),
        ("annual_operating_income",    lambda: t.annual_operating_income_yoy_growth()),
        ("quarterly_ebitda",           lambda: t.quarterly_ebitda_yoy_growth()),
        ("annual_ebitda",              lambda: t.annual_ebitda_yoy_growth()),
        ("quarterly_net_income",       lambda: t.quarterly_net_income_yoy_growth()),
        ("annual_net_income",          lambda: t.annual_net_income_yoy_growth()),
        ("quarterly_fcf",              lambda: t.quarterly_fcf_yoy_growth()),
        ("annual_fcf",                 lambda: t.annual_fcf_yoy_growth()),
        ("quarterly_eps",              lambda: t.quarterly_eps_yoy_growth()),
    ]:
        result = safe_call(fn)
        data[key] = df_to_json(result)
    write_json(out / "growth.json", data)


def statement_to_json(stmt) -> object:
    if isinstance(stmt, dict):  # error case
        return stmt
    try:
        return df_to_json(stmt.df())
    except Exception as exc:
        return {"error": str(exc)}


def fetch_statements(t: Ticker, out: Path) -> None:
    print("  income_statement...")
    write_json(out / "income_statement.json", {
        "quarterly": statement_to_json(safe_call(lambda: t.quarterly_income_statement())),
        "annual":    statement_to_json(safe_call(lambda: t.annual_income_statement())),
    })
    print("  balance_sheet...")
    write_json(out / "balance_sheet.json", {
        "quarterly": statement_to_json(safe_call(lambda: t.quarterly_balance_sheet())),
        "annual":    statement_to_json(safe_call(lambda: t.annual_balance_sheet())),
    })
    print("  cash_flow...")
    write_json(out / "cash_flow.json", {
        "quarterly": statement_to_json(safe_call(lambda: t.quarterly_cash_flow())),
        "annual":    statement_to_json(safe_call(lambda: t.annual_cash_flow())),
    })


def fetch_wacc(t: Ticker, out: Path) -> None:
    print("  wacc...")
    write_json(out / "wacc.json", df_to_json(safe_call(lambda: t.wacc())))


def fetch_dcf(t: Ticker, out: Path) -> None:
    print("  dcf...")
    write_json(out / "dcf.json", df_to_json(safe_call(lambda: t.dcf())))


def fetch_industry(t: Ticker, out: Path) -> None:
    print("  industry...")
    data = {}
    for key, fn in [
        ("ttm_pe",            lambda: t.industry_ttm_pe()),
        ("ps_ratio",          lambda: t.industry_ps_ratio()),
        ("pb_ratio",          lambda: t.industry_pb_ratio()),
        ("roe",               lambda: t.industry_roe()),
        ("roa",               lambda: t.industry_roa()),
        ("equity_multiplier", lambda: t.industry_equity_multiplier()),
        ("gross_margin",      lambda: t.industry_quarterly_gross_margin()),
        ("ebitda_margin",     lambda: t.industry_quarterly_ebitda_margin()),
        ("net_margin",        lambda: t.industry_quarterly_net_margin()),
        ("asset_turnover",    lambda: t.industry_asset_turnover()),
    ]:
        result = safe_call(fn)
        if isinstance(result, dict) and "error" in result:
            data[key] = []  # skip broken fields; don't write error objects to disk
        else:
            data[key] = df_to_json(result)
    write_json(out / "industry.json", data)


def fetch_revenue_segments(t: Ticker, out: Path) -> None:
    print("  revenue_segments...")
    data = {}
    for key, fn in [
        ("by_segment",   lambda: t.revenue_by_segment()),
        ("by_geography", lambda: t.revenue_by_geography()),
        ("by_product",   lambda: t.revenue_by_product()),
    ]:
        result = safe_call(fn)
        data[key] = df_to_json(result)
    write_json(out / "revenue_segments.json", data)


def fetch_news(t: Ticker, out: Path) -> None:
    print("  news...")
    result = safe_call(lambda: t.news())
    if isinstance(result, dict):
        write_json(out / "news.json", result)
        return
    news_list = safe_call(lambda: result.get_news_list())
    serialized = df_to_json(news_list)
    if isinstance(serialized, list):
        serialized = serialized[:10]
    write_json(out / "news.json", serialized)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def fetch_symbol(symbol: str, out_dir: Path) -> dict[str, str]:
    t = Ticker(symbol)
    info_payload = fetch_info(t, out_dir)
    fetch_officers(t, out_dir)
    fetch_price(t, out_dir)
    fetch_beta(t, out_dir)
    fetch_fundamentals(t, out_dir)
    fetch_profitability(t, out_dir)
    fetch_margins(t, out_dir)
    fetch_growth(t, out_dir)
    fetch_statements(t, out_dir)
    fetch_wacc(t, out_dir)
    fetch_dcf(t, out_dir)
    fetch_industry(t, out_dir)
    fetch_revenue_segments(t, out_dir)
    fetch_news(t, out_dir)
    return build_index_entry(symbol, info_payload)


# ---------------------------------------------------------------------------
# Watchdogs
# ---------------------------------------------------------------------------
# Per-symbol timeout: defeatbeta-api occasionally hangs on a single ticker
# (the lazy-warmup of its DuckDB/parquet cache has been observed at 15+ min
# for the very first call on a fresh runner). Without a per-symbol cap, one
# bad ticker can eat the entire CI budget. SIGALRM-based; Linux/macOS only,
# which matches our runtime targets.
#
# Global budget: a soft cap that stops dispatching new symbols once we're
# close to the CI hard timeout. Anything not reached gets recorded as failed
# with a clear reason, so downstream verification can catch a partial run.
PER_SYMBOL_TIMEOUT_SECONDS = int(os.environ.get("PER_SYMBOL_TIMEOUT_SECONDS", "600"))
_global_budget_env = os.environ.get("GLOBAL_BUDGET_SECONDS", "").strip()
GLOBAL_BUDGET_SECONDS: int | None = int(_global_budget_env) if _global_budget_env else None


class SymbolTimeout(Exception):
    """Raised when an individual symbol exceeds PER_SYMBOL_TIMEOUT_SECONDS."""


def _alarm_handler(signum, frame):  # noqa: ARG001 — signal handler signature
    raise SymbolTimeout(f"per-symbol timeout after {PER_SYMBOL_TIMEOUT_SECONDS}s")


def main() -> None:
    symbols = sort_symbols_stalest_first(read_symbols())
    print(f"Processing {len(symbols)} symbols (stalest first): {', '.join(symbols)}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Per-symbol timeout: {PER_SYMBOL_TIMEOUT_SECONDS}s")
    if GLOBAL_BUDGET_SECONDS:
        print(f"Global budget:      {GLOBAL_BUDGET_SECONDS}s")
    print()

    successful: list[str] = []
    failed: list[dict[str, str]] = []
    entries: list[dict[str, str]] = []

    signal.signal(signal.SIGALRM, _alarm_handler)
    start = time.monotonic()

    for symbol in symbols:
        elapsed = time.monotonic() - start
        if GLOBAL_BUDGET_SECONDS and elapsed >= GLOBAL_BUDGET_SECONDS:
            reason = f"global time budget exhausted at {elapsed:.0f}s"
            print(f"[{symbol}] SKIPPED: {reason}")
            failed.append({"symbol": symbol, "reason": reason})
            continue

        print(f"[{symbol}] Starting...")
        out_dir = OUTPUT_DIR / symbol
        signal.alarm(PER_SYMBOL_TIMEOUT_SECONDS)
        try:
            index_entry = fetch_symbol(symbol, out_dir)
            successful.append(symbol)
            entries.append(index_entry)
            print(f"[{symbol}] Done.\n")
        except SymbolTimeout as exc:
            failed.append({"symbol": symbol, "reason": str(exc)})
            print(f"[{symbol}] TIMEOUT: {exc}\n")
            write_json(out_dir / "error.json", {"symbol": symbol, "error": str(exc)})
        except Exception as exc:
            failed.append({"symbol": symbol, "reason": str(exc)})
            print(f"[{symbol}] FAILED: {exc}\n")
            write_json(out_dir / "error.json", {"symbol": symbol, "error": str(exc)})
        finally:
            signal.alarm(0)

    # Resilience: before declaring a symbol unavailable, fall back to any good
    # snapshot already on disk from an earlier run (mirrors the "keep previous
    # snapshot on failed fetch" pattern used by the other dashboards). Recovered
    # symbols re-enter `symbols`/`entries` flagged stale, so they stay
    # searchable and servable rather than disappearing on a partial run.
    fresh_symbols = list(successful)
    available_symbols = list(successful)
    still_failed: list[dict[str, str]] = []
    recovered: list[str] = []
    for item in failed:
        symbol = item["symbol"]
        stale_entry = stale_entry_from_prior_snapshot(symbol)
        if stale_entry is not None:
            available_symbols.append(symbol)
            entries.append(stale_entry)
            recovered.append(symbol)
        else:
            still_failed.append(item)
    failed = still_failed
    failed_symbols = [item["symbol"] for item in failed]

    if recovered:
        print(
            f"Recovered {len(recovered)} symbol(s) from prior snapshots "
            f"(served stale): {', '.join(recovered)}"
        )

    attempted_at = datetime.now(timezone.utc).isoformat()
    previous_last_updated = None
    previous_index_path = PUBLIC_DIR / "index.json"
    if previous_index_path.exists():
        try:
            with open(previous_index_path, "r", encoding="utf-8") as f:
                previous_index = json.load(f)
            previous_last_updated = previous_index.get("lastUpdated")
        except (OSError, json.JSONDecodeError):
            previous_last_updated = None

    index_data = {
        "symbols": available_symbols,
        "failed": failed_symbols,
        # `lastUpdated` advances only when this run fetched at least one symbol.
        # `refreshAttemptedAt` records every attempt, including a total outage.
        "lastUpdated": attempted_at if fresh_symbols else previous_last_updated or attempted_at,
        "refreshAttemptedAt": attempted_at,
        "freshCount": len(fresh_symbols),
        "staleCount": len(recovered),
        "entries": entries,
    }
    write_json(PUBLIC_DIR / "index.json", index_data)

    print("=" * 60)
    print(f"Done. {len(available_symbols)}/{len(symbols)} symbols available.")
    print(f"  Fresh this run: {len(fresh_symbols)}")
    print(f"  Served stale:   {len(recovered)}")
    if fresh_symbols:
        print(f"  Refreshed: {', '.join(fresh_symbols)}")
    if failed:
        print("  Failed:")
        for item in failed:
            print(f"    {item['symbol']}: {item['reason']}")


if __name__ == "__main__":
    main()
