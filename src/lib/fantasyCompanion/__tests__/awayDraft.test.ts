import type { Player, RedraftLineupSettings } from "@/types";
import {
  buildAwayDraftPlan,
  formatAwayDraftPlan,
} from "../awayDraft";

const LINEUP: RedraftLineupSettings = {
  QB: 1,
  RB: 2,
  WR: 3,
  TE: 1,
  FLEX: 1,
  K: 1,
  DST: 1,
};

function player(
  id: string,
  position: Player["position"],
  rankEcr: number,
  averageRank = rankEcr
): Player {
  return {
    id,
    name: `Player ${id}`,
    team: "SF",
    position,
    averageRank,
    rankEcr,
  };
}

describe("away draft plan", () => {
  it("builds a complete, de-duplicated queue in consensus order", () => {
    const players = [
      player("three", "WR", 3),
      player("one", "RB", 1),
      player("two", "QB", 2),
      player("one", "RB", 4),
      player("invalid", "FLEX", 5),
    ];

    const plan = buildAwayDraftPlan(players, {
      platform: "sleeper",
      teams: 2,
      rounds: 2,
      lineup: LINEUP,
    });

    expect(plan.requiredQueueSize).toBe(4);
    expect(plan.queue.map((entry) => entry.player.id)).toEqual([
      "one",
      "two",
      "three",
    ]);
    expect(plan.queue.map((entry) => entry.rank)).toEqual([1, 2, 3]);
  });

  it("uses average rank when ECR is unavailable", () => {
    const withoutEcr = player("average", "TE", 99, 2);
    delete withoutEcr.rankEcr;

    const plan = buildAwayDraftPlan(
      [player("ecr", "WR", 1), withoutEcr],
      {
        platform: "sleeper",
        teams: 1,
        rounds: 2,
        lineup: LINEUP,
      }
    );

    expect(plan.queue.map((entry) => entry.player.id)).toEqual([
      "ecr",
      "average",
    ]);
  });

  it("generates ESPN limits and reserves the final rounds for DST and K", () => {
    const plan = buildAwayDraftPlan([], {
      platform: "espn",
      teams: 12,
      rounds: 15,
      lineup: LINEUP,
    });

    expect(plan.positionLimits).toEqual(
      expect.arrayContaining([
        { position: "QB", minimum: 1, maximum: 2 },
        { position: "K", minimum: 1, maximum: 1 },
        { position: "DST", minimum: 1, maximum: 1 },
      ])
    );
    expect(plan.roundRules).toEqual([
      { round: 14, position: "DST" },
      { round: 15, position: "K" },
    ]);
  });

  it("formats a tab-separated plan that can be copied", () => {
    const plan = buildAwayDraftPlan([player("one", "RB", 1)], {
      platform: "espn",
      teams: 1,
      rounds: 1,
      lineup: { ...LINEUP, K: 0, DST: 0 },
    });

    expect(formatAwayDraftPlan(plan)).toContain("ESPN away draft plan");
    expect(formatAwayDraftPlan(plan)).toContain(
      "1\tPlayer one\tRB\tSF"
    );
  });
});
