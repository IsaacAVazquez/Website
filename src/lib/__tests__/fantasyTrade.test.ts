/**
 * @jest-environment node
 */
import {
  FANTASY_TRADE_MODEL_VERSION,
  calculateReplacementRelativeTradeValue,
  evaluateFantasyTrade,
  type FantasyTradeEvaluationInput,
  type FantasyTradeLeagueSettings,
} from "@/lib/fantasyTrade";
import type { FantasySnapshot } from "@/lib/fantasy";
import type { Player } from "@/types";

const NOW = new Date("2026-08-10T12:00:00.000Z");
const SOURCE_DATE = "2026-08-09T12:00:00.000Z";
const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"] as const;

function makePlayer(
  position: (typeof POSITIONS)[number],
  index: number,
  rank: number
): Player {
  return {
    id: `${position}-${index}`,
    name: `${position} ${index}`,
    team: "SF",
    position,
    averageRank: rank,
    rankEcr: rank,
    rankAverage: rank,
    standardDeviation: 1,
    minRank: Math.max(1, rank - 2),
    maxRank: rank + 2,
    positionRank: index,
    tier: Math.ceil(index / 12),
    adp: rank,
    adpHigh: Math.max(1, rank - 4),
    adpLow: rank + 4,
    adpStandardDeviation: 1,
    adpTimesDrafted: 100,
    lastUpdated: SOURCE_DATE,
  };
}

function buildSnapshot(): FantasySnapshot {
  const overall: Player[] = [];
  let rank = 1;
  for (let index = 1; index <= 100; index += 1) {
    for (const position of POSITIONS) {
      overall.push(makePlayer(position, index, rank));
      rank += 1;
    }
  }
  overall.push({
    ...makePlayer("RB", 101, 20),
    id: "RB-twin-a",
    name: "RB Twin A",
  });
  overall.push({
    ...makePlayer("RB", 102, 20),
    id: "RB-twin-b",
    name: "RB Twin B",
  });

  const positions = {
    QB: overall.filter((player) => player.position === "QB"),
    RB: overall.filter((player) => player.position === "RB"),
    WR: overall.filter((player) => player.position === "WR"),
    TE: overall.filter((player) => player.position === "TE"),
    K: overall.filter((player) => player.position === "K"),
    DST: overall.filter((player) => player.position === "DST"),
    FLEX: overall.filter((player) => ["RB", "WR", "TE"].includes(player.position)),
  };
  const metadata = {
    available: true,
    sourceKind: "position_consensus" as const,
    rangeKind: "position" as const,
    playerCount: 100,
    updatedAt: SOURCE_DATE,
  };

  return {
    schemaVersion: 7,
    season: 2026,
    week: 0,
    generatedAt: SOURCE_DATE,
    upstreamUpdatedAt: SOURCE_DATE,
    scoringFormat: "PPR",
    source: "Test consensus",
    adpSource: {
      provider: "Test market",
      url: "https://example.com/adp",
      asOf: SOURCE_DATE,
      sampleSize: 10_000,
      matchedCount: overall.length,
    },
    overall,
    positions,
    sliceMetadata: {
      overall: {
        ...metadata,
        sourceKind: "overall_consensus",
        rangeKind: "overall",
        playerCount: overall.length,
      },
      qb: metadata,
      rb: metadata,
      wr: metadata,
      te: metadata,
      flex: {
        ...metadata,
        sourceKind: "derived_flex",
        rangeKind: "overall",
        playerCount: positions.FLEX.length,
      },
      k: metadata,
      dst: metadata,
    },
  };
}

const LEAGUE: FantasyTradeLeagueSettings = {
  scoring: "ppr",
  teams: 8,
  rosterSize: 13,
  lineup: { QB: 1, RB: 1, WR: 1, TE: 1, FLEX: 1, K: 0, DST: 0 },
};

function input(
  sideA: readonly string[],
  sideB: readonly string[],
  overrides: Partial<FantasyTradeEvaluationInput> = {}
): FantasyTradeEvaluationInput {
  return {
    snapshot: buildSnapshot(),
    league: LEAGUE,
    sideA: { playerIds: sideA },
    sideB: { playerIds: sideB },
    now: NOW,
    ...overrides,
  };
}

