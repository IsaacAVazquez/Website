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
  "totalTeams" | "userTeam" | "rounds" | "draftType" | "lineup"
> = {
  totalTeams: 2,
  userTeam: 1,
  rounds: 15,
  draftType: "snake",
  lineup: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DST: 1 },
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

  it("keeps a valid late redraft ADP even when it sits at the best-ball floor", () => {
    const reports = calculateRedraftDraftValues(
      [
        pick({
          pickNumber: 180,
          round: 15,
          teamNumber: 1,
          player: player({
            id: "late-redraft-adp",
            position: "WR",
            adp: 179,
            rankEcr: 20,
          }),
        }),
      ],
      { ...REDRAFT_SETTINGS, totalTeams: 12 }
    );

    expect(reports[0].market).toMatchObject({
      judgedPicks: 1,
      adpPicks: 1,
      consensusRankPicks: 0,
      averageDelta: 1,
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

  it("shrinks market scores when ADP has a thin sample or wide variation", () => {
    const reports = calculateRedraftDraftValues(
      [
        pick({
          pickNumber: 40,
          round: 4,
          teamNumber: 1,
          player: player({
            id: "stable-adp",
            position: "WR",
            adp: 10,
            adpStandardDeviation: 2,
            adpTimesDrafted: 100,
          }),
        }),
        pick({
          pickNumber: 40,
          round: 4,
          teamNumber: 2,
          player: player({
            id: "thin-adp",
            position: "WR",
            adp: 10,
            adpStandardDeviation: 2,
            adpTimesDrafted: 5,
          }),
        }),
        pick({
          pickNumber: 40,
          round: 4,
          teamNumber: 3,
          player: player({
            id: "wide-adp",
            position: "WR",
            adp: 10,
            adpStandardDeviation: 40,
            adpTimesDrafted: 100,
          }),
        }),
      ],
      { ...REDRAFT_SETTINGS, totalTeams: 3 }
    );

    const stable = component(reports[0], "market").score;
    const thin = component(reports[1], "market").score;
    const wide = component(reports[2], "market").score;

    expect(stable).toBeGreaterThan(thin);
    expect(stable).toBeGreaterThan(wide);
    expect(thin).toBeGreaterThan(50);
    expect(wide).toBeGreaterThan(50);
  });

  it("keeps the room confidence early when four ADP picks all have thin samples", () => {
    const picks = Array.from({ length: 4 }, (_, index) => [
      pick({
        pickNumber: index * 2 + 1,
        round: index + 1,
        teamNumber: 1,
        player: player({
          id: `thin-${index}`,
          position: index % 2 === 0 ? "RB" : "WR",
          adp: index * 2 + 1,
          adpStandardDeviation: 2,
          adpTimesDrafted: 5,
        }),
      }),
      pick({
        pickNumber: index * 2 + 2,
        round: index + 1,
        teamNumber: 2,
        player: player({
          id: `settled-${index}`,
          position: index % 2 === 0 ? "RB" : "WR",
          adp: index * 2 + 2,
          adpStandardDeviation: 2,
          adpTimesDrafted: 100,
        }),
      }),
    ]).flat();

    const reports = calculateRedraftDraftValues(picks, REDRAFT_SETTINGS);

    expect(reports[0].confidence).toBe("early");
    expect(reports[1].confidence).toBe("developing");
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

  it("does not reward an early kicker over another depth pick", () => {
    const commonPositions: Position[] = ["QB", "RB", "RB", "WR", "WR", "TE", "RB"];
    const teamPicks = (teamNumber: number, finalPosition: Position) =>
      [...commonPositions, finalPosition].map((position, index) => {
        const pickNumber = index * 2 + teamNumber;
        return pick({
          pickNumber,
          round: index + 1,
          teamNumber,
          player: player({
            id: `team-${teamNumber}-${index}`,
            position,
            adp: pickNumber,
          }),
        });
      });
    const reports = calculateRedraftDraftValues(
      [...teamPicks(1, "K"), ...teamPicks(2, "RB")],
      REDRAFT_SETTINGS
    );
    const earlyKicker = reports[0];
    const depthBack = reports[1];

    expect(component(earlyKicker, "lineup").score).toBe(
      component(depthBack, "lineup").score
    );
    expect(component(earlyKicker, "roster").score).toBeLessThanOrEqual(
      component(depthBack, "roster").score
    );
    expect(earlyKicker.compositeScore).toBeLessThanOrEqual(
      depthBack.compositeScore ?? Number.NEGATIVE_INFINITY
    );
  });

  it("tests bye coverage against an attainable final redraft roster", () => {
    const positions: Position[] = [
      "QB", "QB", "QB", "QB",
      "RB", "RB", "RB",
      "WR", "WR", "WR",
      "TE", "K", "DST",
    ];
    const picks = positions.map((position, index) => {
      const round = index + 1;
      const pickNumber = round % 2 === 1 ? (round - 1) * 2 + 1 : round * 2;
      return pick({
        pickNumber,
        round,
        teamNumber: 1,
        player: player({
          id: `redraft-bye-${index}`,
          position,
          rankEcr: pickNumber,
          byeWeek:
            position === "RB" && index < 6
              ? 9
              : position === "WR"
                ? 10
                : undefined,
        }),
      });
    });
    const report = calculateRedraftDraftValues(picks, REDRAFT_SETTINGS)[0];
    const byeCoverage = component(report, "byes");

    expect(byeCoverage.score).toBe(25);
    expect(byeCoverage.detail).toContain("1 starting slot could be uncovered");
    expect(byeCoverage.detail).toContain("best single final composition");
  });

  it("uses midrank percentile for an exact tie", () => {
    const reports = calculateRedraftDraftValues(
      [
        pick({ pickNumber: 1, round: 1, teamNumber: 1, player: player({ id: "a", position: "RB", adp: 1 }) }),
        pick({ pickNumber: 2, round: 1, teamNumber: 2, player: player({ id: "b", position: "RB", adp: 2 }) }),
      ],
      REDRAFT_SETTINGS
    );

    expect(reports[0].roomRank).toBe(1.5);
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
  it("keeps treating best-ball floor ADP as an undrafted placeholder", () => {
    const reports = calculateBestBallDraftValues({
      picks: [
        {
          pickNumber: 200,
          round: 17,
          teamNumber: 1,
          player: player({
            id: "best-ball-floor",
            position: "WR",
            adp: 214,
            rankEcr: 100,
          }),
        },
      ],
      contestId: "bbm-vii",
    });

    expect(reports[0].market).toMatchObject({
      judgedPicks: 1,
      adpPicks: 0,
      consensusRankPicks: 1,
      averageDelta: 100,
    });
  });

  it("does not reuse standard-season ADP for a separate contest slate", () => {
    const reports = calculateBestBallDraftValues({
      picks: [
        {
          pickNumber: 50,
          round: 5,
          teamNumber: 1,
          player: player({
            id: "weekly-saved-adp",
            position: "WR",
            adp: 100,
            rankEcr: 20,
          }),
        },
      ],
      contestId: "weekly-winners",
    });

    expect(reports[0].market).toMatchObject({
      judgedPicks: 1,
      adpPicks: 0,
      consensusRankPicks: 1,
      averageDelta: 30,
    });
  });

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

  it("leaves a Superflex pick unpriced when its format rank is missing", () => {
    const reports = calculateBestBallDraftValues({
      picks: [
        {
          pickNumber: 12,
          round: 1,
          teamNumber: 1,
          player: player({
            id: "missing-superflex-rank",
            position: "QB",
            adp: 12,
            rankEcr: 3,
          }),
        },
      ],
      contestId: "superflex",
    });

    expect(reports[0].market).toMatchObject({
      judgedPicks: 0,
      adpPicks: 0,
      formatRankPicks: 0,
      consensusRankPicks: 0,
      averageDelta: null,
    });
    expect(component(reports[0], "market").score).toBe(50);
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
    expect(reports[0].modelVersion).toBe("draft-outlook-v2");

    const eliminatorReports = calculateBestBallDraftValues({
      picks,
      contestId: "eliminator",
      week17Opponents: { KC: "MIN", MIN: "KC" },
    });
    expect(
      eliminatorReports[1].components.find((entry) => entry.id === "correlation")?.detail
    ).toContain("Week 17 pairs are not scored for this contest");
  });

  it("penalizes a whole QB room on one bye but not ordinary RB overlap", () => {
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
        player: player({ id: "qb-a", position: "QB", adp: 2, byeWeek: 9 }),
      },
      {
        pickNumber: 3,
        round: 1,
        teamNumber: 2,
        player: player({ id: "qb-b", position: "QB", adp: 3, byeWeek: 9 }),
      },
      {
        pickNumber: 5,
        round: 2,
        teamNumber: 2,
        player: player({ id: "qb-c", position: "QB", adp: 5, byeWeek: 9 }),
      },
      {
        pickNumber: 6,
        round: 2,
        teamNumber: 3,
        player: player({ id: "wr-unknown", position: "WR", adp: 6 }),
      },
    ];
    const reports = calculateBestBallDraftValues({ picks, contestId: "bbm-vii" });
    const ordinaryOverlap = reports[0].components.find((entry) => entry.id === "byes");
    const conflict = reports[1].components.find((entry) => entry.id === "byes");
    const missing = reports[2].components.find((entry) => entry.id === "byes");

    expect(ordinaryOverlap?.score).toBe(50);
    expect(conflict?.score).toBeLessThan(50);
    expect(missing?.score).toBe(50);
  });

  it("tests bye coverage against attainable Superflex compositions", () => {
    const positions: Position[] = [
      "QB", "QB", "QB",
      "RB", "RB", "RB",
      "WR", "WR", "WR", "WR", "WR", "WR", "WR", "WR",
      "TE", "TE",
    ];
    const picks: BestBallDraftPick[] = positions.map((position, index) => ({
      pickNumber: index + 1,
      round: index + 1,
      teamNumber: 1,
      player: player({
        id: `sf-bye-${index}`,
        position,
        superflexRank: index + 1,
        byeWeek: position === "RB" || position === "TE" ? 9 : undefined,
      }),
    }));
    const report = calculateBestBallDraftValues({ picks, contestId: "superflex" })[0];
    const byeCoverage = report.components.find((entry) => entry.id === "byes");

    expect(byeCoverage?.score).toBeLessThan(50);
    expect(byeCoverage?.detail).toContain("1 starting slot could be uncovered");
  });

  it("uses one final composition to cover every published bye", () => {
    const positions: Position[] = [
      "QB", "QB",
      "RB", "RB", "RB", "RB", "RB",
      "WR", "WR", "WR", "WR", "WR", "WR",
      "TE", "TE",
    ];
    const picks: BestBallDraftPick[] = positions.map((position, index) => ({
      pickNumber: index + 1,
      round: index + 1,
      teamNumber: 1,
      player: player({
        id: `joint-bye-${index}`,
        position,
        adp: index + 1,
        byeWeek: position === "RB" ? 9 : position === "WR" ? 10 : 11,
      }),
    }));
    const report = calculateBestBallDraftValues({ picks, contestId: "bbm-vii" })[0];
    const byeCoverage = report.components.find((entry) => entry.id === "byes");

    expect(byeCoverage?.score).toBeLessThan(50);
    expect(byeCoverage?.detail).toContain("best single final composition");
  });

  it("does not score a Week 17 opponent pair without a quarterback stack", () => {
    const picks: BestBallDraftPick[] = [
      {
        pickNumber: 1,
        round: 1,
        teamNumber: 1,
        player: player({ id: "kc-rb", position: "RB", team: "KC", adp: 1 }),
      },
      {
        pickNumber: 4,
        round: 2,
        teamNumber: 1,
        player: player({ id: "buf-rb", position: "RB", team: "BUF", adp: 4 }),
      },
    ];
    const report = calculateBestBallDraftValues({
      picks,
      contestId: "bbm-vii",
      week17Opponents: { KC: "BUF", BUF: "KC" },
    })[0];
    const withoutSchedule = calculateBestBallDraftValues({
      picks,
      contestId: "bbm-vii",
    })[0];
    const correlation = report.components.find((entry) => entry.id === "correlation");
    const baseline = withoutSchedule.components.find((entry) => entry.id === "correlation");

    expect(correlation?.score).toBe(baseline?.score);
    expect(correlation?.detail).toContain("neutral until the roster has a quarterback");
  });
});
