#!/usr/bin/env python3
"""
Investment data pipeline using defeatbeta-api.
Reads symbols from scripts/investments_symbols.txt, fetches financial data,
and writes raw per-ticker JSON files to public/data/investments/{SYMBOL}/
before the snapshot builder compacts them into snapshot.json artifacts.

Usage:
    .venv/bin/python3 scripts/fetch_investments_data.py
    (or: npm run update:investments, which also builds curated snapshots)

Requirements:
    .venv/bin/pip install defeatbeta-api
"""

import json
import sys
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
OUTPUT_DIR = PROJECT_ROOT / "public" / "data" / "investments"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def read_symbols() -> list[str]:
    if not SYMBOLS_FILE.exists():
        print(f"Error: symbols file not found at {SYMBOLS_FILE}")
        sys.exit(1)
    lines = SYMBOLS_FILE.read_text().strip().splitlines()
    return [line.strip().upper() for line in lines if line.strip() and not line.startswith("#")]


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
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)


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


def main() -> None:
    symbols = read_symbols()
    print(f"Processing {len(symbols)} symbols: {', '.join(symbols)}")
    print(f"Output directory: {OUTPUT_DIR}\n")

    successful: list[str] = []
    failed: list[str] = []
    entries: list[dict[str, str]] = []

    for symbol in symbols:
        print(f"[{symbol}] Starting...")
        out_dir = OUTPUT_DIR / symbol
        try:
            index_entry = fetch_symbol(symbol, out_dir)
            successful.append(symbol)
            entries.append(index_entry)
            print(f"[{symbol}] Done.\n")
        except Exception as exc:
            failed.append(symbol)
            print(f"[{symbol}] FAILED: {exc}\n")
            write_json(out_dir / "error.json", {"symbol": symbol, "error": str(exc)})

    index_data = {
        "symbols": successful,
        "failed": failed,
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "entries": entries,
    }
    write_json(OUTPUT_DIR / "index.json", index_data)

    print("=" * 60)
    print(f"Done. {len(successful)}/{len(symbols)} symbols processed.")
    if successful:
        print(f"  Success: {', '.join(successful)}")
    if failed:
        print(f"  Failed:  {', '.join(failed)}")


if __name__ == "__main__":
    main()
