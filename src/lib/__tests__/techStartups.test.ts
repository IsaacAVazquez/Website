/**
 * @jest-environment node
 */
import {
  buildTechStartupSnapshot,
  calculateMomentumScore,
  formatUsdCompact,
  sortTechStartups,
  type BuildTechStartupSnapshotInput,
  type TechStartupSeedEntry,
} from "@/lib/techStartups";
import type { TechStartup, TechStartupSortKey } from "@/types/techStartup";

function seedEntry(overrides: Partial<TechStartupSeedEntry> = {}): TechStartupSeedEntry {
  return {
    id: overrides.id ?? "acme",
    name: "Acme",
    description: "desc",
    sector: { key: "sector-ai", label: "AI" },
    stage: { key: "stage-late", label: "Late" },
    headquarters: "San Francisco",
    country: "US",
    founded: 2015,
    website: "https://acme.example",
    totalRaised: 1_000_000,
    valuation: null,
    employees: "51-200",
    lastRound: { stage: "Series A", amount: 10_000_000, date: "2026-01", leadInvestors: ["Foo"] },
    notableInvestors: ["Foo"],
    tags: ["ai"],
    ...overrides,
  };
}

function buildInput(
  entries: TechStartupSeedEntry[],
  overrides: Partial<BuildTechStartupSnapshotInput> = {}
): BuildTechStartupSnapshotInput {
  return {
    entries,
    generatedAt: "2026-07-06T00:00:00Z",
    asOf: "2026-07-06",
    verified: false,
    sourceLabel: "Curated",
    sourceUrl: "https://example.com",
    disclaimer: "Illustrative figures.",
    ...overrides,
  };
}

function startup(overrides: Partial<TechStartup>): TechStartup {
  return {
    id: overrides.id ?? "s",
    name: "S",
    description: "d",
    sector: "sector-ai",
    stage: "stage-late",
    headquarters: "San Francisco",
    country: "US",
    founded: 2015,
    website: "https://s.example",
    totalRaised: 0,
    valuation: 0,
    employees: "1-10",
    lastRound: { stage: "Seed", amount: 0, date: "2020-01", leadInvestors: [] },
    notableInvestors: [],
    tags: [],
    momentumScore: 0,
    ...overrides,
  };
}

describe("calculateMomentumScore", () => {
  it("blends recency (24-month window) with log10 round size and valuation", () => {
    // recency: months=0 -> max(0, 24)*2.5 = 60
    // round: log10(99_999_999 + 1) = 8 -> 8*3 = 24
    // valuation: log10(999_999_999 + 1) = 9 -> 9*1.5 = 13.5
    const score = calculateMomentumScore(
      {
        totalRaised: 5_000_000,
        valuation: 999_999_999,
        lastRound: { stage: "Series C", amount: 99_999_999, date: "2026-07", leadInvestors: [] },
      },
      "2026-07-06"
    );
    expect(score).toBe(97.5);
  });

  it("clamps the recency contribution to zero once a round is 24+ months old", () => {
    // round + valuation only (recency clamped): 24 + 13.5 = 37.5
    const atBoundary = calculateMomentumScore(
      {
        totalRaised: 5_000_000,
        valuation: 999_999_999,
        lastRound: { stage: "Series C", amount: 99_999_999, date: "2024-07", leadInvestors: [] },
      },
      "2026-07-06"
    );
    const wellPast = calculateMomentumScore(
      {
        totalRaised: 5_000_000,
        valuation: 999_999_999,
        lastRound: { stage: "Series C", amount: 99_999_999, date: "2020-07", leadInvestors: [] },
      },
      "2026-07-06"
    );
    expect(atBoundary).toBe(37.5);
    expect(wellPast).toBe(37.5);
  });

  it("floors months-since at zero so a future round still reads as fully recent", () => {
    const futureRound = calculateMomentumScore(
      {
        totalRaised: 5_000_000,
        valuation: 999_999_999,
        lastRound: { stage: "Series C", amount: 99_999_999, date: "2027-01", leadInvestors: [] },
      },
      "2026-07-06"
    );
    // recency floored to months=0 -> full 60, matching a same-month round: 60 + 24 + 13.5
    expect(futureRound).toBe(97.5);
  });

  it("falls back to totalRaised for the valuation term when valuation is null", () => {
    const round = { stage: "Series C", amount: 99_999_999, date: "2026-07", leadInvestors: [] };
    const nullValuation = calculateMomentumScore(
      { totalRaised: 999_999_999, valuation: null, lastRound: round },
      "2026-07-06"
    );
    const explicitValuation = calculateMomentumScore(
      // totalRaised here must be ignored because valuation is present
      { totalRaised: 1, valuation: 999_999_999, lastRound: round },
      "2026-07-06"
    );
    expect(nullValuation).toBe(97.5);
    expect(nullValuation).toBe(explicitValuation);
  });
});