function replaceOverallPlayer(
  snapshot: FantasySnapshot,
  playerId: string,
  changes: Partial<Player>
): FantasySnapshot {
  return {
    ...snapshot,
    overall: snapshot.overall.map((player) =>
      player.id === playerId ? { ...player, ...changes } : player
    ),
  };
}

describe("calculateReplacementRelativeTradeValue", () => {
  it("is monotonic, bounded, and zero at replacement", () => {
    expect(calculateReplacementRelativeTradeValue(1, 100)).toBe(100);
    expect(calculateReplacementRelativeTradeValue(10, 100)).toBeGreaterThan(
      calculateReplacementRelativeTradeValue(20, 100)
    );
    expect(calculateReplacementRelativeTradeValue(100, 100)).toBe(0);
    expect(calculateReplacementRelativeTradeValue(120, 100)).toBe(0);
    expect(calculateReplacementRelativeTradeValue(Number.NaN, 100)).toBe(0);
  });
});

describe("evaluateFantasyTrade", () => {
  it("returns a balanced result for equal evidence and exposes the versioned contract", () => {
    const result = evaluateFantasyTrade(input(["RB-twin-a"], ["RB-twin-b"]));

    expect(result.modelVersion).toBe(FANTASY_TRADE_MODEL_VERSION);
    expect(result.scope).toBe("preseason-one-qb-redraft");
    expect(result.coverage).toBe("supported");
    expect(result.verdict).toBe("balanced");
    expect(result.relativeGap).toBe(0);
    expect(result.sideA.value).toBe(result.sideB.value);
  });

  it("gives scarce players more value in deeper leagues", () => {
    const shallow = evaluateFantasyTrade(input(["QB-8"], ["RB-8"]));
    const deep = evaluateFantasyTrade(
      input(["QB-8"], ["RB-8"], {
        league: { ...LEAGUE, teams: 16 },
      })
    );

    expect(deep.sideA.players[0].blendedValue).toBeGreaterThan(
      shallow.sideA.players[0].blendedValue as number
    );
  });

  it("raises wide-receiver value when the lineup starts more receivers and flexes", () => {
    const shallow = evaluateFantasyTrade(
      input(["WR-20"], ["RB-20"], {
        league: {
          ...LEAGUE,
          lineup: { QB: 1, RB: 3, WR: 1, TE: 1, FLEX: 0, K: 0, DST: 0 },
        },
      })
    );
    const receiverHeavy = evaluateFantasyTrade(
      input(["WR-20"], ["RB-20"], {
        league: {
          ...LEAGUE,
          lineup: { QB: 1, RB: 1, WR: 4, TE: 1, FLEX: 2, K: 0, DST: 0 },
        },
      })
    );

    expect(receiverHeavy.sideA.players[0].expertValue).toBeGreaterThan(
      shallow.sideA.players[0].expertValue as number
    );
  });

  it("separates expert and reliable current-market values", () => {
    const result = evaluateFantasyTrade(input(["RB-1"], ["RB-10"]));
    const player = result.sideA.players[0];

    expect(player.expertValue).not.toBeNull();
    expect(player.marketValue).not.toBeNull();
    expect(player.blendedValue).not.toBeNull();
    expect(player.marketReliability).toBeGreaterThan(0);
    expect(result.sideA.marketPlayerCount).toBe(1);
  });

  it("withholds the verdict when any selected player lacks reliable market coverage", () => {
    const snapshot = replaceOverallPlayer(buildSnapshot(), "RB-1", {
      adpTimesDrafted: 19,
    });
    const result = evaluateFantasyTrade(
      input(["RB-1"], ["RB-10"], { snapshot })
    );

    expect(result.sideA.players[0].expertValue).not.toBeNull();
    expect(result.sideA.players[0].marketValue).toBeNull();
    expect(result.sideA.players[0].coverage).toBe("limited");
    expect(result.coverage).toBe("insufficient");
    expect(result.verdict).toBe("insufficient");
    expect(result.relativeGap).toBeNull();
  });

  it("withholds the verdict for a stale market while retaining expert explanation", () => {
    const snapshot = buildSnapshot();
    snapshot.adpSource = {
      ...snapshot.adpSource!,
      asOf: "2026-08-01T00:00:00.000Z",
    };
    const result = evaluateFantasyTrade(
      input(["RB-1"], ["RB-10"], { snapshot })
    );

    expect(result.sources.market.usable).toBe(false);
    expect(result.sideA.players[0].expertValue).not.toBeNull();
    expect(result.sideA.players[0].marketValue).toBeNull();
    expect(result.coverage).toBe("insufficient");
    expect(result.verdict).toBe("insufficient");
    expect(result.relativeGap).toBeNull();
  });

  it("fails closed when the expert board is stale", () => {
    const snapshot = buildSnapshot();
    snapshot.upstreamUpdatedAt = "2026-08-01T00:00:00.000Z";
    const result = evaluateFantasyTrade(
      input(["RB-1"], ["RB-10"], { snapshot })
    );

    expect(result.coverage).toBe("insufficient");
    expect(result.verdict).toBe("insufficient");
    expect(result.relativeGap).toBeNull();
  });

  it("prices only overall-board players", () => {
    const snapshot = buildSnapshot();
    snapshot.positions.RB.push({
      ...makePlayer("RB", 500, 1),
      id: "position-only",
    });
    const result = evaluateFantasyTrade(
      input(["position-only"], ["RB-10"], { snapshot })
    );

    expect(result.sideA.players[0].expertValue).toBeNull();
    expect(result.coverage).toBe("insufficient");
    expect(result.verdict).toBe("insufficient");
  });

  it("limits unequal quick-mode packages and states the replacement assumption", () => {
    const result = evaluateFantasyTrade(
      input(["RB-1"], ["RB-10", "WR-10"])
    );

    expect(result.coverage).toBe("limited");
    expect(result.verdict).not.toMatch(/^clear-edge/);
    expect(result.warnings.join(" ")).toContain("replacement-level asset worth zero");
  });

  it("widens its sensitivity range when source spreads grow", () => {
    const narrow = evaluateFantasyTrade(input(["RB-3"], ["WR-3"]));
    const snapshot = replaceOverallPlayer(buildSnapshot(), "RB-3", {
      standardDeviation: 20,
      adpStandardDeviation: 20,
    });
    const wide = evaluateFantasyTrade(
      input(["RB-3"], ["WR-3"], { snapshot })
    );
    const narrowRange = narrow.sideA.players[0].range!;
    const wideRange = wide.sideA.players[0].range!;

    expect(wideRange.high - wideRange.low).toBeGreaterThan(
      narrowRange.high - narrowRange.low
    );
  });

  it("issues a clear edge only when supported ranges do not overlap", () => {
    const result = evaluateFantasyTrade(input(["RB-1"], ["RB-30"]));

    expect(result.coverage).toBe("supported");
    expect(result.rangesOverlap).toBe(false);
    expect(result.verdict).toBe("clear-edge-side-a");
    expect(result.winner).toBe("side-a");
  });

  it("withholds the verdict when a side includes a position the league does not roster", () => {
    const result = evaluateFantasyTrade(input(["K-1"], ["DST-1"]));

    // An unrosterable player has no market in this league, so the evaluation
    // mirrors the dropped-player case instead of pricing him at zero and
    // issuing a "balanced" verdict.
    expect(result.sideA.players[0].blendedValue).toBeNull();
    expect(result.sideA.players[0].coverage).toBe("insufficient");
    expect(result.sideA.players[0].warnings).toContain(
      "K is not used in this league's roster settings."
    );
    expect(result.coverage).toBe("insufficient");
    expect(result.verdict).toBe("insufficient");
  });

  it("rejects duplicate assets and scoring-mismatched snapshots", () => {
    const duplicate = evaluateFantasyTrade(input(["RB-1"], ["RB-1"]));
    expect(duplicate.coverage).toBe("insufficient");
    expect(duplicate.verdict).toBe("insufficient");

    const mismatch = evaluateFantasyTrade(
      input(["RB-1"], ["RB-10"], {
        league: { ...LEAGUE, scoring: "standard" },
      })
    );
    expect(mismatch.coverage).toBe("insufficient");
    expect(mismatch.verdict).toBe("insufficient");
  });
});
