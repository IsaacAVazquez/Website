/**
 * @jest-environment node
 */
import {
  DEFAULT_REDRAFT_LINEUP,
  countRedraftStartingSlots,
  getRedraftRosterTarget,
  normalizeRedraftLineup,
  redraftLineupSummary,
} from "@/lib/redraftLineup";

describe("normalizeRedraftLineup", () => {
  it("clamps every slot to its supported range and pins QB at one", () => {
    const lineup = normalizeRedraftLineup({
      RB: 9,
      WR: 0,
      TE: -2,
      FLEX: 7,
      K: 4,
      DST: 2,
    });
    expect(lineup).toEqual({ QB: 1, RB: 3, WR: 1, TE: 1, FLEX: 3, K: 1, DST: 1 });
  });

  it("falls back to the default lineup for missing or unparseable input", () => {
    expect(normalizeRedraftLineup(undefined)).toEqual(DEFAULT_REDRAFT_LINEUP);
    expect(countRedraftStartingSlots(DEFAULT_REDRAFT_LINEUP)).toBe(9);
    expect(redraftLineupSummary(DEFAULT_REDRAFT_LINEUP)).toBe(
      "1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX, 1 K, and 1 DST"
    );
  });
});

describe("getRedraftRosterTarget", () => {
  it("adds the backup QB at four spare rounds and the backup TE at five", () => {
    // Nine starters: 13 rounds clears the QB threshold only, 15 clears both.
    const shortDraft = getRedraftRosterTarget(DEFAULT_REDRAFT_LINEUP, 13);
    expect(shortDraft).toEqual({ QB: 2, RB: 4, WR: 4, TE: 1, K: 1, DST: 1 });

    const longDraft = getRedraftRosterTarget(DEFAULT_REDRAFT_LINEUP, 15);
    expect(longDraft).toEqual({ QB: 2, RB: 4, WR: 5, TE: 2, K: 1, DST: 1 });
  });

  it("always totals exactly the number of rounds", () => {
    for (const rounds of [13, 14, 15, 16, 17, 18]) {
      const target = getRedraftRosterTarget(DEFAULT_REDRAFT_LINEUP, rounds);
      const total = Object.values(target).reduce((sum, count) => sum + count, 0);
      expect(total).toBe(rounds);
    }
  });

  it("splits skill slots near 45 percent RB while honoring lineup minimums", () => {
    // RB1/WR4 forces the rebalance loop: the 45 percent split wants three
    // backs, the WR minimum holds at four, and the shrink loop takes the
    // surplus back off RB because WR cannot go below its lineup floor.
    const lineup = normalizeRedraftLineup({ RB: 1, WR: 4, TE: 1, FLEX: 0, K: 0, DST: 0 });
    const target = getRedraftRosterTarget(lineup, 8);
    expect(target).toEqual({ QB: 1, RB: 2, WR: 4, TE: 1, K: 0, DST: 0 });
  });
});
