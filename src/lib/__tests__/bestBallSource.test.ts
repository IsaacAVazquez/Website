import {
  assertBestBallSourceScoring,
  getExpectedBestBallSeason,
  parseBestBallAdpPayload,
  parseBestBallSchedulePayload,
} from "@/lib/bestBallSource";

describe("best ball public sources", () => {
  it("keeps January and February attached to the season that began the prior year", () => {
    expect(getExpectedBestBallSeason(new Date("2027-02-15T00:00:00.000Z"))).toBe(2026);
    expect(getExpectedBestBallSeason(new Date("2027-03-01T00:00:00.000Z"))).toBe(2027);
  });

  it("rejects a rankings feed with the wrong scoring label", () => {
    expect(() => assertBestBallSourceScoring("PPR", "HALF")).toThrow(
      "instead of HALF"
    );
    expect(() => assertBestBallSourceScoring("HALF", "HALF")).not.toThrow();
  });

  it("keeps only usable NFL best ball ADP rows and carries the latest timestamp", () => {
    const board = parseBestBallAdpPayload([
      {
        adp: 11.2,
        updatedAt: "2026-08-01T10:00:00Z",
        player: { name: "Ja'Marr Chase", position: "WR" },
      },
      {
        adp: 44,
        updatedAt: "2026-08-02T10:00:00Z",
        player: { name: "Josh Allen", position: "QB" },
      },
      { adp: null, player: { name: "No Market", position: "RB" } },
      { adp: 3, player: { name: "Wrong Sport", position: "P" } },
    ]);

    expect(board.entries).toEqual([
      { name: "Ja'Marr Chase", team: "", position: "WR", adp: 11.2 },
      { name: "Josh Allen", team: "", position: "QB", adp: 44 },
    ]);
    expect(board.updatedAt).toBe("2026-08-02T10:00:00.000Z");
  });

  it("builds both directions of every Week 17 matchup", () => {
    const teams = [
      "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE",
      "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC",
      "LAC", "LAR", "LV", "MIA", "MIN", "NE", "NO", "NYG",
      "NYJ", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WSH",
    ];
    const payload = {
      season: { year: 2026 },
      week: { number: 17 },
      events: Array.from({ length: 16 }, (_, index) => ({
        competitions: [{
          competitors: [
            { team: { abbreviation: teams[index * 2] } },
            { team: { abbreviation: teams[index * 2 + 1] } },
          ],
        }],
      })),
    };

    const board = parseBestBallSchedulePayload(payload, {
      season: 2026,
      week: 17,
      sourceUrl: "https://example.com/schedule",
    });

    expect(board.opponents.ARI).toBe("ATL");
    expect(board.opponents.ATL).toBe("ARI");
    expect(Object.keys(board.opponents)).toHaveLength(32);
  });

  it("rejects an incomplete schedule", () => {
    expect(() =>
      parseBestBallSchedulePayload(
        {
          season: { year: 2026 },
          week: { number: 17 },
          events: [],
        },
        { season: 2026, week: 17, sourceUrl: "https://example.com" }
      )
    ).toThrow("incomplete NFL week");
  });
});
