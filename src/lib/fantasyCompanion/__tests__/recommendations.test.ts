import {
  addFantasyCompanionPick,
  createBestBallRoomConfig,
  createFantasyCompanionState,
  createRedraftRoomConfig,
  getFantasyCompanionRecommendations,
  rankAvailableRedraftPlayers,
} from "@/lib/fantasyCompanion";
import type { Player, Position } from "@/types";

function player(
  id: string,
  position: Position,
  averageRank: number,
  options: Partial<Player> = {}
): Player {
  return {
    id,
    name: `Player ${id}`,
    team: "SF",
    position,
    averageRank,
    rankEcr: averageRank,
    tier: Math.ceil(averageRank / 12),
    ...options,
  };
}

describe("redraft companion recommendations", () => {
  it("uses the scoring-specific consensus rank and reports ADP as context", () => {
    const room = createRedraftRoomConfig({ season: 2026, scoring: "PPR" });
    let state = createFantasyCompanionState(room);
    const drafted = player("drafted", "WR", 1);
    const result = addFantasyCompanionPick(state, drafted);
    if (!result.ok) throw new Error("test setup failed");
    state = result.state;

    const lowerEcr = player("lower-ecr", "RB", 30, { rankEcr: 8, adp: 30 });
    const lowerAdp = player("lower-adp", "WR", 7, { rankEcr: 10, adp: 2 });
    const recommendations = rankAvailableRedraftPlayers(
      [drafted, lowerAdp, lowerEcr],
      state
    );

    expect(recommendations.map((entry) => entry.player.id)).toEqual([
      "lower-ecr",
      "lower-adp",
    ]);
    expect(recommendations[0]).toMatchObject({
      rank: 1,
      sourceRank: 8,
      adpDeltaAtCurrentPick: -28,
    });
    expect(recommendations[0].reason).toContain("PPR consensus rank is 8");
    expect(getFantasyCompanionRecommendations({ state, players: [lowerAdp, lowerEcr] }))
      .toMatchObject({ kind: "redraft", mode: "consensus" });
  });

  it("does not produce recommendations after the draft is complete", () => {
    const room = createRedraftRoomConfig({ season: 2026, teams: 2, rounds: 1 });
    let state = createFantasyCompanionState(room);
    const pool = [player("1", "WR", 1), player("2", "RB", 2), player("3", "TE", 3)];
    for (const drafted of pool.slice(0, 2)) {
      const result = addFantasyCompanionPick(state, drafted);
      if (result.ok) state = result.state;
    }
    expect(rankAvailableRedraftPlayers(pool, state)).toEqual([]);
  });
});

describe("best-ball companion recommendations", () => {
  const pool: Player[] = [
    player("wr", "WR", 1, { adp: 1.2, team: "SF" }),
    player("rb", "RB", 2, { adp: 2.1, team: "ATL" }),
    player("qb", "QB", 20, { adp: 20.2, team: "BUF" }),
    player("te", "TE", 24, { adp: 24.5, team: "KC" }),
  ];

  it("reuses the exact current best-ball engine for supported contest ADP", () => {
    const state = createFantasyCompanionState(
      createBestBallRoomConfig({ season: 2026, contestId: "bbm-vii", userTeam: 1 })
    );
    const result = getFantasyCompanionRecommendations({ state, players: pool, limit: 2 });
    expect(result).toMatchObject({ kind: "best-ball", mode: "exact" });
    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations.every((entry) => entry.player.position !== "K")).toBe(true);
  });

  it("withholds exact scores between the user's turns and restores them on the clock", () => {
    let state = createFantasyCompanionState(
      createBestBallRoomConfig({ season: 2026, contestId: "bbm-vii", userTeam: 2 })
    );

    const offTurn = getFantasyCompanionRecommendations({ state, players: pool, limit: 2 });
    expect(offTurn).toMatchObject({
      kind: "best-ball",
      mode: "exact",
      recommendations: [],
    });
    expect(offTurn.reason).toContain("when your team is on the clock");

    const firstPick = addFantasyCompanionPick(state, pool[0]);
    if (!firstPick.ok) throw new Error("test setup failed");
    state = firstPick.state;

    const onTurn = getFantasyCompanionRecommendations({ state, players: pool, limit: 2 });
    expect(onTurn).toMatchObject({ kind: "best-ball", mode: "exact" });
    expect(onTurn.recommendations).toHaveLength(2);
  });

  it("keeps unsupported contest slates in reference mode", () => {
    for (const contestId of ["eliminator", "weekly-winners", "sit-and-go", "superflex"] as const) {
      const state = createFantasyCompanionState(
        createBestBallRoomConfig({ season: 2026, contestId })
      );
      const result = getFantasyCompanionRecommendations({ state, players: pool });
      expect(result.kind).toBe("best-ball");
      expect(result.mode).toBe("reference");
      expect(result.recommendations).toEqual([]);
      expect(result.reason.length).toBeGreaterThan(20);
    }
  });
});
