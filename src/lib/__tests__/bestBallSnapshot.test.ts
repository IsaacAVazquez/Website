import {
  assertBestBallAdpCoverage,
  assertBestBallRankingCoverage,
  assertBestBallSuperflexCoverage,
  BEST_BALL_SUPERFLEX_CORE_QB_COUNT,
  BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
  getBestBallSuperflexCoreQuarterbackIds,
  normalizeBestBallSnapshot,
} from "@/lib/bestBallSnapshot";

describe("assertBestBallRankingCoverage", () => {
  it("rejects a board that cannot fill a supported 216-pick room", () => {
    expect(() =>
      assertBestBallRankingCoverage({
        players: 216,
        previousPlayers: 0,
        previousTopPlayers: 0,
        retainedTopPlayers: 0,
      })
    ).toThrow(/returned 216 players/);
  });

  it("rejects a fresh board that loses too much prior coverage", () => {
    expect(() =>
      assertBestBallRankingCoverage({
        players: 300,
        previousPlayers: 377,
        previousTopPlayers: 150,
        retainedTopPlayers: 119,
      })
    ).toThrow(/300 players versus 377 previously/);
  });

  it("accepts a full board with ordinary same-season churn", () => {
    expect(() =>
      assertBestBallRankingCoverage({
        players: 360,
        previousPlayers: 377,
        previousTopPlayers: 150,
        retainedTopPlayers: 140,
      })
    ).not.toThrow();
  });
});

describe("assertBestBallAdpCoverage", () => {
  it("rejects a fresh ADP join that falls materially below the prior snapshot", () => {
    expect(() =>
      assertBestBallAdpCoverage({
        freshSourceReceived: true,
        matches: 200,
        previousMatches: 339,
        previousTopPlayers: 140,
        retainedTopPlayers: 100,
      })
    ).toThrow(/200 players versus 339 previously/);
  });

  it("allows a failed optional ADP refresh to retain the prior snapshot data", () => {
    expect(() =>
      assertBestBallAdpCoverage({
        freshSourceReceived: false,
        matches: 0,
        previousMatches: 339,
        previousTopPlayers: 140,
        retainedTopPlayers: 0,
      })
    ).not.toThrow();
  });
});

describe("assertBestBallSuperflexCoverage", () => {
  const healthyCoverage: Parameters<typeof assertBestBallSuperflexCoverage>[0] = {
    freshSourceReceived: true,
    totalPlayers: 377,
    rankMatches: 377,
    tierMatches: 377,
    topBoardPlayers: 150,
    topBoardRankMatches: 150,
    topBoardTierMatches: 150,
    quarterbackPlayers: 44,
    quarterbackRankMatches: 44,
    quarterbackTierMatches: 44,
    coreQuarterbackPlayers: 42,
    coreQuarterbackRankMatches: 42,
    coreQuarterbackTierMatches: 42,
    hasPreviousSource: true,
  };

  it("rejects a thin fresh response even when a previous source exists", () => {
    expect(() =>
      assertBestBallSuperflexCoverage({
        ...healthyCoverage,
        rankMatches: 149,
        tierMatches: 149,
        topBoardRankMatches: 149,
        topBoardTierMatches: 149,
      })
    ).toThrow(/Superflex ranks for 149 of 377 players/);
  });

  it("rejects a fresh response that clears the absolute floor but misses most of the board", () => {
    expect(() =>
      assertBestBallSuperflexCoverage({
        ...healthyCoverage,
        rankMatches: 300,
        tierMatches: 300,
      })
    ).toThrow(/300 of 377 players/);
  });

  it("rejects a fresh response that misses too much of the top board", () => {
    expect(() =>
      assertBestBallSuperflexCoverage({
        ...healthyCoverage,
        topBoardRankMatches: 142,
        topBoardTierMatches: 142,
      })
    ).toThrow(/top 150 matched 142 ranks/);
  });

  it("accepts the current public boards when only four fringe quarterbacks are absent", () => {
    expect(() =>
      assertBestBallSuperflexCoverage({
        ...healthyCoverage,
        totalPlayers: 402,
        rankMatches: 398,
        tierMatches: 398,
        topBoardPlayers: 150,
        topBoardRankMatches: 150,
        topBoardTierMatches: 150,
        quarterbackPlayers: 50,
        quarterbackRankMatches: 46,
        quarterbackTierMatches: 46,
      })
    ).not.toThrow();
  });

  it("rejects a fresh response that loses more than ten percent of all quarterbacks", () => {
    expect(() =>
      assertBestBallSuperflexCoverage({
        ...healthyCoverage,
        totalPlayers: 402,
        rankMatches: 398,
        tierMatches: 398,
        quarterbackPlayers: 50,
        quarterbackRankMatches: 44,
        quarterbackTierMatches: 44,
      })
    ).toThrow(/Quarterbacks matched 44 ranks/);
  });

  it("rejects a fresh response that misses a core quarterback", () => {
    expect(() =>
      assertBestBallSuperflexCoverage({
        ...healthyCoverage,
        coreQuarterbackRankMatches: 41,
        coreQuarterbackTierMatches: 41,
      })
    ).toThrow(/core contains 42 of 42 required players and matched 41 ranks/);
  });

  it("rejects a standard board that does not contain the 42-player quarterback core", () => {
    expect(() =>
      assertBestBallSuperflexCoverage({
        ...healthyCoverage,
        quarterbackPlayers: 41,
        quarterbackRankMatches: 41,
        quarterbackTierMatches: 41,
        coreQuarterbackPlayers: 41,
        coreQuarterbackRankMatches: 41,
        coreQuarterbackTierMatches: 41,
      })
    ).toThrow(/core contains 41 of 42 required players/);
  });

  it("allows a failed refresh only when the current season has a prior source", () => {
    expect(() =>
      assertBestBallSuperflexCoverage({
        ...healthyCoverage,
        freshSourceReceived: false,
        rankMatches: 0,
        tierMatches: 0,
        topBoardRankMatches: 0,
        topBoardTierMatches: 0,
        quarterbackRankMatches: 0,
        quarterbackTierMatches: 0,
        coreQuarterbackRankMatches: 0,
        coreQuarterbackTierMatches: 0,
      })
    ).not.toThrow();
    expect(() =>
      assertBestBallSuperflexCoverage({
        ...healthyCoverage,
        freshSourceReceived: false,
        rankMatches: 0,
        tierMatches: 0,
        topBoardRankMatches: 0,
        topBoardTierMatches: 0,
        quarterbackRankMatches: 0,
        quarterbackTierMatches: 0,
        coreQuarterbackRankMatches: 0,
        coreQuarterbackTierMatches: 0,
        hasPreviousSource: false,
      })
    ).toThrow(/no usable Superflex/);
  });

  it("selects the first 42 quarterback position ranks as the exact core", () => {
    const quarterbacks = Array.from({ length: 45 }, (_, index) => {
      const positionRank = 45 - index;
      return {
        id: `qb-${positionRank}`,
        name: `Quarterback ${positionRank}`,
        team: "FA",
        position: "QB",
        positionRank,
        averageRank: index + 1,
      } as const;
    });

    const coreIds = getBestBallSuperflexCoreQuarterbackIds(quarterbacks);

    expect(coreIds.size).toBe(BEST_BALL_SUPERFLEX_CORE_QB_COUNT);
    expect(coreIds.has("qb-1")).toBe(true);
    expect(coreIds.has("qb-42")).toBe(true);
    expect(coreIds.has("qb-43")).toBe(false);
  });
});

