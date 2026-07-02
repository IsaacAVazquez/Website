"use client";
/* eslint-disable react-refresh/only-export-components -- co-located constants are intentional */

import React from "react";

export const METRIC_DEFINITIONS: Record<string, string> = {
  // Valuation — all label variants
  "P/E TTM": "Price-to-Earnings (trailing 12 months). How much investors pay per $1 of profit. Lower generally means cheaper.",
  "P/E (TTM)": "Price-to-Earnings (trailing 12 months). How much investors pay per $1 of profit. Lower generally means cheaper.",
  "EPS TTM": "Earnings Per Share (trailing 12 months). Net profit divided by shares outstanding.",
  "EPS (TTM)": "Earnings Per Share (trailing 12 months). Net profit divided by shares outstanding.",
  "P/S": "Price-to-Sales. Market cap divided by annual revenue. Useful when a company isn't yet profitable.",
  "P/S Ratio": "Price-to-Sales. Market cap divided by annual revenue. Useful when a company isn't yet profitable.",
  "P/B": "Price-to-Book. Market cap relative to net assets on the balance sheet. Under 1 may signal undervaluation.",
  "P/B Ratio": "Price-to-Book. Market cap relative to net assets on the balance sheet. Under 1 may signal undervaluation.",
  "PEG": "Price/Earnings-to-Growth. P/E adjusted for expected growth rate. Under 1 is often considered attractive.",
  "PEG Ratio": "Price/Earnings-to-Growth. P/E adjusted for expected growth rate. Under 1 is often considered attractive.",

  // Market & capital
  "Market Cap": "Total market value of all outstanding shares, equal to price multiplied by shares outstanding.",
  "52W Range": "The stock's highest and lowest closing price over the trailing 52 weeks.",

  // Risk
  "Beta 5Y": "5-year beta measures volatility relative to the broader market. 1.0 = moves with the market. Above 1 = more volatile.",
  "Beta (5Y)": "5-year beta measures volatility relative to the broader market. 1.0 = moves with the market. Above 1 = more volatile.",

  // Margins & returns
  "Net Margin": "Percentage of revenue that becomes net profit after all expenses and taxes.",
  "FCF Margin": "Free Cash Flow margin. Cash generated after capital expenditures, as a percentage of revenue.",
  "Gross Margin": "Revenue minus cost of goods sold, as a percentage of revenue.",
  "Operating Margin": "Operating profit as a percentage of revenue, before interest and taxes.",
  "EBITDA Margin": "Earnings before interest, taxes, depreciation, and amortization, as a percentage of revenue.",
  "ROIC": "Return on Invested Capital. Measures how efficiently the company converts invested capital into profit. Above 10% is generally strong.",
  "Return on Inv. Capital": "Return on Invested Capital. Measures how efficiently the company converts invested capital into profit. Above 10% is generally strong.",
  "ROE": "Return on Equity. Net income as a percentage of shareholder equity.",
  "Return on Equity (ROE)": "Net income as a percentage of shareholder equity. Measures how effectively management uses equity to generate profit.",
  "ROA": "Return on Assets. Net income relative to total assets, a measure of asset efficiency.",
  "Return on Assets (ROA)": "Net income relative to total assets. Measures how efficiently the company uses its assets to generate earnings.",
  "Asset Turnover": "Revenue divided by total assets. Shows how efficiently the company generates revenue from its asset base.",
  "Equity Multiplier": "Total assets divided by shareholder equity. A higher value indicates more financial leverage.",

  // DCF
  "DCF Upside": "Model-implied return vs. the current market price, based on a Discounted Cash Flow valuation.",
  "Fair Value": "The DCF model's estimate of intrinsic value per share.",
  "DCF Fair Value": "The DCF model's estimate of intrinsic value per share.",
  "WACC": "Weighted Average Cost of Capital. The discount rate used in the DCF model. Reflects the blended cost of equity and debt financing.",

  // Growth
  "YoY": "Year-over-Year. The percentage change compared to the same period a year ago.",
  "QoQ": "Quarter-over-Quarter. The percentage change compared to the immediately preceding quarter.",
  "TTM": "Trailing Twelve Months. A rolling 12-month window of the most recent available data.",
};

interface Props {
  term: string;
  definition?: string;
  /**
   * Which edge the tooltip anchors to. Defaults to "left" (tooltip extends
   * rightward). Use "right" when the badge sits near the right edge of its
   * container, so the bubble extends leftward instead of clipping off-screen.
   */
  align?: "left" | "right";
}

export function MetricTooltip({ term, definition, align = "left" }: Props) {
  const text = definition ?? METRIC_DEFINITIONS[term];
  if (!text) return null;

  const bubbleAlign = align === "right" ? "right-0" : "left-0";
  const arrowAlign = align === "right" ? "right-3" : "left-3";

  // The trigger is a focusable, tappable control so the definition is reachable
  // by keyboard and on touch — not hover-only. It often sits inside a larger
  // clickable row, so clicks/keys are stopped from bubbling to that parent.
  // The bubble reveals on hover or keyboard/tap focus (group-focus-within).
  const swallow = (event: { stopPropagation: () => void }) => event.stopPropagation();

  return (
    <span className="group relative ml-0.5 inline-flex items-center align-middle">
      <span
        role="button"
        tabIndex={0}
        aria-label={`What is ${term}?`}
        onClick={swallow}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            swallow(event);
          }
        }}
        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-[var(--home-paper-alt)] text-3xs font-bold leading-none text-[var(--home-ink-muted)] ring-1 ring-[var(--home-rule)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--home-ink)]"
      >
        ?
      </span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full ${bubbleAlign} z-[80] mb-2 w-52 rounded-[var(--radius-2xl)] bg-[var(--home-ink)] px-3 py-2.5 text-2xs leading-snug text-[var(--home-paper)] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100`}
      >
        {text}
        <span className={`absolute ${arrowAlign} top-full border-4 border-transparent border-t-[var(--home-ink)]`} />
      </span>
    </span>
  );
}
