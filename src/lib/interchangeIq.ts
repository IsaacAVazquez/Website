export const INTERCHANGE_RATES = {
  visaMcCredit: { rate: 0.0165, fixed: 0.1 },
  visaMcDebit: { rate: 0.0025, fixed: 0.22 },
  amex: { rate: 0.023, fixed: 0 },
};

export interface FlatProcessor {
  id: string;
  name: string;
  model: "Flat Rate";
  pctRate: number;
  fixedFee: number;
  note: string;
}

export interface InterchangePlusProcessor {
  id: string;
  name: string;
  model: "Interchange+";
  markupPct: number;
  markupFixed: number;
  note: string;
}

export type Processor = FlatProcessor | InterchangePlusProcessor;

export const PROCESSORS: Processor[] = [
  { id: "stripe", name: "Stripe", model: "Flat Rate", pctRate: 0.029, fixedFee: 0.3, note: "Standard online card rate" },
  { id: "square", name: "Square", model: "Flat Rate", pctRate: 0.026, fixedFee: 0.1, note: "Card-present; online is 2.9%+$0.30" },
  { id: "shopify", name: "Shopify", model: "Flat Rate", pctRate: 0.029, fixedFee: 0.3, note: "Shopify Payments basic plan" },
  { id: "paypal", name: "PayPal", model: "Flat Rate", pctRate: 0.0349, fixedFee: 0.49, note: "Standard checkout rate" },
  { id: "stripe_ic", name: "Stripe IC+", model: "Interchange+", markupPct: 0.0025, markupFixed: 0.1, note: "Custom pricing; typically $250k+/yr volume" },
  { id: "adyen", name: "Adyen", model: "Interchange+", markupPct: 0.003, markupFixed: 0.13, note: "Processing markup + blended scheme fees" },
  { id: "checkout", name: "Checkout.com", model: "Interchange+", markupPct: 0.0025, markupFixed: 0.1, note: "Enterprise tier; volume minimums apply" },
];

export const DEFAULT_INTERCHANGE_VOLUME = 50_000;
export const DEFAULT_INTERCHANGE_TICKET = 85;
export const DEFAULT_INTERCHANGE_CREDIT_PCT = 65;
export const DEFAULT_INTERCHANGE_AMEX_OF_CREDIT = 18;

export interface CardMix {
  creditFraction: number;
  debitFraction: number;
  amexFraction: number;
}

export interface ProcessorResult {
  id: string;
  name: string;
  model: "Flat Rate" | "Interchange+";
  monthlyFee: number;
  effectiveRate: number;
  txCount: number;
  perTxAvg: number;
  note: string;
}

export function buildCardMix(creditPct: number, amexOfCredit: number): CardMix {
  const creditFrac = creditPct / 100;
  const amexFrac = creditFrac * (amexOfCredit / 100);

  return {
    creditFraction: creditFrac - amexFrac,
    debitFraction: 1 - creditFrac,
    amexFraction: amexFrac,
  };
}

export function calcInterchange(
  volume: number,
  txCount: number,
  mix: CardMix
): number {
  return (
    mix.creditFraction *
      (INTERCHANGE_RATES.visaMcCredit.rate * volume +
        INTERCHANGE_RATES.visaMcCredit.fixed * txCount) +
    mix.debitFraction *
      (INTERCHANGE_RATES.visaMcDebit.rate * volume +
        INTERCHANGE_RATES.visaMcDebit.fixed * txCount) +
    mix.amexFraction *
      (INTERCHANGE_RATES.amex.rate * volume +
        INTERCHANGE_RATES.amex.fixed * txCount)
  );
}

export function calcProcessorResults(
  volume: number,
  avgTicket: number,
  mix: CardMix
): ProcessorResult[] {
  const txCount = volume / avgTicket;
  const interchange = calcInterchange(volume, txCount, mix);

  return PROCESSORS.map((processor): ProcessorResult => {
    const fee =
      processor.model === "Flat Rate"
        ? processor.pctRate * volume + processor.fixedFee * txCount
        : interchange +
          processor.markupPct * volume +
          processor.markupFixed * txCount;

    return {
      id: processor.id,
      name: processor.name,
      model: processor.model,
      monthlyFee: fee,
      effectiveRate: volume > 0 ? fee / volume : 0,
      txCount,
      perTxAvg: txCount > 0 ? fee / txCount : 0,
      note: processor.note,
    };
  }).sort((left, right) => left.monthlyFee - right.monthlyFee);
}

export function calcStripeBreakevenTicket(mix: CardMix): number | null {
  const interchangeEffRate =
    mix.creditFraction * INTERCHANGE_RATES.visaMcCredit.rate +
    mix.debitFraction * INTERCHANGE_RATES.visaMcDebit.rate +
    mix.amexFraction * INTERCHANGE_RATES.amex.rate;

  // Per-transaction fixed interchange the IC+ processor passes through on top of
  // its own markup. Leaving this out (and flipping the fixed-fee sign) produced
  // a phantom positive breakeven and told small-ticket merchants flat rate wins
  // when IC+ is actually cheaper.
  const interchangeFixed =
    mix.creditFraction * INTERCHANGE_RATES.visaMcCredit.fixed +
    mix.debitFraction * INTERCHANGE_RATES.visaMcDebit.fixed +
    mix.amexFraction * INTERCHANGE_RATES.amex.fixed;

  const stripeFlat = PROCESSORS.find((processor) => processor.id === "stripe") as
    | FlatProcessor
    | undefined;
  const stripeIC = PROCESSORS.find((processor) => processor.id === "stripe_ic") as
    | InterchangePlusProcessor
    | undefined;

  if (!stripeFlat || !stripeIC) return null;

  // Solve flat.pct·T + flat.fixed = ic.eff·T + ic.fixed + ic.markupPct·T +
  // ic.markupFixed for the ticket T where the two per-transaction costs meet.
  // Flat's percentage rate is higher, so a crossover only exists when flat's
  // fixed fee is the larger fixed component; otherwise IC+ wins at every ticket.
  const rateDiff = stripeFlat.pctRate - (interchangeEffRate + stripeIC.markupPct);
  const fixedDiff = interchangeFixed + stripeIC.markupFixed - stripeFlat.fixedFee;
  const breakeven = rateDiff > 0 ? fixedDiff / rateDiff : null;

  return breakeven !== null && breakeven > 0 ? breakeven : null;
}