const PLAYER = {
  id: "fp-1",
  name: "Test Player",
  team: "buf",
  position: "WR",
  averageRank: 1,
  standardDeviation: 2.5,
};

const JAGUARS_PLAYER = {
  ...PLAYER,
  id: "fp-2",
  name: "Jacksonville Player",
  team: "JAC",
};

describe("normalizeBestBallSnapshot", () => {
  it("normalizes a complete snapshot", () => {
    const snapshot = normalizeBestBallSnapshot({
      schemaVersion: BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
      season: 2026,
      generatedAt: "2026-08-02T12:00:00Z",
      players: [PLAYER, JAGUARS_PLAYER],
      rankingSource: {
        provider: "FantasyPros",
        url: "https://example.com/ranks",
        asOf: "2026-08-01T12:00:00Z",
        expertCount: 6,
      },
      superflexSource: null,
      adpSource: null,
      scheduleSource: null,
      week17Opponents: {
        buf: "mia",
        MIA: "BUF",
        JAX: "WSH",
        WSH: "JAX",
        BAD: "BAD",
      },
    });

    expect(snapshot.players[0]).toMatchObject({ team: "BUF", position: "WR" });
    expect(snapshot.rankingSource.expertCount).toBe(6);
    expect(snapshot.players[1]).toMatchObject({ team: "JAX", position: "WR" });
    expect(snapshot.week17Opponents).toEqual({
      BUF: "MIA",
      MIA: "BUF",
      JAX: "WAS",
      WAS: "JAX",
    });
  });

  it("keeps a player when the source does not publish expert spread", () => {
    const { standardDeviation: _spread, ...playerWithoutSpread } = PLAYER;
    const snapshot = normalizeBestBallSnapshot({
      schemaVersion: BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
      season: 2026,
      generatedAt: "2026-08-02T12:00:00Z",
      players: [playerWithoutSpread],
      rankingSource: {
        provider: "FantasyPros official API",
        url: "https://example.com/ranks",
        asOf: "2026-08-01T12:00:00Z",
      },
      superflexSource: null,
      adpSource: null,
      scheduleSource: null,
      week17Opponents: {},
    });

    expect(snapshot.players[0]).not.toHaveProperty("standardDeviation");
  });

  it("rejects an incomplete snapshot", () => {
    expect(() => normalizeBestBallSnapshot({ schemaVersion: 1 })).toThrow(
      "Best ball rankings snapshot is incomplete."
    );
  });
});
