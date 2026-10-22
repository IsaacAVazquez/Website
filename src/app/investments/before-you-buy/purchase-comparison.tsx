import type { ReactNode } from "react";
import { HOLDING_PALETTE } from "@/components/investments/holdingPalette";
import {
  describeBuy, formatDay, formatMoney, formatRatio, formatReturn, weightIn,
  FUND_SECTOR, MIN_COMPARISON_DAYS, type BeforeYouBuyResult, type Mix,
} from "@/lib/beforeYouBuy";

export const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const ratio = (value: number | null) => value === null ? "Unavailable" : formatRatio(value);
const worstAverage = (result: BeforeYouBuyResult, side: "before" | "after") => {
  const values = result.worstDays.flatMap((day) => day[side] === null ? [] : [day[side] as number]);
  return values.length ? formatReturn(values.reduce((sum, value) => sum + value, 0) / values.length) : "Unavailable";
};

export function TableScroll({ label, children }: { label: string; children: ReactNode }) {
  return <div role="region" aria-label={`${label} (scrollable)`} tabIndex={0} className="byb-scroll">{children}</div>;
}

function SectorBars({ results }: { results: BeforeYouBuyResult[] }) {
  const first = results[0];
  const totals = new Map<string, number>();
  for (const mix of [first.before, ...results.map((result) => result.after)]) {
    for (const entry of mix.sectors) totals.set(entry.sector, Math.max(totals.get(entry.sector) ?? 0, entry.weight));
  }
  const sectors = [...totals].sort((a, b) => b[1] - a[1]).map(([sector]) => sector);
  const shown = sectors.length <= 5 ? sectors : sectors.slice(0, 4);
  const parts = (mix: Mix) => {
    const entries = shown.map((sector, i) => ({ sector, weight: weightIn(mix.sectors, sector), color: HOLDING_PALETTE[i] }));
    const other = Math.max(0, 1 - entries.reduce((sum, entry) => sum + entry.weight, 0));
    return other > 0.00001 ? [...entries, { sector: "Other", weight: other, color: HOLDING_PALETTE[4] }] : entries;
  };
  const rows = [{ label: "Current", mix: first.before }, ...results.map((result) => ({ label: `Buy ${result.buy.symbol}`, mix: result.after }))];
  return <div className="byb-bars">
    {rows.map(({ label, mix }) => <div className="byb-bar-row" key={label}>
      <span className="byb-bar-label">{label}</span>
      <div className="byb-bar" role="img" aria-label={`${label}: ${parts(mix).filter((part) => part.weight > 0).map((part) => `${part.sector} ${percent(part.weight)}`).join(", ") || "nothing held"}`}>
        {parts(mix).filter((part) => part.weight > 0).map((part) => <span key={part.sector} style={{ flexGrow: part.weight, flexBasis: 0, background: part.color }} />)}
      </div>
    </div>)}
    <ul className="byb-legend" aria-hidden="true">{[...new Map(rows.flatMap(({ mix }) => parts(mix)).map((part) => [part.sector, part])).values()].map((part) => <li key={part.sector}><span style={{ background: part.color }} />{part.sector}</li>)}</ul>
  </div>;
}

