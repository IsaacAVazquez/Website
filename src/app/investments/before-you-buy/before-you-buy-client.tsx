"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { StockSearch } from "@/components/investments/StockSearch";
import { HOLDING_PALETTE } from "@/components/investments/holdingPalette";
import { loadHoldings } from "@/hooks/useInvestments";
import {
  analyzeBuy,
  describeBuy,
  formatDay,
  formatMoney,
  formatRatio,
  formatReturn,
  formatWeight,
  weightIn,
  type BeforeYouBuyResult,
  type Position,
  type SymbolHistory,
} from "@/lib/beforeYouBuy";
import { getClientInvestmentSnapshot } from "@/lib/investmentsClientData";
import type { PortfolioHolding, StockPrice } from "@/types/investment";
import "./before-you-buy.css";

const BENCHMARK = "SPY";
const DISCLAIMER = "An independent concept by Isaac Vazquez, not affiliated with or endorsed by Google.";

/** A $50,000 sample, 30% in an S&P 500 fund and the rest in six large companies. */
const SAMPLE: Position[] = [
  { symbol: "SPY", value: 15000 },
  { symbol: "AAPL", value: 8000 },
  { symbol: "MSFT", value: 7000 },
  { symbol: "GOOGL", value: 6000 },
  { symbol: "AMZN", value: 5000 },
  { symbol: "JPM", value: 5000 },
  { symbol: "COST", value: 4000 },
];
const EXAMPLES = ["NVDA", "XOM", "KO"];
/** HOLDING_PALETTE's first four steps are the ones that read apart; see holdingPalette.ts. */
const DISTINCT_COLORS = 4;

type Loaded = { history: SymbolHistory; name: string } | "missing";

interface Figure {
  label: string;
  value: string;
  was?: string;
}

function toLoaded(symbol: string, sections: Record<string, unknown>): Loaded {
  const prices = (Array.isArray(sections.price) ? (sections.price as StockPrice[]) : []).filter(
    (row) => typeof row?.date === "string" && Number.isFinite(row?.close)
  );
  const info = (sections.info ?? {}) as { sector?: string; shortName?: string };
  return prices.length > 1
    ? { history: { prices, sector: info.sector || undefined }, name: `${info.shortName ?? symbol} (${symbol})` }
    : "missing";
}

/** A table that can scroll sideways on a phone, reachable and labelled for a keyboard. */
function TableScroll({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="region" aria-label={`${label} (scrollable)`} tabIndex={0} className="byb-scroll">
      {children}
    </div>
  );
}

