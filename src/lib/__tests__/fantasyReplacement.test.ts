import {
  buildFantasyReplacementCutoffs,
  calculateFantasyReplacementSourceValue,
  calculateReplacementRelativeValue,
  getFantasyReplacementExpertRank,
} from "@/lib/fantasyReplacement";
import type { Player, Position, RedraftLineupSettings } from "@/types";

const traditional: RedraftLineupSettings = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  FLEX: 1,
  K: 1,
  DST: 1,
};

function player(id: string, position: Position, rank: number): Player {
  return {
    id,
    name: id,
    team: "SF",
    position,
    averageRank: rank,
    rankEcr: rank,
  };
}

function board(): Player[] {
  const players: Player[] = [];
  for (let index = 1; index <= 80; index += 1) {
    players.push(player(`qb-${index}`, "QB", index * 6));
    players.push(player(`rb-${index}`, "RB", index * 3 - 1));
    players.push(player(`wr-${index}`, "WR", index * 3));
    players.push(player(`te-${index}`, "TE", index * 6 + 1));
  }
  for (let index = 1; index <= 20; index += 1) {
    players.push(player(`k-${index}`, "K", 150 + index));
    players.push(player(`dst-${index}`, "DST", 170 + index));
  }
  return players;
}

describe("fantasy replacement value", () => {
  it("is bounded, monotonic, and zero at the replacement line", () => {
    expect(calculateReplacementRelativeValue(1, 100)).toBe(100);
    expect(calculateReplacementRelativeValue(10, 100)).toBeGreaterThan(
      calculateReplacementRelativeValue(50, 100)
    );
    expect(calculateReplacementRelativeValue(100, 100)).toBe(0);
    expect(calculateReplacementRelativeValue(150, 100)).toBe(0);
  });

  it("moves replacement lines deeper in larger leagues", () => {
    const players = board();
    const eightTeam = buildFantasyReplacementCutoffs(
      players,
      { teams: 8, rosterSize: 15, lineup: traditional },
      getFantasyReplacementExpertRank
    );
    const twelveTeam = buildFantasyReplacementCutoffs(
      players,
      { teams: 12, rosterSize: 15, lineup: traditional },
      getFantasyReplacementExpertRank
    );

    expect(twelveTeam.QB.starter).toBeGreaterThan(eightTeam.QB.starter ?? 0);
    expect(twelveTeam.RB.roster).toBeGreaterThan(eightTeam.RB.roster ?? 0);
  });

  it("allocates FLEX after dedicated starters and reacts to receiver-heavy lineups", () => {
    const players = board();
    const twoReceiver = buildFantasyReplacementCutoffs(
      players,
      { teams: 8, rosterSize: 15, lineup: traditional },
      getFantasyReplacementExpertRank
    );
    const threeReceiver: RedraftLineupSettings = {
      ...traditional,
      WR: 3,
      FLEX: 2,
    };
    const receiverHeavy = buildFantasyReplacementCutoffs(
      players,
      { teams: 8, rosterSize: 17, lineup: threeReceiver },
      getFantasyReplacementExpertRank
    );

    expect(twoReceiver.WR.starter).toBeGreaterThan(8 * traditional.WR);
    expect(receiverHeavy.WR.starter).toBeGreaterThan(twoReceiver.WR.starter ?? 0);
  });

  it("never places a final roster line ahead of a FLEX-adjusted starter line", () => {
    const flexHeavy: RedraftLineupSettings = {
      QB: 1,
      RB: 1,
      WR: 1,
      TE: 1,
      FLEX: 2,
      K: 0,
      DST: 0,
    };
    const players = [
      player("qb-1", "QB", 1),
      player("qb-2", "QB", 10),
      player("rb-1", "RB", 2),
      player("rb-2", "RB", 20),
      player("rb-3", "RB", 40),
      player("rb-4", "RB", 60),
      player("wr-1", "WR", 3),
      player("wr-2", "WR", 21),
      player("wr-3", "WR", 41),
      player("wr-4", "WR", 61),
      player("te-1", "TE", 4),
      player("te-2", "TE", 5),
      player("te-3", "TE", 6),
      player("te-4", "TE", 7),
    ];

    const cutoffs = buildFantasyReplacementCutoffs(
      players,
      { teams: 2, rosterSize: 6, lineup: flexHeavy },
      getFantasyReplacementExpertRank
    );

    expect(cutoffs.TE).toEqual({ starter: 7, roster: 7 });
    for (const cutoff of Object.values(cutoffs)) {
      if (cutoff.starter !== null && cutoff.roster !== null) {
        expect(cutoff.roster).toBeGreaterThanOrEqual(cutoff.starter);
      }
    }
  });

  it("keeps partial value when only one replacement cutoff is covered", () => {
    const value = calculateFantasyReplacementSourceValue(5, {
      starter: 20,
      roster: null,
    });
    expect(value?.coverage).toBe(0.75);
    expect(value?.value).toBeGreaterThan(0);
  });
});
