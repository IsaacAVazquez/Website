import {
  analyzePoolFixtures,
  effectiveResult,
  scoreParticipantPicks,
} from "../poolAnalysis";
import { createPool, type StoredPool } from "../persistence";
import type {
  ScorePoolLeagueSnapshot,
  SnapshotFixture,
  SnapshotOddsEntry,
} from "@/types/scorePools";

const NOW = "2026-08-01T12:00:00.000Z";

function odds(overrides: Partial<SnapshotOddsEntry> = {}): SnapshotOddsEntry {
  return {
    fetchedAt: "2026-08-01T09:00:00.000Z",
    bookmaker: "pinnacle",
    manual: false,
    moneyline: { home: 2.1, draw: 3.4, away: 3.5 },
    totals: { line: 2.5, over: 1.9, under: 1.95 },
    ...overrides,
  };
}

function fixture(overrides: Partial<SnapshotFixture> = {}): SnapshotFixture {
  return {
    id: "f1",
    kickoff: "2026-08-02T19:00:00.000Z",
    homeTeam: "Alpha",
    awayTeam: "Beta",
    stage: null,
    round: null,
    knockout: false,
    status: "scheduled",
    result: null,
    lineupsConfirmed: null,
    injuryNotes: [],
    odds: [odds()],
    ...overrides,
  };
}

function league(overrides: Partial<ScorePoolLeagueSnapshot> = {}): ScorePoolLeagueSnapshot {
  return {
    key: "epl",
    name: "Premier League",
    sport: "soccer",
    season: "2026",
    sources: { fixtures: "API-Football", odds: "The Odds API" },
    generatedAt: NOW,
    sample: false,
    notes: [],
    fixtures: [],
    standings: [],
    ...overrides,
  };
}

function pool(overrides: Partial<StoredPool> = {}): StoredPool {
  return { ...createPool("epl", "Office"), ...overrides };
}

