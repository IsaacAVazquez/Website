import { computeWeeklyTiers, WEEKLY_TIER_MAX_SIZE } from "@/lib/fantasyWeeklyTiers";
import type { FantasyWeeklyPlayer } from "@/lib/fantasyWeeklySnapshot";

function row(rank: number, rankAverage?: number, standardDeviation = 1): FantasyWeeklyPlayer {
  return {
    id: `fp-${rank}`,
    name: `Player ${rank}`,
    team: "BUF",
    position: "WR",
    rank,
    standardDeviation,
    ...(rankAverage !== undefined ? { rankAverage } : {}),
  };
}

const sizes = (players: FantasyWeeklyPlayer[]) => computeWeeklyTiers(players).map((tier) => tier.players.length);

describe("computeWeeklyTiers", () => {
  it("returns nothing for an empty board", () => {
    expect(computeWeeklyTiers([])).toEqual([]);
  });

  it("keeps a board at or under the cap as one tier", () => {
    const players = Array.from({ length: WEEKLY_TIER_MAX_SIZE }, (_, index) => row(index + 1, index + 1));
    expect(sizes(players)).toEqual([10]);
  });

  it("splits at the widest gap, measured against the pair's spread", () => {
    // Averages 1..6, then a jump to 12. A plain gap of 6 between agreeing experts.
    const averages = [1, 2, 3, 4, 5, 6, 12, 13, 14, 15, 16];
    const tiers = computeWeeklyTiers(averages.map((average, index) => row(index + 1, average)));
    expect(tiers.map((tier) => tier.players.length)).toEqual([6, 5]);
    expect(tiers[1].cliff).toBe(6);
    expect(tiers[0].cliff).toBe(0);
  });

  it("discounts a jump the experts disagree about", () => {
    // The 5-rank jump after the sixth player sits between two players with a spread of 10,
    // so the 2-rank jump after the third, between agreeing experts, is the wider gap.
    const players = [
      row(1, 1), row(2, 2), row(3, 3),
      row(4, 5), row(5, 6), row(6, 7, 10),
      row(7, 12, 10), row(8, 13), row(9, 14), row(10, 15), row(11, 16),
    ];
    expect(sizes(players)[0]).toBe(3);
  });

  it("never leaves a tier of one, and none past the cap", () => {
    // A big jump after the first player, which a split may not isolate.
    const averages = [1, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
    const result = sizes(averages.map((average, index) => row(index + 1, average)));
    expect(result[0]).toBeGreaterThanOrEqual(2);
    expect(Math.max(...result)).toBeLessThanOrEqual(WEEKLY_TIER_MAX_SIZE);
    expect(result.reduce((sum, size) => sum + size, 0)).toBe(12);
  });

  it("falls back to the whole-number rank when no average is published", () => {
    const players = Array.from({ length: 25 }, (_, index) => row(index + 1));
    const tiers = computeWeeklyTiers(players);
    // Every gap ties, so the board halves into even tiers rather than pairs.
    expect(tiers.map((tier) => tier.players.length)).toEqual([6, 6, 6, 7]);
    expect(tiers.flatMap((tier) => tier.players.map((player) => player.rank))).toEqual(
      players.map((player) => player.rank)
    );
  });
});
