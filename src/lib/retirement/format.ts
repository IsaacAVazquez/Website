// ============================================================
// Formatting helpers shared by the engine (lever labels) and the UI.
// ============================================================

export function formatCurrency(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(Math.round(value * 10 ** maximumFractionDigits) / 10 ** maximumFractionDigits);
}

const COMPACT_SUFFIXES = ["", "K", "M", "B", "T"];

/**
 * "$950", "$100K", "$1.5M", "-$22.5K". Written out by hand because `Intl`
 * compact notation drops the decimal once a value has two digits ("$12K" where
 * this prints "$12.3K"), so the two are not interchangeable.
 */
export function formatCompactCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  let scaled = Math.abs(value);
  let tier = 0;
  // Step up a unit whenever rounding would print a thousand of this one.
  while (tier < COMPACT_SUFFIXES.length - 1 && Math.round(scaled * 10) / 10 >= 1000) {
    scaled /= 1000;
    tier += 1;
  }
  return `${sign}$${Math.round(scaled * 10) / 10}${COMPACT_SUFFIXES[tier]}`;
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

/** "≈85 of 100 scenarios" — the honest framing the spec (§6.2) asks for. */
export function formatScenarioCount(successRate: number): string {
  const n = Math.round(successRate * 100);
  return `${n} of 100`;
}
