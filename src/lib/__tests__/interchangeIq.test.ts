import {
  buildCardMix,
  calcInterchange,
  calcProcessorResults,
  calcStripeBreakevenTicket,
  DEFAULT_INTERCHANGE_AMEX_OF_CREDIT,
  DEFAULT_INTERCHANGE_CREDIT_PCT,
  DEFAULT_INTERCHANGE_TICKET,
  DEFAULT_INTERCHANGE_VOLUME,
} from "../interchangeIq";

describe("interchangeIq", () => {
  it("builds a normalized card mix from credit and Amex percentages", () => {
    const mix = buildCardMix(
      DEFAULT_INTERCHANGE_CREDIT_PCT,
      DEFAULT_INTERCHANGE_AMEX_OF_CREDIT
    );

    expect(mix.creditFraction).toBeCloseTo(0.533, 3);
    expect(mix.debitFraction).toBeCloseTo(0.35, 3);
    expect(mix.amexFraction).toBeCloseTo(0.117, 3);
  });

  it("calculates blended interchange before processor markup", () => {
    const mix = buildCardMix(65, 18);
    const txCount = DEFAULT_INTERCHANGE_VOLUME / DEFAULT_INTERCHANGE_TICKET;

    expect(calcInterchange(DEFAULT_INTERCHANGE_VOLUME, txCount, mix)).toBeCloseTo(
      694.67,
      2
    );
  });

  it("sorts processor results cheapest first with stable per-transaction values", () => {
    const results = calcProcessorResults(
      DEFAULT_INTERCHANGE_VOLUME,
      DEFAULT_INTERCHANGE_TICKET,
      buildCardMix(65, 18)
    );

    expect(results[0]).toMatchObject({
      id: "stripe_ic",
      name: "Stripe IC+",
      model: "Interchange+",
    });
    expect(results.at(-1)).toMatchObject({
      id: "paypal",
      name: "PayPal",
      model: "Flat Rate",
    });
    expect(results[0].monthlyFee).toBeCloseTo(878.5, 2);
    expect(results[0].effectiveRate).toBeCloseTo(0.0176, 3);
    expect(results[0].perTxAvg).toBeCloseTo(1.49, 2);
  });

  it("returns null when Stripe IC+ beats flat rate at every ticket size", () => {
    // For the default mix, IC+'s effective per-transaction cost sits below flat
    // rate's at every positive ticket (the true crossover is negative), so there
    // is no flat-rate breakeven to report.
    expect(calcStripeBreakevenTicket(buildCardMix(65, 18))).toBeNull();
  });

  it("returns the ticket where flat rate and IC+ per-transaction costs cross", () => {
    // A debit-heavy mix pushes fixed interchange high enough that flat rate's
    // lower percentage wins on small tickets, so a positive breakeven exists.
    const mix = buildCardMix(0, 0); // all debit
    const breakeven = calcStripeBreakevenTicket(mix);
    expect(breakeven).not.toBeNull();
    expect(breakeven!).toBeGreaterThan(0);

    // Cross-check against the full cost model: at the breakeven ticket, Stripe
    // flat and Stripe IC+ must cost the same per transaction, which proves it is
    // the real crossover rather than an artifact of the formula.
    const results = calcProcessorResults(10_000, breakeven!, mix);
    const flat = results.find((result) => result.id === "stripe")!;
    const ic = results.find((result) => result.id === "stripe_ic")!;
    expect(flat.perTxAvg).toBeCloseTo(ic.perTxAvg, 6);
  });

  it("keeps zero volume calculations finite", () => {
    const results = calcProcessorResults(0, 85, buildCardMix(65, 18));

    expect(results.every((result) => result.monthlyFee === 0)).toBe(true);
    expect(results.every((result) => result.effectiveRate === 0)).toBe(true);
    expect(results.every((result) => Number.isFinite(result.perTxAvg))).toBe(true);
  });
});
