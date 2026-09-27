import { leaderboardSlats } from "../leaderboard";
import type { GolfLeaderboardEntry } from "@/types/golf";

const entry = (overrides: Partial<GolfLeaderboardEntry> = {}): GolfLeaderboardEntry => ({
  playerId: "player",
  playerName: "Player",
  country: "USA",
  position: "1",
  totalToPar: 0,
  today: 0,
  thru: "F",
  status: "Finish",
  roundScores: [70, 70, 70, 70],
  movement: 0,
  ...overrides,
});

const OPTS = { cutLine: -3, cutState: "made" as const, coursePar: 71, rounds: 4 };

describe("leaderboardSlats", () => {
  it("returns no slats and no cut line for an empty board", () => {
    expect(leaderboardSlats([], OPTS)).toEqual({ slats: [], cutIndex: null });
  });

  it("computes per-round to-par tone and the total from a runaway leader", () => {
    const [slat] = leaderboardSlats(
      [entry({ playerId: "leader", playerName: "Leader", position: "1", totalToPar: -26, roundScores: [66, 67, 64, 61] })],
      OPTS
    ).slats;

    expect(slat.rounds).toEqual([
      { score: 66, toPar: -5, tone: "under" },
      { score: 67, toPar: -4, tone: "under" },
      { score: 64, toPar: -7, tone: "under" },
      { score: 61, toPar: -10, tone: "under" },
    ]);
    expect(slat.total).toBe(-26);
    expect(slat.totalTone).toBe("under");
  });

  it("pads a missed-cut player's rounds with null past the round they stopped at", () => {
    const [slat] = leaderboardSlats(
      [
        entry({
          playerId: "mc",
          playerName: "Missed Cut Player",
          position: "-",
          totalToPar: -2,
          status: "Missed Cut",
          roundScores: [70, 69],
        }),
      ],
      OPTS
    ).slats;

    expect(slat.rounds).toEqual([
      { score: 70, toPar: -1, tone: "under" },
      { score: 69, toPar: -2, tone: "under" },
      { score: null, toPar: null, tone: null },
      { score: null, toPar: null, tone: null },
    ]);
    expect(slat.madeCut).toBe(false);
  });

  it("marks an even round as even and an over-par round as over", () => {
    const [slat] = leaderboardSlats(
      [entry({ roundScores: [71, 74, 70, 70], totalToPar: 2 })],
      OPTS
    ).slats;

    expect(slat.rounds[0]).toEqual({ score: 71, toPar: 0, tone: "even" });
    expect(slat.rounds[1]).toEqual({ score: 74, toPar: 3, tone: "over" });
    expect(slat.totalTone).toBe("over");
  });

  it("draws the cut line after the last player whose status made the cut", () => {
    const { cutIndex, slats } = leaderboardSlats(
      [
        entry({ playerId: "a", position: "1", status: "Finish" }),
        entry({ playerId: "b", position: "2", status: "Finish" }),
        entry({ playerId: "c", position: "-", status: "Missed Cut", roundScores: [75, 76] }),
        entry({ playerId: "d", position: "-", status: "Withdrawn", roundScores: [80] }),
      ],
      OPTS
    );

    expect(cutIndex).toBe(1);
    expect(slats[0].madeCut).toBe(true);
    expect(slats[1].madeCut).toBe(true);
    expect(slats[2].madeCut).toBe(false);
    expect(slats[3].madeCut).toBe(false);
  });

  it("draws no cut line for a no-cut event even if entries exist", () => {
    const { cutIndex } = leaderboardSlats(
      [entry({ status: "Finish" }), entry({ status: "Finish" })],
      { cutLine: null, cutState: "none", coursePar: 71, rounds: 4 }
    );

    expect(cutIndex).toBeNull();
  });

  it("draws no cut line while the cut is only pending", () => {
    const { cutIndex } = leaderboardSlats(
      [entry({ status: "In progress" }), entry({ status: "In progress" })],
      { cutLine: null, cutState: "pending", coursePar: 71, rounds: 4 }
    );

    expect(cutIndex).toBeNull();
  });

  it("draws no cut line when the cut state is unknown", () => {
    const { cutIndex } = leaderboardSlats(
      [entry({ status: "Missed Cut", roundScores: [80, 80] })],
      { cutLine: null, cutState: "unknown", coursePar: 71, rounds: 4 }
    );

    expect(cutIndex).toBeNull();
  });
});
