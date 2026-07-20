import type { ScorePoolsSnapshot } from "../../src/types/scorePools";
import { assessScorePoolsSnapshotQuality } from "../verifyScorePoolsSnapshot";

function snapshot(overrides: Partial<ScorePoolsSnapshot> = {}): ScorePoolsSnapshot {
  return {
    generatedAt: "2026-07-20T06:00:00Z",
    leagues: [
      {
        key: "premier-league",
        name: "Premier League",
        sport: "soccer",
        season: "2026-27",
        sources: { fixtures: "API-Football", odds: "The Odds API" },
        generatedAt: "2026-07-20T06:00:00Z",
        sample: false,
        notes: [],
        standings: [],
        fixtures: [
          {
            id: "fixture-1",
            kickoff: "2026-07-21T18:00:00Z",
            homeTeam: "Home",
            awayTeam: "Away",
            stage: null,
            round: null,
            knockout: false,
            status: "scheduled",
            result: null,
            lineupsConfirmed: null,
            injuryNotes: [],
            odds: [
              {
                fetchedAt: "2026-07-20T06:00:00Z",
                bookmaker: "Example",
                manual: false,
                moneyline: { home: 2, draw: 3, away: 4 },
                totals: null,
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("assessScorePoolsSnapshotQuality", () => {
  it("accepts recent provider-backed fixtures and odds", () => {
    const result = assessScorePoolsSnapshotQuality(
      snapshot(),
      new Date("2026-07-20T07:00:00Z")
    );

    expect(result.issues).toEqual([]);
    expect(result.liveFixtures).toBe(1);
    expect(result.liveOdds).toBe(1);
  });

  it("rejects sample-only output even when it contains fixtures and odds", () => {
    const sampleOnly = snapshot();
    sampleOnly.leagues[0].sample = true;
    sampleOnly.leagues[0].sources = {
      fixtures: "manual entry",
      odds: "manual entry",
    };
    sampleOnly.leagues[0].fixtures[0].odds[0].manual = true;

    const result = assessScorePoolsSnapshotQuality(
      sampleOnly,
      new Date("2026-07-20T07:00:00Z")
    );

    expect(result.issues).toEqual(
      expect.arrayContaining([
        "snapshot has no provider-backed live leagues",
        "live leagues have no fixtures",
        "live leagues have no provider odds",
      ])
    );
  });

  it("rejects stale provider data", () => {
    const result = assessScorePoolsSnapshotQuality(
      snapshot(),
      new Date("2026-07-21T07:00:00Z")
    );

    expect(result.issues).toContain(
      "live league is stale or invalid: premier-league"
    );
  });
});
