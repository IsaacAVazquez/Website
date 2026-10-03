import {
  DRAFT_TELEMETRY_STORAGE_PREFIX,
  decodeDraftTurnRecords,
  getDraftTelemetryStorageKey,
  resolveDraftTelemetry,
  type DraftTurnRecord,
} from "@/lib/draftTelemetry";
import type { DraftPick, Player, Position } from "@/types";

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

function pick(pickNumber: number, teamNumber: number, taken: Player): DraftPick {
  return {
    pickNumber,
    round: 1,
    teamNumber,
    player: taken,
    timestamp: new Date("2026-08-31T00:00:00.000Z"),
    pickTimeSeconds: 0,
    isKeeper: false,
  };
}

const rankOf = (candidate: Player): number | null =>
  typeof candidate.rankEcr === "number" && Number.isFinite(candidate.rankEcr)
    ? candidate.rankEcr
    : null;

const players = [
  player("rb-1", "RB", 2),
  player("rb-2", "RB", 5),
  player("rb-3", "RB", 12),
  player("wr-1", "WR", 1),
  player("wr-2", "WR", 3),
  player("wr-3", "WR", 8),
];

function record(overrides: Partial<DraftTurnRecord>): DraftTurnRecord {
  return {
    pick: 1,
    nextUserPick: 4,
    chosenPlayerId: "wr-1",
    chosenPlayerName: "wr-1",
    bestAvailableId: "wr-1",
    bestAvailableName: "wr-1",
    waitPosition: "RB",
    waitBaselineId: "rb-1",
    waitBaselineName: "rb-1",
    waitBaselineRank: 2,
    expectedSurvivorId: "rb-2",
    expectedSurvivorName: "rb-2",
    expectedSurvivorRank: 5,
    waitCostSpots: 3,
    waitCostPoints: 10,
    atRiskPlayerId: "rb-1",
    atRiskPlayerName: "rb-1",
    atRiskPosition: "RB",
    recommendedIds: ["wr-1", "rb-1"],
    modelVersion: "redraft-decision-v2",
    snapshotRevision: "2026-08-31T00:00:00.000Z",
    rankingAsOf: "2026-08-31T00:00:00.000Z",
    marketAsOf: "2026-08-31T00:00:00.000Z",
    vorpAsOf: "2026-08-31T00:00:00.000Z",
    waitCandidates: [
      {
        playerId: "rb-1",
        playerName: "rb-1",
        rank: 2,
        projectedPointsAboveReplacement: 50,
      },
      {
        playerId: "rb-2",
        playerName: "rb-2",
        rank: 5,
        projectedPointsAboveReplacement: 40,
      },
      {
        playerId: "rb-3",
        playerName: "rb-3",
        rank: 12,
        projectedPointsAboveReplacement: 20,
      },
    ],
    recordedAt: "2026-08-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("decodeDraftTurnRecords", () => {
  it("drops malformed and duplicate entries and sorts by pick", () => {
    const decoded = decodeDraftTurnRecords([
      record({ pick: 4, nextUserPick: 2 }),
      record({ pick: 1 }),
      record({ pick: 1, chosenPlayerName: "duplicate" }),
      { pick: 2 },
      "junk",
      null,
    ]);

    expect(decoded.map((entry) => entry.pick)).toEqual([1, 4]);
    // A next pick at or before the turn itself is meaningless and drops to null.
    expect(decoded[1].nextUserPick).toBeNull();
    expect(decoded[0].modelVersion).toBe("redraft-decision-v2");
    expect(decoded[0].waitCandidates).toHaveLength(3);
    expect(decodeDraftTurnRecords("junk")).toEqual([]);
  });

  it("keys storage per draft under the versioned prefix", () => {
    expect(getDraftTelemetryStorageKey("abc")).toBe(`${DRAFT_TELEMETRY_STORAGE_PREFIX}abc`);
    expect(DRAFT_TELEMETRY_STORAGE_PREFIX).toBe("fantasy-draft-telemetry-v2-");
  });

  it("rejects non-integer and non-positive picks and missing chosen players", () => {
    const decoded = decodeDraftTurnRecords([
      { ...record({}), pick: 0 },
      { ...record({}), pick: 1.5 },
      { ...record({}), pick: "3" },
      { ...record({ pick: 5 }), chosenPlayerId: "" },
      { ...record({ pick: 6 }), chosenPlayerName: 42 },
      record({ pick: 7 }),
    ]);
    expect(decoded.map((entry) => entry.pick)).toEqual([7]);
  });

  it("coerces malformed optional fields to null and keeps only string recommendation ids", () => {
    const [decoded] = decodeDraftTurnRecords([
      {
        pick: 2,
        nextUserPick: 9.5,
        chosenPlayerId: "wr-1",
        chosenPlayerName: "wr-1",
        bestAvailableId: "",
        waitBaselineRank: Number.NaN,
        waitCostSpots: Infinity,
        waitCostPoints: "10",
        recommendedIds: ["wr-1", 7, null, "rb-1"],
        waitCandidates: "not-a-list",
        recordedAt: 12345,
      },
    ]);

    expect(decoded.nextUserPick).toBeNull();
    expect(decoded.bestAvailableId).toBeNull();
    expect(decoded.waitBaselineRank).toBeNull();
    expect(decoded.waitCostSpots).toBeNull();
    expect(decoded.waitCostPoints).toBeNull();
    expect(decoded.recommendedIds).toEqual(["wr-1", "rb-1"]);
    expect(decoded.waitCandidates).toEqual([]);
    expect(decoded.recordedAt).toBe("");
    expect(decoded.modelVersion).toBeNull();

    const [noIds] = decodeDraftTurnRecords([{ ...record({}), recommendedIds: "wr-1" }]);
    expect(noIds.recommendedIds).toEqual([]);
  });

  it("drops invalid and duplicate wait candidates and sorts the rest by rank", () => {
    const [decoded] = decodeDraftTurnRecords([
      record({
        waitCandidates: [
          { playerId: "rb-3", playerName: "rb-3", rank: 12, projectedPointsAboveReplacement: "20" },
          { playerId: "rb-1", playerName: "rb-1", rank: 2, projectedPointsAboveReplacement: 50 },
          { playerId: "rb-1", playerName: "dupe", rank: 1, projectedPointsAboveReplacement: 99 },
          { playerId: "rb-0", playerName: "rb-0", rank: 0, projectedPointsAboveReplacement: 1 },
          { playerId: "", playerName: "blank", rank: 3, projectedPointsAboveReplacement: 1 },
          { playerId: "rb-9", playerName: "", rank: 4, projectedPointsAboveReplacement: 1 },
          { playerId: "rb-8", playerName: "rb-8", rank: "5", projectedPointsAboveReplacement: 1 },
          "junk",
        ] as unknown as DraftTurnRecord["waitCandidates"],
      }),
    ]);

    expect(decoded.waitCandidates).toEqual([
      { playerId: "rb-1", playerName: "rb-1", rank: 2, projectedPointsAboveReplacement: 50 },
      { playerId: "rb-3", playerName: "rb-3", rank: 12, projectedPointsAboveReplacement: null },
    ]);
  });
});

