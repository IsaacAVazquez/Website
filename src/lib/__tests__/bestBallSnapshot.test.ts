import {
  assertBestBallAdpCoverage,
  assertBestBallRankingCoverage,
  assertBestBallSuperflexCoverage,
  BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
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
  it("rejects a thin fresh response even when a previous source exists", () => {
    expect(() =>
      assertBestBallSuperflexCoverage({
        freshSourceReceived: true,
        totalPlayers: 377,
        rankMatches: 149,
        tierMatches: 149,
        topBoardPlayers: 150,
        topBoardRankMatches: 149,
        topBoardTierMatches: 149,
        quarterbackPlayers: 44,
        quarterbackRankMatches: 44,
        quarterbackTierMatches: 44,
        hasPreviousSource: true,
      })
    ).toThrow(/Superflex ranks for 149 of 377 players/);
  });

  it("rejects a fresh response that clears the absolute floor but misses most of the board", () => {
    expect(() =>
      assertBestBallSuperflexCoverage({
        freshSourceReceived: true,
        totalPlayers: 377,
        rankMatches: 300,
        tierMatches: 300,
        topBoardPlayers: 150,
        topBoardRankMatches: 150,
        topBoardTierMatches: 150,
        quarterbackPlayers: 44,
        quarterbackRankMatches: 44,
        quarterbackTierMatches: 44,
        hasPreviousSource: true,
      })
    ).toThrow(/300 of 377 players/);
  });

  it("rejects a fresh response that misses too much of the top board", () => {
    expect(() =>
      assertBestBallSuperflexCoverage({
        freshSourceReceived: true,
        totalPlayers: 377,
        rankMatches: 377,
        tierMatches: 377,
        topBoardPlayers: 150,
        topBoardRankMatches: 142,
        topBoardTierMatches: 142,
        quarterbackPlayers: 44,
        quarterbackRankMatches: 44,
        quarterbackTierMatches: 44,
        hasPreviousSource: true,
      })
    ).toThrow(/top 150 matched 142 ranks/);
  });

  it("rejects a fresh response that misses any quarterback", () => {
    expect(() =>
      assertBestBallSuperflexCoverage({
        freshSourceReceived: true,
        totalPlayers: 377,
        rankMatches: 376,
        tierMatches: 376,
        topBoardPlayers: 150,
        topBoardRankMatches: 150,
        topBoardTierMatches: 150,
        quarterbackPlayers: 44,
        quarterbackRankMatches: 43,
        quarterbackTierMatches: 43,
        hasPreviousSource: true,
      })
    ).toThrow(/Quarterbacks matched 43 ranks/);
  });

  it("allows a failed refresh only when the current season has a prior source", () => {
    expect(() =>
      assertBestBallSuperflexCoverage({
        freshSourceReceived: false,
        totalPlayers: 377,
        rankMatches: 0,
        tierMatches: 0,
        topBoardPlayers: 150,
        topBoardRankMatches: 0,
        topBoardTierMatches: 0,
        quarterbackPlayers: 44,
        quarterbackRankMatches: 0,
        quarterbackTierMatches: 0,
        hasPreviousSource: true,
      })
    ).not.toThrow();
    expect(() =>
      assertBestBallSuperflexCoverage({
        freshSourceReceived: false,
        totalPlayers: 377,
        rankMatches: 0,
        tierMatches: 0,
        topBoardPlayers: 150,
        topBoardRankMatches: 0,
        topBoardTierMatches: 0,
        quarterbackPlayers: 44,
        quarterbackRankMatches: 0,
        quarterbackTierMatches: 0,
        hasPreviousSource: false,
      })
    ).toThrow(/no usable Superflex/);
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
    expect(snapshot.players[1]).toMatchObject({ team: "JAX", position: "WR" });
    expect(snapshot.week17Opponents).toEqual({
      BUF: "MIA",
      MIA: "BUF",
      JAX: "WAS",
      WAS: "JAX",
    });
  });

  it("rejects an incomplete snapshot", () => {
    expect(() => normalizeBestBallSnapshot({ schemaVersion: 1 })).toThrow(
      "Best ball rankings snapshot is incomplete."
    );
  });
});
