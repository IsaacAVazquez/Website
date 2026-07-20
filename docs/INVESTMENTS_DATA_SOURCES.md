# Investments Data Sources

**Last updated:** 2026-07-12

This is the source, provenance, and public-display ledger for `/investments`.
Code licensing and market-data display rights are separate questions. A package
being open source does not grant redistribution rights for the data it fetches.

## Current production sources

| Data | Current source | Runtime | Retention | Public-display status | Decision |
| --- | --- | --- | --- | --- | --- |
| Company profiles, statements, ratios, history, beta, and news | `defeatbeta-api==0.0.47`; its published dataset card lists Yahoo Finance, Nasdaq, Treasury, YCharts, StockAnalysis, and other public endpoints | Snapshot build only | Compact snapshots are committed; raw responses are builder inputs | Not yet verified for every upstream source | Temporary. Reject delayed prices, preserve source dates, and replace fundamentals with SEC data plus a licensed market feed. |
| Market quotes | Finnhub quote API | Request time through `/api/investments/quotes` | 30-second server cache and short browser cache | Written public-display approval has not been recorded | Temporary. Preserve provider trade time and do not describe API response time as market freshness. |
| Filings | SEC EDGAR links only | User follows an external link | None | SEC public data, subject to fair-access policy | Expand into the primary statements and filing-provenance source. |
| User holdings | Browser `localStorage` | Client only | User-controlled browser storage | Symbols are sent to the quote endpoint and Finnhub; shares, cost basis, notes, and portfolio history stay local | Keep portfolio details local unless a deliberate account/sync product decision changes the privacy model. |

**Release gate:** Finnhub's published self-serve market-data plans are labeled
for personal use. Written permission for public quote display or redistribution
has not been recorded for this site. Obtain that permission or switch to a
vendor agreement that explicitly permits public display before treating runtime
quotes as production-cleared data.

Current references:

- DefeatBeta code and source inventory: <https://github.com/defeat-beta/defeatbeta-api> and <https://huggingface.co/datasets/defeatbeta/yahoo-finance-data>
- Finnhub documentation, pricing, and terms entry points: <https://finnhub.io/docs/api>, <https://finnhub.io/pricing-stock-api-market-data>, and <https://finnhub.io/register>
- SEC EDGAR APIs, ticker-to-CIK mapping, and fair access: <https://www.sec.gov/search-filings/edgar-application-programming-interfaces>, <https://www.sec.gov/file/company-tickers>, and <https://www.sec.gov/about/developer-resources>

## Current quality baseline

The snapshot assessed on 2026-07-10 covers 151 securities. All 151 have a
dated price, but only 28 are within the seven-day recency target; 123 are
explicitly marked delayed. The oldest preserved price is from 2026-02-20. This
is now visible in the index and interface instead of being counted as fresh.

The quote endpoint has request, symbol, concurrency, and deadline limits, but
its cache and provider budget are process-local. A multi-instance deployment
still needs a shared cache and distributed provider quota before quote traffic
can scale safely.

## Target architecture

Use SEC EDGAR submissions and Company Facts as the primary source for filed
fundamentals. Preserve CIK, accession number, form, filed and accepted time,
taxonomy, unit, fiscal period, and amendment status with each normalized fact.
SEC does not provide market quotes, so price history, corporate actions, and
quotes still need a vendor whose agreement explicitly covers this public site.

For a lower-cost public-display feed, Tiingo publishes startup pricing for EOD
and IEX display redistribution. IEX is a single venue, so the UI must identify
it as IEX rather than consolidated US market data. For consolidated SIP data,
Massive is the stronger technical fit, but its individual plans cannot power an
app used by other people and require a business agreement.

- Tiingo EOD, IEX, and pricing: <https://www.tiingo.com/products/end-of-day-stock-price-data>, <https://www.tiingo.com/products/iex-api>, <https://www.tiingo.com/about/pricing>
- Massive stock coverage and terms: <https://massive.com/docs/rest/stocks>, <https://massive.com/legal/individuals-terms-of-service>, <https://massive.com/legal/businesses-terms-of-service>

## Expansion gate

Do not add more symbols to the current all-sections-per-symbol job. The existing
151-symbol universe already exceeds the twice-weekly time budget, and expanding
it would make the oldest data older. Expansion should follow a split pipeline:

1. active-security reference data daily;
2. licensed quotes at request time with provider timestamps;
3. adjusted EOD history and corporate actions nightly;
4. SEC fundamentals when a new filing arrives;
5. optional profiles and news on a slower cadence.

Keep common stock, ADRs, ETFs, and benchmarks as explicit asset types. SPY is a
benchmark and must not advertise company-only capabilities such as margins,
ROIC, or DCF. Store stable identifiers such as CIK and, where licensed, FIGI so
ticker changes and provider aliases do not create new company histories.

## Migration quality gates

These are requirements for the target SEC plus licensed-market-data pipeline.
The current implementation has source-date, finite-value, OHLC, provider
timestamp, and field-level fallback retention checks. The fuller
corporate-action, per-field provenance, and trading-calendar gates below must
land before the source migration is considered complete.

- Separate `sourceAsOf` from `snapshotBuiltAt` for every section.
- Require active-equity EOD history to end on the latest completed trading day.
- Preserve provider trade time and API received time for every quote.
- Validate OHLC invariants, finite values, ordering, duplicate dates, splits,
  dividends, and material previous-close discrepancies before promotion.
- Quarantine a failed section while retaining its prior valid version.
- Keep canaries for a normal stock, dual-class stock, ADR, ETF, recent split,
  ticker change, foreign filer, and non-calendar fiscal year.
- Record the executed provider agreement, permitted display, retention,
  attribution, renewal date, and owner here before switching or expanding.
