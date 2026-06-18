/**
 * @jest-environment node
 */
import { FANTASY_SNAPSHOT_SCHEMA_VERSION } from "@/lib/fantasy";
import {
  buildFantasySnapshot,
  getNflRegularSeasonWeek,
  getSnapshotSeason,
} from "@/lib/fantasySnapshotBuilder";

const NFL_WEEKS = 18;

describe("getSnapshotSeason", () => {
  it("keeps the in-progress season through the January playoffs", () => {
    expect(getSnapshotSeason(new Date(Date.UTC(2027, 0, 6)))).toBe(2026); // championship week
    expect(getSnapshotSeason(new Date(Date.UTC(2027, 1, 10)))).toBe(2026); // post-Super Bowl
  });

  it("rolls to the new season in March", () => {
    expect(getSnapshotSeason(new Date(Date.UTC(2027, 2, 1)))).toBe(2027);
    expect(getSnapshotSeason(new Date(Date.UTC(2026, 8, 10)))).toBe(2026); // in-season
  });
});

describe("getNflRegularSeasonWeek", () => {
  it("reports week 0 during the offseason and before Week 1 kickoff", () => {
    expect(getNflRegularSeasonWeek(2026, new Date(Date.UTC(2026, 5, 8)))).toBe(0); // June
    expect(getNflRegularSeasonWeek(2026, new Date(Date.UTC(2026, 8, 1)))).toBe(0); // Sep 1, before kickoff
  });

  it("counts up through the regular season", () => {
    const earlyOctober = getNflRegularSeasonWeek(2026, new Date(Date.UTC(2026, 9, 1)));
    const lateNovember = getNflRegularSeasonWeek(2026, new Date(Date.UTC(2026, 10, 25)));

    expect(earlyOctober).toBeGreaterThanOrEqual(3);
    expect(earlyOctober).toBeLessThanOrEqual(6);
    expect(lateNovember).toBeGreaterThan(earlyOctober);
    expect(lateNovember).toBeLessThanOrEqual(NFL_WEEKS);
  });

  it("caps at the final regular-season week through the playoffs and offseason rollover", () => {
    expect(getNflRegularSeasonWeek(2026, new Date(Date.UTC(2026, 11, 25)))).toBeGreaterThanOrEqual(15); // late December
    expect(getNflRegularSeasonWeek(2026, new Date(Date.UTC(2027, 1, 1)))).toBe(NFL_WEEKS); // following February
  });
});

