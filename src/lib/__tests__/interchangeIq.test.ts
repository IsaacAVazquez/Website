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

  it("returns a Stripe flat-rate breakeven ticket for favorable card mixes", () => {
    expect(calcStripeBreakevenTicket(buildCardMix(65, 18))).toBeCloseTo(14.14, 2);
  });

  it("keeps zero volume calculations finite", () => {
    const results = calcProcessorResults(0, 85, buildCardMix(65, 18));

    expect(results.every((result) => result.monthlyFee === 0)).toBe(true);
    expect(results.every((result) => result.effectiveRate === 0)).toBe(true);
    expect(results.every((result) => Number.isFinite(result.perTxAvg))).toBe(true);
  });
});
