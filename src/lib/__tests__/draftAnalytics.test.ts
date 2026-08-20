/**
 * @jest-environment node
 */
import {
  classifyPickValue,
  computeDraftAnalytics,
  detectPositionRuns,
  getLiveDraftSignals,
  ECR_BASELINE_MAX_RANK,
  getPickBaseline,
  getPickDelta,
  getReachStealThreshold,
  getRosterNeeds,
  getTeamValueTotal,
  isPlayerValueAtPick,
  reconcileTeamRosters,
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

  it("refuses a consensus rank too deep to stand in for a pick number", () => {
    // ADP is a pick and consensus rank is a board position. Deep ranks run far past the
    // last pick of a draft, so using one as a baseline invented enormous phantom reaches.
    expect(getPickBaseline(player({ rankEcr: ECR_BASELINE_MAX_RANK }))).toBe(
      ECR_BASELINE_MAX_RANK
    );
    expect(getPickBaseline(player({ rankEcr: ECR_BASELINE_MAX_RANK + 1 }))).toBeNull();
    expect(getPickBaseline(player({ rankEcr: 400 }))).toBeNull();
    // A real ADP still wins no matter how deep the consensus rank is.
    expect(getPickBaseline(player({ adp: 180, rankEcr: 400 }))).toBe(180);
  });

  it("does not judge a player from an ADP sample below twenty selections", () => {
    expect(getPickBaseline(player({ adp: 40, adpTimesDrafted: 19, rankEcr: 35 }))).toBeNull();
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

  it("uses published player uncertainty instead of a fixed late-round multiplier", () => {
    expect(
      getReachStealThreshold(
        12,
        player({ adp: 140, adpStandardDeviation: 4, adpTimesDrafted: 100 })
      )
    ).toBe(6);
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

  it("uses ADP variation when published and suppresses a thin player sample", () => {
    const stableLate = pick({
      pickNumber: 150,
      round: 12,
      player: player({
        adp: 140,
        adpStandardDeviation: 4,
        adpTimesDrafted: 100,
      }),
    });
    const thin = pick({
      pickNumber: 150,
      round: 12,
      player: player({
        adp: 140,
        adpStandardDeviation: 4,
        adpTimesDrafted: 10,
      }),
    });

    expect(classifyPickValue(stableLate)).toBe("steal");
    expect(classifyPickValue(thin)).toBeNull();
    expect(isPlayerValueAtPick(stableLate.player, 150, 12)).toBe(true);
    expect(isPlayerValueAtPick(thin.player, 150, 12)).toBe(false);
    expect(isPlayerValueAtPick(player({ rankEcr: 100 }), 150, 12)).toBe(false);
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

  it("reports market totals, configured starter gaps, and positions that meet depth targets", () => {
    const valueTeamPicks = [
      pick({ pickNumber: 20, round: 2, teamNumber: 1, player: player({ id: "v1", position: "RB", adp: 5 }) }),
      pick({ pickNumber: 32, round: 3, teamNumber: 1, player: player({ id: "v2", position: "RB", adp: 12 }) }),
      pick({ pickNumber: 44, round: 4, teamNumber: 1, player: player({ id: "v3", position: "RB", adp: 30 }) }),
      pick({ pickNumber: 50, round: 5, teamNumber: 1, player: player({ id: "v4", position: "RB", adp: 40 }) }),
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

    expect(valueTeam?.valueTotal).toBe(59);
    expect(reachTeam?.valueTotal).toBe(-32);
    expect(valueTeam?.strengths).toContain("RB");
    expect(valueTeam?.weaknesses).toEqual(expect.arrayContaining(["QB", "WR", "TE"]));
    expect(valueTeam?.weaknesses).not.toEqual(expect.arrayContaining(["K", "DST"]));
  });

  it("uses the sanitized pick list instead of stale player copies inside team rosters", () => {
    const staleStoredPick = pick({
      pickNumber: 20,
      round: 2,
      teamNumber: 1,
      player: player({ id: "saved", adp: 1, rankEcr: 10 }),
    });
    const currentModelPick = {
      ...staleStoredPick,
      player: player({ id: "saved", adp: undefined, rankEcr: 10 }),
    };

    const analytics = computeDraftAnalytics(
      [currentModelPick],
      [roster(1, [staleStoredPick])]
    );

    expect(analytics.teamStrengths[0].valueTotal).toBe(10);
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

  it("reports the run still on the clock, not the earliest one that qualifies", () => {
    // Two runs sit inside the window at pick 24: RB ended at 19, WR ended at 22.
    // Sorted by startPick the RB run comes first, but the receiver run is live.
    const picks = [
      pick({ pickNumber: 15, round: 2, player: player({ id: "rb1", position: "RB" }) }),
      pick({ pickNumber: 17, round: 2, player: player({ id: "rb2", position: "RB" }) }),
      pick({ pickNumber: 19, round: 2, player: player({ id: "rb3", position: "RB" }) }),
      pick({ pickNumber: 20, round: 2, player: player({ id: "wr1", position: "WR" }) }),
      pick({ pickNumber: 21, round: 2, player: player({ id: "wr2", position: "WR" }) }),
      pick({ pickNumber: 22, round: 2, player: player({ id: "wr3", position: "WR" }) }),
    ];

    expect(getLiveDraftSignals(picks, 24).activeRun?.position).toBe("WR");
  });
});

describe("reconcileTeamRosters", () => {
  it("rebuilds position counts and totals from the exact model picks", () => {
    const savedPick = pick({
      teamNumber: 1,
      player: player({ id: "position-change", position: "RB", auctionValue: 1 }),
    });
    const currentPick = {
      ...savedPick,
      player: player({
        id: "position-change",
        position: "WR",
        auctionValue: 7,
        projectedPoints: 123,
      }),
    };
    const reconciled = reconcileTeamRosters([roster(1, [savedPick])], [currentPick]);

    expect(reconciled[0].positionCounts).toMatchObject({ RB: 0, WR: 1 });
    expect(reconciled[0].totalValue).toBe(7);
    expect(reconciled[0].projectedPoints).toBe(123);
    expect(reconciled[0].picks[0].player.position).toBe("WR");
  });
});

describe("getRosterNeeds", () => {
  const counts = (overrides: Partial<TeamRoster["positionCounts"]> = {}) => ({
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0,
    ...overrides,
  });
  const needsFor = (overrides: Partial<TeamRoster["positionCounts"]> = {}) =>
    getRosterNeeds({ positionCounts: counts(overrides) });
  const slots = (needs: ReturnType<typeof getRosterNeeds>) => needs.map((need) => need.slot);

  it("opens on configured skill starters and flex while deferring kicker and defense", () => {
    const needs = needsFor();

    expect(needs.every((need) => need.level === "starter")).toBe(true);
    expect(needs.map((need) => need.slot).sort()).toEqual([
      "FLEX",
      "QB",
      "RB",
      "TE",
      "WR",
    ]);

    // RB and WR have the largest starting gaps. K and DST stay hidden until
    // the remaining picks equal the remaining specialist slots.
    expect(slots(needs).slice(0, 2).sort()).toEqual(["RB", "WR"]);

    // No depth while any starting slot is still open.
    expect(needs.some((need) => need.level === "depth")).toBe(false);
  });

  it("surfaces depth after the configured starters and flex are filled", () => {
    const needs = needsFor({ RB: 3, WR: 2, TE: 1, QB: 1, K: 1, DST: 1 });

    expect(needs.some((need) => need.level === "starter")).toBe(false);
    const depth = needs.filter((need) => need.level === "depth").map((need) => need.slot);
    expect(depth).toEqual(expect.arrayContaining(["RB", "WR", "QB", "TE"]));
    // WR has the largest remaining gap and stays ahead of backup QB and TE.
    expect(depth.indexOf("WR")).toBeLessThan(depth.indexOf("TE"));
  });

  it("holds depth back for a missing skill starter but not for an open K or DST", () => {
    // A missing starting RB suppresses all depth guidance...
    expect(needsFor({ RB: 0, WR: 2, TE: 1, QB: 1, K: 1, DST: 1 }).some((need) => need.level === "depth")).toBe(
      false
    );

    // ...but open K/DST (drafted last) do not block depth.
    const withKicker = needsFor({ RB: 3, WR: 2, TE: 1, QB: 1, K: 0, DST: 0 });
    expect(withKicker.some((need) => need.level === "depth")).toBe(true);
    expect(
      withKicker
        .filter((need) => need.level === "starter")
        .map((need) => need.slot)
        .sort()
    ).toEqual([]);
  });

  it("makes kicker and defense due only in the final roster spots", () => {
    const beforeFinalTwo = getRosterNeeds({
      positionCounts: counts({ QB: 2, RB: 4, WR: 5, TE: 2, K: 0, DST: 0 }),
      rounds: 15,
    });
    expect(slots(beforeFinalTwo).sort()).toEqual(["DST", "K"]);

    const finalPick = getRosterNeeds({
      positionCounts: counts({ QB: 2, RB: 4, WR: 5, TE: 2, K: 1, DST: 0 }),
      rounds: 15,
    });
    expect(slots(finalPick)).toEqual(["DST"]);
  });

  it("never lists a position as both a starter and a depth need", () => {
    const needs = needsFor({ RB: 0, WR: 2, TE: 1, QB: 1, K: 1, DST: 1 });
    const rbNeeds = needs.filter((need) => need.slot === "RB");

    expect(rbNeeds).toHaveLength(1);
    expect(rbNeeds[0].level).toBe("starter");
  });

  it("returns nothing once starter and depth targets are all met", () => {
    expect(needsFor({ RB: 4, WR: 5, TE: 2, QB: 2, K: 1, DST: 1 })).toHaveLength(0);
  });

  it("uses a three-receiver lineup and two flex spots when configured", () => {
    const needs = getRosterNeeds({
      positionCounts: counts({ QB: 1, RB: 2, WR: 2, TE: 1, K: 0, DST: 0 }),
      lineup: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 2, K: 0, DST: 0 },
      rounds: 15,
    });

    expect(needs.filter((need) => need.level === "starter").map((need) => need.slot)).toEqual([
      "WR",
      "FLEX",
    ]);
  });
});
