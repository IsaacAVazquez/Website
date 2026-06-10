/**
 * Shared money/percent formatting for the investments portfolio surfaces.
 *
 * Previously these helpers were copy-pasted across `PortfolioHeroCard`,
 * `HoldingsTable`, and `PortfolioStatsGrid`. They are consolidated here so the
 * rounding, currency, and sign conventions stay identical across the dashboard.
 *
 * Conventions: U+2212 MINUS SIGN ("−") for negatives, "+" for positives, and an
 * em dash ("—") for non-finite percentages.
 */

/** `$1,234.56`. `fractionDigits` controls both min and max decimals. */
export function formatCurrency(n: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

/** `+$1,234.56` / `−$1,234.56`, signed by value. */
export function formatSignedCurrency(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${formatCurrency(Math.abs(n))}`;
}

/** `+12.34%` / `−12.34%`, or `—` for non-finite input. */
export function formatPercent(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(2)}%`;
}

/**
 * Whether a lower value is the favorable side for an industry-comparison
 * metric. Valuation multiples (P/E, P/S, P/B, PEG) and discount/risk rates
 * read "cheaper/safer is better"; profitability and growth metrics read
 * "higher is better".
 */
export function isLowerBetterMetric(label: string): boolean {
  return /p\/e|p\/s|p\/b|peg|wacc|beta/i.test(label);
}

/** Whether an industry-comparison metric is expressed in percentage units. */
export function isPercentMetric(label: string): boolean {
  return /margin|\broe\b|\broa\b|\broic\b|growth|yield|upside|wacc/i.test(label);
}

/**
 * `37.18` for ratio metrics, `26.60%` for percentage metrics, `—` for missing
 * values — keeps the industry-comparison tables honest about units.
 */
export function formatComparisonMetricValue(label: string, n: number | undefined): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return "—";
  return isPercentMetric(label) ? `${n.toFixed(2)}%` : n.toFixed(2);
}

/**
 * Splits a balance into a whole-dollar part and a cents part so the hero card
 * can render them at different type sizes (e.g. `$12,345` + `.67`).
 */
export function formatBalance(n: number): { whole: string; cents: string } {
  if (!Number.isFinite(n)) return { whole: "$0", cents: ".00" };
  const sign = n < 0 ? "−" : "";
  // Round to total cents first so 12.999 carries into the whole-dollar part
  // ($13.00) instead of rendering "$12.100".
  const totalCents = Math.round(Math.abs(n) * 100);
  const whole = Math.floor(totalCents / 100);
  const cents = totalCents % 100;
  return {
    whole: `${sign}$${whole.toLocaleString("en-US")}`,
    cents: `.${cents.toString().padStart(2, "0")}`,
  };
}
