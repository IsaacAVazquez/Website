import { MIN_MEANINGFUL_DELTA, bestIndex } from "../compareMetrics";
import type { Player } from "@/types";

/**
 * Guards the compare modal's "who wins this row" rule. The thresholds are
 * judgment calls, so the point of these cases is that a change to them is
 * deliberate and visible rather than silent.
 */
function player(overrides: Partial<Player>): Player {
  return { id: "x", name: "Player", team: "FA", position: "WR", ...overrides } as Player;
}

describe("bestIndex", () => {
  it("ignores a difference smaller than the row's threshold", () => {
    // The case from the critique: 99.3% vs 99.2% rostered is noise, not a win.
    const players = [player({ id: "a", ownership: 99.3 }), player({ id: "b", ownership: 99.2 })];
    expect(bestIndex(players, "own", "higher")).toBe(-1);
  });

  it("marks a winner once the gap clears the threshold", () => {
    const players = [player({ id: "a", ownership: 94 }), player({ id: "b", ownership: 99 })];
    expect(bestIndex(players, "own", "higher")).toBe(1);
  });

  it("treats a lower value as the win on rank rows", () => {
    const players = [player({ id: "a", rankEcr: 4 }), player({ id: "b", rankEcr: 1 })];
    expect(bestIndex(players, "rank", "lower")).toBe(1);
  });

  it("scores the same published rank values that the compare table renders", () => {
    const players = [player({ id: "a", rankEcr: 4 }), player({ id: "b", rankEcr: 5 })];
    const publishedRanks = new Map([
      ["a", 6],
      ["b", 3],
    ]);

    expect(
      bestIndex(players, "rank", "lower", (candidate) => publishedRanks.get(candidate.id) ?? null)
    ).toBe(1);
  });

  it("needs the best to clear the next best, not just the worst", () => {
    // 20 vs 21 is inside the fallback 10-pick ADP threshold even though 60 is far away.
    const players = [
      player({ id: "a", adp: 20 }),
      player({ id: "b", adp: 21 }),
      player({ id: "c", adp: 60 }),
    ];
    expect(bestIndex(players, "adp", "lower")).toBe(-1);
  });

  it("uses player-level ADP variation instead of a fixed gap", () => {
    const players = [
      player({ id: "a", adp: 20, adpStandardDeviation: 15, adpTimesDrafted: 100 }),
      player({ id: "b", adp: 32, adpStandardDeviation: 12, adpTimesDrafted: 100 }),
    ];
    expect(bestIndex(players, "adp", "lower")).toBe(-1);

    players[1].adp = 36;
    expect(bestIndex(players, "adp", "lower")).toBe(0);
  });

  it("does not declare an ADP winner from an early player sample", () => {
    const players = [
      player({ id: "a", adp: 20, adpStandardDeviation: 3, adpTimesDrafted: 8 }),
      player({ id: "b", adp: 50, adpStandardDeviation: 3, adpTimesDrafted: 100 }),
    ];
    expect(bestIndex(players, "adp", "lower")).toBe(-1);
  });

  it("returns a wash for rows with no direction and for missing data", () => {
    const players = [player({ id: "a", tier: 1 }), player({ id: "b", tier: 3 })];
    expect(bestIndex(players, "bye", "none")).toBe(-1);
    expect(bestIndex([player({ id: "a", tier: 1 }), player({ id: "b" })], "tier", "lower")).toBe(-1);
  });

  it("keeps a threshold on every scored row so none falls back to marking noise", () => {
    for (const key of ["rank", "posRank", "tier", "adp", "own"]) {
      expect(MIN_MEANINGFUL_DELTA[key]).toBeGreaterThan(0);
    }
  });
});
