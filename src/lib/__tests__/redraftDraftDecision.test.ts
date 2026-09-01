import {
  calculateRedraftDraftDecision,
  describeRedraftWait,
  getRedraftNextPickForTeam,
  getRedraftTeamAtPick,
  type RedraftDraftDecisionInput,
  type RedraftWaitReading,
} from "@/lib/redraftDraftDecision";
import type { Player, Position, RedraftLineupSettings } from "@/types";

const lineup: RedraftLineupSettings = {
  QB: 1,
  RB: 1,
  WR: 1,
  TE: 1,
  FLEX: 0,
  K: 0,
  DST: 0,
};

function player(
  id: string,
  position: Position,
  rank: number,
  options: Partial<Player> = {}
): Player {
  return {
    id,
    name: id,
    team: "SF",
    position,
    averageRank: rank,
    rankEcr: rank,
    tier: Math.ceil(rank / 12),
    positionRank: 1,
    ...options,
  };
}

function fixture(): Pick<
  RedraftDraftDecisionInput,
  "players" | "positionBoards"
> {
  const players = [
    player("qb-1", "QB", 5, { adp: 2, adpTimesDrafted: 100 }),
    player("qb-2", "QB", 9, { adp: 5, adpTimesDrafted: 100 }),
    player("qb-3", "QB", 18, { adp: 20, adpTimesDrafted: 100 }),
    player("rb-1", "RB", 1, { adp: 1, adpTimesDrafted: 100 }),
    player("rb-2", "RB", 7, { adp: 6, adpTimesDrafted: 100 }),
    player("rb-3", "RB", 15, { adp: 16, adpTimesDrafted: 100 }),
    player("wr-1", "WR", 2, { adp: 2, adpTimesDrafted: 100 }),
    player("wr-2", "WR", 8, { adp: 7, adpTimesDrafted: 100 }),
    player("wr-3", "WR", 16, { adp: 17, adpTimesDrafted: 100 }),
    player("te-1", "TE", 4, { adp: 3, adpTimesDrafted: 100 }),
    player("te-2", "TE", 12, { adp: 9, adpTimesDrafted: 100 }),
    player("te-3", "TE", 20, { adp: 21, adpTimesDrafted: 100 }),
  ];
  const positionBoards = {
    QB: [
      player("qb-1", "QB", 1, { tier: 1, positionRank: 1 }),
      player("qb-2", "QB", 2, { tier: 1, positionRank: 2 }),
      player("qb-3", "QB", 3, { tier: 2, positionRank: 3 }),
    ],
    RB: [
      player("rb-1", "RB", 1, { tier: 1, positionRank: 1 }),
      player("rb-2", "RB", 2, { tier: 2, positionRank: 2 }),
      player("rb-3", "RB", 3, { tier: 3, positionRank: 3 }),
    ],
    WR: [
      player("wr-1", "WR", 1, { tier: 1, positionRank: 1 }),
      player("wr-2", "WR", 2, { tier: 1, positionRank: 2 }),
      player("wr-3", "WR", 3, { tier: 2, positionRank: 3 }),
    ],
    TE: [
      player("te-1", "TE", 1, { tier: 1, positionRank: 1 }),
      player("te-2", "TE", 2, { tier: 2, positionRank: 2 }),
      player("te-3", "TE", 3, { tier: 3, positionRank: 3 }),
    ],
  };
  return { players, positionBoards };
}

function report(overrides: Partial<RedraftDraftDecisionInput> = {}) {
  const data = fixture();
  return calculateRedraftDraftDecision({
    ...data,
    picks: [],
    room: {
      teams: 2,
      rounds: 6,
      userTeam: 1,
      draftOrder: "snake",
      lineup,
    },
    currentPick: 1,
    rankingUsable: true,
    marketCurrent: true,
    ...overrides,
  });
}

