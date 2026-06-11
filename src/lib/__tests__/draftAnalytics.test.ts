/**
 * @jest-environment node
 */
import {
  classifyPickValue,
  computeDraftAnalytics,
  detectPositionRuns,
  getLiveDraftSignals,
  getPickBaseline,
  getPickDelta,
  getReachStealThreshold,
  getTeamValueTotal,
  REACH_STEAL_MIN_THRESHOLD,
} from "@/lib/draftAnalytics";
import type { DraftPick, Player, TeamRoster } from "@/types";

function player(overrides: Partial<Player>): Player {
  return {
    id: overrides.id ?? `player-${overrides.name ?? "x"}`,
    name: "Test Player",
    team: "SF",
    position: "RB",
    averageRank: 50,
    standardDeviation: 1,
    ...overrides,
  } as Player;
}

function pick(overrides: Partial<DraftPick> & { player: Player }): DraftPick {
  return {
    pickNumber: 1,
    round: 1,
    teamNumber: 1,
    timestamp: new Date("2026-08-30T00:00:00Z"),
    ...overrides,
  };
}

function roster(teamNumber: number, picks: DraftPick[]): TeamRoster {
  const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 };
  for (const teamPick of picks) {
    const position = teamPick.player.position as keyof typeof positionCounts;
    if (position in positionCounts) {
      positionCounts[position] += 1;
    }
  }

  return {
    teamNumber,
    picks,
    positionCounts,
    totalValue: 0,
    projectedPoints: 0,
  };
}

describe("getPickBaseline", () => {
  it("prefers adp, then consensus rank, then average rank", () => {
    expect(getPickBaseline(player({ adp: 12.4, rankEcr: 20, averageRank: 22 }))).toBe(12.4);
    expect(getPickBaseline(player({ rankEcr: 20, averageRank: 22 }))).toBe(20);
    expect(getPickBaseline(player({ averageRank: 22 }))).toBe(22);
    expect(getPickBaseline(player({ averageRank: Number.NaN }))).toBeNull();
  });
});

describe("getReachStealThreshold", () => {
  it("holds the floor early and widens by round", () => {
    expect(getReachStealThreshold(1)).toBe(REACH_STEAL_MIN_THRESHOLD);
    expect(getReachStealThreshold(2)).toBe(REACH_STEAL_MIN_THRESHOLD);
    expect(getReachStealThreshold(3)).toBe(9);
    expect(getReachStealThreshold(5)).toBe(15);
    expect(getReachStealThreshold(12)).toBe(36);
  });
});

describe("classifyPickValue", () => {
  it("flags steals, reaches, and leaves ordinary picks alone", () => {
    const steal = pick({ pickNumber: 30, round: 3, player: player({ adp: 15 }) });
    const reach = pick({ pickNumber: 10, round: 1, player: player({ adp: 25 }) });
    const ordinary = pick({ pickNumber: 18, round: 2, player: player({ adp: 16 }) });
    const unjudgeable = pick({ pickNumber: 5, round: 1, player: player({ averageRank: Number.NaN }) });

    expect(getPickDelta(steal)).toBe(15);
    expect(classifyPickValue(steal)).toBe("steal");
    expect(classifyPickValue(reach)).toBe("reach");
    expect(classifyPickValue(ordinary)).toBeNull();
    expect(classifyPickValue(unjudgeable)).toBeNull();
  });

  it("requires a larger gap in later rounds", () => {
    // A 10-spot gap is a flag in round 1 but noise in round 12 (threshold 36).
    const earlyGap = pick({ pickNumber: 20, round: 1, player: player({ adp: 10 }) });
    const lateGap = pick({ pickNumber: 150, round: 12, player: player({ adp: 140 }) });

    expect(classifyPickValue(earlyGap)).toBe("steal");
    expect(classifyPickValue(lateGap)).toBeNull();
  });
});

describe("detectPositionRuns", () => {
  it("finds clusters of same-position picks inside the window", () => {
    const picks = [
      pick({ pickNumber: 31, round: 3, player: player({ id: "rb1", position: "RB" }) }),
      pick({ pickNumber: 33, round: 3, player: player({ id: "rb2", position: "RB" }) }),
      pick({ pickNumber: 34, round: 3, player: player({ id: "wr1", position: "WR" }) }),
      pick({ pickNumber: 36, round: 3, player: player({ id: "rb3", position: "RB" }) }),
      pick({ pickNumber: 38, round: 4, player: player({ id: "rb4", position: "RB" }) }),
    ];

    const runs = detectPositionRuns(picks);
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      position: "RB",
      playersSelected: 4,
      startPick: 31,
      endPick: 38,
      startRound: 3,
      endRound: 4,
    });
  });

  it("splits clusters separated by more than the window and honors minCount", () => {
    const picks = [
      pick({ pickNumber: 1, round: 1, player: player({ id: "qb1", position: "QB" }) }),
      pick({ pickNumber: 3, round: 1, player: player({ id: "qb2", position: "QB" }) }),
      // Eleven picks later; a new cluster, but only two players, so no run.
      pick({ pickNumber: 14, round: 2, player: player({ id: "qb3", position: "QB" }) }),
      pick({ pickNumber: 16, round: 2, player: player({ id: "qb4", position: "QB" }) }),
    ];

    expect(detectPositionRuns(picks)).toHaveLength(0);
    expect(detectPositionRuns(picks, { minCount: 2 })).toHaveLength(2);
  });
});

