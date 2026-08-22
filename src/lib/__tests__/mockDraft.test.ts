import type { Player, RedraftLineupSettings, TeamRoster } from "@/types";
import { mulberry32 } from "@/lib/retirement/random";
import { calculateDraftOrder } from "@/app/fantasy-football/draft-tracker/hooks/useDraftState";
import { getMockDraftBoardValue, pickForTeam, type MockDraftEngineConfig } from "@/lib/mockDraft";

let nextId = 0;

function makePlayer(overrides: Partial<Player> = {}): Player {
  nextId += 1;
  return {
    id: `mock-${nextId}`,
    name: `Player ${nextId}`,
    team: "FA",
    position: "WR",
    averageRank: nextId,
    rankEcr: nextId,
    ...overrides,
  } as Player;
}

type RosterShape = Pick<TeamRoster, "picks" | "positionCounts">;

function makeRoster(players: Player[] = []): RosterShape {
  const positionCounts = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 };
  for (const player of players) {
    if (player.position in positionCounts) {
      positionCounts[player.position as keyof typeof positionCounts] += 1;
    }
  }
  return {
    picks: players.map((player, index) => ({
      pickNumber: index + 1,
      round: index + 1,
      teamNumber: 1,
      player,
      timestamp: new Date(0),
    })),
    positionCounts,
  };
}

/**
 * A plausible 164-player one-QB board: RB/WR dominate the front, QBs and TEs
 * sprinkle through the middle, K/DST carry deep consensus ranks. Ranks above
 * 150 deliberately fall past the ECR baseline cutoff so the deep board
 * exercises the no-baseline fallback ordering.
 */
function makeBoard(): Player[] {
  nextId = 0;
  const board: Player[] = [];
  const add = (position: Player["position"], count: number, rankOf: (i: number) => number) => {
    for (let i = 0; i < count; i += 1) {
      const rank = rankOf(i);
      board.push(makePlayer({ position, rankEcr: rank, averageRank: rank }));
    }
  };
  add("RB", 45, (i) => 1 + i * 3);
  add("WR", 50, (i) => 2 + i * 3);
  add("TE", 25, (i) => 6 + i * 6);
  add("QB", 20, (i) => 12 + i * 7);
  add("K", 12, (i) => 130 + i * 3);
  add("DST", 12, (i) => 132 + i * 3);
  return board.sort((a, b) => (a.rankEcr as number) - (b.rankEcr as number));
}

const CONFIG: MockDraftEngineConfig = { totalTeams: 10, rounds: 15 };

interface SimPick {
  pickNumber: number;
  round: number;
  teamNumber: number;
  player: Player;
}

function simulateDraft(seed: number, config: MockDraftEngineConfig = CONFIG) {
  const rng = mulberry32(seed);
  const available = makeBoard();
  const rosters: RosterShape[] = Array.from({ length: config.totalTeams }, () => makeRoster());
  const picks: SimPick[] = [];
  const totalPicks = config.totalTeams * config.rounds;
  for (let pickNumber = 1; pickNumber <= totalPicks; pickNumber += 1) {
    const teamNumber = calculateDraftOrder(pickNumber, config.totalTeams, "snake");
    const roster = rosters[teamNumber - 1];
    const player = pickForTeam(available, roster, pickNumber, config, rng);
    if (!player) throw new Error(`no pick returned at ${pickNumber}`);
    const index = available.findIndex((p) => p.id === player.id);
    if (index === -1) throw new Error(`picked unavailable player at ${pickNumber}`);
    available.splice(index, 1);
    roster.picks.push({ pickNumber, round: 1, teamNumber, player, timestamp: new Date(0) });
    roster.positionCounts[player.position as keyof RosterShape["positionCounts"]] += 1;
    picks.push({
      pickNumber,
      round: Math.ceil(pickNumber / config.totalTeams),
      teamNumber,
      player,
    });
  }
  return { picks, rosters };
}

