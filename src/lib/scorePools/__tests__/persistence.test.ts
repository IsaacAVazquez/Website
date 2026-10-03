import {
  createPool,
  createRival,
  decodeScorePoolsStore,
  emptyScorePoolsStore,
  SCORE_POOLS_STORAGE_KEY,
  toPoolAnalysisConfig,
} from "../persistence";
import {
  DEFAULT_FIELD_CONFIG,
  DEFAULT_MODEL_CONFIG,
  DEFAULT_RISK_PARAMS,
  DEFAULT_SCORING_RULES,
  DEFAULT_STANDING,
} from "../defaults";

function storeWith(pools: unknown[], extra: Record<string, unknown> = {}) {
  return { version: 1, activePoolId: null, pools, ...extra };
}

function decodeOnePool(pool: Record<string, unknown>) {
  const decoded = decodeScorePoolsStore(storeWith([{ id: "p1", leagueKey: "epl", ...pool }]));
  if (!decoded) throw new Error("store rejected");
  return decoded.pools[0];
}

describe("decodeScorePoolsStore", () => {
  it("uses a versioned storage key", () => {
    expect(SCORE_POOLS_STORAGE_KEY).toBe("score_pools_store_v1");
  });

  it("rejects non-objects and other versions", () => {
    expect(decodeScorePoolsStore(null)).toBeUndefined();
    expect(decodeScorePoolsStore("store")).toBeUndefined();
    expect(decodeScorePoolsStore([])).toBeUndefined();
    expect(decodeScorePoolsStore({ version: 2, pools: [] })).toBeUndefined();
    expect(decodeScorePoolsStore({ pools: [] })).toBeUndefined();
  });

  it("degrades a non-array pools field to an empty store", () => {
    expect(decodeScorePoolsStore({ version: 1, pools: "nope", activePoolId: "x" })).toEqual({
      version: 1,
      activePoolId: null,
      pools: [],
    });
  });

  it("drops pools without an id or league key", () => {
    const decoded = decodeScorePoolsStore(
      storeWith([
        { id: "keep", leagueKey: "epl" },
        { leagueKey: "epl" },
        { id: "no-league" },
        { id: 7, leagueKey: "epl" },
        "junk",
        null,
      ]),
    );
    expect(decoded?.pools.map((pool) => pool.id)).toEqual(["keep"]);
  });

  it("keeps a valid active pool id and falls back to the first pool otherwise", () => {
    const pools = [
      { id: "a", leagueKey: "epl" },
      { id: "b", leagueKey: "epl" },
    ];
    expect(decodeScorePoolsStore(storeWith(pools, { activePoolId: "b" }))?.activePoolId).toBe("b");
    expect(decodeScorePoolsStore(storeWith(pools, { activePoolId: "gone" }))?.activePoolId).toBe(
      "a",
    );
    expect(decodeScorePoolsStore(storeWith(pools, { activePoolId: 3 }))?.activePoolId).toBe("a");
  });

  it("fills every missing field of a bare pool with defaults", () => {
    expect(decodeOnePool({})).toEqual({
      id: "p1",
      name: "My pool",
      leagueKey: "epl",
      rules: DEFAULT_SCORING_RULES,
      standing: DEFAULT_STANDING,
      field: DEFAULT_FIELD_CONFIG,
      devigMethod: "proportional",
      lockOffsetMinutes: 60,
      timezone: null,
      flags: {},
      submissions: {},
      manualResults: {},
      manualOdds: {},
      rivals: [],
    });
  });

  it("keeps valid scalar settings", () => {
    const pool = decodeOnePool({
      name: "Office pool",
      rules: { exact: 10, correctDifference: 4, correctOutcome: 1, basis: "finalResult", penaltiesCountAsWin: true },
      standing: {
        myPoints: 12,
        nearestAbovePoints: 15,
        nearestBelowPoints: 9,
        poolSize: 20,
        gamesRemaining: 4,
        posture: "chase",
      },
      field: { modalShare: 0.4, chalkShare: 0.7 },
      devigMethod: "power",
      lockOffsetMinutes: 0,
      timezone: "America/Los_Angeles",
    });
    expect(pool.name).toBe("Office pool");
    expect(pool.rules).toEqual({
      exact: 10,
      correctDifference: 4,
      correctOutcome: 1,
      basis: "finalResult",
      penaltiesCountAsWin: true,
    });
    expect(pool.standing).toEqual({
      myPoints: 12,
      nearestAbovePoints: 15,
      nearestBelowPoints: 9,
      poolSize: 20,
      gamesRemaining: 4,
      posture: "chase",
    });
    expect(pool.field).toEqual({ modalShare: 0.4, chalkShare: 0.7 });
    expect(pool.devigMethod).toBe("power");
    expect(pool.lockOffsetMinutes).toBe(0);
    expect(pool.timezone).toBe("America/Los_Angeles");
  });

  it("clamps and repairs out-of-range or mistyped settings", () => {
    const pool = decodeOnePool({
      name: "",
      rules: { exact: 500, correctDifference: -3, correctOutcome: "2", basis: "halfTime", penaltiesCountAsWin: "yes" },
      standing: {
        myPoints: 1e9,
        nearestAbovePoints: Number.POSITIVE_INFINITY,
        nearestBelowPoints: -1e9,
        poolSize: 1,
        gamesRemaining: 3.6,
        posture: "panic",
      },
      field: { modalShare: 2, chalkShare: 0 },
      devigMethod: "shin",
      lockOffsetMinutes: 5000.7,
      timezone: "",
    });
    expect(pool.name).toBe("My pool");
    expect(pool.rules).toEqual({
      exact: 100,
      correctDifference: 0,
      correctOutcome: DEFAULT_SCORING_RULES.correctOutcome,
      basis: DEFAULT_SCORING_RULES.basis,
      penaltiesCountAsWin: false,
    });
    expect(pool.standing).toEqual({
      myPoints: 100000,
      nearestAbovePoints: null,
      nearestBelowPoints: -100000,
      poolSize: 2,
      gamesRemaining: 4,
      posture: "auto",
    });
    expect(pool.field).toEqual({ modalShare: 0.9, chalkShare: 0.1 });
    expect(pool.devigMethod).toBe("proportional");
    expect(pool.lockOffsetMinutes).toBe(1440);
    expect(pool.timezone).toBeNull();
  });

  it("falls back to default field shares when field is not an object", () => {
    expect(decodeOnePool({ field: [0.5, 0.5] }).field).toEqual(DEFAULT_FIELD_CONFIG);
  });

  it("keeps only true context flags and drops empty flag sets", () => {
    const pool = decodeOnePool({
      flags: {
        f1: { deadRubber: true, mustWinHome: "true", unknownFlag: true, rotationRiskAway: true },
        f2: { drawSuitsBoth: false },
        f3: "deadRubber",
      },
    });
    expect(pool.flags).toEqual({ f1: { deadRubber: true, rotationRiskAway: true } });
  });

  it("drops submissions with invalid scorelines", () => {
    const pool = decodeOnePool({
      submissions: {
        ok: { score: { home: 2, away: 1 }, submittedAt: "2026-08-01T10:00:00Z" },
        noTime: { score: { home: 0, away: 0 } },
        boundary: { score: { home: 15, away: 0 }, submittedAt: "t" },
        tooMany: { score: { home: 16, away: 0 } },
        negative: { score: { home: -1, away: 0 } },
        fractional: { score: { home: 1.5, away: 0 } },
        strings: { score: { home: "1", away: "0" } },
        noScore: { submittedAt: "t" },
        notRecord: 5,
      },
    });
    expect(pool.submissions).toEqual({
      ok: { score: { home: 2, away: 1 }, submittedAt: "2026-08-01T10:00:00Z" },
      noTime: { score: { home: 0, away: 0 }, submittedAt: "" },
      boundary: { score: { home: 15, away: 0 }, submittedAt: "t" },
    });
  });

  it("decodes manual results and nulls out invalid extra-time and shootout fields", () => {
    const pool = decodeOnePool({
      manualResults: {
        full: {
          ninetyMinutes: { home: 1, away: 1 },
          afterExtraTime: { home: 2, away: 2 },
          penaltyWinner: "away",
        },
        partial: {
          ninetyMinutes: { home: 0, away: 1 },
          afterExtraTime: { home: "x", away: 1 },
          penaltyWinner: "draw",
        },
        broken: { ninetyMinutes: null },
        notRecord: [],
      },
    });
    expect(pool.manualResults).toEqual({
      full: {
        ninetyMinutes: { home: 1, away: 1 },
        afterExtraTime: { home: 2, away: 2 },
        penaltyWinner: "away",
      },
      partial: { ninetyMinutes: { home: 0, away: 1 }, afterExtraTime: null, penaltyWinner: null },
    });
  });

  it("decodes manual odds, requiring a valid home and away price", () => {
    const pool = decodeOnePool({
      manualOdds: {
        full: { home: 2.1, draw: 3.3, away: 3.6, line: 2.5, over: 1.9, under: 1.95, enteredAt: "t" },
        twoWay: { home: 1.8, away: 2.05, line: 0, over: 1, under: 1001 },
        lineTooHigh: { home: 1.8, away: 2.05, line: 30 },
        evensHome: { home: 1, away: 2 },
        missingAway: { home: 2 },
        infinite: { home: Number.POSITIVE_INFINITY, away: 2 },
        notRecord: "2.1/3.6",
      },
    });
    expect(pool.manualOdds).toEqual({
      full: { home: 2.1, draw: 3.3, away: 3.6, line: 2.5, over: 1.9, under: 1.95, enteredAt: "t" },
      twoWay: { home: 1.8, draw: null, away: 2.05, line: null, over: null, under: null, enteredAt: "" },
      lineTooHigh: {
        home: 1.8,
        draw: null,
        away: 2.05,
        line: null,
        over: null,
        under: null,
        enteredAt: "",
      },
    });
  });

  it("decodes rivals, dropping ones without an id and filtering bad picks", () => {
    const pool = decodeOnePool({
      rivals: [
        {
          id: "r1",
          name: "Sam",
          pointsAdjustment: 7,
          picks: { f1: { home: 1, away: 0 }, f2: { home: -2, away: 0 } },
        },
        { id: "r2", pointsAdjustment: 1e7, picks: "none" },
        { name: "No id" },
        42,
      ],
    });
    expect(pool.rivals).toEqual([
      { id: "r1", name: "Sam", pointsAdjustment: 7, picks: { f1: { home: 1, away: 0 } } },
      { id: "r2", name: "Rival", pointsAdjustment: 100000, picks: {} },
    ]);
  });

  it("treats a non-array rivals field as no rivals", () => {
    expect(decodeOnePool({ rivals: { r1: {} } }).rivals).toEqual([]);
  });
});

