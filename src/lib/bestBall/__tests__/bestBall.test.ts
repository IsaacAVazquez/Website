/**
 * @jest-environment node
 */
import {
  BEST_BALL_CONTEST_ORDER,
  BEST_BALL_CONTESTS,
  BEST_BALL_RULES_AS_OF,
  BEST_BALL_STRATEGY_PROFILES,
  STANDARD_BEST_BALL_LINEUP,
  STANDARD_ROSTER_SEARCH_SPACE,
  SUPERFLEX_BEST_BALL_LINEUP,
  analyzeBestBallRoster,
  findByeWeekConflicts,
  findQbPassCatcherStacks,
  findSameTeamConcentrations,
  findWeek17OpponentPairs,
  getAdaptiveRosterTargets,
  getNextUserPick,
  getSnakeTeamNumber,
  hasSupportedBestBallAdp,
  normalizeContestId,
  recommendBestBallPlayers,
  sortBestBallRankings,
} from "@/lib/bestBall";
import type { BestBallDraftPick, BestBallPosition } from "@/lib/bestBall";
import type { Player } from "@/types";

function player(
  id: string,
  position: Player["position"],
  rank: number,
  overrides: Partial<Player> = {}
): Player {
  return {
    id,
    name: `Player ${id}`,
    team: "KC",
    position,
    averageRank: rank,
    rankEcr: rank,
    positionRank: rank,
    standardDeviation: 1,
    ...overrides,
  };
}

function pick(
  playerValue: Player,
  round: number,
  teamNumber = 1,
  pickNumber = (round - 1) * 12 + teamNumber
): BestBallDraftPick {
  return { player: playerValue, round, teamNumber, pickNumber };
}

