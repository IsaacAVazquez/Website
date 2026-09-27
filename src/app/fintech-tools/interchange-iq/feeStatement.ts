/**
 * Interchange IQ signature helpers: the fee statement bars and the
 * breakeven scale. Both are pure transforms of `calcProcessorResults` and
 * `calcStripeBreakevenTicket`, so the signature never disagrees with the
 * processor list or the breakeven text below it.
 */
import type { calcProcessorResults } from "@/lib/interchangeIq";

type ProcessorResult = ReturnType<typeof calcProcessorResults>[number];

/**
 * A fee this far below the most expensive processor renders as an
 * invisible sliver on the shared scale (an outlier 50x the rest would
 * otherwise leave the cheapest under 2%), so any nonzero fee gets at
 * least this much of the bar.
 */
const MIN_VISIBLE_FRACTION = 0.04;

export interface FeeStatementRow {
  id: string;
  name: string;
  model: ProcessorResult["model"];
  fee: number;
  /** Position on the shared scale set by the most expensive fee, 0..1. */
  fraction: number;
  isCheapest: boolean;
}

/**
 * Put every processor's monthly fee on one scale set by the most expensive
 * fee, and mark the cheapest. `calcProcessorResults` already sorts
 * cheapest first, but this finds the minimum itself rather than assuming
 * that order.
 */
export function feeStatement(results: ProcessorResult[]): FeeStatementRow[] {
  if (results.length === 0) return [];

  const fees = results.map((result) => result.monthlyFee);
  const maxFee = Math.max(...fees);
  const minFee = Math.min(...fees);
  let cheapestMarked = false;

  return results.map((result) => {
    const isCheapest = !cheapestMarked && result.monthlyFee === minFee;
    if (isCheapest) cheapestMarked = true;

    const rawFraction = maxFee > 0 ? result.monthlyFee / maxFee : 0;
    const fraction = rawFraction > 0 ? Math.max(rawFraction, MIN_VISIBLE_FRACTION) : 0;

    return {
      id: result.id,
      name: result.name,
      model: result.model,
      fee: result.monthlyFee,
      fraction,
      isCheapest,
    };
  });
}

const BREAKEVEN_DOMAIN_LOW = 5;
const BREAKEVEN_DOMAIN_HIGH = 500;

export interface BreakevenScale {
  domain: { low: number; high: number };
  ticketFraction: number;
  breakevenFraction: number | null;
}

/**
 * Place the average ticket and the Stripe flat vs. IC+ breakeven ticket on
 * a $5 to $500 scale, clamped at both ends so a ticket at the slider's
 * limits, or a breakeven the formula puts outside that range, still lands
 * on the bar instead of running off it.
 */
export function breakevenScale(avgTicket: number, breakevenTicket: number | null): BreakevenScale {
  const span = BREAKEVEN_DOMAIN_HIGH - BREAKEVEN_DOMAIN_LOW;
  const toFraction = (value: number) => Math.min(1, Math.max(0, (value - BREAKEVEN_DOMAIN_LOW) / span));

  return {
    domain: { low: BREAKEVEN_DOMAIN_LOW, high: BREAKEVEN_DOMAIN_HIGH },
    ticketFraction: toFraction(avgTicket),
    breakevenFraction: breakevenTicket !== null ? toFraction(breakevenTicket) : null,
  };
}
