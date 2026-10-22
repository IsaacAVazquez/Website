"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { StockSearch } from "@/components/investments/StockSearch";
import { loadHoldings } from "@/hooks/useInvestments";
import { BUY_PORTFOLIO_KEY, compareBuys, decodeBuyPositions, formatMoney, type Position, type SymbolHistory } from "@/lib/beforeYouBuy";
import { readValidatedBrowserStorage, writeBrowserStorageJson, type PersistenceStatus } from "@/lib/browserStorage";
import { isValidSymbol } from "@/lib/investmentSymbol";
import { getClientInvestmentSnapshot } from "@/lib/investmentsClientData";
import type { PortfolioHolding, StockPrice } from "@/types/investment";
import { PurchaseComparison, TableScroll, WorstDays } from "./purchase-comparison";
import "./before-you-buy.css";

const BENCHMARK = "SPY";
const DISCLAIMER = "An independent concept by Isaac Vazquez, not affiliated with or endorsed by Google.";
const SAMPLE: Position[] = [
  { symbol: "SPY", value: 15000 }, { symbol: "AAPL", value: 8000 }, { symbol: "MSFT", value: 7000 },
  { symbol: "GOOGL", value: 6000 }, { symbol: "AMZN", value: 5000 }, { symbol: "JPM", value: 5000 }, { symbol: "COST", value: 4000 },
];
const EXAMPLES = ["NVDA", "XOM", "KO"];
type Loaded = { history: SymbolHistory; name: string } | "missing";
type EditorRow = { symbol: string; amount: string };
type Source = "sample" | "saved" | "custom";
const editorRows = (positions: Position[]) => positions.map((position) => ({ symbol: position.symbol, amount: String(position.value) }));
const positive = (value: string) => value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) > 0;

function toLoaded(symbol: string, sections: Record<string, unknown>): Loaded {
  const prices = (Array.isArray(sections.price) ? sections.price as StockPrice[] : [])
    .filter((row) => typeof row?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.date) && Number.isFinite(row.close) && row.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const info = (sections.info ?? {}) as { sector?: string; shortName?: string };
  return prices.length > 1 ? {
    history: { prices, sector: info.sector || undefined },
    name: info.shortName ?? symbol,
  } : "missing";
}

/** Reruns only when the inputs, as text, or the loaded prices change. */
function useComparison(key: string, loaded: Record<string, Loaded>) {
  return useMemo(() => {
    if (!key) return [];
    const { positions, buys } = JSON.parse(key) as { positions: Position[]; buys: Position[] };
    const histories: Record<string, SymbolHistory> = {};
    for (const [symbol, entry] of Object.entries(loaded)) if (entry !== "missing") histories[symbol] = entry.history;
    return compareBuys(positions, buys, histories, BENCHMARK);
  }, [key, loaded]);
}

