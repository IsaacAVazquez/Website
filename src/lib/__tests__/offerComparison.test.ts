import {
  compareOffers,
  createBlankOffer,
  createDefaultOffers,
  decodeOffers,
  projectOffer,
} from "../offerComparison";

describe("offer comparison", () => {
  it("splits the default offers' leaders between year one and four years", () => {
    const result = compareOffers(createDefaultOffers());
    const [a, b] = result.offers;

    // A: 165,000 base + 15% bonus + 4% match + 5% of 200,000 + 30,000 signing.
    expect(a.years[0].total).toBeCloseTo(165_000 + 24_750 + 6_600 + 10_000 + 30_000);
    // B: 155,000 base + 10% bonus + 5% match + 25% of 240,000 + 10,000 signing.
    expect(b.years[0].total).toBeCloseTo(155_000 + 15_500 + 7_750 + 60_000 + 10_000);
    expect(result.firstYearLeader).toBe(1);
    expect(result.firstYearLead).toBeCloseTo(11_900);

    // Base over four years at a 3% raise is 1 + 1.03 + 1.0609 + 1.092727 = 4.183627 times the start.
    expect(a.sums.base).toBeCloseTo(165_000 * 4.183627, 2);
    expect(a.sums.equity).toBeCloseTo(200_000);
    expect(a.sums.total).toBeCloseTo(1_051_455.16, 1);
    expect(b.sums.total).toBeCloseTo(995_731.51, 1);
    expect(result.leader).toBe(0);
    expect(result.lead).toBeCloseTo(55_723.65, 1);
    expect(result.close).toBe(false);
  });

  it("prices each year's vest at the middle of that year", () => {
    const offer = { ...createBlankOffer(0), baseSalary: 0, matchPercent: 0, equityGrant: 100_000, equityGrowthPercent: 10 };
    const { years } = projectOffer(offer);
    expect(years[0].equity).toBeCloseTo(25_000 * 1.1 ** 0.5);
    expect(years[3].equity).toBeCloseTo(25_000 * 1.1 ** 3.5);
  });

  it("calls offers within 2% a wash and labels a cleared name by its letter", () => {
    const offers = [createBlankOffer(0), { ...createBlankOffer(1), name: "  ", signingBonus: 1_000 }];
    const result = compareOffers(offers);
    expect(result.close).toBe(true);
    expect(result.offers[1].name).toBe("Offer B");
  });

  it("repairs a persisted list", () => {
    expect(decodeOffers(null)).toEqual(createDefaultOffers());
    expect(decodeOffers([{}])).toEqual(createDefaultOffers());

    const [first, second, third] = decodeOffers([
      { name: "x".repeat(60), baseSalary: -5, vesting: "cliff", bonusPercent: "12" },
      { baseSalary: 9e9, raisePercent: 4 },
      null,
      { name: "fourth" },
    ]);
    expect(first.name).toHaveLength(40);
    expect(first.baseSalary).toBe(0);
    expect(first.vesting).toBe("even");
    expect(first.bonusPercent).toBe(10);
    expect(second.baseSalary).toBe(5_000_000);
    expect(second.raisePercent).toBe(4);
    expect(third).toEqual(createBlankOffer(2));
  });
});