export function PurchaseComparison({ results, name }: { results: BeforeYouBuyResult[]; name: string }) {
  const first = results[0];
  const sector = first.buySector;
  const boughtWeight = first.after.holdings.find((holding) => holding.symbol === first.buy.symbol)?.weight ?? 0;
  const mixes = [{ label: "in the current portfolio", mix: first.before }, ...results.map((result) => ({ label: `after buying ${result.buy.symbol}`, mix: result.after }))];
  const hasFunds = mixes.some(({ mix }) => weightIn(mix.sectors, FUND_SECTOR) > 0);
  const hasUnknown = mixes.some(({ mix }) => weightIn(mix.sectors, "Unclassified") > 0);
  const coverageShares = (group: string) => mixes.map(({ label, mix }) => `${percent(weightIn(mix.sectors, group))} ${label}`).join(", ");
  const allSectors = [...new Set([first.before, ...results.map((result) => result.after)].flatMap((mix) => mix.sectors.map((entry) => entry.sector)))];
  const rows: { label: string; help: string; values: string[] }[] = [
    {
      label: "Largest holding", help: "One position as a share of the whole portfolio.",
      values: [first.before, ...results.map((result) => result.after)].map((mix) => mix.holdings[0] ? `${mix.holdings[0].symbol} ${percent(mix.holdings[0].weight)}` : "None"),
    },
    ...(sector !== FUND_SECTOR && sector !== "Unclassified" ? [{
      label: `${sector} in direct holdings`, help: "Funds are counted separately below.",
      values: [first.before, ...results.map((result) => result.after)].map((mix) => percent(weightIn(mix.sectors, sector))),
    }] : []),
    {
      label: "Market sensitivity (beta)", help: "1.00 means equal sensitivity to daily S&P 500 moves.",
      values: [first.before, ...results.map((result) => result.after)].map((mix) => ratio(mix.beta)),
    },
    {
      label: "Average on the five worst market days", help: "Historical daily returns at these fixed weights.",
      values: [worstAverage(first, "before"), ...results.map((result) => worstAverage(result, "after"))],
    },
  ];
  return <>
    <div className="byb-result-heading">
      <h2>What changes</h2>
      <span>{formatMoney(first.before.total)} to {formatMoney(first.after.total)}</span>
    </div>
    <p role="status" aria-live="polite" className="byb-summary">
      <span className="byb-position-share">{percent(boughtWeight)}</span>
      <span>{first.buy.symbol} would make up this much of your portfolio after adding {formatMoney(first.buy.value)}.</span>
    </p>
    <p className="byb-result-context">{name}. {first.before.holdings.some((holding) => holding.symbol === first.buy.symbol) ? "This adds to a position you already hold." : "This would be a new position."}</p>
    {sector !== FUND_SECTOR && sector !== "Unclassified" ? <p className="byb-takeaway">
      Your direct {sector} share {weightIn(first.after.sectors, sector) > weightIn(first.before.sectors, sector) ? "rises" : weightIn(first.after.sectors, sector) < weightIn(first.before.sectors, sector) ? "falls" : "stays unchanged"}
      {weightIn(first.after.sectors, sector) !== weightIn(first.before.sectors, sector) ? ` from ${percent(weightIn(first.before.sectors, sector))} to ${percent(weightIn(first.after.sectors, sector))}` : ` at ${percent(weightIn(first.after.sectors, sector))}`}.
      {results[1] ? ` With ${results[1].buy.symbol} instead, it would be ${percent(weightIn(results[1].after.sectors, sector))}.` : ""}
    </p> : null}
    <TableScroll label="Purchase comparison">
      <table className="byb-table byb-comparison-table">
        <caption className="sr-only">The same starting portfolio and purchase amount for each option</caption>
        <thead><tr><th scope="col">Portfolio impact</th><th scope="col">Current</th>{results.map((result) => <th scope="col" key={result.buy.symbol}>Buy {result.buy.symbol}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}<span className="byb-cell-note">{row.help}</span></th>{row.values.map((value, i) => <td key={i} data-proposed={i > 0 || undefined}>{value}</td>)}</tr>)}</tbody>
      </table>
    </TableScroll>
    <div className="byb-sector-heading"><h3>How the mix changes</h3><span>Share of total value</span></div>
    <SectorBars results={results} />
    {hasFunds || hasUnknown ? <p className="byb-coverage-note">
      {hasFunds ? `The fund share is ${coverageShares(FUND_SECTOR)}. I don't have their underlying holdings, so their sector exposure is not included in the direct sector totals. ` : ""}
      {hasUnknown ? `The share without a sector classification is ${coverageShares("Unclassified")}.` : ""}
    </p> : null}
    <p className="byb-note byb-data-date">{first.window ? `Prices through ${formatDay(first.window.to)}. ${first.window.days} shared daily returns. ` : "No shared price history. "}Not investment advice.</p>
    {(first.window?.days ?? 0) < MIN_COMPARISON_DAYS ? <p className="byb-warning">Historical comparisons need at least {MIN_COMPARISON_DAYS} shared daily returns. Allocation changes are still shown.</p> : null}
    <details className="byb-detail">
      <summary>Sector weights and calculation detail</summary>
      <TableScroll label="Sector weights before and after"><table className="byb-table">
        <thead><tr><th scope="col">Sector</th><th scope="col">Current</th>{results.map((result) => <th scope="col" key={result.buy.symbol}>Buy {result.buy.symbol}</th>)}</tr></thead>
        <tbody>{allSectors.map((entry) => <tr key={entry}><th scope="row">{entry}</th>{[first.before, ...results.map((result) => result.after)].map((mix, i) => <td key={i}>{percent(weightIn(mix.sectors, entry))}</td>)}</tr>)}</tbody>
      </table></TableScroll>
      <p className="byb-note">{describeBuy(first, name)}</p>
      {results.map((result) => <p key={result.buy.symbol} className="byb-note">{result.buy.symbol}&apos;s correlation with the current portfolio is {ratio(result.correlation)}. A value of 1 means daily returns moved together; 0 means no linear relationship.</p>)}
    </details>
  </>;
}

export function WorstDays({ results }: { results: BeforeYouBuyResult[] }) {
  const first = results[0];
  if (!first.worstDays.length) return null;
  return <section className="byb-worst" aria-labelledby="byb-worst-heading">
    <h2 id="byb-worst-heading">The market&apos;s five worst days</h2>
    <p className="byb-note">SPY&apos;s lowest daily returns from {formatDay(first.window!.from)} to {formatDay(first.window!.to)}. Each mix uses fixed weights, with the same dates for both purchases.</p>
    <TableScroll label="The market's five worst days"><table className="byb-table">
      <thead><tr><th scope="col">Day</th><th scope="col">SPY</th><th scope="col">Current</th>{results.map((result) => <th scope="col" key={result.buy.symbol}>Buy {result.buy.symbol}</th>)}</tr></thead>
      <tbody>{first.worstDays.map((day, i) => <tr key={day.date}><th scope="row">{formatDay(day.date)}</th><td>{formatReturn(day.benchmark)}</td><td>{day.before === null ? "Unavailable" : formatReturn(day.before)}</td>{results.map((result) => <td key={result.buy.symbol}>{formatReturn(result.worstDays[i].after)}</td>)}</tr>)}</tbody>
    </table></TableScroll>
  </section>;
}
