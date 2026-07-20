import {
  buildInvestmentsPriceHealth,
  isRecentInvestmentPrice,
} from "../investmentsPriceHealth";

describe("investmentsPriceHealth", () => {
  const assessedAt = "2026-07-10T00:00:01.000Z";

  it("does not let a new snapshot timestamp hide an old market series", () => {
    expect(isRecentInvestmentPrice("2026-02-20", assessedAt)).toBe(false);
    expect(isRecentInvestmentPrice("2026-07-08", assessedAt)).toBe(true);
  });

  it("profiles recent, delayed, and missing histories separately", () => {
    expect(
      buildInvestmentsPriceHealth(
        ["2026-07-08", "2026-07-02", "2026-02-20", null],
        assessedAt
      )
    ).toEqual({
      assessedAt,
      maxAgeDays: 7,
      pricedCount: 3,
      recentCount: 1,
      delayedCount: 2,
      missingCount: 1,
      oldestAsOf: "2026-02-20",
      latestAsOf: "2026-07-08",
    });
  });

  it("treats invalid and materially future-dated values as unhealthy", () => {
    expect(isRecentInvestmentPrice("not-a-date", assessedAt)).toBe(false);
    expect(isRecentInvestmentPrice("2026-02-30", assessedAt)).toBe(false);
    expect(isRecentInvestmentPrice("2026-07-15", assessedAt)).toBe(false);
  });
});
