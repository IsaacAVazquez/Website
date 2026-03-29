import { renderHook, waitFor } from "@testing-library/react";
import { FANTASY_SNAPSHOT_SCHEMA_VERSION } from "@/lib/fantasy";
import { resetFantasySnapshotCacheForTests, useFantasySnapshot } from "../useFantasySnapshot";

const originalFetch = global.fetch;

describe("useFantasySnapshot", () => {
  beforeEach(() => {
    resetFantasySnapshotCacheForTests();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("loads position data from the published snapshot file", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        schemaVersion: FANTASY_SNAPSHOT_SCHEMA_VERSION,
        season: 2025,
        week: 0,
        generatedAt: "2026-03-18T00:00:00.000Z",
        scoringFormat: "STANDARD",
        source: "snapshot",
        sliceMetadata: {
          overall: { available: true, sourceKind: "derived_overall", rangeKind: "overall", playerCount: 1 },
          qb: { available: true, sourceKind: "shared_position_consensus", rangeKind: "position", playerCount: 1 },
          rb: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
          wr: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
          te: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
          flex: { available: true, sourceKind: "derived_flex", rangeKind: "position", playerCount: 0 },
          k: { available: true, sourceKind: "shared_position_consensus", rangeKind: "position", playerCount: 0 },
          dst: { available: true, sourceKind: "shared_position_consensus", rangeKind: "position", playerCount: 0 },
        },
        positions: {
          QB: [
            {
              id: "player-1",
              name: "Josh Allen",
              team: "BUF",
              position: "QB",
              averageRank: 1,
              projectedPoints: 360,
              standardDeviation: 1.2,
              expertRanks: [1],
            },
          ],
          RB: [],
          WR: [],
          TE: [],
          K: [],
          DST: [],
          FLEX: [],
        },
        overall: [
          {
            id: "player-1",
            name: "Josh Allen",
            team: "BUF",
            position: "QB",
            averageRank: 1,
            projectedPoints: 360,
            standardDeviation: 1.2,
            expertRanks: [1],
          },
        ],
      }),
    });

    const { result } = renderHook(() =>
      useFantasySnapshot({
        position: "qb",
        scoring: "standard",
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(global.fetch).toHaveBeenCalledWith(
      `/data/fantasy/standard.json?v=${FANTASY_SNAPSHOT_SCHEMA_VERSION}`,
      {
      cache: "force-cache",
      }
    );
    expect(result.current.players).toHaveLength(1);
    expect(result.current.metadata?.position).toBe("qb");
    expect(result.current.sliceMetadata?.available).toBe(true);
    expect(result.current.metadata?.slices?.overall.sourceKind).toBe("derived_overall");
  });

  it("loads the full snapshot when all=true", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        schemaVersion: FANTASY_SNAPSHOT_SCHEMA_VERSION,
        season: 2025,
        week: 0,
        generatedAt: "2026-03-18T00:00:00.000Z",
        scoringFormat: "HALF_PPR",
        source: "snapshot",
        sliceMetadata: {
          overall: { available: true, sourceKind: "derived_overall", rangeKind: "overall", playerCount: 1 },
          qb: { available: true, sourceKind: "shared_position_consensus", rangeKind: "position", playerCount: 0 },
          rb: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
          wr: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
          te: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
          flex: { available: true, sourceKind: "derived_flex", rangeKind: "position", playerCount: 0 },
          k: { available: true, sourceKind: "shared_position_consensus", rangeKind: "position", playerCount: 0 },
          dst: { available: true, sourceKind: "shared_position_consensus", rangeKind: "position", playerCount: 0 },
        },
        positions: {
          QB: [],
          RB: [],
          WR: [],
          TE: [],
          K: [],
          DST: [
            {
              id: "player-dst-1",
              name: "Denver Broncos",
              team: "DEN",
              position: "DST",
              averageRank: 1,
              projectedPoints: 135,
              standardDeviation: 1.2,
              expertRanks: [1],
            },
          ],
          FLEX: [],
        },
        overall: [
          {
            id: "player-2",
            name: "Bijan Robinson",
            team: "ATL",
            position: "RB",
            averageRank: 1,
            projectedPoints: 275,
            standardDeviation: 1.1,
            expertRanks: [1],
          },
        ],
      }),
    });

    const { result } = renderHook(() =>
      useFantasySnapshot({
        scoring: "half_ppr",
        all: true,
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.snapshot?.overall).toHaveLength(1);
    expect(result.current.players).toHaveLength(1);
    expect(result.current.metadata?.position).toBe("all");
    expect(result.current.metadata?.slice).toBeNull();
    expect(result.current.metadata?.slices?.overall.sourceKind).toBe("derived_overall");
    expect(result.current.metadata?.slices?.dst.available).toBe(true);
  });

  it("does not refetch when only the position changes for the same scoring format", async () => {
    const initialProps: { position: "rb" | "flex" } = { position: "rb" };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        schemaVersion: FANTASY_SNAPSHOT_SCHEMA_VERSION,
        season: 2025,
        week: 0,
        generatedAt: "2026-03-18T00:00:00.000Z",
        scoringFormat: "STANDARD",
        source: "snapshot",
        sliceMetadata: {
          overall: { available: true, sourceKind: "derived_overall", rangeKind: "overall", playerCount: 0 },
          qb: { available: true, sourceKind: "shared_position_consensus", rangeKind: "position", playerCount: 0 },
          rb: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 1 },
          wr: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
          te: { available: true, sourceKind: "position_consensus", rangeKind: "position", playerCount: 0 },
          flex: { available: true, sourceKind: "derived_flex", rangeKind: "position", playerCount: 1 },
          k: { available: true, sourceKind: "shared_position_consensus", rangeKind: "position", playerCount: 0 },
          dst: { available: true, sourceKind: "shared_position_consensus", rangeKind: "position", playerCount: 0 },
        },
        positions: {
          QB: [],
          RB: [
            {
              id: "player-3",
              name: "Saquon Barkley",
              team: "PHI",
              position: "RB",
              averageRank: 1,
              projectedPoints: 260,
              standardDeviation: 1.4,
              expertRanks: [1],
            },
          ],
          WR: [],
          TE: [],
          K: [],
          DST: [],
          FLEX: [
            {
              id: "player-3",
              name: "Saquon Barkley",
              team: "PHI",
              position: "RB",
              averageRank: 1,
              projectedPoints: 260,
              standardDeviation: 1.4,
              expertRanks: [1],
            },
          ],
        },
        overall: [],
      }),
    });

    const { result, rerender } = renderHook(
      ({ position }: { position: "rb" | "flex" }) =>
        useFantasySnapshot({
          position,
          scoring: "standard",
        }),
      {
        initialProps,
      }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender({ position: "flex" as const });

    await waitFor(() => expect(result.current.metadata?.position).toBe("flex"));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.players[0]?.position).toBe("RB");
  });

  it("normalizes a legacy snapshot without slice metadata", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        season: 2025,
        week: 0,
        generatedAt: "2026-03-18T00:00:00.000Z",
        scoringFormat: "PPR",
        source: "snapshot",
        positions: {
          QB: [
            {
              id: "player-legacy-qb",
              name: "Josh Allen",
              team: "BUF",
              position: "QB",
              averageRank: 21,
              projectedPoints: 360,
              standardDeviation: 1.1,
              expertRanks: [21],
            },
          ],
          RB: [],
          WR: [],
          TE: [],
          K: [],
          DST: [],
          FLEX: [],
        },
        overall: [
          {
            id: "player-4",
            name: "Ja'Marr Chase",
            team: "CIN",
            position: "WR",
            averageRank: 1,
            projectedPoints: 330,
            standardDeviation: 1.1,
            expertRanks: [1],
          },
        ],
      }),
    });

    const { result } = renderHook(() =>
      useFantasySnapshot({
        position: "qb",
        scoring: "ppr",
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.players).toHaveLength(1);
    expect(result.current.sliceMetadata?.available).toBe(true);
    expect(result.current.sliceMetadata?.sourceKind).toBe("shared_position_consensus");
    expect(result.current.snapshot?.sliceMetadata.qb.available).toBe(true);
  });

  it("surfaces api failures as a friendly error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const { result } = renderHook(() =>
      useFantasySnapshot({
        position: "overall",
        scoring: "standard",
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toMatch(/unavailable/i);
    expect(result.current.players).toHaveLength(0);
    expect(result.current.sliceMetadata).toBeNull();
  });
});
