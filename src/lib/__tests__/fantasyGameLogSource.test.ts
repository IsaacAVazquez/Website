import {
  FantasyGameLogFetchError,
  fetchFantasyGameLogBoard,
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

describe("summarizeWeeklyRows edge cases", () => {
  const fourGames: Array<[number, number]> = [
    [10, 14],
    [10, 14],
    [10, 14],
    [10, 14],
  ];

  it("skips rows without a player id or display name", () => {
    const rows = [
      ...gamesFor(fourGames, { player_id: "" }),
      ...gamesFor(fourGames, { player_display_name: "" }),
    ];

    expect(summarizeWeeklyRows(rows, "PPR")).toEqual({ entries: [], throughWeek: null });
  });

  it("skips games whose scoring column is missing, blank, or NA", () => {
    const rows = [
      ...gamesFor(fourGames),
      weekRow({ week: "5", fantasy_points: "NA", fantasy_points_ppr: "NA" }),
      weekRow({ week: "6", fantasy_points: "", fantasy_points_ppr: "abc" }),
    ];

    const { entries, throughWeek } = summarizeWeeklyRows(rows, "PPR");

    expect(entries[0].games).toBe(4);
    // Skipped games do not stretch the reported reach either.
    expect(throughWeek).toBe(4);
  });

  it("scores half PPR from both columns and takes the middle value of an odd sample", () => {
    const rows = gamesFor([
      [2, 4],
      [10, 14],
      [6, 8],
      [12, 18],
      [20, 30],
    ]);

    expect(summarizeWeeklyRows(rows, "HALF_PPR").entries[0]).toMatchObject({
      games: 5,
      low: 3,
      median: 12,
      average: 12.4,
      high: 25,
    });
    expect(summarizeWeeklyRows(rows, "STANDARD").entries[0].median).toBe(10);
  });

  it("treats a missing week as week zero and a missing team as blank", () => {
    const rows = gamesFor(fourGames).map((row) => {
      const { week: _week, team: _team, ...rest } = row;
      return rest;
    });

    const { entries, throughWeek } = summarizeWeeklyRows(rows, "PPR");

    expect(throughWeek).toBe(0);
    expect(entries[0].team).toBe("");
  });

  it("keeps the newer club when an older week arrives later in the file", () => {
    const rows = [
      weekRow({ week: "4", team: "KC", fantasy_points: "10", fantasy_points_ppr: "14" }),
      weekRow({ week: "1", team: "CIN", fantasy_points: "10", fantasy_points_ppr: "14" }),
      weekRow({ week: "2", team: "CIN", fantasy_points: "10", fantasy_points_ppr: "14" }),
      weekRow({ week: "3", team: "CIN", fantasy_points: "10", fantasy_points_ppr: "14" }),
    ];

    expect(summarizeWeeklyRows(rows, "PPR").entries[0].team).toBe("KC");
  });

  it("accepts lowercase positions from the source", () => {
    const rows = gamesFor(fourGames, { position: "te" });
    expect(summarizeWeeklyRows(rows, "PPR").entries[0].position).toBe("TE");
  });
});

describe("fetchFantasyGameLogBoard", () => {
  const CSV = [
    "player_id,player_display_name,position,team,season,week,season_type,fantasy_points,fantasy_points_ppr",
    "00-1,Alpha Back,RB,SF,2025,1,REG,10,14",
    "00-1,Alpha Back,RB,SF,2025,2,REG,12,16",
    "00-1,Alpha Back,RB,SF,2025,3,REG,8,10",
    "00-1,Alpha Back,RB,SF,2025,4,REG,14,20",
    "00-1,Alpha Back,RB,SF,2025,19,POST,40,50",
  ].join("\n");

  function csvResponse(body: string, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: { get: () => null } as unknown as Headers,
      text: async () => body,
    } as unknown as Response;
  }

  it("fetches the season's weekly release and summarizes regular-season games", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(csvResponse(CSV));

    const board = await fetchFantasyGameLogBoard("PPR", 2101, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2101.csv",
      expect.objectContaining({ headers: expect.objectContaining({ Accept: expect.stringContaining("text/csv") }) })
    );
    expect(board).toMatchObject({
      season: 2101,
      seasonType: "REG",
      throughWeek: 4,
      sourceUrl: expect.stringContaining("stats_player_week_2101.csv"),
    });
    expect(board.entries).toEqual([
      { name: "Alpha Back", team: "SF", position: "RB", games: 4, low: 10, median: 15, average: 15, high: 20 },
    ]);
  });

  it("downloads a season once and reuses it for every scoring format", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(csvResponse(CSV));

    const [ppr, standard] = await Promise.all([
      fetchFantasyGameLogBoard("PPR", 2102, fetchImpl),
      fetchFantasyGameLogBoard("STANDARD", 2102, fetchImpl),
    ]);
    const half = await fetchFantasyGameLogBoard("HALF_PPR", 2102, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(ppr.entries[0].average).toBe(15);
    expect(standard.entries[0].average).toBe(11);
    expect(half.entries[0].average).toBe(13);
  });

  it("throws a typed error with the status and does not cache the failure", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(csvResponse("Not Found", 404))
      .mockResolvedValueOnce(csvResponse(CSV));

    const failure = await fetchFantasyGameLogBoard("PPR", 2103, fetchImpl).catch(
      (error: unknown) => error
    );

    expect(failure).toBeInstanceOf(FantasyGameLogFetchError);
    expect(failure).toMatchObject({
      name: "FantasyGameLogFetchError",
      status: 404,
      message: "nflverse weekly stats 2103 responded 404",
    });
    expect((failure as FantasyGameLogFetchError).headers).toBeDefined();

    const retried = await fetchFantasyGameLogBoard("PPR", 2103, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(retried.entries).toHaveLength(1);
  });

  it("returns an empty board for an empty release", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(csvResponse(""));

    await expect(fetchFantasyGameLogBoard("PPR", 2104, fetchImpl)).resolves.toMatchObject({
      entries: [],
      throughWeek: null,
    });
  });
});