describe("redraft draft decision model", () => {
  it("uses positional tiers while keeping replacement value on the overall scale", () => {
    const result = report();
    const quarterback = result.positions.find((entry) => entry.position === "QB");

    expect(quarterback?.bestAvailable?.expertRank).toBe(5);
    expect(quarterback?.tier).toMatchObject({
      tier: 1,
      positionRank: 1,
      remaining: 2,
      nextTier: 2,
      nextTierPositionRank: 3,
    });
    expect(quarterback?.bestAvailable?.value).toBeGreaterThan(0);
  });

  it("names the plausible survivor when no priced player reaches the next pick", () => {
    const survivor = {
      player: player("rb-9", "RB", 30, { name: "Late Runner" }),
      expertRank: 30,
      rankCost: 12,
      replacementDrop: 8.5,
      pointsDrop: null,
    };
    const wait: RedraftWaitReading = {
      kind: "no-priced-survivor",
      nextPick: 16,
      plausibleSurvivor: survivor,
      coverage: "supported",
    };
    expect(describeRedraftWait(wait)).toBe(
      "No reliably priced option reaches pick #16 at the market midpoint. Late Runner remains inside the published uncertainty band."
    );
    expect(describeRedraftWait({ ...wait, plausibleSurvivor: null })).toBe(
      "No reliably priced option reaches pick #16 at the market midpoint."
    );
  });

  it("measures the market midpoint cost of waiting only on the user's turn", () => {
    const onClock = report();
    const quarterback = onClock.positions.find((entry) => entry.position === "QB");
    expect(onClock.followingUserPick).toBe(4);
    expect(quarterback?.wait).toMatchObject({
      kind: "measured",
      nextPick: 4,
      survivor: { player: { id: "qb-2" }, rankCost: 4 },
    });

    const offClock = report({ currentPick: 2 });
    expect(offClock.positions[0].bestAvailable).not.toBeNull();
    expect(offClock.positions[0].wait).toMatchObject({
      kind: "unmeasurable",
      reason: "off-clock",
    });
  });

  it("withholds wait cost for stale and thin market readings", () => {
    const stale = report({ marketCurrent: false });
    expect(stale.positions[0].wait).toMatchObject({
      kind: "unmeasurable",
      reason: "market-unavailable",
    });

    const data = fixture();
    const thinPlayers = data.players.map((entry) => ({
      ...entry,
      adpTimesDrafted: 2,
    }));
    const thin = report({ players: thinPlayers });
    expect(thin.positions[0].wait).toMatchObject({
      kind: "unmeasurable",
      reason: "no-reliable-market",
    });
  });

  it("keeps fixed league replacement lines when alternatives are drafted", () => {
    const initial = report();
    const afterPick = report({
      picks: [{ teamNumber: 2, player: fixture().players[0] }],
      currentPick: 2,
    });
    const initialQb = initial.playerValues.find((entry) => entry.player.id === "qb-2");
    const afterQb = afterPick.playerValues.find((entry) => entry.player.id === "qb-2");
    expect(afterQb?.starterCutoff).toBe(initialQb?.starterCutoff);
    expect(afterQb?.value).toBe(initialQb?.value);
  });

  it("gives a filled position zero urgency", () => {
    const quarterback = fixture().players.find((entry) => entry.id === "qb-1");
    if (!quarterback) throw new Error("fixture missing quarterback");
    const result = report({ picks: [{ teamNumber: 1, player: quarterback }] });
    expect(result.positions.find((entry) => entry.position === "QB")).toMatchObject({
      need: "filled",
      scarcityScore: 0,
    });
  });

  it("supports snake turns, adjacent turn picks, linear order, and the last round", () => {
    expect(getRedraftTeamAtPick(13, 12, "snake")).toBe(12);
    expect(getRedraftNextPickForTeam({
      fromPick: 1,
      team: 1,
      teams: 12,
      rounds: 15,
      draftOrder: "snake",
      strictlyAfter: true,
    })).toBe(24);
    expect(getRedraftNextPickForTeam({
      fromPick: 12,
      team: 12,
      teams: 12,
      rounds: 15,
      draftOrder: "snake",
      strictlyAfter: true,
    })).toBe(13);
    expect(getRedraftNextPickForTeam({
      fromPick: 3,
      team: 3,
      teams: 10,
      rounds: 2,
      draftOrder: "linear",
      strictlyAfter: true,
    })).toBe(13);
    expect(getRedraftNextPickForTeam({
      fromPick: 13,
      team: 3,
      teams: 10,
      rounds: 2,
      draftOrder: "linear",
      strictlyAfter: true,
    })).toBeNull();
  });
});

/**
 * Five players per position so a four-team room's starter cutoffs exist. The
 * QB market spreads separate the market-only survival band from the wider
 * combined value/reach band: qb-1 carries a tight ADP sample under a huge
 * expert disagreement, which must not stretch his survival odds.
 */
function roomFixture(): Pick<
  RedraftDraftDecisionInput,
  "players" | "positionBoards"
