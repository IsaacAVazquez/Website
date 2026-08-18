import {
  gamePointsForFormat,
  MIN_GAME_LOG_GAMES,
  summarizeWeeklyRows,
} from "@/lib/fantasyGameLogSource";

/**
 * Rows in the shape nflverse publishes: one per player per game, with the
 * string values a CSV read produces.
 */
function weekRow(
  overrides: Partial<Record<string, string>> & { fantasy_points: string; fantasy_points_ppr: string }
): Record<string, string> {
  return {
    player_id: "00-0000001",
    player_display_name: "Test Player",
    position: "WR",
    team: "CIN",
    season: "2025",
    week: "1",
    season_type: "REG",
    ...overrides,
  };
}

function gamesFor(points: Array<[number, number]>, overrides: Record<string, string> = {}) {
  return points.map(([standard, ppr], index) =>
    weekRow({
      week: String(index + 1),
      fantasy_points: String(standard),
      fantasy_points_ppr: String(ppr),
      ...overrides,
    })
  );
}

describe("gamePointsForFormat", () => {
  it("reads the published column for standard and PPR", () => {
    expect(gamePointsForFormat(10, 14, "STANDARD")).toBe(10);
    expect(gamePointsForFormat(10, 14, "PPR")).toBe(14);
  });

  it("derives half PPR as the midpoint of the two published columns", () => {
    // The formats differ only by one point per reception, so the midpoint is
    // exact rather than an approximation.
    expect(gamePointsForFormat(10, 14, "HALF_PPR")).toBe(12);
  });

  it("yields nothing when either column is missing", () => {
    expect(gamePointsForFormat(null, 14, "HALF_PPR")).toBeNull();
    expect(gamePointsForFormat(10, null, "PPR")).toBeNull();
  });
});

describe("summarizeWeeklyRows", () => {
  it("reduces a player's games to low, median, average, and high", () => {
    const rows = gamesFor([
      [2, 4],
      [10, 14],
      [6, 8],
      [12, 18],
    ]);

    const { entries } = summarizeWeeklyRows(rows, "PPR");

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      name: "Test Player",
      games: 4,
      low: 4,
      median: 11,
      average: 11,
      high: 18,
    });
  });

  it("drops players under the games-played floor rather than drawing a range across noise", () => {
    const rows = gamesFor([
      [10, 14],
      [12, 16],
    ]);

    expect(summarizeWeeklyRows(rows, "PPR").entries).toHaveLength(0);
    expect(summarizeWeeklyRows(rows, "PPR", 2).entries).toHaveLength(1);
    expect(MIN_GAME_LOG_GAMES).toBeGreaterThan(2);
  });

  it("keeps regular-season games only", () => {
    const rows = [
      ...gamesFor([
        [10, 14],
        [10, 14],
        [10, 14],
        [10, 14],
      ]),
      ...gamesFor([[40, 50]], { season_type: "POST", week: "19" }),
    ];

    const { entries, throughWeek } = summarizeWeeklyRows(rows, "PPR");

    expect(entries[0].games).toBe(4);
    expect(entries[0].high).toBe(14);
    expect(throughWeek).toBe(4);
  });

  it("reports the team from the player's latest game, so a midseason trade lands on the current club", () => {
    const rows = [
      ...gamesFor(
        [
          [10, 14],
          [10, 14],
        ],
        { team: "CIN" }
      ),
      ...gamesFor(
        [
          [10, 14],
          [10, 14],
        ],
        { team: "KC" }
      ).map((row, index) => ({ ...row, week: String(index + 3) })),
    ];

    expect(summarizeWeeklyRows(rows, "PPR").entries[0].team).toBe("KC");
  });

  it("separates players who share a display name by their player id", () => {
    const rows = [
      ...gamesFor([
        [10, 14],
        [10, 14],
        [10, 14],
        [10, 14],
      ]),
      ...gamesFor([
        [2, 3],
        [2, 3],
        [2, 3],
        [2, 3],
      ]).map((row) => ({ ...row, player_id: "00-0000002", team: "NYJ" })),
    ];

    const { entries } = summarizeWeeklyRows(rows, "PPR");

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.average)).toEqual([14, 3]);
  });

  it("ignores positions the redraft board does not rank this way", () => {
    const rows = gamesFor(
      [
        [10, 10],
        [10, 10],
        [10, 10],
        [10, 10],
      ],
      { position: "K" }
    );

    expect(summarizeWeeklyRows(rows, "PPR").entries).toHaveLength(0);
  });
});
