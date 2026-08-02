/**
 * @jest-environment node
 */
import {
  calculateBestBallDraftValues,
  calculateContestFieldEconomics,
  calculateExpectedReturn,
  calculateRedraftDraftValues,
  getDraftSlotContext,
} from "@/lib/fantasyTeamValue";
import type { BestBallDraftPick } from "@/lib/bestBall";
import type { DraftPick, DraftSettings, Player, Position } from "@/types";

function player(overrides: Partial<Player> & { id: string; position: Position }): Player {
  return {
    name: overrides.name ?? overrides.id,
    team: overrides.team ?? "SF",
    averageRank: overrides.averageRank ?? 100,
    standardDeviation: overrides.standardDeviation ?? 3,
    ...overrides,
  };
}

function pick({
  pickNumber,
  round,
  teamNumber,
  player: selectedPlayer,
}: {
  pickNumber: number;
  round: number;
  teamNumber: number;
  player: Player;
}): DraftPick {
  return {
    pickNumber,
    round,
    teamNumber,
    player: selectedPlayer,
    timestamp: new Date("2026-08-02T00:00:00Z"),
  };
}

const REDRAFT_SETTINGS: Pick<
  DraftSettings,
  "totalTeams" | "userTeam" | "rounds" | "draftType"
> = {
  totalTeams: 2,
  userTeam: 1,
  rounds: 15,
  draftType: "snake",
};

function component(
  report: ReturnType<typeof calculateRedraftDraftValues>[number],
  id: string
) {
  const match = report.components.find((entry) => entry.id === id);
  if (!match) throw new Error(`Missing ${id} component`);
  return match;
}

describe("expected return math", () => {
  it("calculates gross return, net EV, ROI, and the break-even payout chance", () => {
    expect(
      calculateExpectedReturn({
        entryCost: 25,
        payoutProbability: 0.1,
        averagePayout: 300,
      })
    ).toEqual({
      grossExpectedReturn: 30,
      netExpectedValue: 5,
      roi: 0.2,
      breakEvenPayoutProbability: 25 / 300,
    });
  });

  it("rejects probabilities outside zero to one", () => {
    expect(
      calculateExpectedReturn({ entryCost: 25, payoutProbability: 1.1, averagePayout: 30 })
    ).toBeNull();
  });

  it("pins the published Best Ball Mania field baseline", () => {
    const result = calculateContestFieldEconomics({
      entryFee: 25,
      fieldEntries: 672_336,
      prizePool: 15_000_000,
    });

    expect(result?.grossExpectedReturn).toBeCloseTo(22.3102734347, 8);
    expect(result?.netExpectedValue).toBeCloseTo(-2.6897265653, 8);
    expect(result?.roi).toBeCloseTo(-0.1075890626, 8);
    expect(result?.breakEvenEdge).toBeCloseTo(0.12056, 5);
  });
});

describe("draft slot context", () => {
  it("shows the back-to-back and long turn gaps at the edge of a snake", () => {
    expect(
      getDraftSlotContext({ slot: 1, teams: 12, rounds: 18, draftType: "snake" })
    ).toMatchObject({ firstPick: 1, minimumTurnGap: 1, maximumTurnGap: 23 });
    expect(
      getDraftSlotContext({ slot: 6, teams: 12, rounds: 18, draftType: "snake" })
    ).toMatchObject({ firstPick: 6, minimumTurnGap: 11, maximumTurnGap: 13 });
  });

  it("keeps the gap constant in a linear draft", () => {
    expect(
      getDraftSlotContext({ slot: 4, teams: 10, rounds: 15, draftType: "linear" })
    ).toMatchObject({ firstPick: 4, minimumTurnGap: 10, maximumTurnGap: 10 });
  });
});