describe("computeDraftAnalytics", () => {
  it("returns empty analytics for an empty draft", () => {
    const analytics = computeDraftAnalytics([], []);

    expect(analytics.bestValue).toEqual([]);
    expect(analytics.reaches).toEqual([]);
    expect(analytics.steals).toEqual([]);
    expect(analytics.positionRunAnalysis).toEqual([]);
    expect(analytics.teamStrengths).toEqual([]);
  });

  it("sorts steals and reaches by how far they beat or trailed the baseline", () => {
    const bigSteal = pick({ pickNumber: 40, round: 4, player: player({ id: "s1", adp: 10 }) });
    const smallSteal = pick({ pickNumber: 30, round: 3, player: player({ id: "s2", adp: 18 }) });
    const reach = pick({ pickNumber: 5, round: 1, player: player({ id: "r1", adp: 30 }) });

    const analytics = computeDraftAnalytics([smallSteal, reach, bigSteal], []);

    expect(analytics.steals.map((entry) => entry.player.id)).toEqual(["s1", "s2"]);
    expect(analytics.reaches.map((entry) => entry.player.id)).toEqual(["r1"]);
    expect(analytics.bestValue[0].player.id).toBe("s1");
  });

  it("grades teams by net value and reads strengths from the starter targets", () => {
    const valueTeamPicks = [
      pick({ pickNumber: 20, round: 2, teamNumber: 1, player: player({ id: "v1", position: "RB", adp: 5 }) }),
      pick({ pickNumber: 32, round: 3, teamNumber: 1, player: player({ id: "v2", position: "RB", adp: 12 }) }),
      pick({ pickNumber: 44, round: 4, teamNumber: 1, player: player({ id: "v3", position: "RB", adp: 30 }) }),
    ];
    const reachTeamPicks = [
      pick({ pickNumber: 8, round: 1, teamNumber: 2, player: player({ id: "w1", position: "WR", adp: 40 }) }),
    ];

    const analytics = computeDraftAnalytics(
      [...valueTeamPicks, ...reachTeamPicks],
      [roster(1, valueTeamPicks), roster(2, reachTeamPicks), roster(3, [])]
    );

    expect(analytics.teamStrengths).toHaveLength(2);

    const valueTeam = analytics.teamStrengths.find((team) => team.teamNumber === 1);
    const reachTeam = analytics.teamStrengths.find((team) => team.teamNumber === 2);

    expect(valueTeam?.valueTotal).toBe(49);
    expect(reachTeam?.valueTotal).toBe(-32);
    expect(valueTeam?.overallGrade).toBe("A+");
    expect(reachTeam?.overallGrade).toBe("D");
    expect(valueTeam?.strengths).toContain("RB");
    expect(valueTeam?.weaknesses).toEqual(expect.arrayContaining(["QB", "WR", "TE", "K", "DST"]));
  });
});

describe("getTeamValueTotal", () => {
  it("ignores picks without a baseline", () => {
    const judged = pick({ pickNumber: 20, round: 2, player: player({ id: "a", adp: 10 }) });
    const unjudged = pick({ pickNumber: 21, round: 2, player: player({ id: "b", averageRank: Number.NaN }) });

    expect(getTeamValueTotal(roster(1, [judged, unjudged]))).toBe(10);
  });
});

describe("getLiveDraftSignals", () => {
  it("surfaces the latest flagged pick and a still-warm run", () => {
    const picks = [
      pick({ pickNumber: 10, round: 1, player: player({ id: "r1", position: "WR", adp: 30 }) }),
      pick({ pickNumber: 31, round: 3, player: player({ id: "rb1", position: "RB", adp: 31 }) }),
      pick({ pickNumber: 32, round: 3, player: player({ id: "rb2", position: "RB", adp: 33 }) }),
      pick({ pickNumber: 33, round: 3, player: player({ id: "rb3", position: "RB", adp: 35 }) }),
    ];

    const signals = getLiveDraftSignals(picks, 34);
    expect(signals.latestFlaggedPick?.pick.player.id).toBe("r1");
    expect(signals.latestFlaggedPick?.kind).toBe("reach");
    expect(signals.activeRun?.position).toBe("RB");

    // Far past the run window, the run is no longer "active".
    expect(getLiveDraftSignals(picks, 60).activeRun).toBeNull();
  });
});
