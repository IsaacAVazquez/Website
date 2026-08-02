import {
  BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
  normalizeBestBallSnapshot,
} from "@/lib/bestBallSnapshot";

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