describe("resolveDraftTelemetry", () => {
  // Two-team snake feel: user picks 1 and 4, the other team picks 2 and 3.
  const picks = [
    pick(1, 1, player("wr-1", "WR", 1)),
    pick(2, 2, player("rb-1", "RB", 2)),
    pick(3, 2, player("wr-2", "WR", 3)),
    pick(4, 1, player("rb-2", "RB", 5)),
  ];

  it("scores survivor, at-risk, hit rate, and realized wait cost from the log", () => {
    const recap = resolveDraftTelemetry({
      records: [record({})],
      picks,
      players,
      rankOf,
      vorpOf: (playerId) => (playerId === "rb-1" ? 50 : playerId === "rb-2" ? 40 : null),
    });

    expect(recap.totalTurns).toBe(1);
    const outcome = recap.outcomes[0];
    expect(outcome.measured).toBe(true);
    // rb-2 was not taken in the window, so the survivor call was right.
    expect(outcome.survivorSurvived).toBe(true);
    // rb-1 was taken at pick 2, so the at-risk call was right.
    expect(outcome.atRiskGone).toBe(true);
    expect(outcome.followedRecommendation).toBe(true);
    // Best RB left when pick 4 arrived was rb-2, three ranks below rb-1.
    expect(outcome.realizedBestId).toBe("rb-2");
    expect(outcome.realizedDropSpots).toBe(3);
    expect(outcome.realizedDropPoints).toBe(10);
    expect(recap.survivalMeasured).toBe(1);
    expect(recap.survivalCorrect).toBe(1);
    expect(recap.atRiskMeasured).toBe(1);
    expect(recap.atRiskGone).toBe(1);
    expect(recap.recommendedHits).toBe(1);
    expect(recap.averagePredictedDropSpots).toBe(3);
    expect(recap.averageRealizedDropSpots).toBe(3);
    expect(recap.averagePredictedDropPoints).toBe(10);
    expect(recap.averageRealizedDropPoints).toBe(10);
  });

  it("keeps realized wait cost fixed when the published board refreshes", () => {
    // The snapshot refreshed between the draft and the recap: rb-1 fell to 4.
    const refreshed = players.map((candidate) =>
      candidate.id === "rb-1" ? { ...candidate, rankEcr: 4 } : candidate
    );
    const recap = resolveDraftTelemetry({
      records: [record({})],
      picks,
      players: refreshed,
      rankOf,
      vorpOf: () => null,
    });
    // The frozen turn board keeps rb-1 at 2 and rb-2 at 5 even though the
    // current public board moved rb-1 to 4.
    expect(recap.outcomes[0].realizedDropSpots).toBe(3);
    expect(recap.outcomes[0].realizedDropPoints).toBe(10);
  });

  it("measures a zero market drop when the user took the baseline player himself", () => {
    const recap = resolveDraftTelemetry({
      records: [record({ chosenPlayerId: "rb-1", chosenPlayerName: "rb-1" })],
      picks: [
        pick(1, 1, player("rb-1", "RB", 2)),
        pick(2, 2, player("wr-2", "WR", 3)),
        pick(3, 2, player("wr-3", "WR", 8)),
        pick(4, 1, player("rb-2", "RB", 5)),
      ],
      players,
      rankOf,
      vorpOf: () => null,
    });
    // His own pick is a choice, not market attrition: the market removed no RB
    // before his next turn, so waiting is measured as free rather than as the
    // cost of his own consumption of the position.
    expect(recap.outcomes[0].realizedBestId).toBe("rb-1");
    expect(recap.outcomes[0].realizedDropSpots).toBe(0);
  });

  it("marks a wrong survivor call and skips calls about the player the user took", () => {
    const survivorTaken = [
      pick(1, 1, player("wr-1", "WR", 1)),
      pick(2, 2, player("rb-2", "RB", 5)),
      pick(3, 2, player("rb-1", "RB", 2)),
      pick(4, 1, player("wr-2", "WR", 3)),
    ];
    const recap = resolveDraftTelemetry({
      records: [record({})],
      picks: survivorTaken,
      players,
      rankOf,
      vorpOf: () => null,
    });
    expect(recap.outcomes[0].survivorSurvived).toBe(false);
    expect(recap.survivalCorrect).toBe(0);
    // Realized best RB at pick 4 is rb-3 at rank 12, ten ranks below rb-1.
    expect(recap.outcomes[0].realizedBestId).toBe("rb-3");
    expect(recap.outcomes[0].realizedDropSpots).toBe(10);
    expect(recap.outcomes[0].realizedDropPoints).toBe(30);

    const tookTheRisk = resolveDraftTelemetry({
      records: [record({ chosenPlayerId: "rb-1", chosenPlayerName: "rb-1", recommendedIds: [] })],
      picks: [
        pick(1, 1, player("rb-1", "RB", 2)),
        pick(2, 2, player("wr-2", "WR", 3)),
        pick(3, 2, player("wr-3", "WR", 8)),
        pick(4, 1, player("rb-2", "RB", 5)),
      ],
      players,
      rankOf,
      vorpOf: () => null,
    });
    // The user took the flagged player, so the market call is unmeasurable.
    expect(tookTheRisk.outcomes[0].atRiskGone).toBeNull();
    expect(tookTheRisk.atRiskMeasured).toBe(0);
    expect(tookTheRisk.outcomes[0].followedRecommendation).toBe(false);
  });

  it("ignores records that no longer match the pick log after an undo", () => {
    const recap = resolveDraftTelemetry({
      records: [
        record({}),
        record({ pick: 4, chosenPlayerId: "wr-3", chosenPlayerName: "wr-3", nextUserPick: null }),
      ],
      picks,
      players,
      rankOf,
      vorpOf: () => null,
    });
    // Pick 4 in the log is rb-2, so the wr-3 record is a stale branch.
    expect(recap.totalTurns).toBe(1);
    expect(recap.outcomes[0].record.pick).toBe(1);
  });

  it("leaves the final turn unscored when there is no next pick", () => {
    const recap = resolveDraftTelemetry({
      records: [
        record({
          pick: 4,
          chosenPlayerId: "rb-2",
          chosenPlayerName: "rb-2",
          nextUserPick: null,
          recommendedIds: [],
        }),
      ],
      picks,
      players,
      rankOf,
      vorpOf: () => null,
    });
    expect(recap.outcomes[0].measured).toBe(false);
    expect(recap.outcomes[0].survivorSurvived).toBeNull();
    expect(recap.outcomes[0].atRiskGone).toBeNull();
    expect(recap.outcomes[0].realizedDropSpots).toBeNull();
    expect(recap.averagePredictedDropSpots).toBeNull();
  });

  it("orders outcomes by pick and averages across scored turns", () => {
    const recap = resolveDraftTelemetry({
      records: [
        record({
          pick: 4,
          chosenPlayerId: "rb-2",
          chosenPlayerName: "rb-2",
          nextUserPick: null,
          recommendedIds: ["rb-2"],
        }),
        record({}),
      ],
      picks,
      players,
      rankOf,
      vorpOf: () => null,
    });

    expect(recap.outcomes.map((outcome) => outcome.record.pick)).toEqual([1, 4]);
    expect(recap.recommendedHits).toBe(2);
    expect(recap.realizedDropMeasured).toBe(1);
  });

  it("finds no realized best when the whole frozen board was drafted in the window", () => {
    const recap = resolveDraftTelemetry({
      records: [
        record({
          waitCandidates: [
            { playerId: "rb-1", playerName: "rb-1", rank: 2, projectedPointsAboveReplacement: 50 },
          ],
        }),
      ],
      picks,
      players,
      rankOf,
      vorpOf: () => null,
    });

    expect(recap.outcomes[0].realizedBestId).toBeNull();
    expect(recap.outcomes[0].realizedDropSpots).toBeNull();
    expect(recap.averageRealizedDropSpots).toBeNull();
  });

  it("skips the points drop when either frozen VORP is missing", () => {
    const recap = resolveDraftTelemetry({
      records: [
        record({
          waitCandidates: [
            { playerId: "rb-1", playerName: "rb-1", rank: 2, projectedPointsAboveReplacement: null },
            { playerId: "rb-2", playerName: "rb-2", rank: 5, projectedPointsAboveReplacement: 40 },
          ],
        }),
      ],
      picks,
      players,
      rankOf,
      vorpOf: () => 999,
    });

    expect(recap.outcomes[0].realizedDropSpots).toBe(3);
    expect(recap.outcomes[0].realizedDropPoints).toBeNull();
    expect(recap.averagePredictedDropPoints).toBeNull();
  });

  it("leaves a turn with no priced position or no predictions unscored but measured", () => {
    const recap = resolveDraftTelemetry({
      records: [
        record({
          waitPosition: null,
          expectedSurvivorId: null,
          atRiskPlayerId: null,
        }),
      ],
      picks,
      players,
      rankOf,
      vorpOf: () => null,
    });

    const outcome = recap.outcomes[0];
    expect(outcome.measured).toBe(true);
    expect(outcome.survivorSurvived).toBeNull();
    expect(outcome.atRiskGone).toBeNull();
    expect(outcome.realizedBestId).toBeNull();
    expect(recap.survivalMeasured).toBe(0);
  });

  it("does not measure a turn whose next pick has not been made yet", () => {
    const recap = resolveDraftTelemetry({
      records: [record({ nextUserPick: 6 })],
      picks,
      players,
      rankOf,
      vorpOf: () => null,
    });

    expect(recap.outcomes[0].measured).toBe(false);
    expect(recap.outcomes[0].realizedDropSpots).toBeNull();
  });

  describe("legacy records without a frozen position board", () => {
    it("rebuilds the realized wait cost from the current board and VORP lookup", () => {
      const vorp: Record<string, number> = { "rb-1": 50, "rb-2": 40, "rb-3": 20 };
      const recap = resolveDraftTelemetry({
        records: [record({ waitCandidates: [] })],
        picks,
        players,
        rankOf,
        vorpOf: (playerId) => vorp[playerId] ?? null,
      });

      const outcome = recap.outcomes[0];
      // rb-1 went at pick 2, so rb-2 (rank 5) is the best RB at pick 4.
      expect(outcome.realizedBestId).toBe("rb-2");
      expect(outcome.realizedBestName).toBe("rb-2");
      expect(outcome.realizedDropSpots).toBe(3);
      expect(outcome.realizedDropPoints).toBe(10);
      expect(recap.averagePredictedDropSpots).toBe(3);
      expect(recap.averageRealizedDropPoints).toBe(10);
    });

    it("treats the user's own pick as a choice rather than market attrition", () => {
      const recap = resolveDraftTelemetry({
        records: [record({ chosenPlayerId: "rb-1", chosenPlayerName: "rb-1", waitCandidates: [] })],
        picks: [
          pick(1, 1, player("rb-1", "RB", 2)),
          pick(2, 2, player("wr-2", "WR", 3)),
          pick(3, 2, player("wr-3", "WR", 8)),
          pick(4, 1, player("rb-2", "RB", 5)),
        ],
        players,
        rankOf,
        vorpOf: () => null,
      });

      expect(recap.outcomes[0].realizedBestId).toBe("rb-1");
      expect(recap.outcomes[0].realizedDropSpots).toBe(0);
      expect(recap.outcomes[0].realizedDropPoints).toBeNull();
    });

    it("skips unranked candidates and leaves the drop null without a ranked baseline", () => {
      const unranked = players.map((candidate) =>
        candidate.id === "rb-2" ? { ...candidate, rankEcr: undefined } : candidate
      );
      const recap = resolveDraftTelemetry({
        records: [record({ waitCandidates: [], waitBaselineId: null })],
        picks,
        players: unranked,
        rankOf,
        vorpOf: () => 10,
      });

      const outcome = recap.outcomes[0];
      expect(outcome.realizedBestId).toBe("rb-3");
      expect(outcome.realizedDropSpots).toBeNull();
      // With no baseline there is nothing to subtract from.
      expect(outcome.realizedDropPoints).toBeNull();
    });

    it("never reports a negative drop when the realized best outranks the baseline", () => {
      const recap = resolveDraftTelemetry({
        records: [record({ waitCandidates: [], waitBaselineId: "rb-3" })],
        picks,
        players,
        rankOf,
        vorpOf: (playerId) => (playerId === "rb-3" ? 20 : 40),
      });

      expect(recap.outcomes[0].realizedBestId).toBe("rb-2");
      expect(recap.outcomes[0].realizedDropSpots).toBe(0);
      expect(recap.outcomes[0].realizedDropPoints).toBe(0);
    });

    it("finds no realized best when nobody at the position is left", () => {
      const recap = resolveDraftTelemetry({
        records: [record({ waitCandidates: [], waitPosition: "TE" })],
        picks,
        players,
        rankOf,
        vorpOf: () => 5,
      });

      expect(recap.outcomes[0].realizedBestId).toBeNull();
      expect(recap.outcomes[0].realizedDropSpots).toBeNull();
      expect(recap.outcomes[0].realizedDropPoints).toBeNull();
    });
  });
});