describe("analyzePoolFixtures", () => {
  it("analyzes priced fixtures and lists the ones with no odds anywhere", () => {
    const priced = fixture({ id: "priced", round: "Round 3" });
    const unpriced = fixture({ id: "unpriced", odds: [] });
    const { analyzed, missingOdds } = analyzePoolFixtures(
      [priced, unpriced],
      league(),
      pool(),
      NOW,
    );
    expect(missingOdds).toEqual([unpriced]);
    expect(analyzed).toHaveLength(1);
    expect(analyzed[0].fixture).toBe(priced);
    expect(analyzed[0].analysis.fixtureId).toBe("priced");
    expect(analyzed[0].analysis.stage).toBe("Round 3");
    expect(analyzed[0].analysis.asOf).toBe(NOW);
    expect(analyzed[0].analysis.market.manual).toBe(false);
    expect(analyzed[0].analysis.market.bookmaker).toBe("pinnacle");
  });

  it("returns empty lists for no fixtures", () => {
    expect(analyzePoolFixtures([], league(), pool(), NOW)).toEqual({ analyzed: [], missingOdds: [] });
  });

  it("lets hand-entered odds beat the snapshot and stand in when the snapshot has none", () => {
    const manualOdds = {
      home: 1.5,
      draw: 4,
      away: 7,
      line: 3.5,
      over: 2.4,
      under: 1.6,
      enteredAt: "2026-08-01T10:00:00.000Z",
    };
    const withSnapshot = fixture({ id: "a", stage: "Semifinal", lineupsConfirmed: true });
    const withoutSnapshot = fixture({ id: "b", odds: [] });
    const { analyzed, missingOdds } = analyzePoolFixtures(
      [withSnapshot, withoutSnapshot],
      league(),
      pool({ manualOdds: { a: manualOdds, b: manualOdds } }),
      NOW,
    );
    expect(missingOdds).toEqual([]);
    const [a, b] = analyzed.map((entry) => entry.analysis);
    for (const analysis of [a, b]) {
      expect(analysis.market.manual).toBe(true);
      expect(analysis.market.fetchedAt).toBe("2026-08-01T10:00:00.000Z");
      expect(analysis.market.bookmaker).toBeNull();
      expect(analysis.market.totalsLine).toBe(3.5);
      expect(analysis.market.overround).toBeCloseTo(1 / 1.5 + 1 / 4 + 1 / 7 - 1, 10);
    }
    expect(a.stage).toBe("Semifinal");
  });

  it("maps a two-way hand entry with no total and no entry time", () => {
    const { analyzed } = analyzePoolFixtures(
      [fixture()],
      league(),
      pool({
        manualOdds: {
          f1: { home: 1.8, draw: null, away: 2.05, line: null, over: null, under: null, enteredAt: "" },
        },
      }),
      NOW,
    );
    const { market } = analyzed[0].analysis;
    expect(market.probabilities.draw).toBeUndefined();
    expect(market.totalsLine).toBeNull();
    expect(market.fetchedAt).toBeNull();
  });

  it("keeps a hand-entered line whose over and under prices are missing", () => {
    const { analyzed } = analyzePoolFixtures(
      [fixture()],
      league(),
      pool({
        manualOdds: {
          f1: { home: 2.1, draw: 3.4, away: 3.5, line: 2.5, over: null, under: null, enteredAt: "t" },
        },
      }),
      NOW,
    );
    expect(analyzed[0].analysis.market.totalsLine).toBe(2.5);
  });

  it("applies the pool's stored flags only to their fixture", () => {
    const { analyzed } = analyzePoolFixtures(
      [fixture({ id: "flagged" }), fixture({ id: "plain" })],
      league(),
      pool({ flags: { flagged: { deadRubber: true } } }),
      NOW,
    );
    expect(analyzed[0].analysis.appliedFlags).toEqual(["deadRubber"]);
    expect(analyzed[1].analysis.appliedFlags).toEqual([]);
  });

  it("derives suggested flags from the league's standings across groups", () => {
    const { analyzed } = analyzePoolFixtures(
      [fixture()],
      league({
        standings: [
          {
            group: "A",
            rows: [{ team: "Alpha", position: 1, played: 2, points: 6, qualified: true, eliminated: false }],
          },
          {
            group: "B",
            rows: [{ team: "Beta", position: 1, played: 2, points: 6, qualified: true, eliminated: false }],
          },
        ],
      }),
      pool(),
      NOW,
    );
    expect(analyzed[0].analysis.suggestedFlags.map((s) => s.flag)).toEqual([
      "deadRubber",
      "drawSuitsBoth",
    ]);
  });

  it("uses the pool's lock offset", () => {
    const { analyzed } = analyzePoolFixtures([fixture()], league(), pool({ lockOffsetMinutes: 30 }), NOW);
    expect(analyzed[0].analysis.locksAt).toBe("2026-08-02T18:30:00.000Z");
  });
});

describe("effectiveResult", () => {
  it("returns the snapshot result, omitting null extra-time and shootout fields", () => {
    const result = effectiveResult(
      fixture({
        result: { ninetyMinutes: { home: 2, away: 0 }, afterExtraTime: null, penaltyWinner: null },
      }),
      pool(),
    );
    expect(result).toEqual({ ninetyMinutes: { home: 2, away: 0 } });
  });

  it("carries extra time and the shootout winner when the snapshot has them", () => {
    expect(
      effectiveResult(
        fixture({
          result: {
            ninetyMinutes: { home: 1, away: 1 },
            afterExtraTime: { home: 1, away: 1 },
            penaltyWinner: "home",
          },
        }),
        pool(),
      ),
    ).toEqual({
      ninetyMinutes: { home: 1, away: 1 },
      afterExtraTime: { home: 1, away: 1 },
      penaltyWinner: "home",
    });
  });

  it("prefers the snapshot result over a manual override", () => {
    const result = effectiveResult(
      fixture({
        result: { ninetyMinutes: { home: 2, away: 0 }, afterExtraTime: null, penaltyWinner: null },
      }),
      pool({
        manualResults: {
          f1: { ninetyMinutes: { home: 0, away: 0 }, afterExtraTime: null, penaltyWinner: null },
        },
      }),
    );
    expect(result?.ninetyMinutes).toEqual({ home: 2, away: 0 });
  });

  it("falls back to the manual result when the snapshot has none", () => {
    expect(
      effectiveResult(
        fixture(),
        pool({
          manualResults: {
            f1: { ninetyMinutes: { home: 0, away: 0 }, afterExtraTime: null, penaltyWinner: null },
          },
        }),
      ),
    ).toEqual({ ninetyMinutes: { home: 0, away: 0 } });
    expect(
      effectiveResult(
        fixture(),
        pool({
          manualResults: {
            f1: {
              ninetyMinutes: { home: 2, away: 2 },
              afterExtraTime: { home: 3, away: 3 },
              penaltyWinner: "away",
            },
          },
        }),
      ),
    ).toEqual({
      ninetyMinutes: { home: 2, away: 2 },
      afterExtraTime: { home: 3, away: 3 },
      penaltyWinner: "away",
    });
  });

  it("returns null with no result anywhere", () => {
    expect(effectiveResult(fixture(), pool())).toBeNull();
  });
});

