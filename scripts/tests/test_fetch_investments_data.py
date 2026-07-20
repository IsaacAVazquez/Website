import unittest
import sys
import types
from datetime import datetime, timedelta, timezone
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


class FetchInvestmentsDataTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