> {
  const quarterbacks = [
    player("qb-1", "QB", 5, {
      adp: 1,
      adpTimesDrafted: 100,
      adpStandardDeviation: 1,
      standardDeviation: 12,
    }),
    player("qb-2", "QB", 9, { adp: 9, adpTimesDrafted: 100, adpStandardDeviation: 1 }),
    player("qb-3", "QB", 12, { adp: 20, adpTimesDrafted: 100, adpStandardDeviation: 1 }),
    player("qb-4", "QB", 20, { adp: 24, adpTimesDrafted: 100 }),
    player("qb-5", "QB", 30, { adp: 32, adpTimesDrafted: 100 }),
  ];
  const flexPlayers = (["RB", "WR", "TE"] as const).flatMap((position, positionIndex) =>
    [1, 2, 3, 4, 5].map((slot) =>
      player(`${position.toLowerCase()}-${slot}`, position, 40 + positionIndex * 10 + slot, {
        adp: 40 + positionIndex * 10 + slot,
        adpTimesDrafted: 100,
      })
    )
  );
  const positionBoards = {
    QB: [
      player("qb-1", "QB", 1, { tier: 1, positionRank: 1 }),
      player("qb-2", "QB", 2, { tier: 1, positionRank: 2 }),
      player("qb-3", "QB", 3, { tier: 2, positionRank: 3 }),
      player("qb-4", "QB", 4, { tier: 2, positionRank: 4 }),
      player("qb-5", "QB", 5, { tier: 3, positionRank: 5 }),
    ],
  };
  return { players: [...quarterbacks, ...flexPlayers], positionBoards };
}

function roomReport(teams: number, overrides: Partial<RedraftDraftDecisionInput> = {}) {
  return calculateRedraftDraftDecision({
    ...roomFixture(),
    picks: [],
    room: { teams, rounds: 6, userTeam: 1, draftOrder: "snake", lineup },
    currentPick: 1,
    rankingUsable: true,
    marketCurrent: true,
    ...overrides,
  });
}

describe("league-size and market-band corrections", () => {
  it("normalizes the tier cliff by the room's team count, not a fixed 12", () => {
    // QB tier 1 tops out at overall rank 9 and tier 2 opens at 12, a 3-rank
    // gap. Against one round of picks that gap saturates a 2-team room and
    // reads 0.75 in a 4-team room; the old fixed /12 gave 0.2 in both.
    const twoTeam = roomReport(2).positions.find((entry) => entry.position === "QB");
    const fourTeam = roomReport(4).positions.find((entry) => entry.position === "QB");
    expect(twoTeam?.tier.overallBoardGap).toBe(3);
    expect(twoTeam?.tier.signal).toBe(0.7);
    expect(fourTeam?.tier.signal).toBe(0.5);
  });

  it("publishes a 0-100 scarcity score no smaller than the tier signal", () => {
    // The score is max(tier signal, wait signal) scaled to 100, so with the
    // 4-team tier signal pinned at 0.5 above, the published number is bounded
    // below by 50 and above by the scale itself.
    const quarterback = roomReport(4).positions.find((entry) => entry.position === "QB");
    expect(typeof quarterback?.scarcityScore).toBe("number");
    expect(quarterback?.scarcityScore).toBeGreaterThanOrEqual(50);
    expect(quarterback?.scarcityScore).toBeLessThanOrEqual(100);
  });

  it("sizes survival bands from the market spread alone, without expert disagreement", () => {
    // Next user turn in the 4-team room is pick #8. qb-1 sits at ADP 1 with a
    // 1-pick market deviation, so the survival band (floor 6) ends at 7 and he
    // is not a plausible survivor; the combined band, inflated to 13 by his
    // 12-rank expert disagreement, wrongly kept him plausible.
    const quarterback = roomReport(4).positions.find((entry) => entry.position === "QB");
    expect(quarterback?.wait).toMatchObject({
      kind: "measured",
      nextPick: 8,
      survivor: { player: { id: "qb-2" }, pointsDrop: null },
      plausibleSurvivor: { player: { id: "qb-2" } },
      saferSurvivor: { player: { id: "qb-3" } },
    });
  });

  it("prices the wait cost in projected season points when VORP covers both players", () => {
    const withVorp = roomReport(4, {
      vorpValues: new Map([
        ["qb-1", { value: 60 }],
        ["qb-2", { value: 38 }],
      ]),
    });
    const wait = withVorp.positions.find((entry) => entry.position === "QB")?.wait;
    expect(wait).toMatchObject({
      kind: "measured",
      survivor: { player: { id: "qb-2" }, pointsDrop: 22 },
    });
    if (wait?.kind === "measured") {
      expect(describeRedraftWait(wait)).toBe(
        "At pick #8, the market midpoint moves to qb-2. Waiting costs about 22 projected season points (4 consensus spots and 19.6 replacement index points) against the best option now. qb-3 is the safer bet to last, with his whole published range clearing that pick."
      );
    }

    const partialCoverage = roomReport(4, {
      vorpValues: new Map([["qb-1", { value: 60 }]]),
    });
    const partialWait = partialCoverage.positions.find(
      (entry) => entry.position === "QB"
    )?.wait;
    expect(partialWait).toMatchObject({
      kind: "measured",
      survivor: { pointsDrop: null },
    });
  });
});