describe("buildTechStartupSnapshot", () => {
  it("counts a valuation exactly at the $1B unicorn threshold (>=) and derives totals", () => {
    const snapshot = buildTechStartupSnapshot(
      buildInput([
        seedEntry({ id: "exact", totalRaised: 100, valuation: 1_000_000_000 }),
        seedEntry({ id: "below", totalRaised: 200, valuation: 999_999_999 }),
        seedEntry({ id: "undisclosed", totalRaised: 300, valuation: null }),
      ])
    );
    expect(snapshot.totals.unicornCount).toBe(1);
    expect(snapshot.totals.startups).toBe(3);
    expect(snapshot.totals.totalRaised).toBe(600);
    // null valuation coalesced to 0: 1_000_000_000 + 999_999_999 + 0
    expect(snapshot.totals.totalValuation).toBe(1_999_999_999);
  });

  it("defaults the currency to USD but honors an explicit override", () => {
    const usd = buildTechStartupSnapshot(buildInput([seedEntry()]));
    const eur = buildTechStartupSnapshot(buildInput([seedEntry()], { currency: "EUR" }));
    expect(usd.currency).toBe("USD");
    expect(eur.currency).toBe("EUR");
  });
});

describe("sortTechStartups", () => {
  it("sorts by valuation descending, breaking ties with totalRaised (null valuation as 0)", () => {
    const result = sortTechStartups(
      [
        startup({ id: "a", valuation: 1000, totalRaised: 50 }),
        startup({ id: "b", valuation: 1000, totalRaised: 100 }),
        startup({ id: "c", valuation: 2000, totalRaised: 1 }),
        startup({ id: "d", valuation: null, totalRaised: 999 }),
      ],
      "valuation"
    );
    expect(result.map((s) => s.id)).toEqual(["c", "b", "a", "d"]);
  });

  it("sorts by raised descending, breaking ties with valuation", () => {
    const result = sortTechStartups(
      [
        startup({ id: "a", totalRaised: 1000, valuation: 50 }),
        startup({ id: "b", totalRaised: 1000, valuation: 100 }),
        startup({ id: "c", totalRaised: 2000, valuation: 1 }),
      ],
      "raised"
    );
    expect(result.map((s) => s.id)).toEqual(["c", "b", "a"]);
  });

  it("sorts by most recent round date, breaking ties with momentum score", () => {
    const result = sortTechStartups(
      [
        startup({ id: "a", lastRound: { stage: "S", amount: 0, date: "2025-01", leadInvestors: [] }, momentumScore: 50 }),
        startup({ id: "b", lastRound: { stage: "S", amount: 0, date: "2025-01", leadInvestors: [] }, momentumScore: 90 }),
        startup({ id: "c", lastRound: { stage: "S", amount: 0, date: "2026-06", leadInvestors: [] }, momentumScore: 1 }),
      ],
      "recent"
    );
    expect(result.map((s) => s.id)).toEqual(["c", "b", "a"]);
  });

  it("sorts by momentum descending, breaking ties with valuation", () => {
    const result = sortTechStartups(
      [
        startup({ id: "a", momentumScore: 50, valuation: 50 }),
        startup({ id: "b", momentumScore: 50, valuation: 100 }),
        startup({ id: "c", momentumScore: 90, valuation: 1 }),
      ],
      "momentum"
    );
    expect(result.map((s) => s.id)).toEqual(["c", "b", "a"]);
  });

  it("falls back to the momentum sort for an unknown sort key", () => {
    const result = sortTechStartups(
      [
        startup({ id: "a", momentumScore: 10 }),
        startup({ id: "b", momentumScore: 30 }),
      ],
      "bogus" as TechStartupSortKey
    );
    expect(result.map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("does not mutate the input array", () => {
    const input = [
      startup({ id: "a", momentumScore: 10 }),
      startup({ id: "b", momentumScore: 30 }),
    ];
    sortTechStartups(input, "momentum");
    expect(input.map((s) => s.id)).toEqual(["a", "b"]);
  });
});

describe("formatUsdCompact", () => {
  it("formats at the trillion, billion, million, and thousand boundaries", () => {
    expect(formatUsdCompact(1e12)).toBe("$1T");
    expect(formatUsdCompact(1e9)).toBe("$1B");
    expect(formatUsdCompact(1e6)).toBe("$1M");
    expect(formatUsdCompact(1e3)).toBe("$1K");
  });

  it("emits a raw dollar figure below the thousand boundary", () => {
    expect(formatUsdCompact(999)).toBe("$999");
    expect(formatUsdCompact(0)).toBe("$0");
  });

  it("keeps one decimal place for non-integer scaled values and rounds half up", () => {
    expect(formatUsdCompact(13_800_000_000)).toBe("$13.8B");
    expect(formatUsdCompact(300_000_000_000)).toBe("$300B");
    expect(formatUsdCompact(600_000_000)).toBe("$600M");
    expect(formatUsdCompact(1_250_000_000)).toBe("$1.3B");
  });

  it("returns 'Undisclosed' for null and NaN", () => {
    expect(formatUsdCompact(null)).toBe("Undisclosed");
    expect(formatUsdCompact(Number.NaN)).toBe("Undisclosed");
  });
});
