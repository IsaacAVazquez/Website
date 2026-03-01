#!/usr/bin/env python3
"""
Investment data pipeline using defeatbeta-api.
Reads symbols from scripts/investments_symbols.txt, fetches financial data,
and writes per-ticker JSON files to public/data/investments/{SYMBOL}/.

Usage:
    python3 scripts/fetch_investments_data.py

Requirements:
    pip install defeatbeta-api
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Attempt to import defeatbeta-api; fail gracefully with clear instructions
# ---------------------------------------------------------------------------
try:
    from defeatbeta import Ticker  # type: ignore
except ImportError:
    print("Error: defeatbeta-api is not installed.")
    print("Install it with:  pip install defeatbeta-api")
    sys.exit(1)


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
    """Read symbols from the symbols file, one per line."""
    if not SYMBOLS_FILE.exists():
        print(f"Error: symbols file not found at {SYMBOLS_FILE}")
        sys.exit(1)
    lines = SYMBOLS_FILE.read_text().strip().splitlines()
    return [line.strip().upper() for line in lines if line.strip() and not line.startswith("#")]


def safe_call(fn, *args, **kwargs):
    """Call fn(*args, **kwargs), returning None and printing a warning on error."""
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        return {"error": str(exc)}


def serialize(obj):
    """
    JSON-serialize obj, handling DataFrames, Series, numpy types, and datetimes.
    Returns a JSON-safe object (dict / list / scalar).
    """
    # pandas DataFrame → list of row dicts
    try:
        import pandas as pd  # type: ignore
        if isinstance(obj, pd.DataFrame):
            return json.loads(obj.to_json(orient="records", date_format="iso"))
        if isinstance(obj, pd.Series):
            return json.loads(obj.to_json(date_format="iso"))
    except ImportError:
        pass

    # numpy scalars
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

    # datetime
    if isinstance(obj, datetime):
        return obj.isoformat()

    # dict / list recursion
    if isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serialize(v) for v in obj]

    return obj


def write_json(path: Path, data) -> None:
    """Write data to path as pretty-printed JSON."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)


# ---------------------------------------------------------------------------
# Per-section fetchers
# ---------------------------------------------------------------------------
def fetch_sections(ticker: "Ticker", symbol: str, out_dir: Path) -> None:
    """Fetch all data sections for a single ticker and write JSON files."""
    print(f"  Fetching price history...")
    write_json(out_dir / "price.json", serialize(safe_call(ticker.price, period="2y", interval="1d")))

    print(f"  Fetching fundamentals...")
    write_json(out_dir / "fundamentals.json", serialize(safe_call(ticker.fundamentals)))

    print(f"  Fetching profitability...")
    write_json(out_dir / "profitability.json", serialize(safe_call(ticker.profitability)))

    print(f"  Fetching margins...")
    write_json(out_dir / "margins.json", serialize(safe_call(ticker.margins)))

    print(f"  Fetching growth...")
    write_json(out_dir / "growth.json", serialize(safe_call(ticker.growth)))

    print(f"  Fetching income statement...")
    write_json(out_dir / "income_statement.json", serialize(safe_call(ticker.income_statement)))

    print(f"  Fetching balance sheet...")
    write_json(out_dir / "balance_sheet.json", serialize(safe_call(ticker.balance_sheet)))

    print(f"  Fetching cash flow...")
    write_json(out_dir / "cash_flow.json", serialize(safe_call(ticker.cash_flow)))

    print(f"  Fetching WACC...")
    write_json(out_dir / "wacc.json", serialize(safe_call(ticker.wacc)))

    print(f"  Fetching industry comparisons...")
    write_json(out_dir / "industry.json", serialize(safe_call(ticker.industry)))

    print(f"  Fetching revenue segments...")
    write_json(out_dir / "revenue_segments.json", serialize(safe_call(ticker.revenue_segments)))

    print(f"  Fetching beta...")
    write_json(out_dir / "beta.json", serialize(safe_call(ticker.beta)))

    print(f"  Fetching transcripts list...")
    transcripts_data = safe_call(ticker.transcripts)
    write_json(out_dir / "transcripts.json", serialize(transcripts_data))

    print(f"  Fetching news...")
    write_json(out_dir / "news.json", serialize(safe_call(ticker.news)))

    print(f"  Fetching DCF...")
    write_json(out_dir / "dcf.json", serialize(safe_call(ticker.dcf)))

    print(f"  Fetching company info...")
    write_json(out_dir / "info.json", serialize(safe_call(ticker.info)))

    print(f"  Fetching officers...")
    write_json(out_dir / "officers.json", serialize(safe_call(ticker.officers)))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    symbols = read_symbols()
    print(f"Processing {len(symbols)} symbols: {', '.join(symbols)}")
    print(f"Output directory: {OUTPUT_DIR}")

    successful: list[str] = []
    failed: list[str] = []

    for symbol in symbols:
        print(f"\n[{symbol}] Starting...")
        out_dir = OUTPUT_DIR / symbol
        try:
            ticker = Ticker(symbol)
            fetch_sections(ticker, symbol, out_dir)
            successful.append(symbol)
            print(f"[{symbol}] Done.")
        except Exception as exc:
            failed.append(symbol)
            print(f"[{symbol}] FAILED: {exc}")
            # Write an error marker so the UI knows this symbol had issues
            write_json(out_dir / "error.json", {"symbol": symbol, "error": str(exc)})

    # Write index file
    index_data = {
        "symbols": successful,
        "failed": failed,
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
    }
    write_json(OUTPUT_DIR / "index.json", index_data)

    print(f"\n{'='*60}")
    print(f"Done. {len(successful)}/{len(symbols)} symbols processed.")
    if successful:
        print(f"  Success: {', '.join(successful)}")
    if failed:
        print(f"  Failed:  {', '.join(failed)}")
    print(f"  Index written to {OUTPUT_DIR / 'index.json'}")


if __name__ == "__main__":
    main()
