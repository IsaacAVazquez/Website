import {
  CHART_PLAY_LABEL,
  DEALER_UPCARDS,
  buildStrategyChart,
  type ChartPlay,
  type ChartRow,
} from "@/lib/blackjack/strategy";
import type { TableRules } from "@/lib/blackjack/tableRules";

const LEGEND: readonly ChartPlay[] = ["H", "S", "D", "Ds", "P", "R", "Rs"];

function upcardLabel(up: number): string {
  return up === 11 ? "A" : String(up);
}

function ChartTable({ caption, rowHead, rows }: { caption: string; rowHead: string; rows: ChartRow[] }) {
  return (
    <table className="bj-chart">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{rowHead}</th>
          {DEALER_UPCARDS.map((up) => (
            <th key={up} scope="col">
              <span className="sr-only">Dealer shows </span>
              {upcardLabel(up)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row">{row.label}</th>
            {row.plays.map((play, index) => (
              <td key={DEALER_UPCARDS[index]} data-play={play}>
                <abbr title={CHART_PLAY_LABEL[play]}>{play}</abbr>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The chart the table grades against, drawn from the same function the grader calls. */
export function StrategyChartView({ rules }: { rules: TableRules }) {
  const chart = buildStrategyChart(rules);
  const used = new Set([...chart.hard, ...chart.soft, ...chart.pairs].flatMap((row) => row.plays));

  return (
    <div className="bj-chart-view">
      <p className="bj-note">
        This is the chart for {rules.label.toLowerCase()}, read across from your hand to the dealer&apos;s
        upcard. The table grades against the same chart, so a play that changes with the rules changes
        in both places.
      </p>
      <ul className="bj-legend" aria-label="Chart key">
        {LEGEND.filter((play) => used.has(play)).map((play) => (
          <li key={play}>
            <span className="bj-legend-mark" data-play={play} aria-hidden="true">
              {play}
            </span>
            {CHART_PLAY_LABEL[play]}
          </li>
        ))}
      </ul>
      <div className="bj-chart-grid">
        <ChartTable caption="Hard totals" rowHead="Total" rows={chart.hard} />
        <ChartTable caption="Soft totals" rowHead="Hand" rows={chart.soft} />
        <ChartTable caption="Pairs" rowHead="Pair" rows={chart.pairs} />
      </div>
    </div>
  );
}