describe("scoreParticipantPicks", () => {
  const finished = (id: string, kickoff: string, home: number, away: number) =>
    fixture({
      id,
      kickoff,
      status: "finished",
      result: { ninetyMinutes: { home, away }, afterExtraTime: null, penaltyWinner: null },
    });

  it("scores picks under the pool's rules, sorts by kickoff, and totals the points", () => {
    const testLeague = league({
      fixtures: [
        finished("late", "2026-08-03T19:00:00.000Z", 1, 0),
        finished("early", "2026-08-01T19:00:00.000Z", 1, 0),
        finished("mid", "2026-08-02T19:00:00.000Z", 1, 0),
        finished("miss", "2026-08-04T19:00:00.000Z", 0, 2),
        fixture({ id: "open", kickoff: "2026-08-05T19:00:00.000Z" }),
        finished("unpicked", "2026-08-06T19:00:00.000Z", 1, 1),
      ],
    });
    const { rows, total } = scoreParticipantPicks(testLeague, pool(), {
      early: { home: 1, away: 0 }, // exact, 5
      mid: { home: 2, away: 1 }, // difference, 3
      late: { home: 3, away: 0 }, // outcome, 2
      miss: { home: 2, away: 0 }, // none, 0
      open: { home: 1, away: 1 }, // no result yet
      notInLeague: { home: 1, away: 0 },
    });
    expect(rows.map((row) => row.fixture.id)).toEqual(["early", "mid", "late", "miss", "open"]);
    expect(rows.map((row) => row.score?.component ?? null)).toEqual([
      "exact",
      "difference",
      "outcome",
      "none",
      null,
    ]);
    expect(rows[4].result).toBeNull();
    expect(total).toBe(10);
  });

  it("uses the pool's custom point values", () => {
    const testLeague = league({ fixtures: [finished("f1", NOW, 2, 1)] });
    const { total } = scoreParticipantPicks(
      testLeague,
      pool({
        rules: {
          exact: 10,
          correctDifference: 4,
          correctOutcome: 1,
          basis: "ninetyMinutes",
          penaltiesCountAsWin: false,
        },
      }),
      { f1: { home: 2, away: 1 } },
    );
    expect(total).toBe(10);
  });

  it("scores manual results when the snapshot has none", () => {
    const { total, rows } = scoreParticipantPicks(
      league({ fixtures: [fixture()] }),
      pool({
        manualResults: {
          f1: { ninetyMinutes: { home: 0, away: 0 }, afterExtraTime: null, penaltyWinner: null },
        },
      }),
      { f1: { home: 1, away: 1 } },
    );
    expect(rows[0].score?.component).toBe("difference");
    expect(total).toBe(3);
  });

  it("returns nothing for no picks", () => {
    expect(scoreParticipantPicks(league({ fixtures: [fixture()] }), pool(), {})).toEqual({
      rows: [],
      total: 0,
    });
  });
});
