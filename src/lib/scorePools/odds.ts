// ============================================================
// Odds normalization and de-vig
//
// Everything downstream depends on this being clean: convert any
// quoted format to decimal, take implied probabilities, then strip
// the bookmaker margin so the outcomes sum to one. Works for both
// two-way and three-way markets.
// ============================================================

import type {
  DevigMethod,
  DevigResult,
  MoneylineOdds,
  OddsFormat,
  OutcomeProbabilities,
  RawPrice,
} from "./types";

/** Convert a price in any supported format to decimal odds. */
export function toDecimal(value: number | string, format: OddsFormat): number {
  switch (format) {
    case "decimal": {
      const decimal = typeof value === "string" ? Number.parseFloat(value) : value;
      if (!Number.isFinite(decimal) || decimal <= 1) {
        throw new Error(`Decimal odds must be greater than 1, got ${value}`);
      }
      return decimal;
    }
    case "american": {
      const american = typeof value === "string" ? Number.parseFloat(value) : value;
      if (!Number.isFinite(american) || Math.abs(american) < 100) {
        throw new Error(`American odds must be at least +/-100, got ${value}`);
      }
      return american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
    }
    case "fractional": {
      const text = String(value).trim();
      const match = text.match(/^(\d+(?:\.\d+)?)\s*[/:-]\s*(\d+(?:\.\d+)?)$/);
      if (!match) {
        throw new Error(`Fractional odds must look like "5/2", got ${value}`);
      }
      const numerator = Number.parseFloat(match[1]);
      const denominator = Number.parseFloat(match[2]);
      if (denominator <= 0) {
        throw new Error(`Fractional odds need a positive denominator, got ${value}`);
      }
      return 1 + numerator / denominator;
    }
  }
}

export function rawPriceToDecimal(price: RawPrice): number {
  return toDecimal(price.value, price.format);
}

/** Raw implied probability of a decimal price, margin still included. */
export function impliedProbability(decimal: number): number {
  if (!Number.isFinite(decimal) || decimal <= 1) {
    throw new Error(`Decimal odds must be greater than 1, got ${decimal}`);
  }
  return 1 / decimal;
}

/** Bookmaker margin: sum of raw implied probabilities minus 1. */
export function overround(decimals: number[]): number {
  return decimals.reduce((sum, d) => sum + impliedProbability(d), 0) - 1;
}

/**
 * Strip the margin from a set of decimal prices so the implied
 * probabilities sum to one.
 *
 * - `proportional` divides each implied probability by the booked total —
 *   the standard first move and what most hand de-vigging does.
 * - `power` solves for k so the k-th powers of the implied probabilities
 *   sum to one, which shifts more of the margin off longshots.
 */
export function devig(
  decimals: number[],
  method: DevigMethod = "proportional",
): DevigResult {
  if (decimals.length < 2) {
    throw new Error("De-vig needs at least two outcomes");
  }
  const implied = decimals.map(impliedProbability);
  const total = implied.reduce((sum, q) => sum + q, 0);
  const margin = total - 1;

  if (method === "proportional") {
    return {
      probabilities: implied.map((q) => q / total),
      overround: margin,
      method,
    };
  }

  // Power method: find k with sum(q_i^k) = 1. With an overround the raw sum
  // exceeds 1, so k > 1; a (rare) underround needs k < 1. Bisection on a
  // bracket wide enough for any real book.
  const sumAt = (k: number) => implied.reduce((sum, q) => sum + Math.pow(q, k), 0);
  let lo = 0.5;
  let hi = 5;
  // sumAt is decreasing in k. Expand the bracket if a pathological market needs it.
  while (sumAt(hi) > 1 && hi < 50) hi *= 2;
  while (sumAt(lo) < 1 && lo > 0.01) lo /= 2;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (sumAt(mid) > 1) lo = mid;
    else hi = mid;
  }
  const k = (lo + hi) / 2;
  const powered = implied.map((q) => Math.pow(q, k));
  const poweredTotal = powered.reduce((sum, q) => sum + q, 0);
  return {
    probabilities: powered.map((q) => q / poweredTotal),
    overround: margin,
    method,
  };
}

/** De-vig a moneyline, handling both two-way and three-way markets. */
export function devigMoneyline(
  odds: MoneylineOdds,
  method: DevigMethod = "proportional",
): { probabilities: OutcomeProbabilities; overround: number } {
  const threeWay = odds.draw !== undefined;
  const decimals = threeWay
    ? [odds.home, odds.draw as number, odds.away]
    : [odds.home, odds.away];
  const result = devig(decimals, method);
  const probabilities: OutcomeProbabilities = threeWay
    ? {
        home: result.probabilities[0],
        draw: result.probabilities[1],
        away: result.probabilities[2],
      }
    : { home: result.probabilities[0], away: result.probabilities[1] };
  return { probabilities, overround: result.overround };
}

/**
 * De-vig an over/under pair to the over probability. Returns null when
 * either price is missing — the caller falls back to treating the line
 * as fair.
 */
export function devigTotals(
  over: number | undefined,
  under: number | undefined,
  method: DevigMethod = "proportional",
): number | null {
  if (over === undefined || under === undefined) return null;
  return devig([over, under], method).probabilities[0];
}