describe("redraft Draft Outlook", () => {
  it("ranks a team with better slot-adjusted value ahead of a reaching team", () => {
    const reports = calculateRedraftDraftValues(
      [
        pick({
          pickNumber: 20,
          round: 2,
          teamNumber: 1,
          player: player({ id: "value-rb", position: "RB", adp: 5 }),
        }),
        pick({
          pickNumber: 2,
          round: 1,
          teamNumber: 2,
          player: player({ id: "reach-rb", position: "RB", adp: 20 }),
        }),
      ],
      REDRAFT_SETTINGS
    );

    expect(reports[0].market.averageDelta).toBe(15);
    expect(reports[1].market.averageDelta).toBe(-18);
    expect(reports[0].roomRank).toBe(1);
    expect(reports[0].roomPercentile).toBe(100);
    expect(reports[1].roomPercentile).toBe(0);
  });

  it("reports whether a pick used ADP or a consensus fallback", () => {
    const reports = calculateRedraftDraftValues(
      [
        pick({
          pickNumber: 10,
          round: 1,
          teamNumber: 1,
          player: player({ id: "adp", position: "WR", adp: 8, rankEcr: 30 }),
        }),
        pick({
          pickNumber: 12,
          round: 2,
          teamNumber: 1,
          player: player({ id: "rank", position: "RB", rankEcr: 11, averageRank: 20 }),
        }),
      ],
      REDRAFT_SETTINGS
    );

    expect(reports[0].market).toMatchObject({
      judgedPicks: 2,
      adpPicks: 1,
      consensusRankPicks: 1,
      formatRankPicks: 0,
    });
  });

  it("widens market noise in later rounds", () => {
    const reports = calculateRedraftDraftValues(
      [
        pick({
          pickNumber: 20,
          round: 1,
          teamNumber: 1,
          player: player({ id: "early", position: "WR", adp: 10 }),
        }),
        pick({
          pickNumber: 120,
          round: 10,
          teamNumber: 2,
          player: player({ id: "late", position: "WR", adp: 110 }),
        }),
      ],
      REDRAFT_SETTINGS
    );

    expect(component(reports[0], "market").score).toBeGreaterThan(
      component(reports[1], "market").score
    );
  });

  it("penalizes a concentrated opening against a balanced starting base", () => {
    const picks = [
      pick({ pickNumber: 1, round: 1, teamNumber: 1, player: player({ id: "q1", position: "QB", adp: 1 }) }),
      pick({ pickNumber: 4, round: 2, teamNumber: 1, player: player({ id: "q2", position: "QB", adp: 4 }) }),
      pick({ pickNumber: 5, round: 3, teamNumber: 1, player: player({ id: "q3", position: "QB", adp: 5 }) }),
      pick({ pickNumber: 8, round: 4, teamNumber: 1, player: player({ id: "q4", position: "QB", adp: 8 }) }),
      pick({ pickNumber: 2, round: 1, teamNumber: 2, player: player({ id: "rb1", position: "RB", adp: 2 }) }),
      pick({ pickNumber: 3, round: 2, teamNumber: 2, player: player({ id: "wr1", position: "WR", adp: 3 }) }),
      pick({ pickNumber: 6, round: 3, teamNumber: 2, player: player({ id: "rb2", position: "RB", adp: 6 }) }),
      pick({ pickNumber: 7, round: 4, teamNumber: 2, player: player({ id: "wr2", position: "WR", adp: 7 }) }),
    ];
    const reports = calculateRedraftDraftValues(picks, REDRAFT_SETTINGS);

    expect(component(reports[1], "roster").score).toBeGreaterThan(
      component(reports[0], "roster").score
    );
    expect(component(reports[1], "lineup").score).toBeGreaterThan(
      component(reports[0], "lineup").score
    );
    expect(reports[1].roomRank).toBe(1);
  });

  it("uses midrank percentile for an exact tie", () => {
    const reports = calculateRedraftDraftValues(
      [
        pick({ pickNumber: 1, round: 1, teamNumber: 1, player: player({ id: "a", position: "RB", adp: 1 }) }),
        pick({ pickNumber: 2, round: 1, teamNumber: 2, player: player({ id: "b", position: "RB", adp: 2 }) }),
      ],
      REDRAFT_SETTINGS
    );

    expect(reports[0].roomRank).toBe(1);
    expect(reports[0].roomTieCount).toBe(2);
    expect(reports[0].roomPercentile).toBe(50);
    expect(reports[1].roomPercentile).toBe(50);
  });

  it("compares room rank only among teams with the same number of picks", () => {
    const reports = calculateRedraftDraftValues(
      [
        pick({ pickNumber: 1, round: 1, teamNumber: 1, player: player({ id: "a1", position: "RB", adp: 1 }) }),
        pick({ pickNumber: 6, round: 2, teamNumber: 1, player: player({ id: "a2", position: "WR", adp: 6 }) }),
        pick({ pickNumber: 2, round: 1, teamNumber: 2, player: player({ id: "b1", position: "RB", adp: 2 }) }),
        pick({ pickNumber: 3, round: 1, teamNumber: 3, player: player({ id: "c1", position: "WR", adp: 3 }) }),
      ],
      { ...REDRAFT_SETTINGS, totalTeams: 3 }
    );

    expect(reports[0].roomSize).toBe(1);
    expect(reports[0].roomPercentile).toBe(50);
    expect(reports[1].roomSize).toBe(2);
    expect(reports[2].roomSize).toBe(2);
  });
});

