/**
 * @jest-environment node
 */
import {
  BEST_BALL_CONSENSUS_MAX_DIVERGENT,
  assertBestBallConsensusConsistency,
  evaluateBestBallConsensusConsistency,
  getBestBallConsensusBandGap,
  getBestBallConsensusIssue,
  getBestBallFrozenBoardClause,
  getBestBallModelSourceIssue,
  getBestBallRankingSource,
  isBestBallBoardFrozen,
  isBestBallConsensusDivergent,
  isBestBallSeasonOpen,
} from "@/lib/bestBall/sourceCapabilities";
import { getContestPreset } from "@/lib/bestBall/contests";
import {
  BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
  type BestBallSnapshot,
  type BestBallSourceMetadata,
} from "@/lib/bestBallSnapshot";
import type { Player } from "@/types";

const POSITIONS: Player["position"][] = ["QB", "RB", "WR", "TE"];

/**
 * A board of `size` players whose published fields agree with each other,
 * plus the ordinary deep-tail quirk (past rank 260 the consensus rank drifts
 * well outside the band, which every healthy FantasyPros board shows).
 */
function healthyBoard(size = 333): Player[] {
  return Array.from({ length: size }, (_, index) => {
    const rank = index + 1;
    const tailDrift = rank > 260 ? 40 : 0;
    return {
      id: `fp-${rank}`,
      name: `Player ${rank}`,
      team: "KC",
      position: POSITIONS[index % POSITIONS.length],
      averageRank: rank,
      rankEcr: rank,
      rankAverage: rank - tailDrift + 0.4,
      minRank: Math.max(1, rank - tailDrift - 1),
      maxRank: rank - tailDrift + 2,
      standardDeviation: 0.5,
      tier: Math.ceil(rank / 12),
      positionRank: Math.ceil(rank / 4),
    };
  });
}

/**
 * The 2026-09-06 shape: three of four experts rank the player near the top
 * while the fourth omits him, so rank_ave, rank_min, and rank_max sit at the
 * top and rank_ecr lands 50-odd places lower. Every third player gets it.
 */
function brokenBoard(size = 350): Player[] {
  return healthyBoard(size).map((player, index) =>
    index % 3 === 0 && index < 200
      ? { ...player, rankEcr: player.rankEcr! + 53, averageRank: player.averageRank + 53, tier: 7 }
      : player
  );
}

const GIBBS: Player = {
  id: "fp-22968",
  name: "Jahmyr Gibbs",
  team: "DET",
  position: "RB",
  averageRank: 54,
  rankEcr: 54,
  rankAverage: 1.33,
  standardDeviation: 0.47,
  tier: 7,
  positionRank: 19,
  minRank: 1,
  maxRank: 2,
};

describe("best ball consensus self-consistency", () => {
  it("measures how far a published consensus rank sits outside its own expert band", () => {
    expect(getBestBallConsensusBandGap(GIBBS)).toBe(52);
    expect(getBestBallConsensusBandGap({ ...GIBBS, rankEcr: 1 })).toBe(0);
    expect(getBestBallConsensusBandGap({ ...GIBBS, rankEcr: 2, minRank: 5, maxRank: 9 })).toBe(3);
    expect(getBestBallConsensusBandGap({ ...GIBBS, minRank: undefined })).toBeNull();
    expect(isBestBallConsensusDivergent(GIBBS)).toBe(true);
    expect(isBestBallConsensusDivergent({ ...GIBBS, rankEcr: 12 })).toBe(false);
  });

  it("passes a healthy board, including its deep-tail drift", () => {
    const verdict = evaluateBestBallConsensusConsistency(healthyBoard());

    expect(verdict).toMatchObject({ ok: true, sampled: 150, divergent: 0 });
    expect(() => assertBestBallConsensusConsistency(healthyBoard())).not.toThrow();
  });

  it("fails the four-expert omission shape and names the worst offenders", () => {
    const verdict = evaluateBestBallConsensusConsistency(brokenBoard());

    expect(verdict.ok).toBe(false);
    expect(verdict.sampled).toBe(150);
    expect(verdict.divergent).toBeGreaterThan(BEST_BALL_CONSENSUS_MAX_DIVERGENT);
    expect(verdict.examples[0]).toMatch(/ECR \d+, experts \d+ to \d+, average/);
    expect(() => assertBestBallConsensusConsistency(brokenBoard())).toThrow(
      /disagrees with its own expert ranges/
    );
  });

  it("tolerates a handful of divergent rows and skips rows without a published band", () => {
    const board = healthyBoard();
    for (let index = 0; index < BEST_BALL_CONSENSUS_MAX_DIVERGENT; index += 1) {
      board[index] = { ...board[index], rankEcr: 90 + index, averageRank: 90 + index };
    }
    expect(evaluateBestBallConsensusConsistency(board).ok).toBe(true);

    board[BEST_BALL_CONSENSUS_MAX_DIVERGENT] = {
      ...board[BEST_BALL_CONSENSUS_MAX_DIVERGENT],
      rankEcr: 99,
      averageRank: 99,
    };
    expect(evaluateBestBallConsensusConsistency(board).ok).toBe(false);

    const noBands = board.map(({ minRank: _min, maxRank: _max, ...player }) => player);
    expect(evaluateBestBallConsensusConsistency(noBands)).toMatchObject({ ok: true, divergent: 0 });
  });
});