/** Two stacked bars, now and with the buy, in one sector order so a colour means one sector in both. */
function SectorBars({ result }: { result: BeforeYouBuyResult }) {
  // Only the palette's first four steps read apart, so past five sectors the smallest share one "Other".
  const all = result.after.sectors.map((entry) => entry.sector);
  const shown = all.length <= DISTINCT_COLORS + 1 ? all : all.slice(0, DISTINCT_COLORS);
  const segments = (sectors: BeforeYouBuyResult["before"]["sectors"]) => {
    if (sectors.length === 0) return [];
    const parts = shown.map((sector, i) => ({ sector, weight: weightIn(sectors, sector), color: HOLDING_PALETTE[i] }));
    const other = 1 - parts.reduce((sum, part) => sum + part.weight, 0);
    return other > 0.0005
      ? [...parts, { sector: "Other", weight: other, color: HOLDING_PALETTE[DISTINCT_COLORS] }]
      : parts;
  };
  const rows = [
    { label: "Now", parts: segments(result.before.sectors).filter((part) => part.weight > 0) },
    { label: "With the buy", parts: segments(result.after.sectors).filter((part) => part.weight > 0) },
  ];

  return (
    <div className="byb-bars">
      {rows.map((row) => (
        <div key={row.label} className="byb-bar-row">
          <span className="byb-bar-label">{row.label}</span>
          <div
            role="img"
            aria-label={`${row.label}: ${row.parts.map((part) => `${part.sector} ${formatWeight(part.weight)}`).join(", ") || "nothing held"}`}
            className="byb-bar"
          >
            {row.parts.map((part) => (
              <span key={part.sector} style={{ flexGrow: part.weight, flexBasis: 0, background: part.color }} />
            ))}
          </div>
        </div>
      ))}
      <ul aria-hidden="true" className="byb-legend">
        {rows[1].parts.map((part) => (
          <li key={part.sector}>
            <span style={{ background: part.color }} />
            {part.sector}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BeforeYouBuyClient() {
  const ids = useId();
  const amountId = `${ids}-amount`;
  const amountErrorId = `${ids}-amount-error`;
  const portfolioLabelId = `${ids}-portfolio`;
  const [saved, setSaved] = useState<PortfolioHolding[] | null>(null);
  const [source, setSource] = useState<"sample" | "saved" | null>(null);
  const [symbol, setSymbol] = useState("NVDA");
  const [amountText, setAmountText] = useState("5000");
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-shot read of the holdings /investments saved in this browser; localStorage is unavailable during SSR
    setSaved(loadHoldings());
  }, []);

  // The sample until the saved holdings are read, so the server and the first client render agree.
  const usingSaved = source === "saved" || (source === null && (saved?.length ?? 0) > 0);
  const portfolioSymbols = usingSaved ? (saved ?? []).map((holding) => holding.symbol) : SAMPLE.map((p) => p.symbol);
  const neededKey = [...new Set([BENCHMARK, symbol, ...portfolioSymbols])].join(",");

  useEffect(() => {
    for (const next of neededKey.split(",")) {
      if (next in loaded) continue;
      // The loader shares one request per symbol, so a repeat call here only waits on the same fetch.
      getClientInvestmentSnapshot(next)
        .then((snapshot) => toLoaded(next, snapshot.sections as Record<string, unknown>))
        .catch((): Loaded => "missing")
        .then((entry) => setLoaded((current) => (next in current ? current : { ...current, [next]: entry })));
    }
  }, [neededKey, loaded]);

  const amount = Number(amountText);
  const amountValid = Number.isFinite(amount) && amount > 0;

  const result = useMemo(() => {
    const ready = neededKey.split(",").every((next) => next in loaded);
    if (!amountValid || !ready || loaded[BENCHMARK] === "missing" || loaded[symbol] === "missing") return null;
    const history: Record<string, SymbolHistory> = {};
    for (const [key, entry] of Object.entries(loaded)) if (entry !== "missing") history[key] = entry.history;
    const lastClose = (key: string) => history[key]?.prices.at(-1)?.close ?? 0;
    const positions: Position[] = usingSaved
      ? (saved ?? []).flatMap((holding) =>
          history[holding.symbol] ? [{ symbol: holding.symbol, value: holding.shares * lastClose(holding.symbol) }] : []
        )
      : SAMPLE.filter((position) => history[position.symbol]);
    return analyzeBuy(positions, { symbol, value: amount }, history, BENCHMARK);
  }, [loaded, neededKey, usingSaved, saved, symbol, amount, amountValid]);

  const buyEntry = loaded[symbol];
  const buyName = buyEntry && buyEntry !== "missing" ? buyEntry.name : symbol;
  const unavailable = loaded[BENCHMARK] === "missing" ? BENCHMARK : buyEntry === "missing" ? symbol : null;
  const leftOut = portfolioSymbols.filter((next) => loaded[next] === "missing");
  const summary = result
    ? describeBuy(result, buyName)
    : !amountValid
      ? "Enter an amount above zero to see what the buy would change."
      : unavailable
        ? `Prices for ${unavailable} aren't available right now, so there's nothing to compare yet.`
        : "Loading a year of prices for the portfolio and the buy…";

  // The panel's own summary: the three numbers the buy moves, as the bars' caption.
  const figures: Figure[] = result
    ? [
        {
          label: `${result.buySector} share`,
          value: formatWeight(weightIn(result.after.sectors, result.buySector)),
          was: `Was ${formatWeight(weightIn(result.before.sectors, result.buySector))}`,
        },
        ...(result.after.beta !== null
          ? [
              {
                label: "Beta",
                value: formatRatio(result.after.beta),
                was: result.before.beta !== null ? `Was ${formatRatio(result.before.beta)}` : undefined,
              },
            ]
          : []),
        ...(result.correlation !== null
          ? [{ label: "Correlation", value: formatRatio(result.correlation), was: "With what you hold" }]
          : []),
      ]
    : amountValid && !unavailable
      ? // Placeholders while prices load, so the panel doesn't jump when they land.
        ["Sector share", "Beta", "Correlation"].map((label) => ({ label, value: "…" }))
      : [];

  const sectorRows = result
    ? [...new Set([...result.after.sectors, ...result.before.sectors].map((entry) => entry.sector))]
    : [];

  return (
    <div className="byb">
      <div className="byb-page c97-shell c97-frame">
        <header className="byb-title">
          <h1>Before You Buy</h1>
          <p>
            A product concept for Google Finance, built on my own investment data. Pick a stock and an amount to see
            what the buy would do to your portfolio before you make it.
          </p>
          <p className="byb-disclaimer">{DISCLAIMER}</p>
        </header>

        <div className="byb-calc">
          <section className="byb-buy" aria-labelledby={`${ids}-buy`}>
            <h2 id={`${ids}-buy`}>The buy</h2>
            <div className="byb-buy-fields">
              <div>
                <span className="byb-label">Stock</span>
                <StockSearch value={symbol} onChange={(next) => setSymbol(next.toUpperCase())} />
              </div>
              <label htmlFor={amountId}>
                <span className="byb-label">Amount</span>
                <span className="byb-money">
                  <span aria-hidden="true">$</span>
                  <input
                    id={amountId}
                    aria-label="Amount in dollars"
                    aria-invalid={!amountValid || undefined}
                    aria-describedby={amountValid ? undefined : amountErrorId}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={500}
                    value={amountText}
                    onChange={(event) => setAmountText(event.target.value)}
                  />
                </span>
                {amountValid ? null : (
                  <span id={amountErrorId} className="byb-note">
                    Enter an amount above zero.
                  </span>
                )}
              </label>
            </div>
            <div className="byb-examples">
              <span className="byb-label">Or try</span>
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="byb-chip"
                  aria-pressed={symbol === example}
                  onClick={() => setSymbol(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </section>

          <section className="byb-portfolio" aria-labelledby={portfolioLabelId}>
            <h2 id={portfolioLabelId}>Portfolio</h2>
            <div className="byb-switch" role="group" aria-labelledby={portfolioLabelId}>
              <button type="button" aria-pressed={!usingSaved} onClick={() => setSource("sample")}>
                Sample portfolio
              </button>
              <button type="button" aria-pressed={usingSaved} disabled={!saved?.length} onClick={() => setSource("saved")}>
                Your saved holdings
              </button>
            </div>
            <p className="byb-note">
              {usingSaved ? (
                <>
                  Your holdings from the <Link href="/investments">investments page</Link>, valued at the last close.
                  Edit them there.
                </>
              ) : (
                <>
                  A $50,000 sample with 30% in an S&amp;P 500 index fund and the rest in six large companies.
                  {saved?.length === 0 ? (
                    <>
                      {" "}
                      Save holdings on the <Link href="/investments">investments page</Link> to try your own.
                    </>
                  ) : null}
                </>
              )}
              {leftOut.length > 0 ? ` Left out because my data doesn't cover them: ${leftOut.join(", ")}.` : null}
            </p>
            {result ? (
              <TableScroll label="Portfolio holdings">
                <table className="byb-table">
                  <caption className="sr-only">The portfolio before the buy</caption>
                  <thead>
                    <tr>
                      <th scope="col">Holding</th>
                      <th scope="col" data-align="end">
                        Value
                      </th>
                      <th scope="col" data-align="end">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.before.holdings.map((holding) => (
                      <tr key={holding.symbol}>
                        <td>{holding.symbol}</td>
                        <td data-align="end">{formatMoney(holding.value)}</td>
                        <td data-align="end">{formatWeight(holding.weight)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            ) : null}
          </section>

          <section className="byb-result" aria-labelledby={`${ids}-result`}>
            <h2 id={`${ids}-result`} className="sr-only">
              What the buy changes
            </h2>
            <p role="status" aria-live="polite" className="byb-summary">
              {summary}
            </p>
            {result ? <SectorBars result={result} /> : null}
            {figures.length > 0 ? (
              <dl className="byb-figures">
                {figures.map((figure) => (
                  <div key={figure.label} className="byb-figure">
                    <dt>{figure.label}</dt>
                    <dd className="byb-figure-value">{figure.value}</dd>
                    {figure.was ? <dd className="byb-figure-was">{figure.was}</dd> : null}
                  </div>
                ))}
              </dl>
            ) : null}
            {result?.window ? <p className="byb-note">Prices through {formatDay(result.window.to)}.</p> : null}
            {result ? (
              <details className="byb-detail">
                <summary>Before and after, sector by sector</summary>
                <TableScroll label="Sector weights before and after">
                  <table className="byb-table">
                    <caption className="sr-only">Sector weights before and after the buy</caption>
                    <thead>
                      <tr>
                        <th scope="col">Sector</th>
                        <th scope="col" data-align="end">
                          Now
                        </th>
                        <th scope="col" data-align="end">
                          With the buy
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectorRows.map((sector) => (
                        <tr key={sector}>
                          <td>{sector}</td>
                          <td data-align="end">{formatWeight(weightIn(result.before.sectors, sector))}</td>
                          <td data-align="end">{formatWeight(weightIn(result.after.sectors, sector))}</td>
                        </tr>
                      ))}
                      <tr>
                        <td>Largest holding</td>
                        <td data-align="end">
                          {result.before.holdings[0]
                            ? `${result.before.holdings[0].symbol} ${formatWeight(result.before.holdings[0].weight)}`
                            : "None"}
                        </td>
                        <td data-align="end">
                          {`${result.after.holdings[0].symbol} ${formatWeight(result.after.holdings[0].weight)}`}
                        </td>
                      </tr>
                      <tr>
                        <td>Beta against SPY</td>
                        <td data-align="end">{result.before.beta !== null ? formatRatio(result.before.beta) : "None"}</td>
                        <td data-align="end">{result.after.beta !== null ? formatRatio(result.after.beta) : "None"}</td>
                      </tr>
                    </tbody>
                  </table>
                </TableScroll>
                {result.correlation !== null ? (
                  <p className="byb-note">
                    Over the same year, {symbol}&apos;s daily moves had a correlation of {formatRatio(result.correlation)}{" "}
                    with the current portfolio&apos;s, where 1 means they always moved together and 0 means no
                    relationship.
                  </p>
                ) : null}
              </details>
            ) : null}
          </section>
        </div>

        {result ? (
          <section className="byb-worst" aria-labelledby={`${ids}-worst`}>
            <h2 id={`${ids}-worst`}>The market&apos;s five worst days</h2>
            {result.window ? (
              <p className="byb-note">
                The days SPY fell most between {formatDay(result.window.from)} and {formatDay(result.window.to)}, with
                each mix held at today&apos;s weights.
              </p>
            ) : null}
            <TableScroll label="The market's five worst days">
              <table className="byb-table">
                <thead>
                  <tr>
                    <th scope="col">Day</th>
                    <th scope="col" data-align="end">
                      SPY
                    </th>
                    <th scope="col" data-align="end">
                      Now
                    </th>
                    <th scope="col" data-align="end">
                      With the buy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.worstDays.map((day) => (
                    <tr key={day.date}>
                      <td>{formatDay(day.date)}</td>
                      <td data-align="end">{formatReturn(day.benchmark)}</td>
                      <td data-align="end">{day.before !== null ? formatReturn(day.before) : "None"}</td>
                      <td data-align="end">{formatReturn(day.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </section>
        ) : null}

        <section className="byb-how" aria-labelledby={`${ids}-how`}>
          <h2 id={`${ids}-how`}>How this works</h2>
          <p>
            Every number on this page comes from the same year of daily closing prices in my{" "}
            <Link href="/investments">investments data</Link>, so two readings can&apos;t disagree just because they
            were measured over different periods. Both versions of the portfolio hold today&apos;s weights fixed through
            that year, which shows what each mix would have done and is not a record of any real account. Beta compares
            the portfolio&apos;s daily moves with SPY&apos;s on the same days, so 1 means it tends to move with the
            market and anything above 1 means it tends to move more, and the correlation compares the stock&apos;s
            daily moves with the current portfolio&apos;s. Index funds show as one slice because the data doesn&apos;t
            say what they hold, the prices are the last close and not live quotes, and a year is a short window that a
            calmer or rougher year could change. The page describes what a buy would change and doesn&apos;t say
            whether to make it. Not investment advice.
          </p>
        </section>
      </div>
    </div>
  );
}