describe("best ball Draft Outlook", () => {
  it("uses the format rank instead of one-QB ADP in Superflex", () => {
    const picks: BestBallDraftPick[] = [
      {
        pickNumber: 30,
        round: 3,
        teamNumber: 1,
        player: player({ id: "sf-value", position: "QB", adp: 100, superflexRank: 10 }),
      },
      {
        pickNumber: 1,
        round: 1,
        teamNumber: 2,
        player: player({ id: "sf-reach", position: "QB", adp: 1, superflexRank: 30 }),
      },
    ];
    const reports = calculateBestBallDraftValues({ picks, contestId: "superflex" });

    expect(reports[0].market).toMatchObject({ formatRankPicks: 1, adpPicks: 0 });
    expect(reports[0].market.averageDelta).toBe(20);
    expect(reports[1].market.averageDelta).toBe(-29);
  });

  it("rewards a QB pass-catcher connection without turning it into payout EV", () => {
    const picks: BestBallDraftPick[] = [
      {
        pickNumber: 1,
        round: 1,
        teamNumber: 1,
        player: player({ id: "qb-stack", position: "QB", team: "BUF", adp: 1 }),
      },
      {
        pickNumber: 4,
        round: 2,
        teamNumber: 1,
        player: player({ id: "wr-stack", position: "WR", team: "BUF", adp: 4 }),
      },
      {
        pickNumber: 2,
        round: 1,
        teamNumber: 2,
        player: player({ id: "qb-alone", position: "QB", team: "KC", adp: 2 }),
      },
      {
        pickNumber: 3,
        round: 2,
        teamNumber: 2,
        player: player({ id: "wr-alone", position: "WR", team: "MIN", adp: 3 }),
      },
    ];
    const reports = calculateBestBallDraftValues({ picks, contestId: "bbm-vii" });
    const stacked = reports[0].components.find((entry) => entry.id === "correlation");
    const unstacked = reports[1].components.find((entry) => entry.id === "correlation");

    expect(stacked?.score).toBeGreaterThan(unstacked?.score ?? 0);
    expect(reports[0].modelVersion).toBe("draft-outlook-v1");

    const eliminatorReports = calculateBestBallDraftValues({
      picks,
      contestId: "eliminator",
      week17Opponents: { KC: "MIN", MIN: "KC" },
    });
    expect(
      eliminatorReports[1].components.find((entry) => entry.id === "correlation")?.detail
    ).toContain("Week 17 pairs are not scored for this contest");
  });

  it("counts same-position bye collisions and does not treat missing data as safe", () => {
    const picks: BestBallDraftPick[] = [
      {
        pickNumber: 1,
        round: 1,
        teamNumber: 1,
        player: player({ id: "rb-a", position: "RB", adp: 1, byeWeek: 7 }),
      },
      {
        pickNumber: 4,
        round: 2,
        teamNumber: 1,
        player: player({ id: "rb-b", position: "RB", adp: 4, byeWeek: 7 }),
      },
      {
        pickNumber: 2,
        round: 1,
        teamNumber: 2,
        player: player({ id: "wr-unknown", position: "WR", adp: 2 }),
      },
    ];
    const reports = calculateBestBallDraftValues({ picks, contestId: "bbm-vii" });
    const conflict = reports[0].components.find((entry) => entry.id === "byes");
    const missing = reports[1].components.find((entry) => entry.id === "byes");

    expect(conflict?.score).toBeLessThan(50);
    expect(missing?.score).toBe(50);
  });
});