const NOW = new Date("2026-08-10T12:00:00.000Z");
const FRESH_AS_OF = "2026-08-09T12:00:00.000Z";
const STALE_AS_OF = "2026-08-01T00:00:00.000Z";

function source(
  provider: string,
  asOf: string = FRESH_AS_OF
): BestBallSourceMetadata {
  return {
    provider,
    url: `https://example.com/${provider.toLowerCase().replaceAll(" ", "-")}`,
    asOf,
  };
}

const COMPLETE_WEEK_17 = Object.fromEntries(
  Array.from({ length: 30 }, (_, index) => [
    `TEAM-${index + 1}`,
    `OPP-${index + 1}`,
  ])
);

function snapshot(overrides: Partial<BestBallSnapshot> = {}): BestBallSnapshot {
  return {
    schemaVersion: BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
    season: 2026,
    generatedAt: FRESH_AS_OF,
    players: [],
    rankingSource: source("Standard rankings"),
    superflexSource: source("Superflex rankings"),
    adpSource: source("Underdog ADP"),
    scheduleSource: source("Week 17 schedule"),
    week17Opponents: COMPLETE_WEEK_17,
    ...overrides,
  };
}

describe("best ball source capabilities", () => {
  it("allows an exact standard contest when every required source is fresh and complete", () => {
    const current = snapshot();
    const preset = getContestPreset("bbm-vii");

    expect(getBestBallRankingSource(current, preset)).toBe(current.rankingSource);
    expect(getBestBallModelSourceIssue(current, preset, NOW)).toBeNull();
  });

  it.each([
    {
      label: "missing",
      adpSource: null,
      issue: "the matching standard-season Underdog ADP source is unavailable",
    },
    {
      label: "stale",
      adpSource: source("Underdog ADP", STALE_AS_OF),
      issue: "the matching standard-season Underdog ADP source is stale",
    },
  ])("withholds an exact standard contest when matching ADP is $label", ({ adpSource, issue }) => {
    expect(
      getBestBallModelSourceIssue(
        snapshot({ adpSource }),
        getContestPreset("bbm-vii"),
        NOW
      )
    ).toBe(issue);
  });

  it("does not require matching ADP or a Week 17 schedule for a reference profile that uses neither", () => {
    const reference = snapshot({
      adpSource: null,
      scheduleSource: null,
      week17Opponents: {},
    });

    expect(
      getBestBallModelSourceIssue(reference, getContestPreset("eliminator"), NOW)
    ).toBeNull();
  });

  it("uses the Superflex ranking source instead of the stale standard board", () => {
    const current = snapshot({
      rankingSource: source("Standard rankings", STALE_AS_OF),
      superflexSource: source("Superflex rankings"),
      adpSource: null,
      scheduleSource: null,
      week17Opponents: {},
    });
    const preset = getContestPreset("superflex");

    expect(getBestBallRankingSource(current, preset)).toBe(current.superflexSource);
    expect(getBestBallModelSourceIssue(current, preset, NOW)).toBeNull();
  });

  it("pauses a standard lens with a dated sentence when the consensus contradicts itself", () => {
    const broken = snapshot({
      players: brokenBoard(),
      rankingSource: source("Standard rankings", "2026-09-09T23:22:32.000Z"),
    });
    const issue = getBestBallModelSourceIssue(broken, getContestPreset("bbm-vii"), NOW);

    expect(issue).toMatch(
      /^the PPR best ball consensus published Sep 9, 2026 disagrees with its own expert ranges on \d+ of its top 150 players, so its ranks are withheld$/
    );
    expect(getBestBallConsensusIssue(broken)).toBe(issue);
    expect(getBestBallModelSourceIssue(broken, getContestPreset("eliminator"), NOW)).toBe(issue);
  });

  it("reports a contradiction ahead of staleness and leaves a healthy board alone", () => {
    const staleAndBroken = snapshot({
      players: brokenBoard(),
      rankingSource: source("Standard rankings", STALE_AS_OF),
    });
    expect(getBestBallModelSourceIssue(staleAndBroken, getContestPreset("bbm-vii"), NOW)).toMatch(
      /disagrees with its own expert ranges/
    );

    const healthy = snapshot({ players: healthyBoard() });
    expect(getBestBallConsensusIssue(healthy)).toBeNull();
    expect(getBestBallModelSourceIssue(healthy, getContestPreset("bbm-vii"), NOW)).toBeNull();
  });

  it("does not apply the PPR self-consistency test to the Superflex lens", () => {
    const broken = snapshot({
      players: brokenBoard(),
      adpSource: null,
      scheduleSource: null,
      week17Opponents: {},
    });

    expect(getBestBallModelSourceIssue(broken, getContestPreset("superflex"), NOW)).toBeNull();
  });

  it("withholds a Week 17 profile when the fresh schedule mapping is incomplete", () => {
    const incomplete = Object.fromEntries(Object.entries(COMPLETE_WEEK_17).slice(0, 29));

    expect(
      getBestBallModelSourceIssue(
        snapshot({ week17Opponents: incomplete }),
        getContestPreset("bbm-vii"),
        NOW
      )
    ).toBe("the Week 17 schedule source is incomplete");
  });
});