describe("factories", () => {
  it("creates a pool with copied defaults and a prefixed id", () => {
    const pool = createPool("epl", "Office");
    expect(pool.id).toMatch(/^pool-/);
    expect(pool.name).toBe("Office");
    expect(pool.leagueKey).toBe("epl");
    expect(pool.rules).toEqual(DEFAULT_SCORING_RULES);
    expect(pool.rules).not.toBe(DEFAULT_SCORING_RULES);
    expect(pool.standing).not.toBe(DEFAULT_STANDING);
    expect(pool.field).not.toBe(DEFAULT_FIELD_CONFIG);
    expect(createPool("epl", "Other").id).not.toBe(pool.id);
  });

  it("round-trips a created pool through JSON and the decoder unchanged", () => {
    const pool = createPool("epl", "Office");
    const store = { version: 1, activePoolId: pool.id, pools: [pool] };
    expect(decodeScorePoolsStore(JSON.parse(JSON.stringify(store)))).toEqual(store);
  });

  it("creates a rival with no picks", () => {
    const rival = createRival("Sam");
    expect(rival).toEqual({ id: expect.stringMatching(/^rival-/), name: "Sam", pointsAdjustment: 0, picks: {} });
  });

  it("creates an empty store at the current version", () => {
    expect(emptyScorePoolsStore()).toEqual({ version: 1, activePoolId: null, pools: [] });
    expect(decodeScorePoolsStore(emptyScorePoolsStore())).toEqual(emptyScorePoolsStore());
  });
});

describe("toPoolAnalysisConfig", () => {
  it("carries the pool's settings and keeps model and risk knobs at defaults", () => {
    const pool = {
      ...createPool("epl", "Office"),
      devigMethod: "power" as const,
      lockOffsetMinutes: 15,
      field: { modalShare: 0.5, chalkShare: 0.8 },
    };
    const config = toPoolAnalysisConfig(pool);
    expect(config.rules).toBe(pool.rules);
    expect(config.standing).toBe(pool.standing);
    expect(config.field).toEqual({ ...DEFAULT_FIELD_CONFIG, modalShare: 0.5, chalkShare: 0.8 });
    expect(config.model).toBe(DEFAULT_MODEL_CONFIG);
    expect(config.risk).toBe(DEFAULT_RISK_PARAMS);
    expect(config.devigMethod).toBe("power");
    expect(config.lockOffsetMinutes).toBe(15);
    expect(config.staleOddsMinutes).toBe(720);
  });
});
