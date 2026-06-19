import { EMERGING_RUN_MIN_COUNT, getEmergingRun } from "@/lib/draftAnalytics";
import type { DraftPick, Player, Position } from "@/types";

function pick(pickNumber: number, position: Position): DraftPick {
  const player = {
    id: `p-${pickNumber}`,
    name: `Player ${pickNumber}`,
    team: "FA",
    position,
    averageRank: pickNumber,
    standardDeviation: 1,
  } as Player;
  return {
    pickNumber,
    round: Math.ceil(pickNumber / 10),
    teamNumber: ((pickNumber - 1) % 10) + 1,
    player,
    timestamp: new Date(),
  };
}

describe("getEmergingRun", () => {
  it("flags two same-position picks forming inside the window", () => {
    const picks = [pick(8, "WR"), pick(9, "RB"), pick(10, "RB")];
    const run = getEmergingRun(picks, 11);
    expect(run?.position).toBe("RB");
    expect(run?.count).toBe(EMERGING_RUN_MIN_COUNT);
  });

  it("does not flag a confirmed three-pick run as emerging", () => {
    const picks = [pick(8, "RB"), pick(9, "RB"), pick(10, "RB")];
    expect(getEmergingRun(picks, 11)).toBeNull();
  });

  it("ignores picks outside the trailing window", () => {
    const picks = [pick(1, "RB"), pick(2, "RB")];
    expect(getEmergingRun(picks, 11)).toBeNull();
  });

  it("returns null when nothing is clustering", () => {
    const picks = [pick(8, "WR"), pick(9, "QB"), pick(10, "TE")];
    expect(getEmergingRun(picks, 11)).toBeNull();
  });
});