/**
 * From Week 1 the market is closed and the builder keeps the committed
 * snapshot frozen (getBestBallRefreshFallback), so the same four-day gate
 * has to describe a dated board on purpose rather than a missed refresh.
 * Dates are the committed 2026 board: consensus Sep 1, Superflex Sep 3,
 * ADP and schedule Sep 10, read on Sep 11.
 */
describe("best ball source gate once the season opens", () => {
  const SEASON_NOW = new Date("2026-09-11T12:00:00.000Z");
  const FROZEN_CONSENSUS_AS_OF = "2026-09-01T11:20:54.000Z";
  const FROZEN_CLAUSE =
    "the best ball consensus is frozen at its Sep 1, 2026 board and the market closed at kickoff";

  function frozenSnapshot(overrides: Partial<BestBallSnapshot> = {}): BestBallSnapshot {
    return snapshot({
      generatedAt: "2026-09-11T09:24:17.592Z",
      rankingSource: source("Standard rankings", FROZEN_CONSENSUS_AS_OF),
      superflexSource: source("Superflex rankings", "2026-09-03T19:17:55.000Z"),
      adpSource: source("Underdog ADP", "2026-09-10T15:52:40.059Z"),
      scheduleSource: source("Week 17 schedule", "2026-09-10T19:28:43.439Z"),
      ...overrides,
    });
  }

  it("reads the season from the calendar", () => {
    expect(isBestBallSeasonOpen({ season: 2026 }, NOW)).toBe(false);
    expect(isBestBallSeasonOpen({ season: 2026 }, new Date("2026-09-08T12:00:00.000Z"))).toBe(false);
    expect(isBestBallSeasonOpen({ season: 2026 }, SEASON_NOW)).toBe(true);
  });

  it("names the dated board and the closed market instead of a missed refresh", () => {
    const preset = getContestPreset("bbm-vii");
    const issue = getBestBallModelSourceIssue(frozenSnapshot(), preset, SEASON_NOW);

    expect(issue).toBe(FROZEN_CLAUSE);
    expect(getBestBallFrozenBoardClause(FROZEN_CONSENSUS_AS_OF)).toBe(FROZEN_CLAUSE);
    expect(issue).not.toMatch(/stale|refresh/);
    expect(isBestBallBoardFrozen(frozenSnapshot(), preset, SEASON_NOW)).toBe(true);
  });

  it("dates the Superflex lens by its own board", () => {
    const preset = getContestPreset("superflex");

    expect(getBestBallModelSourceIssue(frozenSnapshot(), preset, SEASON_NOW)).toBe(
      "the best ball consensus is frozen at its Sep 3, 2026 board and the market closed at kickoff"
    );
    expect(isBestBallBoardFrozen(frozenSnapshot(), preset, SEASON_NOW)).toBe(true);
  });

  it("keeps the preseason wording before Week 1", () => {
    const preseason = snapshot({ rankingSource: source("Standard rankings", STALE_AS_OF) });
    const preset = getContestPreset("bbm-vii");

    expect(getBestBallModelSourceIssue(preseason, preset, NOW)).toBe(
      "the required ranking source is stale"
    );
    expect(isBestBallBoardFrozen(preseason, preset, NOW)).toBe(false);
  });

  it("reports a frozen ADP the same way when the consensus itself is current", () => {
    const frozenAdp = frozenSnapshot({
      rankingSource: source("Standard rankings", "2026-09-10T11:00:00.000Z"),
      adpSource: source("Underdog ADP", "2026-09-01T15:00:00.000Z"),
    });

    expect(getBestBallModelSourceIssue(frozenAdp, getContestPreset("bbm-vii"), SEASON_NOW)).toBe(
      "the Underdog ADP is frozen at its Sep 1, 2026 reading and the market closed at kickoff"
    );
  });

  it("keeps a contradiction ahead of the freeze and out of the short form", () => {
    const frozenAndBroken = frozenSnapshot({ players: brokenBoard() });
    const preset = getContestPreset("bbm-vii");

    expect(getBestBallModelSourceIssue(frozenAndBroken, preset, SEASON_NOW)).toMatch(
      /disagrees with its own expert ranges/
    );
    expect(isBestBallBoardFrozen(frozenAndBroken, preset, SEASON_NOW)).toBe(false);
  });
});
