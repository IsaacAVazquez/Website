import {
  analyzeFixture,
  analyzeRound,
  createDefaultPoolConfig,
  summarizeLineMovement,
  type FixtureInput,
  type MarketInputs,
} from "../index";

const NOW = "2026-07-10T12:00:00.000Z";

function fixture(overrides: Partial<FixtureInput> = {}): FixtureInput {
  return {
    id: "final-1",
    kickoff: "2026-07-11T19:00:00.000Z",
    homeTeam: "Alpha",
    awayTeam: "Beta",
    knockout: false,
    markets: {
      moneyline: { home: 2.6, draw: 3.0, away: 3.05 },
      totals: { line: 2.5, over: 2.2, under: 1.7 },
      fetchedAt: "2026-07-10T09:00:00.000Z",
      bookmaker: "book",
    },
    ...overrides,
  };
}

describe("analyzeFixture end to end", () => {
  const pool = createDefaultPoolConfig();
  const analysis = analyzeFixture(fixture(), pool, { now: NOW });

  it("produces a coherent, stamped analysis", () => {
    expect(analysis.asOf).toBe(NOW);
    expect(analysis.market.fetchedAt).toBe("2026-07-10T09:00:00.000Z");
    const { home, draw, away } = analysis.market.probabilities;
    expect(home + (draw as number) + away).toBeCloseTo(1, 10);
    expect(analysis.market.overround).toBeGreaterThan(0);
    const gridSum = analysis.distribution.grid
      .flat()
      .reduce((sum, p) => sum + p, 0);
    expect(gridSum).toBeCloseTo(1, 10);
    expect(analysis.recommendation.candidates.length).toBe(64);
    expect(analysis.recommendation.reason.length).toBeGreaterThan(20);
  });

  it("locks one hour before kickoff by default", () => {
    expect(analysis.locksAt).toBe("2026-07-11T18:00:00.000Z");
  });

  it("recommends the draw in the tight game under default neutral-ish standing", () => {
    expect(analysis.recommendation.recommended.score).toEqual({ home: 1, away: 1 });
  });
});

describe("recheck list", () => {
  const pool = createDefaultPoolConfig();

  it("flags stale odds", () => {
    const analysis = analyzeFixture(
      fixture({
        markets: {
          moneyline: { home: 2.6, draw: 3.0, away: 3.05 },
          fetchedAt: "2026-07-08T09:00:00.000Z",
        },
      }),
      pool,
      { now: NOW },
    );
    expect(analysis.recheck.join(" ")).toMatch(/hours old/);
  });

  it("flags hand-entered odds and missing totals", () => {
    const analysis = analyzeFixture(
      fixture({
        markets: {
          moneyline: { home: 2.6, draw: 3.0, away: 3.05 },
          fetchedAt: NOW,
          manual: true,
        },
      }),
      pool,
      { now: NOW },
    );
    const text = analysis.recheck.join(" ");
    expect(text).toMatch(/entered by hand/);
    expect(text).toMatch(/No totals market/);
  });

  it("flags unconfirmed lineups", () => {
    const analysis = analyzeFixture(fixture({ lineupsConfirmed: false }), pool, { now: NOW });
    expect(analysis.recheck.join(" ")).toMatch(/Lineups aren't confirmed/);
  });
});

describe("context flags", () => {
  const pool = createDefaultPoolConfig();

  it("derives suggested flags from standings and surfaces them for confirmation", () => {
    const standings = [
      { team: "Alpha", qualified: true },
      { team: "Beta", qualified: true },
    ];
    const analysis = analyzeFixture(fixture(), pool, { now: NOW, standings });
    expect(analysis.suggestedFlags.map((s) => s.flag)).toContain("deadRubber");
    expect(analysis.recheck.join(" ")).toMatch(/Standings suggest/);
  });

  it("applying drawSuitsBoth raises the draw mass and lowers the total", () => {
    const base = analyzeFixture(fixture(), pool, { now: NOW });
    const shaded = analyzeFixture(
      fixture({ flags: { drawSuitsBoth: true } }),
      pool,
      { now: NOW },
    );
    expect(shaded.distribution.outcome.draw).toBeGreaterThan(base.distribution.outcome.draw);
    expect(shaded.distribution.expectedTotal).toBeLessThan(base.distribution.expectedTotal);
    expect(shaded.appliedFlags).toContain("drawSuitsBoth");
    expect(shaded.contextAudit.length).toBeGreaterThan(0);
  });

  it("a dead rubber scales the priced total down via the two-pass calibration", () => {
    const base = analyzeFixture(fixture(), pool, { now: NOW });
    const dead = analyzeFixture(fixture({ flags: { deadRubber: true } }), pool, { now: NOW });
    expect(dead.distribution.expectedTotal).toBeCloseTo(
      base.distribution.expectedTotal * pool.model.context.deadRubberTotalFactor,
      1,
    );
  });
});

describe("analyzeRound", () => {
  it("sorts the round by kickoff", () => {
    const pool = createDefaultPoolConfig();
    const round = analyzeRound(
      [
        fixture({ id: "b", kickoff: "2026-07-11T19:00:00.000Z" }),
        fixture({ id: "a", kickoff: "2026-07-11T15:00:00.000Z" }),
      ],
      pool,
      { now: NOW },
    );
    expect(round.map((analysis) => analysis.fixtureId)).toEqual(["a", "b"]);
  });
});

describe("line movement", () => {
  it("summarizes de-vigged movement between the first and latest snapshots", () => {
    const history: MarketInputs[] = [
      {
        moneyline: { home: 2.8, draw: 3.0, away: 2.9 },
        totals: { line: 2.5 },
        fetchedAt: "2026-07-09T09:00:00.000Z",
      },
      {
        moneyline: { home: 2.6, draw: 3.0, away: 3.05 },
        totals: { line: 2.25 },
        fetchedAt: "2026-07-10T09:00:00.000Z",
      },
    ];
    const movement = summarizeLineMovement(history);
    expect(movement).not.toBeNull();
    expect(movement!.snapshots).toBe(2);
    // Home shortened from 2.8 to 2.6, so its de-vigged probability rose.
    expect(movement!.outcomeDelta.home).toBeGreaterThan(0);
    expect(movement!.totalLineDelta).toBeCloseTo(-0.25, 10);
  });

  it("needs at least two timestamped snapshots", () => {
    expect(summarizeLineMovement([])).toBeNull();
    expect(
      summarizeLineMovement([{ moneyline: { home: 2.0, away: 1.9 } }]),
    ).toBeNull();
  });
});