describe("pickForTeam", () => {
  it("produces the same full draft for the same seed", () => {
    const first = simulateDraft(42).picks.map((p) => p.player.id);
    const second = simulateDraft(42).picks.map((p) => p.player.id);
    expect(second).toEqual(first);
    expect(new Set(first).size).toBe(first.length);
  });

  it("takes a top-three board value with the first overall pick", () => {
    const board = makeBoard();
    const topIds = board.slice(0, 3).map((p) => p.id);
    for (const seed of [1, 2, 3, 4, 5]) {
      const player = pickForTeam(board, makeRoster(), 1, CONFIG, mulberry32(seed));
      expect(player).not.toBeNull();
      expect(topIds).toContain((player as Player).id);
    }
  });

  it("keeps a faithful room inside the top two early, while chaotic reaches past three", () => {
    const board = makeBoard();
    const topTwo = board.slice(0, 2).map((p) => p.id);
    const seeds = Array.from({ length: 40 }, (_, i) => i + 1);
    for (const seed of seeds) {
      const player = pickForTeam(
        board,
        makeRoster(),
        1,
        { ...CONFIG, temper: "faithful" },
        mulberry32(seed)
      );
      expect(topTwo).toContain((player as Player).id);
    }
    const chaoticPicks = new Set(
      seeds.map(
        (seed) =>
          (
            pickForTeam(
              board,
              makeRoster(),
              1,
              { ...CONFIG, temper: "chaotic" },
              mulberry32(seed)
            ) as Player
          ).id
      )
    );
    const topThree = new Set(board.slice(0, 3).map((p) => p.id));
    expect([...chaoticPicks].some((id) => !topThree.has(id))).toBe(true);
  });

  it("derives required starters and K/DST caps from a custom lineup", () => {
    const noKDst: RedraftLineupSettings = { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 2, K: 0, DST: 0 };
    const kicker = makePlayer({ position: "K", rankEcr: 1, averageRank: 1 });
    const board = [kicker, ...makeBoard()];
    // Closing round of a no-K/DST lineup: the default config would force a
    // kicker here, the lineup-driven caps must not.
    const config: MockDraftEngineConfig = { ...CONFIG, lineup: noKDst };
    const lateRoster = makeRoster(
      Array.from({ length: 14 }, () => makePlayer({ position: "WR" }))
    );
    for (const seed of [1, 2, 3, 4, 5]) {
      const player = pickForTeam(board, lateRoster, 141, config, mulberry32(seed));
      expect(["K", "DST"]).not.toContain((player as Player).position);
    }
  });

  it("ignores a kicker at the top of the board outside the closing rounds", () => {
    const kicker = makePlayer({ position: "K", rankEcr: 1, averageRank: 1 });
    const board = [kicker, ...makeBoard()];
    const player = pickForTeam(board, makeRoster(), 25, CONFIG, mulberry32(7));
    expect((player as Player).position).not.toBe("K");
  });

  it("never drafts a third quarterback", () => {
    const rostered = [
      makePlayer({ position: "QB" }),
      makePlayer({ position: "QB" }),
    ];
    const board = [
      makePlayer({ position: "QB", rankEcr: 1, averageRank: 1 }),
      makePlayer({ position: "QB", rankEcr: 2, averageRank: 2 }),
      makePlayer({ position: "RB", rankEcr: 3, averageRank: 3 }),
      makePlayer({ position: "WR", rankEcr: 4, averageRank: 4 }),
    ];
    for (const seed of [1, 2, 3]) {
      const player = pickForTeam(board, makeRoster(rostered), 61, CONFIG, mulberry32(seed));
      expect((player as Player).position).not.toBe("QB");
    }
  });

  it("keeps kickers and defenses out of every round before the closing three", () => {
    const { picks } = simulateDraft(11);
    for (const pick of picks) {
      if (pick.round <= CONFIG.rounds - 3) {
        expect(["K", "DST"]).not.toContain(pick.player.position);
      }
    }
  });

  it("fills every required starting slot on every roster by the end", () => {
    for (const seed of [3, 19, 77]) {
      const { rosters } = simulateDraft(seed);
      for (const roster of rosters) {
        expect(roster.positionCounts.QB).toBeGreaterThanOrEqual(1);
        expect(roster.positionCounts.RB).toBeGreaterThanOrEqual(2);
        expect(roster.positionCounts.WR).toBeGreaterThanOrEqual(2);
        expect(roster.positionCounts.TE).toBeGreaterThanOrEqual(1);
        expect(roster.positionCounts.K).toBe(1);
        expect(roster.positionCounts.DST).toBe(1);
      }
    }
  });

  it("goes strictly best-available once the board is down to rankless players", () => {
    const deep = [
      makePlayer({ position: "WR", rankEcr: undefined, averageRank: Number.NaN }),
      makePlayer({ position: "RB", rankEcr: undefined, averageRank: Number.NaN }),
      makePlayer({ position: "WR", rankEcr: undefined, averageRank: Number.NaN }),
    ];
    const player = pickForTeam(deep, makeRoster(), 149, CONFIG, mulberry32(5));
    expect(player).toBe(deep[0]);
  });

  describe("getMockDraftBoardValue", () => {
    it("prices a thin-sample ADP player by consensus instead of sinking him behind the board", () => {
      // Goedert-shaped case: real ADP with under 20 recorded selections. The
      // analytics baseline abstains, but the draft room must still price him
      // on the pick scale or simulated teams never draft him.
      const thin = makePlayer({ rankEcr: 111, averageRank: 111, adp: 110.7, adpTimesDrafted: 14 });
      expect(getMockDraftBoardValue(thin)).toBe(111);
    });

    it("keeps reliable market ADP ahead of consensus", () => {
      const reliable = makePlayer({ rankEcr: 30, averageRank: 30, adp: 24.5, adpTimesDrafted: 400 });
      expect(getMockDraftBoardValue(reliable)).toBe(24.5);
    });

    it("sends only rankless players past every real baseline", () => {
      const rankless = makePlayer({ rankEcr: undefined, averageRank: Number.NaN });
      expect(getMockDraftBoardValue(rankless)).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  it("returns null on an empty board", () => {
    expect(pickForTeam([], makeRoster(), 1, CONFIG, mulberry32(1))).toBeNull();
  });
});