describe("best ball contest catalog", () => {
  it("pins every supported offering and the shared standard rules", () => {
    expect(BEST_BALL_CONTEST_ORDER).toEqual([
      "bbm-vii",
      "puppy",
      "eliminator",
      "weekly-winners",
      "sit-and-go",
      "superflex",
    ]);
    expect(Object.keys(BEST_BALL_CONTESTS).sort()).toEqual([...BEST_BALL_CONTEST_ORDER].sort());

    for (const contest of Object.values(BEST_BALL_CONTESTS)) {
      expect(contest.teams).toBe(12);
      expect(contest.rounds).toBe(18);
      expect(contest.rosterSize).toBe(18);
      expect(contest.scoring).toBe("HALF_PPR");
      expect(contest.rulesAsOf).toBe(BEST_BALL_RULES_AS_OF);
      expect(contest.officialRulesUrl).toMatch(/^https:\/\//);
      expect(contest.officialTermsUrl).toMatch(/^https:\/\//);
      expect(contest.recommendationReason.length).toBeGreaterThan(20);
      expect(hasSupportedBestBallAdp(contest)).toBe(contest.recommendationMode === "exact");
    }

    expect(STANDARD_BEST_BALL_LINEUP).toEqual({ QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 });
    expect(SUPERFLEX_BEST_BALL_LINEUP).toEqual({
      QB: 1,
      RB: 2,
      WR: 3,
      TE: 1,
      FLEX: 0,
      SUPERFLEX: 1,
    });
    expect(BEST_BALL_CONTESTS.puppy.strategyProfileId).toBe(
      BEST_BALL_CONTESTS["bbm-vii"].strategyProfileId
    );
    expect(BEST_BALL_CONTESTS["bbm-vii"]).toMatchObject({
      competitionFormat: "tournament",
      lineupVariant: "standard",
    });
    expect(BEST_BALL_CONTESTS.superflex).toMatchObject({
      competitionFormat: "tournament",
      lineupVariant: "superflex",
    });
    expect(BEST_BALL_CONTESTS.eliminator.competitionFormat).toBe("elimination");
    expect(BEST_BALL_CONTESTS["weekly-winners"].competitionFormat).toBe("weekly");
    expect(BEST_BALL_CONTESTS["sit-and-go"].competitionFormat).toBe("cumulative");
    expect(BEST_BALL_CONTESTS["bbm-vii"].recommendationMode).toBe("exact");
    expect(BEST_BALL_CONTESTS.puppy.recommendationMode).toBe("exact");
    for (const contestId of [
      "eliminator",
      "weekly-winners",
      "sit-and-go",
      "superflex",
    ] as const) {
      expect(BEST_BALL_CONTESTS[contestId].recommendationMode).toBe("reference");
    }
  });

  it("keeps the format profiles materially different", () => {
    const tournament = BEST_BALL_STRATEGY_PROFILES["standard-tournament"];
    const eliminator = BEST_BALL_STRATEGY_PROFILES.eliminator;
    const weekly = BEST_BALL_STRATEGY_PROFILES["weekly-winners"];
    const cumulative = BEST_BALL_STRATEGY_PROFILES.cumulative;

    expect(eliminator.correlationWeight).toBeLessThan(tournament.correlationWeight);
    expect(eliminator.byeCoverageWeight).toBeGreaterThan(tournament.byeCoverageWeight);
    expect(weekly.spikeWeekWeight).toBeGreaterThan(0);
    expect(tournament.week17Treatment).toBe("scored");
    expect(tournament.concentrationFloor).toBeGreaterThan(eliminator.concentrationFloor);
    expect(cumulative.week17Treatment).toBe("none");
  });

  it("normalizes stable IDs, names, and common aliases", () => {
    expect(normalizeContestId("Best Ball Mania VII")).toBe("bbm-vii");
    expect(normalizeContestId("BBM 7")).toBe("bbm-vii");
    expect(normalizeContestId("Sit & Go")).toBe("sit-and-go");
    expect(normalizeContestId("SF")).toBe("superflex");
    expect(normalizeContestId("unknown-format")).toBe("bbm-vii");
  });
});

describe("best ball rankings", () => {
  const pool = [
    player("qb", "QB", 30, { adp: 5, positionRank: 1, superflexRank: 1 }),
    player("wr", "WR", 10, { adp: 20, positionRank: 1, superflexRank: 2 }),
    player("rb", "RB", 20, { adp: 10, positionRank: 1, superflexRank: 3 }),
    player("te", "TE", 40, { adp: 30, positionRank: 1, superflexRank: 4 }),
    player("k", "K", 1),
    player("dst", "DST", 2),
  ];

  it("uses standard-season Underdog ADP only for the supported tournament rooms", () => {
    for (const contestId of ["bbm-vii", "puppy"] as const) {
      const ranked = sortBestBallRankings(pool, contestId);
      expect(ranked.map((entry) => entry.id)).toEqual(["qb", "rb", "wr", "te"]);
      expect(ranked[0].rankReason).toContain("current standard Underdog ADP");
      expect(ranked[0].bestBallEcr).toBe(30);
    }

    for (const contestId of ["eliminator", "weekly-winners", "sit-and-go"] as const) {
      const ranked = sortBestBallRankings(pool, contestId);
      expect(ranked.map((entry) => entry.id)).toEqual(["wr", "rb", "qb", "te"]);
      expect(ranked[0].rankReason).toContain("no matching ADP source");
    }
  });

  it("uses the separate sourced Superflex order without overwriting best ball ECR", () => {
    const ranked = sortBestBallRankings(pool, "superflex");
    const quarterback = ranked.find((entry) => entry.id === "qb");
    const receiver = ranked.find((entry) => entry.id === "wr");

    expect(ranked[0].id).toBe("qb");
    expect(quarterback?.rankAdjustment).toBe(-29);
    expect(quarterback?.adjustedRank).toBe(1);
    expect(quarterback?.rankReason).toContain("sourced Superflex consensus");
    expect(receiver?.rankAdjustment).toBe(-8);
    expect(receiver?.bestBallEcr).toBe(10);
  });
});

describe("snake draft math", () => {
  it("maps turns at both ends of a twelve-team snake", () => {
    expect(getSnakeTeamNumber(1)).toBe(1);
    expect(getSnakeTeamNumber(12)).toBe(12);
    expect(getSnakeTeamNumber(13)).toBe(12);
    expect(getSnakeTeamNumber(24)).toBe(1);
    expect(getSnakeTeamNumber(25)).toBe(1);
  });

  it("finds the next user pick inclusively and stops after the draft", () => {
    expect(getNextUserPick(1, 12)).toBe(12);
    expect(getNextUserPick(13, 12)).toBe(13);
    expect(getNextUserPick(14, 12)).toBe(36);
    expect(getNextUserPick(216, 1)).toBe(216);
    expect(getNextUserPick(217, 1)).toBeNull();
  });
});

describe("adaptive roster targets", () => {
  it("searches only legal standard compositions that total 18", () => {
    expect(STANDARD_ROSTER_SEARCH_SPACE).toEqual({
      QB: { minimum: 2, maximum: 3 },
      RB: { minimum: 4, maximum: 7 },
      WR: { minimum: 6, maximum: 9 },
      TE: { minimum: 2, maximum: 3 },
    });

    const result = getAdaptiveRosterTargets([]);
    expect(result.validCompositions.length).toBeGreaterThan(0);
    for (const composition of result.validCompositions) {
      expect(Object.values(composition).reduce((sum, count) => sum + count, 0)).toBe(18);
      for (const position of Object.keys(composition) as BestBallPosition[]) {
        expect(composition[position]).toBeGreaterThanOrEqual(
          STANDARD_ROSTER_SEARCH_SPACE[position].minimum
        );
        expect(composition[position]).toBeLessThanOrEqual(
          STANDARD_ROSTER_SEARCH_SPACE[position].maximum
        );
      }
    }
    expect(Object.values(result.recommended).reduce((sum, count) => sum + count, 0)).toBe(18);
  });

  it("lowers early QB and TE counts while delayed investment raises them", () => {
    const early = getAdaptiveRosterTargets([
      pick(player("early-qb", "QB", 8), 2),
      pick(player("early-te", "TE", 12), 4),
    ]);
    const delayed = getAdaptiveRosterTargets([
      pick(player("late-wr", "WR", 80), 13),
    ]);

    expect(early.recommended.QB).toBe(2);
    expect(early.recommended.TE).toBe(2);
    expect(delayed.recommended.QB).toBe(3);
    expect(delayed.recommended.TE).toBe(3);
    expect(early.reasons.join(" ")).toContain("early QB");
    expect(delayed.reasons.join(" ")).toContain("No QB through Round 12");
  });

  it("defaults to a three-QB standard build and does not panic on QB in the middle rounds", () => {
    expect(getAdaptiveRosterTargets([]).recommended.QB).toBe(3);

    // Zero QBs through Round 9 is the winning pattern, so no forced-QB reason should fire yet.
    const middle = getAdaptiveRosterTargets([pick(player("r9-wr", "WR", 80), 9)], "bbm-vii", 9);
    expect(middle.targets.QB.reason).not.toContain("raises the preferred QB count");
  });

  it("sets a higher Superflex QB floor", () => {
    const targets = getAdaptiveRosterTargets([], "superflex");
    expect(targets.targets.QB.minimum).toBeGreaterThanOrEqual(3);
    expect(targets.recommended.QB).toBeGreaterThanOrEqual(3);
  });

  it("uses the upcoming user round before a Round 13 pick", () => {
    const targets = getAdaptiveRosterTargets(
      [pick(player("round-twelve-wr", "WR", 80), 12)],
      "bbm-vii",
      13
    );

    expect(targets.currentRound).toBe(13);
    expect(targets.recommended.QB).toBe(3);
    expect(targets.targets.QB.reason).toContain("No QB through Round 12");
  });

  it("keeps completed picks and returns a feasible target after exceeding a normal maximum", () => {
    const picks = Array.from({ length: 4 }, (_, index) =>
      pick(player(`qb-${index}`, "QB", index + 1), index + 1)
    );
    const targets = getAdaptiveRosterTargets(picks);

    expect(targets.recommended.QB).toBe(4);
    expect(Object.values(targets.recommended).reduce((sum, count) => sum + count, 0)).toBe(18);
    expect(targets.targets.QB.reason).toContain("above the normal maximum of 3");
    expect(targets.recommended.RB).toBeGreaterThan(0);
    expect(targets.recommended.WR).toBeGreaterThan(0);
    expect(targets.recommended.TE).toBeGreaterThan(0);
  });
});

describe("roster analysis", () => {
  const roster = [
    pick(player("mahomes", "QB", 12, { team: "KC", byeWeek: 10 }), 2),
    pick(player("rice", "WR", 30, { team: "KC", byeWeek: 10 }), 3),
    pick(player("kelce", "TE", 40, { team: "KC", byeWeek: 10 }), 4),
    pick(player("allen", "QB", 15, { team: "BUF", byeWeek: 7 }), 5),
    pick(player("cook", "RB", 35, { team: "BUF", byeWeek: 7 }), 6),
  ];
  const opponents = { KC: "BUF", BUF: "KC" };

  it("detects QB and pass-catcher stacks without treating RB as a pass catcher", () => {
    const stacks = findQbPassCatcherStacks(roster);
    expect(stacks).toHaveLength(1);
    expect(stacks[0].team).toBe("KC");
    expect(stacks[0].quarterbacks.map((entry) => entry.id)).toEqual(["mahomes"]);
    expect(stacks[0].passCatchers.map((entry) => entry.id)).toEqual(["rice", "kelce"]);
  });

  it("detects same-team concentration and bye conflicts", () => {
    const concentrations = findSameTeamConcentrations(roster);
    const byes = findByeWeekConflicts(roster);
    expect(concentrations).toHaveLength(1);
    expect(concentrations[0]).toMatchObject({ team: "KC", count: 3 });
    expect(byes.map((entry) => [entry.byeWeek, entry.count])).toEqual([
      [10, 3],
      [7, 2],
    ]);
    expect(byes[0].positionCounts).toEqual({ QB: 1, WR: 1, TE: 1 });
  });

  it("deduplicates reciprocal Week 17 opponent pairs", () => {
    const pairs = findWeek17OpponentPairs(roster, opponents);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].teams).toEqual(["BUF", "KC"]);
    expect(pairs[0].playersByTeam.KC).toHaveLength(3);
    expect(pairs[0].playersByTeam.BUF).toHaveLength(2);
  });

  it("returns all analysis sections together", () => {
    const analysis = analyzeBestBallRoster(roster, opponents);
    expect(analysis.stacks).toHaveLength(1);
    expect(analysis.concentrations).toHaveLength(1);
    expect(analysis.byeConflicts).toHaveLength(2);
    expect(analysis.week17Pairs).toHaveLength(1);
    expect(analysis.targets.draftedCount).toBe(5);
  });
});

