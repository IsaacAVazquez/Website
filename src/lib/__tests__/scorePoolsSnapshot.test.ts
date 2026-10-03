import { scorePoolsSnapshot } from "@/data/scorePoolsSnapshot";
import {
  getScorePoolsSnapshotData,
  hasLiveScorePoolsData,
  oddsEntryToMarkets,
  toFixtureInput,
} from "../scorePoolsSnapshot";
import type {
  ScorePoolLeagueSnapshot,
  ScorePoolsSnapshot,
  SnapshotFixture,
  SnapshotOddsEntry,
} from "@/types/scorePools";

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
    generatedAt: "2026-08-01T09:00:00.000Z",
    sample: false,
    notes: [],
    fixtures: [fixture()],
    standings: [],
    ...overrides,
  };
}

const snapshotOf = (...leagues: ScorePoolLeagueSnapshot[]): ScorePoolsSnapshot => ({
  generatedAt: "2026-08-01T09:00:00.000Z",
  leagues,
});

describe("getScorePoolsSnapshotData", () => {
  it("returns the committed snapshot", () => {
    expect(getScorePoolsSnapshotData()).toBe(scorePoolsSnapshot);
  });
});

describe("hasLiveScorePoolsData", () => {
  it("is true when a non-sample league has a fixture with fetched odds", () => {
    expect(hasLiveScorePoolsData(snapshotOf(league()))).toBe(true);
  });

  it("is false for sample leagues, empty leagues, and hand-entered odds only", () => {
    expect(hasLiveScorePoolsData(snapshotOf())).toBe(false);
    expect(hasLiveScorePoolsData(snapshotOf(league({ sample: true })))).toBe(false);
    expect(hasLiveScorePoolsData(snapshotOf(league({ fixtures: [] })))).toBe(false);
    expect(
      hasLiveScorePoolsData(snapshotOf(league({ fixtures: [fixture({ odds: [odds({ manual: true })] })] }))),
    ).toBe(false);
    expect(hasLiveScorePoolsData(snapshotOf(league({ fixtures: [fixture({ odds: [] })] })))).toBe(
      false,
    );
  });

  it("is true when any one league qualifies", () => {
    expect(hasLiveScorePoolsData(snapshotOf(league({ sample: true, key: "s" }), league()))).toBe(true);
  });

  it("reads the committed snapshot by default", () => {
    expect(hasLiveScorePoolsData()).toBe(hasLiveScorePoolsData(scorePoolsSnapshot));
  });
});

describe("oddsEntryToMarkets", () => {
  it("maps a full three-way entry with totals", () => {
    expect(oddsEntryToMarkets(odds())).toEqual({
      moneyline: { home: 2.1, draw: 3.4, away: 3.5 },
      totals: { line: 2.5, over: 1.9, under: 1.95 },
      fetchedAt: "2026-08-01T09:00:00.000Z",
      bookmaker: "pinnacle",
      manual: false,
    });
  });

  it("omits null draw, totals, totals prices, and bookmaker rather than passing nulls", () => {
    const twoWay = oddsEntryToMarkets(
      odds({ moneyline: { home: 1.8, draw: null, away: 2.05 }, totals: null, bookmaker: null, manual: true }),
    );
    expect(twoWay).toEqual({
      moneyline: { home: 1.8, away: 2.05 },
      fetchedAt: "2026-08-01T09:00:00.000Z",
      manual: true,
    });
    expect("draw" in twoWay.moneyline).toBe(false);

    const lineOnly = oddsEntryToMarkets(odds({ totals: { line: 3, over: null, under: null } }));
    expect(lineOnly.totals).toEqual({ line: 3 });
  });
});

describe("toFixtureInput", () => {
  it("returns null when a fixture has no odds", () => {
    expect(toFixtureInput(fixture({ odds: [] }))).toBeNull();
  });

  it("maps the latest odds entry, not the first", () => {
    const input = toFixtureInput(
      fixture({
        odds: [
          odds({ fetchedAt: "t1", moneyline: { home: 2.5, draw: 3.2, away: 2.9 } }),
          odds({ fetchedAt: "t2", moneyline: { home: 2.2, draw: 3.3, away: 3.4 } }),
        ],
      }),
    );
    expect(input?.markets.fetchedAt).toBe("t2");
    expect(input?.markets.moneyline.home).toBe(2.2);
  });

  it("prefers stage over round and omits both when neither exists", () => {
    expect(toFixtureInput(fixture({ stage: "Final", round: "Round 7" }))?.stage).toBe("Final");
    expect(toFixtureInput(fixture({ round: "Round 7" }))?.stage).toBe("Round 7");
    expect(toFixtureInput(fixture())?.stage).toBeUndefined();
  });

  it("passes lineup confirmation only once it is known", () => {
    expect(toFixtureInput(fixture())).not.toHaveProperty("lineupsConfirmed");
    expect(toFixtureInput(fixture({ lineupsConfirmed: false }))?.lineupsConfirmed).toBe(false);
    expect(toFixtureInput(fixture({ lineupsConfirmed: true }))?.lineupsConfirmed).toBe(true);
  });

  it("carries identity, kickoff, and the knockout flag", () => {
    expect(toFixtureInput(fixture({ knockout: true }))).toMatchObject({
      id: "f1",
      kickoff: "2026-08-02T19:00:00.000Z",
      homeTeam: "Alpha",
      awayTeam: "Beta",
      knockout: true,
    });
  });
});
