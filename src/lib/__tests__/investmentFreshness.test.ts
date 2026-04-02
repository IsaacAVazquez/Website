import {
  buildInvestmentFreshness,
  getPriceAsOf,
  normalizeInvestmentFreshness,
  normalizeInvestmentSnapshot,
} from "../investmentFreshness";

describe("investmentFreshness", () => {
  it("derives the latest saved price date from date and report_date rows", () => {
    expect(
      getPriceAsOf([
        { report_date: "2026-03-14", close: 195 },
        { date: "2026-03-15", close: 198 },
      ])
    ).toBe("2026-03-15");
  });

  it("prunes empty freshness sections", () => {
    expect(
      buildInvestmentFreshness({
        snapshotBuiltAt: "2026-03-16T08:00:00.000Z",
        sections: {
          price: "2026-03-15",
          news: null,
          growth: "",
        },
      })
    ).toEqual({
      snapshotBuiltAt: "2026-03-16T08:00:00.000Z",
      sections: {
        price: "2026-03-15",
      },
    });
  });

  it("preserves persisted freshness values over recomputed section dates", () => {
    const freshness = normalizeInvestmentFreshness({
      lastUpdated: "2026-03-16T08:00:00.000Z",
      freshness: {
        snapshotBuiltAt: "2026-03-17T08:00:00.000Z",
        sections: {
          price: "2026-03-14",
        },
      },
      sections: {
        price: [
          { date: "2026-03-15", close: 198 },
        ],
      },
    });

    expect(freshness).toEqual({
      snapshotBuiltAt: "2026-03-17T08:00:00.000Z",
      sections: {
        price: "2026-03-14",
      },
    });
  });

  it("normalizes snapshots by backfilling freshness from the latest available price date", () => {
    const snapshot = normalizeInvestmentSnapshot({
      symbol: "AAPL",
      source: "prefetched",
      lastUpdated: "2026-03-16T08:00:00.000Z",
      capabilities: {
        info: true,
        price: true,
        compare: true,
      },
      sections: {
        info: { shortName: "Apple" },
        price: [
          { report_date: "2026-03-14", open: 192, high: 197, low: 191, close: 195, volume: 1000 },
          { date: "2026-03-15", open: 195, high: 199, low: 194, close: 198, volume: 1200 },
        ],
      },
    });

    expect(snapshot.freshness).toEqual({
      snapshotBuiltAt: "2026-03-16T08:00:00.000Z",
      sections: {
        price: "2026-03-15",
      },
    });
  });
});