describe("fantasySnapshotBuilder", () => {
  it("publishes sourced overall and position availability for every scoring format", () => {
    for (const scoring of ["ppr", "half_ppr", "standard"] as const) {
      const snapshot = buildFantasySnapshot(scoring);

      expect(snapshot.schemaVersion).toBe(FANTASY_SNAPSHOT_SCHEMA_VERSION);
      expect(snapshot.upstreamUpdatedAt).toMatch(/^20\d{2}-/);
      expect(snapshot.sliceMetadata.overall.available).toBe(true);
      expect(snapshot.sliceMetadata.overall.sourceKind).toBe("overall_consensus");
      expect(snapshot.sliceMetadata.overall.rangeKind).toBe("overall");
      expect(snapshot.sliceMetadata.overall.updatedAt).toBe(snapshot.upstreamUpdatedAt);
      expect(snapshot.sliceMetadata.qb.available).toBe(true);
      expect(snapshot.sliceMetadata.rb.available).toBe(true);
      expect(snapshot.sliceMetadata.wr.available).toBe(true);
      expect(snapshot.sliceMetadata.te.available).toBe(true);
      expect(snapshot.sliceMetadata.flex.available).toBe(true);
      expect(snapshot.sliceMetadata.k.available).toBe(true);
      expect(snapshot.sliceMetadata.dst.available).toBe(true);
      expect(snapshot.positions.RB.length).toBeGreaterThan(50);
      expect(snapshot.positions.FLEX.length).toBeGreaterThan(100);
    }
  });

  it("marks qb, k, and dst as shared scoring-agnostic slices across formats", () => {
    const pprSnapshot = buildFantasySnapshot("ppr");
    const halfPprSnapshot = buildFantasySnapshot("half_ppr");
    const standardSnapshot = buildFantasySnapshot("standard");

    expect(pprSnapshot.sliceMetadata.qb.sourceKind).toBe("shared_position_consensus");
    expect(pprSnapshot.sliceMetadata.k.sourceKind).toBe("shared_position_consensus");
    expect(pprSnapshot.sliceMetadata.dst.sourceKind).toBe("shared_position_consensus");

    // The QB/K/DST consensus is scoring-agnostic, but ADP is layered on per
    // scoring format (Fantasy Football Calculator publishes separate
    // ppr/half-ppr/standard feeds), so the boards can differ only in their
    // adp overlay. Compare the consensus with the adp field stripped.
    const withoutAdp = <T extends { adp?: number }>(players: T[]) =>
      players.map(({ adp, ...rest }) => rest);

    expect(withoutAdp(pprSnapshot.positions.QB)).toEqual(withoutAdp(halfPprSnapshot.positions.QB));
    expect(withoutAdp(pprSnapshot.positions.QB)).toEqual(withoutAdp(standardSnapshot.positions.QB));
    expect(withoutAdp(pprSnapshot.positions.K)).toEqual(withoutAdp(halfPprSnapshot.positions.K));
    expect(withoutAdp(pprSnapshot.positions.K)).toEqual(withoutAdp(standardSnapshot.positions.K));
    expect(withoutAdp(pprSnapshot.positions.DST)).toEqual(withoutAdp(halfPprSnapshot.positions.DST));
    expect(withoutAdp(pprSnapshot.positions.DST)).toEqual(withoutAdp(standardSnapshot.positions.DST));
  });

  it("keeps sourced position ranges and freshness metadata", () => {
    const snapshot = buildFantasySnapshot("standard");
    const topQuarterback = snapshot.positions.QB[0];

    expect(snapshot.sliceMetadata.qb.available).toBe(true);
    expect(snapshot.sliceMetadata.qb.rangeKind).toBe("position");
    expect(snapshot.sliceMetadata.qb.updatedAt).toMatch(/^20\d{2}-/);
    expect(topQuarterback.name).toBe("Josh Allen");
    expect(topQuarterback.positionRank).toBe(1);
    expect(Number(topQuarterback.minRank)).toBeGreaterThan(0);
    expect(Number(topQuarterback.maxRank)).toBeGreaterThanOrEqual(Number(topQuarterback.minRank));
  });

  it("never publishes synthetic projections or expert rank arrays, and omits adp when the dataset is empty", () => {
    // Mock an empty ADP dataset rather than relying on the committed seed,
    // which now ships populated. With no entries, no player should carry an
    // adp field and the snapshot should disclose no ADP source.
    jest.resetModules();
    jest.doMock("@/lib/fantasyAdpData", () => ({
      getFantasyAdpDataset: () => ({
        entries: [],
        asOf: null,
        sampleSize: null,
        sourceUrl: "",
      }),
    }));

    try {
      jest.isolateModules(() => {
        const {
          buildFantasySnapshot: buildEmptyAdpSnapshot,
          // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules requires a synchronous callback; dynamic import() would not work here
        } = require("../fantasySnapshotBuilder") as typeof import("../fantasySnapshotBuilder");
        const snapshot = buildEmptyAdpSnapshot("ppr");
        const firstOverallPlayer = snapshot.overall[0];
        const firstPositionPlayer = snapshot.positions.RB[0];

        expect(firstOverallPlayer).toBeDefined();
        expect("projectedPoints" in firstOverallPlayer).toBe(false);
        expect("expertRanks" in firstOverallPlayer).toBe(false);
        expect("adp" in firstOverallPlayer).toBe(false);
        expect("projectedPoints" in firstPositionPlayer).toBe(false);
        expect("expertRanks" in firstPositionPlayer).toBe(false);
        expect("adp" in firstPositionPlayer).toBe(false);
        expect(snapshot.adpSource).toBeNull();
      });
    } finally {
      jest.dontMock("@/lib/fantasyAdpData");
      jest.resetModules();
    }
  });

  it("attaches matched adp readings and discloses the adp source when a dataset is present", () => {
    jest.resetModules();
    jest.doMock("@/lib/fantasyAdpData", () => ({
      getFantasyAdpDataset: () => ({
        entries: [
          { name: "Josh Allen", team: "BUF", position: "QB", adp: 22.4 },
          { name: "Nobody Matched", team: "FA", position: "WR", adp: 199.9 },
        ],
        asOf: "2026-06-07T00:00:00.000Z",
        sampleSize: 421,
        sourceUrl: "https://example.test/adp/ppr",
      }),
    }));

    try {
      jest.isolateModules(() => {
        const {
          buildFantasySnapshot: buildAdpFantasySnapshot,
          // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules requires a synchronous callback; dynamic import() would not work here
        } = require("../fantasySnapshotBuilder") as typeof import("../fantasySnapshotBuilder");
        const snapshot = buildAdpFantasySnapshot("ppr");

        const joshAllen = snapshot.positions.QB.find((player) => player.name === "Josh Allen");
        expect(joshAllen?.adp).toBe(22.4);

        // Players without a matched reading carry no adp field at all.
        const unmatched = snapshot.positions.QB.find((player) => player.name !== "Josh Allen");
        expect(unmatched).toBeDefined();
        expect(unmatched && "adp" in unmatched).toBe(false);

        expect(snapshot.adpSource).toMatchObject({
          url: "https://example.test/adp/ppr",
          asOf: "2026-06-07T00:00:00.000Z",
          sampleSize: 421,
        });
        expect(snapshot.adpSource?.provider).toBeTruthy();
        expect(snapshot.adpSource?.matchedCount).toBeGreaterThan(0);
      });
    } finally {
      jest.dontMock("@/lib/fantasyAdpData");
      jest.resetModules();
    }
  });

  it("derives flex from the sourced overall board and preserves eligible positions", () => {
    const snapshot = buildFantasySnapshot("ppr");

    expect(snapshot.sliceMetadata.flex.sourceKind).toBe("derived_flex");
    expect(snapshot.sliceMetadata.flex.rangeKind).toBe("overall");
    expect(snapshot.sliceMetadata.flex.updatedAt).toBe(snapshot.sliceMetadata.overall.updatedAt);
    expect(snapshot.positions.FLEX.every((player) => ["RB", "WR", "TE"].includes(player.position))).toBe(true);
    expect(snapshot.positions.FLEX[0].averageRank).toBe(1);
  });

  it("uses the mocked sourced overall board when isolated with synthetic public data", () => {
    const createPlayers = (position: "QB" | "RB" | "WR" | "TE" | "K" | "DST", teamPrefix: string) =>
      Array.from({ length: 20 }, (_, index) => ({
        id: `${position}-${index + 1}`,
        name: `${position} ${index + 1}`,
        team: `${teamPrefix}${index % 10}`,
        position,
        averageRank: index + 1,
        rankEcr: index + 1,
        rankAverage: index + 1.25,
        standardDeviation: 1,
        minRank: index + 1,
        maxRank: index + 2,
        positionRank: index + 1,
        tier: Math.floor(index / 5) + 1,
        lastUpdated: "2026-04-15T15:29:20.000Z",
        projectedPoints: 0,
        expertRanks: [],
      }));

    const syntheticPositionData = {
      QB: createPlayers("QB", "Q"),
      RB: createPlayers("RB", "R"),
      WR: createPlayers("WR", "W"),
      TE: createPlayers("TE", "T"),
      K: createPlayers("K", "K"),
      DST: createPlayers("DST", "D"),
    };
    const syntheticOverall = [
      ...syntheticPositionData.RB,
      ...syntheticPositionData.WR,
      ...syntheticPositionData.QB,
      ...syntheticPositionData.TE,
      ...syntheticPositionData.K,
      ...syntheticPositionData.DST,
    ].map((player, index) => ({
      ...player,
      averageRank: index + 1,
      rankEcr: index + 1,
      rankAverage: index + 1.25,
    }));

    jest.resetModules();
    jest.doMock("@/lib/fantasyPositionData", () => ({
      getFantasyOverallData: () => syntheticOverall,
      getFantasyPositionData: (position: keyof typeof syntheticPositionData) =>
        syntheticPositionData[position] ?? [],
      getFantasyPositionDataMetadata: () => ({
        generatedAt: "2026-04-15T16:00:00.000Z",
        source: "mock",
        upstreamUpdatedAt: "2026-04-15T15:29:20.000Z",
      }),
    }));

    try {
      jest.isolateModules(() => {
        const {
          buildFantasySnapshot: buildSyntheticFantasySnapshot,
          // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules requires a synchronous callback; dynamic import() would not work here
        } = require("../fantasySnapshotBuilder") as typeof import("../fantasySnapshotBuilder");
        const snapshot = buildSyntheticFantasySnapshot("ppr");

        expect(snapshot.sliceMetadata.overall.sourceKind).toBe("overall_consensus");
        expect(snapshot.overall[0].id).toBe("RB-1");
        expect(snapshot.positions.FLEX[0].averageRank).toBe(1);
        expect(snapshot.sliceMetadata.flex.updatedAt).toBe("2026-04-15T15:29:20.000Z");
      });
    } finally {
      jest.dontMock("@/lib/fantasyPositionData");
      jest.resetModules();
    }
  });
});
