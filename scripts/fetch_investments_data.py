#!/usr/bin/env python3
"""
Investment data pipeline using defeatbeta-api.
Reads symbols from scripts/investments_symbols.txt, fetches financial data,
and writes per-ticker JSON files to public/data/investments/{SYMBOL}/.

Usage:
    .venv/bin/python3 scripts/fetch_investments_data.py
    (or: npm run update:investments)

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

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
SYMBOLS_FILE = SCRIPT_DIR / "investments_symbols.txt"
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


# ---------------------------------------------------------------------------
# Fetch helpers — map real API methods to output file names
# ---------------------------------------------------------------------------
def fetch_info(t: Ticker, out: Path) -> None:
    print("  info...")
    write_json(out / "info.json", df_to_json(safe_call(lambda: t.info())))


def fetch_officers(t: Ticker, out: Path) -> None:
    print("  officers...")
    write_json(out / "officers.json", df_to_json(safe_call(lambda: t.officers())))


def fetch_price(t: Ticker, out: Path) -> None:
    print("  price...")
    write_json(out / "price.json", df_to_json(safe_call(lambda: t.price())))


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
    write_json(out / "news.json", df_to_json(news_list))


def fetch_transcripts(t: Ticker, out: Path) -> None:
    print("  transcripts...")
    result = safe_call(lambda: t.earning_call_transcripts())
    if isinstance(result, dict):
        write_json(out / "transcripts.json", result)
        return

    transcript_list = safe_call(lambda: result.get_transcripts_list())
    write_json(out / "transcripts.json", df_to_json(transcript_list))

    # Fetch individual transcripts (up to 4 most recent)
    if isinstance(transcript_list, pd.DataFrame):
        for _, row in transcript_list.head(4).iterrows():
            fy = int(row.get("fiscal_year", row.get("fiscalYear", 0)))
            fq = int(row.get("fiscal_quarter", row.get("fiscalQuarter", 0)))
            if fy and fq:
                print(f"    transcript {fy} Q{fq}...")
                content = safe_call(lambda: result.get_transcript(fy, fq))
                write_json(out / f"transcript_{fy}_{fq}.json", df_to_json(content))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def fetch_symbol(symbol: str, out_dir: Path) -> None:
    t = Ticker(symbol)
    fetch_info(t, out_dir)
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
    fetch_transcripts(t, out_dir)


def main() -> None:
    symbols = read_symbols()
    print(f"Processing {len(symbols)} symbols: {', '.join(symbols)}")
    print(f"Output directory: {OUTPUT_DIR}\n")

    successful: list[str] = []
    failed: list[str] = []

    for symbol in symbols:
        print(f"[{symbol}] Starting...")
        out_dir = OUTPUT_DIR / symbol
        try:
            fetch_symbol(symbol, out_dir)
            successful.append(symbol)
            print(f"[{symbol}] Done.\n")
        except Exception as exc:
            failed.append(symbol)
            print(f"[{symbol}] FAILED: {exc}\n")
            write_json(out_dir / "error.json", {"symbol": symbol, "error": str(exc)})

    index_data = {
        "symbols": successful,
        "failed": failed,
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
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
