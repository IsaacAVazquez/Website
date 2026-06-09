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
 * Splits a balance into a whole-dollar part and a cents part so the hero card
 * can render them at different type sizes (e.g. `$12,345` + `.67`).
 */
export function formatBalance(n: number): { whole: string; cents: string } {
  if (!Number.isFinite(n)) return { whole: "$0", cents: ".00" };
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n);
  const whole = Math.floor(abs);
  const cents = Math.round((abs - whole) * 100);
  return {
    whole: `${sign}$${whole.toLocaleString("en-US")}`,
    cents: `.${cents.toString().padStart(2, "0")}`,
  };
}