export function BeforeYouBuyClient() {
  const id = useId();
  const [portfolio, setPortfolio] = useState<{
    saved: PortfolioHolding[]; draft: EditorRow[] | null; source: Source | null; persistence: PersistenceStatus;
  }>({ saved: [], draft: null, source: null, persistence: "persistent" });
  const [symbol, setSymbol] = useState("NVDA");
  const [alternative, setAlternative] = useState("SPY");
  const [comparing, setComparing] = useState(true);
  const [amountText, setAmountText] = useState("5000");
  const [newSymbol, setNewSymbol] = useState("");
  const [newValue, setNewValue] = useState("1000");
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({});
  const requested = useRef(new Set<string>());

  useEffect(() => {
    const restored = readValidatedBrowserStorage<Position[] | null>(BUY_PORTFOLIO_KEY, decodeBuyPositions, () => null);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate validated browser-only holdings after the server render.
    setPortfolio({ saved: loadHoldings(), draft: restored.value ? editorRows(restored.value) : null, source: null, persistence: restored.persistenceStatus });
  }, []);

  useEffect(() => {
    let opened: HTMLDetailsElement[] = [];
    const before = () => {
      document.querySelectorAll<HTMLDetailsElement>(".byb details:not([open])").forEach((detail) => { detail.open = true; opened.push(detail); });
    };
    const after = () => { opened.forEach((detail) => { detail.open = false; }); opened = []; };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after); };
  }, []);

  const source = portfolio.source ?? (portfolio.draft ? "custom" : portfolio.saved.length ? "saved" : "sample");
  const portfolioSymbols = source === "custom" ? (portfolio.draft ?? []).map((row) => row.symbol)
    : source === "saved" ? portfolio.saved.map((holding) => holding.symbol) : SAMPLE.map((position) => position.symbol);
  const neededKey = [...new Set([BENCHMARK, symbol, ...(comparing ? [alternative] : []), ...portfolioSymbols])].filter(isValidSymbol).join(",");

  useEffect(() => {
    for (const next of neededKey.split(",")) {
      if (Object.hasOwn(loaded, next) || requested.current.has(next)) continue;
      requested.current.add(next);
      getClientInvestmentSnapshot(next)
        .then((snapshot) => toLoaded(next, snapshot.sections as Record<string, unknown>))
        .catch((): Loaded => "missing")
        .then((entry) => setLoaded((current) => ({ ...current, [next]: entry })));
    }
  }, [neededKey, loaded]);

  const rows: EditorRow[] = source === "custom" ? portfolio.draft ?? [] : source === "sample" ? editorRows(SAMPLE)
    : portfolio.saved.map((holding) => {
      const entry = loaded[holding.symbol];
      return { symbol: holding.symbol, amount: entry && entry !== "missing" ? String(holding.shares * entry.history.prices.at(-1)!.close) : "" };
    });
  const amountValid = positive(amountText);
  const ready = neededKey.split(",").every((key) => Object.hasOwn(loaded, key));
  const leftOut = source === "saved" ? portfolioSymbols.filter((key) => loaded[key] === "missing") : [];
  const includedRows = rows.filter((row) => !leftOut.includes(row.symbol));
  // Saved rows have no value until their prices load, so an edit then would copy blanks into the draft.
  const locked = source === "saved" && !ready;
  // The rows a new draft starts from. A left-out saved holding comes along only once it has a value.
  const draftRows = (next: EditorRow[]) => next.filter((row) => !leftOut.includes(row.symbol) || positive(row.amount));
  const portfolioValid = includedRows.every((row) => positive(row.amount)) && Number.isFinite(includedRows.reduce((sum, row) => sum + Number(row.amount), 0));
  const total = includedRows.reduce((sum, row) => sum + (positive(row.amount) ? Number(row.amount) : 0), 0);
  const sameAlternative = comparing && symbol === alternative;
  const historicalMissing = neededKey.split(",").filter((key) => loaded[key] === "missing");

  // A saved holding without a price cannot be valued. Never call an entirely
  // uncovered saved account an empty portfolio.
  const comparable = amountValid && portfolioValid && ready && isValidSymbol(symbol) && Number.isFinite(total + Number(amountText)) &&
    !(source === "saved" && portfolio.saved.length > 0 && includedRows.length === 0);
  const comparisonKey = comparable ? JSON.stringify({
    positions: includedRows.map((row) => ({ symbol: row.symbol, value: Number(row.amount) })),
    buys: [{ symbol, value: Number(amountText) }, ...(comparing && !sameAlternative ? [{ symbol: alternative, value: Number(amountText) }] : [])],
  }) : "";
  const results = useComparison(comparisonKey, loaded);

  function saveDraft(next: EditorRow[]) {
    const decoded = decodeBuyPositions(next.map((row) => ({ symbol: row.symbol, value: Number(row.amount) })));
    const persistence = decoded ? writeBrowserStorageJson(BUY_PORTFOLIO_KEY, decoded) : portfolio.persistence;
    setPortfolio((current) => ({ ...current, draft: next, source: "custom", persistence }));
  }

  function addHolding() {
    if (!isValidSymbol(newSymbol) || !positive(newValue) || rows.length >= 100 || !portfolioValid) return;
    const exists = rows.some((row) => row.symbol === newSymbol);
    saveDraft(draftRows(exists ? rows.map((row) => row.symbol === newSymbol ? { ...row, amount: String((Number(row.amount) || 0) + Number(newValue)) } : row)
      : [...rows, { symbol: newSymbol, amount: newValue }]));
    setNewSymbol("");
  }

  function retryData() {
    historicalMissing.forEach((key) => requested.current.delete(key));
    setLoaded((current) => Object.fromEntries(Object.entries(current).filter(([, entry]) => entry !== "missing")));
  }

  const entry = loaded[symbol];
  const name = entry && entry !== "missing" ? entry.name : symbol;
  const emptyMessage = !amountValid ? "Enter an amount above zero to see what the buy would change."
    : !portfolioValid && ready ? "Enter a value above zero for each holding, or remove it."
    : !isValidSymbol(symbol) ? "Pick a stock from the search suggestions."
    : !ready ? "Loading prices for the portfolio and the purchases…"
    : "The saved holdings could not be valued. Edit their dollar values here or try the sample portfolio.";

  return <div className="byb" data-stock-search-portal="">
    <div className="byb-page c97-shell c97-frame">
      <header className="byb-title">
        <h1>Before You Buy</h1>
        <p>See how your next stock purchase changes the portfolio you already have.</p>
        <p className="byb-disclaimer">A product concept for Google Finance. {DISCLAIMER}</p>
      </header>
      <div className="byb-calc">
        <section className="byb-buy" aria-labelledby={`${id}-buy`}>
          <h2 id={`${id}-buy`}>Plan a purchase</h2>
          <div className="byb-buy-fields">
            <div><span className="byb-label">Stock to buy</span><StockSearch value={symbol} onChange={(next) => setSymbol(next.toUpperCase())} /></div>
            <label htmlFor={`${id}-amount`}><span className="byb-label">Purchase amount</span><span className="byb-money"><span aria-hidden="true">$</span><input id={`${id}-amount`} type="number" inputMode="decimal" min="0" step="500" aria-label="Amount in dollars" aria-invalid={!amountValid || undefined} aria-describedby={!amountValid ? `${id}-amount-error` : `${id}-funding`} value={amountText} onChange={(event) => setAmountText(event.target.value)} /></span></label>
          </div>
          {!amountValid ? <p id={`${id}-amount-error`} className="byb-warning">Enter an amount above zero.</p> : null}
          <p id={`${id}-funding`} className="byb-note">This adds new money. Existing holdings stay invested.</p>
          <div className="byb-examples"><span className="byb-label">Try</span>{EXAMPLES.map((example) => <button type="button" key={example} className="byb-chip" aria-pressed={symbol === example} onClick={() => setSymbol(example)}>{example}</button>)}</div>
          <div className="byb-alternative">
            <div className="byb-control-heading"><span className="byb-label">{comparing ? "Compare the same amount in" : "Explore another option"}</span><button className="byb-text-button" type="button" onClick={() => setComparing((current) => !current)}>{comparing ? "Remove comparison" : "Compare another purchase"}</button></div>
            {comparing ? <StockSearch label="Alternative stock" value={alternative} onChange={(next) => setAlternative(next.toUpperCase())} /> : null}
            {sameAlternative ? <p className="byb-note">Both choices are {symbol}. Pick a different stock to compare two purchases.</p> : null}
          </div>
          <div className="byb-source">
            <h3 id={`${id}-portfolio`}>Starting portfolio</h3>
            <div className="byb-switch" role="group" aria-labelledby={`${id}-portfolio`}>
              <button type="button" aria-pressed={source === "sample"} onClick={() => setPortfolio((current) => ({ ...current, source: "sample" }))}>Sample portfolio</button>
              <button type="button" aria-pressed={source === "saved"} disabled={!portfolio.saved.length} onClick={() => setPortfolio((current) => ({ ...current, source: "saved" }))}>Your saved holdings</button>
              {portfolio.draft ? <button type="button" aria-pressed={source === "custom"} onClick={() => setPortfolio((current) => ({ ...current, source: "custom" }))}>Your draft</button> : null}
            </div>
            <p className="byb-note">{source === "sample" ? "A $50,000 sample across seven holdings. Edit it below to try your own mix." : source === "saved" ? "Your holdings from Investments, valued at each stock's latest close. Edits here create a separate draft." : "Your working portfolio. Values are dollar amounts you can change below."}</p>
          </div>
          <details className="byb-portfolio byb-detail">
            <summary>View and edit {rows.length} holdings{portfolioValid ? ` · ${formatMoney(total)}` : ""}</summary>
            <p className="byb-note">{portfolio.persistence === "memory-only" ? "Changes stay in this tab because browser storage is unavailable." : "Valid edits are saved in this browser as a separate draft."}</p>
            {rows.length ? <TableScroll label="Portfolio holdings"><table className="byb-table byb-editor">
              <caption className="sr-only">Starting holdings in dollars</caption>
              <thead><tr><th scope="col">Holding</th><th scope="col">Value ($)</th><th scope="col"><span className="sr-only">Remove</span></th></tr></thead>
              <tbody>{rows.map((row, i) => <tr key={row.symbol}><th scope="row">{row.symbol}</th><td><input type="number" inputMode="decimal" min="0" step="100" aria-label={`${row.symbol} value in dollars`} aria-invalid={(!locked && !positive(row.amount)) || undefined} disabled={locked} value={row.amount} onChange={(event) => saveDraft(draftRows(rows.map((current, index) => index === i ? { ...current, amount: event.target.value } : current)))} /></td><td><button type="button" className="byb-remove" disabled={locked} aria-label={`Remove ${row.symbol}`} onClick={() => saveDraft(draftRows(rows.filter((_, index) => index !== i)))}><Trash2 size={16} aria-hidden="true" /></button></td></tr>)}</tbody>
            </table></TableScroll> : <p className="byb-note">No holdings yet. Add a holding below, or see what a first purchase would look like.</p>}
            {!portfolioValid && ready ? <p className="byb-warning">Enter a value above zero for each holding, or remove it. Invalid edits are not saved.</p> : null}
            <div className="byb-add-holding">
              <span className="byb-label">Add a holding by its current dollar value</span>
              <StockSearch label="Add holding symbol" value={newSymbol} onChange={(next) => setNewSymbol(next.toUpperCase())} />
              <div className="byb-add-value"><input type="number" inputMode="decimal" min="0" step="100" aria-label="New holding value in dollars" value={newValue} onChange={(event) => setNewValue(event.target.value)} /><button type="button" className="byb-add" disabled={!isValidSymbol(newSymbol) || !positive(newValue) || rows.length >= 100 || !portfolioValid} onClick={addHolding}><Plus size={16} aria-hidden="true" />Add holding</button></div>
              {rows.length >= 100 ? <p className="byb-note">This workspace supports up to 100 holdings.</p> : null}
            </div>
          </details>
        </section>
        <section className="byb-result" aria-label="What the buy changes" aria-busy={!ready}>
          {leftOut.length ? <p className="byb-warning">This comparison leaves out holdings without prices: {leftOut.join(", ")}. Enter their dollar values in the editor to include them.</p> : null}
          {historicalMissing.length ? <p className="byb-warning">Prices unavailable for {historicalMissing.join(", ")}. Historical results may be unavailable. <button type="button" className="byb-text-button" onClick={retryData}>Retry data</button></p> : null}
          {results.length ? <PurchaseComparison results={results} name={name} /> : <>
            <h2>What changes</h2><p role="status" aria-live="polite" className="byb-empty-summary">{emptyMessage}</p>
            {!ready ? <div className="byb-loading" aria-hidden="true"><span /><span /><span /></div> : null}
            <p className="byb-note">Not investment advice.</p>
          </>}
        </section>
      </div>
      {results.length ? <WorstDays results={results} /> : null}
      <details className="byb-how byb-detail"><summary>How this comparison works</summary>
        <p>I compare the same starting portfolio with each proposed purchase, using additional money and keeping the weights fixed across the historical window. Saved holdings use their latest available closing prices; edited holdings use the dollar values you enter. The history includes only consecutive benchmark trading dates with prices for every holding, both purchase choices, and SPY, an S&amp;P 500 fund.</p>
        <p>Beta measures historical sensitivity to SPY. Correlation measures how closely a stock&apos;s daily returns moved with the starting portfolio. I withhold historical comparisons with fewer than 30 shared daily returns. These are closing-price comparisons, with no dividends, taxes, fees, or breakdown of the holdings inside funds. A different period can give different results.</p>
        <p>The page describes what a buy would change and doesn&apos;t say whether to make it. The underlying snapshots are available on <Link href="/investments">Investments</Link>.</p>
      </details>
    </div>
  </div>;
}