describe("recommendation scorer", () => {
  const draftedQb = player("qb-kc", "QB", 15, { team: "KC", byeWeek: 10 });
  const rosterPick = pick(draftedQb, 2, 1, 12);
  const stackCandidate = player("wr-kc", "WR", 24, {
    team: "KC",
    byeWeek: 11,
    adp: 18,
  });
  const week17Candidate = player("wr-buf", "WR", 24, {
    team: "BUF",
    byeWeek: 12,
    adp: 18,
  });
  const byeCandidate = player("wr-mia", "WR", 25, {
    team: "MIA",
    byeWeek: 10,
    adp: 19,
  });

  it("returns visible component scores and reasons", () => {
    const [recommendation] = recommendBestBallPlayers({
      players: [stackCandidate],
      picks: [rosterPick],
      userTeamNumber: 1,
      currentPickNumber: 24,
    });

    expect(recommendation.components.baseRank).toBe(0);
    expect(recommendation.components.adpValue).toBeGreaterThan(0);
    expect(recommendation.components.rosterNeed).toBeGreaterThan(0);
    expect(recommendation.components.rosterNeed).toBeLessThanOrEqual(2);
    expect(recommendation.components.stackSchedule).toBeGreaterThan(0);
    expect(recommendation.components.stackSchedule).toBeLessThanOrEqual(2);
    expect(recommendation.components.byeRisk).toBe(0);
    expect(recommendation.reasons.map((reason) => reason.component)).toEqual([
      "baseRank",
      "adpValue",
      "rosterNeed",
      "stackSchedule",
      "gameStack",
      "tierScarcity",
      "byeRisk",
      "concentrationRisk",
      "spikeWeek",
    ]);
  });

  it("prices one ADP slot as one point without counting ADP twice", () => {
    const earlierMarket = player("earlier-market", "WR", 30, { team: "SEA", adp: 31 });
    const laterMarket = player("later-market", "WR", 30, { team: "LAR", adp: 32 });
    const recommendations = recommendBestBallPlayers({
      players: [earlierMarket, laterMarket],
      picks: [],
      userTeamNumber: 1,
      currentPickNumber: 40,
    });
    const earlier = recommendations.find((entry) => entry.player.id === "earlier-market");
    const later = recommendations.find((entry) => entry.player.id === "later-market");
    const earlierMarketScore =
      (earlier?.components.baseRank ?? 0) + (earlier?.components.adpValue ?? 0);
    const laterMarketScore =
      (later?.components.baseRank ?? 0) + (later?.components.adpValue ?? 0);

    expect(earlierMarketScore).toBe(9);
    expect(laterMarketScore).toBe(8);
    expect(earlierMarketScore - laterMarketScore).toBe(1);
  });

  it("does not use standard-lineup ADP in Superflex recommendations", () => {
    const [recommendation] = recommendBestBallPlayers({
      players: [
        player("superflex-qb", "QB", 30, {
          adp: 35,
          superflexRank: 1,
        }),
      ],
      picks: [],
      userTeamNumber: 1,
      currentPickNumber: 12,
      contestId: "superflex",
    });

    expect(recommendation.components.adpValue).toBe(0);
    expect(recommendation.reasons.find((reason) => reason.component === "adpValue")?.detail)
      .toContain("no separate Superflex ADP source");
  });

  it("downweights correlation and only penalizes a bye that can break position coverage", () => {
    const secondQb = player("qb-buf", "QB", 17, { team: "BUF", byeWeek: 10 });
    const byeQbCandidate = player("qb-mia", "QB", 25, {
      team: "MIA",
      byeWeek: 10,
      adp: 19,
    });
    const byeRoster = [rosterPick, pick(secondQb, 3, 1, 13)];
    const tournament = recommendBestBallPlayers({
      players: [stackCandidate, byeCandidate, byeQbCandidate],
      picks: byeRoster,
      userTeamNumber: 1,
      currentPickNumber: 24,
      contestId: "bbm-vii",
    });
    const eliminator = recommendBestBallPlayers({
      players: [stackCandidate, byeCandidate, byeQbCandidate],
      picks: byeRoster,
      userTeamNumber: 1,
      currentPickNumber: 24,
      contestId: "eliminator",
    });

    const tournamentStack = tournament.find((entry) => entry.player.id === "wr-kc");
    const eliminatorStack = eliminator.find((entry) => entry.player.id === "wr-kc");
    const tournamentBye = tournament.find((entry) => entry.player.id === "qb-mia");
    const eliminatorBye = eliminator.find((entry) => entry.player.id === "qb-mia");
    const ordinaryOverlap = tournament.find((entry) => entry.player.id === "wr-mia");
    expect(eliminatorStack?.components.stackSchedule).toBeLessThan(
      tournamentStack?.components.stackSchedule ?? 0
    );
    expect(eliminatorBye?.components.byeRisk).toBeLessThan(
      tournamentBye?.components.byeRisk ?? 0
    );
    expect(ordinaryOverlap?.components.byeRisk).toBe(0);
  });

  it("penalizes a pick that consumes the only feasible bye-week repair slot", () => {
    const roster = [
      ...Array.from({ length: 4 }, (_, index) =>
        pick(player(`repair-rb-${index}`, "RB", 20 + index), index + 1)
      ),
      ...Array.from({ length: 9 }, (_, index) =>
        pick(player(`repair-wr-${index}`, "WR", 40 + index), index + 5)
      ),
      ...Array.from({ length: 2 }, (_, index) =>
        pick(
          player(`repair-te-${index}`, "TE", 70 + index, { byeWeek: 9 }),
          index + 14
        )
      ),
    ];
    const candidate = player("repair-slot-rb", "RB", 180, {
      adp: 180,
      byeWeek: 9,
    });
    const recommendation = recommendBestBallPlayers({
      players: [candidate],
      picks: roster,
      userTeamNumber: 1,
      currentPickNumber: 180,
      contestId: "bbm-vii",
    })[0];

    expect(recommendation.components.byeRisk).toBeLessThan(0);
    expect(
      recommendation.reasons.find((reason) => reason.component === "byeRisk")?.detail
    ).toContain("best single final composition across every published bye");
  });

  it("keeps ranking deep players below shallow ones instead of flooring them at zero", () => {
    const deep = player("deep-wr", "WR", 24, { team: "SEA", rankEcr: 340 });
    const shallow = player("shallow-wr", "WR", 24, { team: "SEA", rankEcr: 230 });
    const [best] = recommendBestBallPlayers({
      players: [deep, shallow],
      picks: [],
      userTeamNumber: 1,
      currentPickNumber: 150,
      contestId: "sit-and-go",
    });

    expect(best.player.id).toBe("shallow-wr");
    // A hard zero floor made every player past rank 220 score identically.
    const deepOnly = recommendBestBallPlayers({
      players: [deep],
      picks: [],
      userTeamNumber: 1,
      currentPickNumber: 150,
      contestId: "sit-and-go",
    })[0];
    expect(deepOnly.components.baseRank).toBeLessThan(0);
  });

  it("omits exact supported-slate recommendations without a usable ADP", () => {
    // 18 rounds x 12 teams means an undrafted player lands at an ADP of about 216.
    const floored = player("floor-wr", "WR", 24, { team: "SEA", rankEcr: 400, adp: 216 });
    const invalid = player("invalid-wr", "WR", 24, { team: "ARI", rankEcr: 300, adp: 0 });
    const genuine = player("real-wr", "WR", 24, { team: "SEA", rankEcr: 240, adp: 200 });
    const recommendations = recommendBestBallPlayers({
      players: [floored, invalid, genuine],
      picks: [],
      userTeamNumber: 1,
      currentPickNumber: 200,
    });
    const [best] = recommendations;
    expect(best.player.id).toBe("real-wr");
    expect(recommendations.map((entry) => entry.player.id)).toEqual(["real-wr"]);
  });

  it("does not turn missing market timing into an urgent exact recommendation", () => {
    const unknownFloor = player("unknown-floor", "WR", 400, {
      team: "SEA",
      adp: 216,
    });
    const likelyToLast = player("likely-to-last", "WR", 200, {
      team: "ARI",
      adp: 200,
    });
    const recommendations = recommendBestBallPlayers({
      players: [unknownFloor, likelyToLast],
      picks: [],
      userTeamNumber: 1,
      currentPickNumber: 170,
    });
    const waiting = recommendations.find((entry) => entry.player.id === likelyToLast.id);

    expect(waiting?.tiebreakers.waitUntilNextTurn).toBe(true);
    expect(recommendations.map((entry) => entry.player.id)).toEqual([likelyToLast.id]);
  });

  it("scores a tier cliff only when the next tier is a real board gap away", () => {
    const roster = [pick(player("wr-filler", "WR", 5, { team: "SEA" }), 1)];
    // One TE left in tier 2, with tier 3 starting far down the board.
    const cliffTe = player("cliff-te", "TE", 40, { team: "GB", adp: 40, tier: 2 });
    const farNextTier = player("next-te", "TE", 70, { team: "NYJ", adp: 70, tier: 3 });
    // One TE left in tier 2, but tier 3 starts immediately after.
    const flatTe = player("flat-te", "TE", 40, { team: "GB", adp: 40, tier: 2 });
    const nearNextTier = player("near-te", "TE", 41, { team: "NYJ", adp: 41, tier: 3 });

    const withCliff = recommendBestBallPlayers({
      players: [cliffTe, farNextTier],
      picks: roster,
      userTeamNumber: 1,
      currentPickNumber: 24,
    }).find((r) => r.player.id === "cliff-te");
    const withoutCliff = recommendBestBallPlayers({
      players: [flatTe, nearNextTier],
      picks: roster,
      userTeamNumber: 1,
      currentPickNumber: 24,
    }).find((r) => r.player.id === "flat-te");

    // The gap scales the score rather than gating it, so a one-spot gap stays small.
    expect(withCliff?.components.tierScarcity).toBeGreaterThan(0);
    expect(withoutCliff?.components.tierScarcity).toBeLessThan(
      (withCliff?.components.tierScarcity ?? 0) / 4
    );
  });

  it("measures a standard tier cliff on ECR even when ADP order is inverted", () => {
    const roster = [pick(player("wr-filler", "WR", 5, { team: "SEA" }), 1)];
    const finalCurrentTier = player("ecr-cliff", "TE", 40, {
      team: "GB",
      adp: 100,
      tier: 2,
    });
    const firstNextTier = player("ecr-next", "TE", 70, {
      team: "NYJ",
      adp: 41,
      tier: 3,
    });

    const recommendation = recommendBestBallPlayers({
      players: [firstNextTier, finalCurrentTier],
      picks: roster,
      userTeamNumber: 1,
      currentPickNumber: 24,
    }).find((entry) => entry.player.id === finalCurrentTier.id);

    expect(recommendation?.components.tierScarcity).toBeGreaterThan(0);
  });

  it("uses the stronger Superflex tier-cliff weight without exceeding the shared cap", () => {
    const roster = [pick(player("wr-filler", "WR", 5, { team: "SEA" }), 1)];
    const cliffTe = player("weighted-cliff", "TE", 40, {
      team: "GB",
      adp: 40,
      superflexRank: 40,
      tier: 2,
      superflexTier: 2,
    });
    const nextTe = player("weighted-next", "TE", 46, {
      team: "NYJ",
      adp: 46,
      superflexRank: 46,
      tier: 3,
      superflexTier: 3,
    });

    const standard = recommendBestBallPlayers({
      players: [cliffTe, nextTe],
      picks: roster,
      userTeamNumber: 1,
      currentPickNumber: 24,
      contestId: "bbm-vii",
    }).find((entry) => entry.player.id === cliffTe.id);
    const superflex = recommendBestBallPlayers({
      players: [cliffTe, nextTe],
      picks: roster,
      userTeamNumber: 1,
      currentPickNumber: 24,
      contestId: "superflex",
    }).find((entry) => entry.player.id === cliffTe.id);

    expect(superflex?.components.tierScarcity).toBeGreaterThan(
      standard?.components.tierScarcity ?? 0
    );
    expect(superflex?.components.tierScarcity).toBeLessThanOrEqual(2);
  });

  it("does not reuse a standard tier cliff when the Superflex tier is missing", () => {
    const roster = [pick(player("wr-filler", "WR", 5, { team: "SEA" }), 1)];
    const standardCliff = player("standard-only-cliff", "TE", 40, {
      superflexRank: 40,
      tier: 2,
    });
    const standardNextTier = player("standard-only-next", "TE", 70, {
      superflexRank: 70,
      tier: 3,
    });

    const recommendation = recommendBestBallPlayers({
      players: [standardCliff, standardNextTier],
      picks: roster,
      userTeamNumber: 1,
      currentPickNumber: 24,
      contestId: "superflex",
    }).find((entry) => entry.player.id === standardCliff.id);

    expect(recommendation?.components.tierScarcity).toBe(0);
  });

  it("omits an exact Superflex recommendation when the format rank is missing", () => {
    const missingFormatRank = player("missing-sf-rank", "QB", 12, {
      tier: 1,
      adp: 12,
    });
    const rankedQuarterback = player("ranked-sf-qb", "QB", 80, {
      superflexRank: 8,
      superflexTier: 1,
      adp: 80,
    });
    const recommendations = recommendBestBallPlayers({
      players: [missingFormatRank, rankedQuarterback],
      picks: [],
      userTeamNumber: 1,
      currentPickNumber: 1,
      contestId: "superflex",
    });

    expect(recommendations.map((entry) => entry.player.id)).toEqual([rankedQuarterback.id]);
  });

  it("scores a completed Week 17 game stack and ignores a bare bring-back", () => {
    const stackedRoster = [rosterPick, pick(stackCandidate, 3, 1, 13)];
    const opponents = { KC: "BUF", BUF: "KC" };

    // Roster already holds the KC QB and a KC pass catcher, so the BUF pick completes the game.
    const completesGame = recommendBestBallPlayers({
      players: [week17Candidate],
      picks: stackedRoster,
      userTeamNumber: 1,
      currentPickNumber: 36,
      contestId: "bbm-vii",
      week17Opponents: opponents,
    })[0];
    // Same pick with only a KC QB on the roster is a bring-back with no stack behind it.
    const bareBringBack = recommendBestBallPlayers({
      players: [week17Candidate],
      picks: [rosterPick],
      userTeamNumber: 1,
      currentPickNumber: 36,
      contestId: "bbm-vii",
      week17Opponents: opponents,
    })[0];
    const eliminator = recommendBestBallPlayers({
      players: [week17Candidate],
      picks: stackedRoster,
      userTeamNumber: 1,
      currentPickNumber: 36,
      contestId: "eliminator",
      week17Opponents: opponents,
    })[0];

    expect(completesGame.components.gameStack).toBeGreaterThan(0);
    expect(completesGame.components.gameStack).toBeLessThanOrEqual(1);
    expect(bareBringBack.components.gameStack).toBe(0);
    expect(eliminator.components.gameStack).toBe(0);
  });

  it("does not score Week 17 without a stack and omits it from cumulative scoring", () => {
    const tournamentWithSchedule = recommendBestBallPlayers({
      players: [week17Candidate],
      picks: [rosterPick],
      userTeamNumber: 1,
      currentPickNumber: 24,
      contestId: "bbm-vii",
      week17Opponents: { BUF: "KC" },
    })[0];
    const tournamentWithoutSchedule = recommendBestBallPlayers({
      players: [week17Candidate],
      picks: [rosterPick],
      userTeamNumber: 1,
      currentPickNumber: 24,
      contestId: "bbm-vii",
    })[0];
    const cumulative = recommendBestBallPlayers({
      players: [week17Candidate],
      picks: [rosterPick],
      userTeamNumber: 1,
      currentPickNumber: 24,
      contestId: "sit-and-go",
      week17Opponents: { BUF: "KC" },
    })[0];

    expect(tournamentWithSchedule.score).toBe(tournamentWithoutSchedule.score);
    expect(tournamentWithSchedule.tiebreakers.week17Opponent).toBe(1);
    expect(cumulative.tiebreakers.week17Opponent).toBe(0);
  });

  it("does not let a Week 17 stack pull a player more than twenty ADP spots forward", () => {
    const stackedRoster = [rosterPick, pick(stackCandidate, 3, 1, 13)];
    const nearMarket = player("near-market", "WR", 100, {
      team: "DAL",
      adp: 100,
      byeWeek: 10,
    });
    const farGameStack = player("far-game-stack", "WR", 125, {
      team: "BUF",
      adp: 125,
      byeWeek: 11,
    });
    const recommendations = recommendBestBallPlayers({
      players: [nearMarket, farGameStack],
      picks: stackedRoster,
      userTeamNumber: 1,
      currentPickNumber: 97,
      contestId: "bbm-vii",
      week17Opponents: { KC: "BUF", BUF: "KC" },
    });
    const far = recommendations.find((entry) => entry.player.id === "far-game-stack");

    expect(recommendations[0].player.id).toBe("near-market");
    expect(far?.components.gameStack).toBe(1);
    expect(far?.tiebreakers.waitUntilNextTurn).toBe(true);
  });

  it("only recommends the required position when one final roster spot remains", () => {
    const finalRoster = [
      pick(player("final-roster-qb", "QB", 10), 1),
      ...Array.from({ length: 4 }, (_, index) =>
        pick(player(`final-roster-rb-${index}`, "RB", 20 + index), index + 2)
      ),
      ...Array.from({ length: 9 }, (_, index) =>
        pick(player(`final-roster-wr-${index}`, "WR", 40 + index), index + 6)
      ),
      ...Array.from({ length: 3 }, (_, index) =>
        pick(player(`final-roster-te-${index}`, "TE", 70 + index), index + 15)
      ),
    ];
    const requiredQb = player("required-final-qb", "QB", 210, {
      team: "SEA",
      adp: 210,
    });
    const optionalWr = player("optional-final-wr", "WR", 190, {
      team: "LAR",
      adp: 190,
    });
    const recommendations = recommendBestBallPlayers({
      players: [optionalWr, requiredQb],
      picks: finalRoster,
      userTeamNumber: 1,
      currentPickNumber: 216,
    });

    expect(recommendations.map((entry) => entry.player.id)).toEqual(["required-final-qb"]);
  });

  it("adds a visible spike-week component only for Weekly Winners", () => {
    const weeklyCandidate = player("weekly-wr", "WR", 20, {
      team: "SEA",
      adp: 20,
      weeklyProjections: [
        { week: 1, projectedPoints: 4, opponent: "LAR", difficulty: "hard" },
        { week: 2, projectedPoints: 24, opponent: "SF", difficulty: "easy" },
      ],
    });
    const weekly = recommendBestBallPlayers({
      players: [weeklyCandidate],
      picks: [],
      userTeamNumber: 1,
      currentPickNumber: 20,
      contestId: "weekly-winners",
    })[0];
    const cumulative = recommendBestBallPlayers({
      players: [weeklyCandidate],
      picks: [],
      userTeamNumber: 1,
      currentPickNumber: 20,
      contestId: "sit-and-go",
    })[0];

    expect(weekly.components.spikeWeek).toBeGreaterThan(0);
    expect(weekly.components.spikeWeek).toBeLessThanOrEqual(1);
    expect(cumulative.components.spikeWeek).toBe(0);
  });

  it("adds no Weekly Winners spike score without weekly projections", () => {
    const [recommendation] = recommendBestBallPlayers({
      players: [player("weekly-without-projections", "WR", 20, { adp: 20 })],
      picks: [],
      userTeamNumber: 1,
      currentPickNumber: 20,
      contestId: "weekly-winners",
    });

    expect(recommendation.components.spikeWeek).toBe(0);
    expect(
      recommendation.reasons.find((reason) => reason.component === "spikeWeek")?.detail
    ).toContain("adds no score");
  });
});
