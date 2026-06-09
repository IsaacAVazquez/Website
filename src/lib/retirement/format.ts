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

export function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

/** "≈85 of 100 scenarios" — the honest framing the spec (§6.2) asks for. */
export function formatScenarioCount(successRate: number): string {
  const n = Math.round(successRate * 100);
  return `${n} of 100`;
}
