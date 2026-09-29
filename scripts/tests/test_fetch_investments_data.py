import json
import signal
import tempfile
import unittest
import sys
import types
from contextlib import ExitStack
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

# Importing defeatbeta-api performs a network call in its package initializer.
# The watchdog helpers under test do not need a provider, so install the
# smallest compatible module stub before importing the pipeline.
ticker_module = types.ModuleType("defeatbeta_api.data.ticker")
ticker_module.Ticker = object
sys.modules["defeatbeta_api"] = types.ModuleType("defeatbeta_api")
sys.modules["defeatbeta_api.data"] = types.ModuleType("defeatbeta_api.data")
sys.modules["defeatbeta_api.data.ticker"] = ticker_module

from scripts import fetch_investments_data as pipeline


def alarm():
    pipeline._alarm_handler(signal.SIGALRM, None)


def rewrapped_like_the_library(fn):
    # defeatbeta-api's query() catches everything and raises a plain Exception.
    def query():
        try:
            return fn()
        except Exception as exc:
            raise Exception(f"Query failed: {exc}")

    return query


class FetchInvestmentsDataTests(unittest.TestCase):
    def setUp(self):
        pipeline._symbol_timed_out = False
        getattr(pipeline, "_industry_cache", {}).clear()
        getattr(pipeline, "_slow_industries", set()).clear()

    def test_a_timeout_the_library_rewraps_still_stops_the_symbol(self):
        with self.assertRaisesRegex(pipeline.SymbolTimeout, "time budget exhausted"):
            pipeline.safe_call(rewrapped_like_the_library(alarm))

    def test_a_rewrapped_timeout_during_statement_conversion_stops_the_symbol(self):
        class Statement:
            df = staticmethod(rewrapped_like_the_library(alarm))

        with self.assertRaises(pipeline.SymbolTimeout):
            pipeline.statement_to_json(Statement())

    def test_a_rewrapped_timeout_in_an_industry_field_is_not_written_as_empty(self):
        class TimedOutTicker:
            def __getattr__(self, name):
                return rewrapped_like_the_library(alarm)

        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(pipeline.SymbolTimeout):
                pipeline.fetch_industry(TimedOutTicker(), Path(tmp))
            self.assertFalse((Path(tmp) / "industry.json").exists())

    def test_a_timed_out_symbol_does_not_stop_the_next_one(self):
        def fetch_symbol(symbol, out_dir):
            if symbol == "SLOW":
                pipeline.safe_call(rewrapped_like_the_library(alarm))
            pipeline.safe_call(lambda: None)
            return {"symbol": symbol, "priceAsOf": "2026-09-25"}

        with tempfile.TemporaryDirectory() as tmp:
            public = Path(tmp) / "public"
            pipeline.write_json(
                public / "index.json",
                {"fetchAttempts": {"GONE": "2026-07-01T00:00:00+00:00"}},
            )
            with (
                patch.object(pipeline, "OUTPUT_DIR", Path(tmp) / "raw"),
                patch.object(pipeline, "PUBLIC_DIR", public),
                patch.object(pipeline, "read_symbols", return_value=["SLOW", "NEXT"]),
                patch.object(pipeline, "fetch_symbol", fetch_symbol),
                patch.object(
                    pipeline,
                    "write_bulk_prices",
                    side_effect=Exception("Query failed: 503"),
                    create=True,
                ),
            ):
                pipeline.main()
            index = json.loads((public / "index.json").read_text())

        # The bulk query failed, so the per symbol path carried the run.
        self.assertEqual(index["symbols"], ["NEXT"])
        self.assertEqual(index["failed"], ["SLOW"])
        # A ticker that left the universe leaves the attempt ledger with it.
        self.assertNotIn("GONE", index["fetchAttempts"])

    def test_bulk_price_writes_the_last_252_rows_of_each_symbol(self):
        import pandas as pd

        days = pd.bdate_range(end="2026-09-25", periods=260).strftime("%Y-%m-%d")
        frame = pd.DataFrame(
            [
                {
                    "symbol": symbol,
                    "report_date": day,
                    "open": 10.0,
                    "close": 10.5,
                    "high": 11.0,
                    "low": 9.5,
                    "volume": 1000,
                }
                for symbol, symbol_days in (("AAA", days), ("BBB", days[-3:]))
                for day in symbol_days
            ]
        )
        queries = []

        class FakeTicker:
            def __init__(self, symbol):
                self.huggingface_client = types.SimpleNamespace(
                    get_url_path=lambda table: f"https://example.test/{table}.parquet"
                )
                self.duckdb_client = types.SimpleNamespace(
                    query=lambda sql: (queries.append(sql), frame)[1]
                )

        with (
            tempfile.TemporaryDirectory() as tmp,
            patch.object(pipeline, "Ticker", FakeTicker),
            patch.object(pipeline, "OUTPUT_DIR", Path(tmp)),
        ):
            written = pipeline.write_bulk_prices(["AAA", "BBB", "CCC"])
            rows = json.loads((Path(tmp) / "AAA" / "bulk_price.json").read_text())
            # The file name is the mark. price.json stays a full refresh's file.
            self.assertFalse((Path(tmp) / "AAA" / "price.json").exists())
            self.assertEqual(
                len(json.loads((Path(tmp) / "BBB" / "bulk_price.json").read_text())), 3
            )
            self.assertFalse((Path(tmp) / "CCC").exists())

        self.assertEqual(written, 2)
        self.assertEqual(len(queries), 1)
        self.assertIn("stock_prices.parquet", queries[0])
        self.assertIn("'AAA', 'BBB', 'CCC'", queries[0])
        self.assertEqual(len(rows), 252)
        self.assertEqual(rows[-1]["report_date"], "2026-09-25")
        self.assertEqual(
            set(rows[0]),
            {"symbol", "report_date", "open", "close", "high", "low", "volume"},
        )

    def test_an_industry_is_fetched_once_per_run(self):
        calls = []

        class CountingTicker:
            def __getattr__(self, name):
                def field():
                    calls.append(name)
                    return [{"report_date": "2026-06-30", "industry": "Banks"}]

                return field

        with tempfile.TemporaryDirectory() as tmp:
            first, second = Path(tmp) / "JPM", Path(tmp) / "BAC"
            pipeline.fetch_industry(CountingTicker(), first, "Banks")
            self.assertEqual(len(calls), 10)
            pipeline.fetch_industry(CountingTicker(), second, "Banks")
            self.assertEqual(len(calls), 10)
            self.assertEqual(
                json.loads((first / "industry.json").read_text()),
                json.loads((second / "industry.json").read_text()),
            )

    def test_a_partial_industry_result_is_not_shared(self):
        class FlakyTicker:
            def __getattr__(self, name):
                def field():
                    if name == "industry_roe":
                        raise Exception("Query failed: 503")
                    return [{"report_date": "2026-06-30", "industry": "Banks"}]

                return field

        with tempfile.TemporaryDirectory() as tmp:
            pipeline.fetch_industry(FlakyTicker(), Path(tmp), "Banks")

        self.assertNotIn("Banks", pipeline._industry_cache)

    def test_an_industry_timeout_keeps_the_symbol_and_skips_the_industry(self):
        # The 2026-09-29 run: PNC and USB both timed out inside the industry
        # section, and the timeout threw away every section they had fetched.
        class SlowIndustryTicker:
            def __init__(self, symbol=None):
                pass

            def __getattr__(self, name):
                return rewrapped_like_the_library(alarm)

        calls = []

        class CountingTicker:
            def __getattr__(self, name):
                calls.append(name)
                return lambda: []

        other_sections = [
            "fetch_officers",
            "fetch_beta",
            "fetch_fundamentals",
            "fetch_profitability",
            "fetch_margins",
            "fetch_growth",
            "fetch_statements",
            "fetch_wacc",
            "fetch_news",
        ]
        with tempfile.TemporaryDirectory() as tmp, ExitStack() as stack:
            for name in other_sections:
                stack.enter_context(patch.object(pipeline, name))
            stack.enter_context(patch.object(pipeline, "Ticker", SlowIndustryTicker))
            stack.enter_context(
                patch.object(
                    pipeline,
                    "fetch_info",
                    return_value=[{"symbol": "PNC", "industry": "Banks - Regional"}],
                )
            )
            stack.enter_context(patch.object(pipeline, "fetch_price", return_value=[]))
            stack.enter_context(
                patch.object(
                    pipeline, "validate_price_freshness", return_value="2026-09-28"
                )
            )
            first, second = Path(tmp) / "PNC", Path(tmp) / "USB"

            entry = pipeline.fetch_symbol("PNC", first)
            written = json.loads((first / "industry.json").read_text())
            pipeline.fetch_industry(CountingTicker(), second, "Banks - Regional")
            skipped = json.loads((second / "industry.json").read_text())

        self.assertEqual(entry["priceAsOf"], "2026-09-28")
        self.assertFalse(pipeline._symbol_timed_out)
        # Every field is present and empty, which is the shape the snapshot
        # builder reads as "carry the prior industry section forward".
        self.assertEqual(set(written), set(pipeline.INDUSTRY_FIELDS))
        self.assertFalse(any(written.values()))
        # The next symbol in the industry does not wait on it again.
        self.assertEqual(calls, [])
        self.assertEqual(skipped, written)

    def test_safe_call_does_not_swallow_symbol_timeout(self):
        def timeout():
            raise pipeline.SymbolTimeout("watchdog fired")

        with self.assertRaisesRegex(pipeline.SymbolTimeout, "watchdog fired"):
            pipeline.safe_call(timeout)

    def test_statement_conversion_does_not_swallow_symbol_timeout(self):
        class TimedOutStatement:
            def df(self):
                raise pipeline.SymbolTimeout("watchdog fired during dataframe conversion")

        with self.assertRaisesRegex(
            pipeline.SymbolTimeout,
            "watchdog fired during dataframe conversion",
        ):
            pipeline.statement_to_json(TimedOutStatement())

    def test_symbol_timeout_is_capped_by_remaining_global_budget(self):
        with (
            patch.object(pipeline, "PER_SYMBOL_TIMEOUT_SECONDS", 600),
            patch.object(pipeline, "RETRY_FAILED_SYMBOL_TIMEOUT_SECONDS", 120),
            patch.object(pipeline, "GLOBAL_BUDGET_SECONDS", 1320),
        ):
            self.assertEqual(pipeline.symbol_timeout_seconds(100), 600)
            self.assertEqual(
                pipeline.symbol_timeout_seconds(100, retrying_failed_symbol=True),
                120,
            )
            self.assertEqual(pipeline.symbol_timeout_seconds(1300), 20)
            self.assertEqual(pipeline.symbol_timeout_seconds(1321), 0)

    def test_attempt_ledger_rotates_unattempted_symbols_ahead_of_failures(self):
        symbols = ["AAPL", "MSFT", "NVDA"]
        attempts = {
            "AAPL": "2026-07-12T10:00:00+00:00",
            "MSFT": "2026-07-01T10:00:00+00:00",
        }

        self.assertEqual(
            pipeline.sort_symbols_stalest_first(symbols, attempts),
            ["NVDA", "MSFT", "AAPL"],
        )

    def test_stale_price_payload_is_rejected_before_promotion(self):
        stale_date = (
            datetime.now(timezone.utc).date()
            - timedelta(days=pipeline.MAX_PRICE_AGE_DAYS + 1)
        ).isoformat()

        with self.assertRaisesRegex(ValueError, "price history is stale"):
            pipeline.validate_price_freshness(
                "TEST",
                [{"report_date": stale_date, "close": 100}],
            )

    def test_provider_error_is_named_instead_of_read_as_a_missing_date(self):
        # The 2026-09-16 outage: the dataset moved, every price call 404'd, and
        # the run reported only "no valid source date".
        with self.assertRaisesRegex(ValueError, "price fetch failed: .*404"):
            pipeline.validate_price_freshness(
                "TEST",
                {"error": "HTTP Error: Unable to connect to URL: 404 (Not Found)."},
            )

    def test_a_run_of_identical_failures_reads_as_systemic(self):
        def failures(count, reason="price fetch failed: 404"):
            return [{"symbol": f"S{i}", "reason": reason} for i in range(count)]

        limit = pipeline.MAX_IDENTICAL_LEADING_FAILURES
        self.assertTrue(pipeline.is_systemic_failure(failures(limit)))
        self.assertFalse(pipeline.is_systemic_failure(failures(limit - 1)))
        # A reason that only differs by the symbol it names is the same failure.
        named = [
            {"symbol": f"S{i}", "reason": f"no data for S{i}"} for i in range(limit)
        ]
        self.assertTrue(pipeline.is_systemic_failure(named))
        # Symbol-specific trouble at the head of the list is not an outage.
        mixed = failures(limit - 1) + [{"symbol": "X", "reason": "price history is stale"}]
        self.assertFalse(pipeline.is_systemic_failure(mixed))


if __name__ == "__main__":
    unittest.main()
