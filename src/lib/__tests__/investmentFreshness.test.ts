import {
  buildInvestmentFreshness,
  getPriceAsOf,
  normalizeInvestmentFreshness,
  normalizeInvestmentSnapshot,
  mergeInvestmentSnapshots,
} from "../investmentFreshness";
import type { InvestmentSnapshot } from "@/types/investment";

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

  it("suppresses the legacy EPS-based DCF section", () => {
    const snapshot = normalizeInvestmentSnapshot({
      symbol: "AAPL",
      source: "prefetched",
      lastUpdated: "2026-03-16T08:00:00.000Z",
      capabilities: { price: true, dcf: true },
      sections: {
        price: [{ date: "2026-03-15", open: 10, high: 11, low: 9, close: 10, volume: 100 }],
        dcf: { fairValue: 999, recommendation: "Buy" },
      },
    } as unknown as InvestmentSnapshot);

    expect(snapshot.capabilities).not.toHaveProperty("dcf");
    expect(snapshot.sections).not.toHaveProperty("dcf");
  });

  it("recomputes capabilities from meaningful served data", () => {
    const snapshot = normalizeInvestmentSnapshot({
      symbol: "SPY",
      source: "prefetched",
      lastUpdated: "2026-03-16T08:00:00.000Z",
      capabilities: {
        fundamentals: true,
        profitability: true,
        margins: true,
        compare: true,
      },
      sections: {
        info: { shortName: "SPDR S&P 500 ETF Trust" },
        fundamentals: {},
        profitability: [{}],
        margins: [{}],
      },
    });

    expect(snapshot.capabilities).toMatchObject({
      info: true,
      fundamentals: false,
      profitability: false,
      margins: false,
      compare: false,
    });
  });

  it("retains a prior meaningful section after a partial refresh", () => {
    const merged = mergeInvestmentSnapshots(
      {
        symbol: "AAPL",
        source: "prefetched",
        lastUpdated: "2026-03-17T08:00:00.000Z",
        freshness: {
          snapshotBuiltAt: "2026-03-17T08:00:00.000Z",
          sections: { price: "2026-03-16" },
        },
        capabilities: { price: true, fundamentals: false },
        sections: {
          price: [{ date: "2026-03-16", open: 10, high: 11, low: 9, close: 10, volume: 100 }],
          fundamentals: {},
        },
      },
      {
        symbol: "AAPL",
        source: "prefetched",
        lastUpdated: "2026-03-10T08:00:00.000Z",
        freshness: {
          snapshotBuiltAt: "2026-03-10T08:00:00.000Z",
          sections: { price: "2026-03-09" },
        },
        capabilities: { price: true, fundamentals: true },
        sections: {
          price: [{ date: "2026-03-09", open: 9, high: 10, low: 8, close: 9, volume: 90 }],
          fundamentals: { ttmPe: 25 },
        },
      }
    );

    expect(merged.sections.fundamentals).toEqual({ ttmPe: 25 });
    expect(merged.capabilities.fundamentals).toBe(true);
    expect(merged.freshness).toMatchObject({
      snapshotBuiltAt: "2026-03-17T08:00:00.000Z",
      sections: { price: "2026-03-16" },
      retainedSections: ["fundamentals"],
    });
  });

  it("retains prior price history when fresh-dated raw rows normalize to nothing", () => {
    const merged = mergeInvestmentSnapshots(
      {
        symbol: "AAPL",
        source: "prefetched",
        lastUpdated: "2026-03-17T08:00:00.000Z",
        freshness: {
          snapshotBuiltAt: "2026-03-17T08:00:00.000Z",
          sections: {},
        },
        capabilities: { price: false },
        sections: {},
      },
      {
        symbol: "AAPL",
        source: "prefetched",
        lastUpdated: "2026-03-10T08:00:00.000Z",
        freshness: {
          snapshotBuiltAt: "2026-03-10T08:00:00.000Z",
          sections: { price: "2026-03-09" },
        },
        capabilities: { price: true },
        sections: {
          price: [{ date: "2026-03-09", open: 9, high: 10, low: 8, close: 9, volume: 90 }],
        },
      }
    );

    expect(merged.sections.price).toEqual([
      { date: "2026-03-09", open: 9, high: 10, low: 8, close: 9, volume: 90 },
    ]);
    expect(merged.capabilities.price).toBe(true);
    expect(merged.freshness).toMatchObject({
      sections: { price: "2026-03-09" },
      retainedSections: ["price"],
    });
  });

  it("does not replace newer prior price history with an older normalized subset", () => {
    const merged = mergeInvestmentSnapshots(
      {
        symbol: "AAPL",
        source: "prefetched",
        lastUpdated: "2026-03-17T08:00:00.000Z",
        freshness: {
          snapshotBuiltAt: "2026-03-17T08:00:00.000Z",
          sections: { price: "2026-03-07" },
        },
        capabilities: { price: true },
        sections: {
          price: [{ date: "2026-03-07", open: 8, high: 9, low: 7, close: 8, volume: 80 }],
        },
      },
      {
        symbol: "AAPL",
        source: "prefetched",
        lastUpdated: "2026-03-10T08:00:00.000Z",
        freshness: {
          snapshotBuiltAt: "2026-03-10T08:00:00.000Z",
          sections: { price: "2026-03-09" },
        },
        capabilities: { price: true },
        sections: {
          price: [{ date: "2026-03-09", open: 9, high: 10, low: 8, close: 9, volume: 90 }],
        },
      }
    );

    expect(merged.sections.price).toEqual([
      { date: "2026-03-09", open: 9, high: 10, low: 8, close: 9, volume: 90 },
    ]);
    expect(merged.freshness).toMatchObject({
      sections: { price: "2026-03-09" },
      retainedSections: ["price"],
    });
  });

  it("fills missing fields from the prior valid section and marks the merge", () => {
    const merged = mergeInvestmentSnapshots(
      {
        symbol: "AAPL",
        source: "prefetched",
        lastUpdated: "2026-03-17T08:00:00.000Z",
        capabilities: { fundamentals: true },
        sections: { fundamentals: { ttmPe: 28 } },
      },
      {
        symbol: "AAPL",
        source: "prefetched",
        lastUpdated: "2026-03-10T08:00:00.000Z",
        capabilities: { fundamentals: true },
        sections: { fundamentals: { ttmPe: 25, marketCap: 3_000_000 } },
      },
    );

    expect(merged.sections.fundamentals).toEqual({
      ttmPe: 28,
      marketCap: 3_000_000,
    });
    expect(merged.freshness?.retainedSections).toEqual(["fundamentals"]);
  });

  it("retains a missing annual statement while accepting new quarterly rows", () => {
    const merged = mergeInvestmentSnapshots(
      {
        symbol: "AAPL",
        source: "prefetched",
        lastUpdated: "2026-03-17T08:00:00.000Z",
        capabilities: { income_statement: true },
        sections: {
          income_statement: {
            quarterly: [{ period: "Q1", revenue: 110 }],
            annual: { error: "provider failed" },
          } as never,
        },
      },
      {
        symbol: "AAPL",
        source: "prefetched",
        lastUpdated: "2026-03-10T08:00:00.000Z",
        capabilities: { income_statement: true },
        sections: {
          income_statement: {
            quarterly: [{ period: "Q4", revenue: 100 }],
            annual: [{ period: "FY", revenue: 400 }],
          },
        },
      },
    );

    expect(merged.sections.income_statement).toEqual({
      quarterly: [{ period: "Q1", revenue: 110 }],
      annual: [{ period: "FY", revenue: 400 }],
    });
    expect(merged.freshness?.retainedSections).toEqual(["income_statement"]);
  });

  it("retains full prior price coverage when a same-date refresh collapses to one row", () => {
    const priorPrice = Array.from({ length: 20 }, (_, index) => ({
      date: `2026-03-${String(index + 1).padStart(2, "0")}`,
      open: 100 + index,
      high: 102 + index,
      low: 99 + index,
      close: 101 + index,
      volume: 1_000 + index,
    }));
    const merged = mergeInvestmentSnapshots(
      {
        symbol: "AAPL",
        source: "prefetched",
        lastUpdated: "2026-03-21T08:00:00.000Z",
        freshness: {
          snapshotBuiltAt: "2026-03-21T08:00:00.000Z",
          sections: { price: "2026-03-20" },
        },
        capabilities: { price: true },
        sections: { price: [priorPrice.at(-1)!] },
      },
      {
        symbol: "AAPL",
        source: "prefetched",
        lastUpdated: "2026-03-20T08:00:00.000Z",
        freshness: {
          snapshotBuiltAt: "2026-03-20T08:00:00.000Z",
          sections: { price: "2026-03-20" },
        },
        capabilities: { price: true },
        sections: { price: priorPrice },
      },
    );

    expect(merged.sections.price).toHaveLength(20);
    expect(merged.freshness?.retainedSections).toEqual(["price"]);
  });
});
