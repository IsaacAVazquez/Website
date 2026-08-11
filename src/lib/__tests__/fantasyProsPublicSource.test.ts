/**
 * @jest-environment node
 */
import {
  FANTASY_PROS_OFFICIAL_API_SOURCE,
  FANTASY_PROS_PUBLIC_SOURCE,
  assertFantasyProsRefreshCoverage,
  fetchFantasyProsPublicConsensusBoard,
  parseFantasyProsOfficialApiConsensusPayload,
  parseFantasyProsPublicConsensusPage,
  type FantasyProsPublicBoard,
} from "@/lib/fantasyProsPublicSource";
import type { Player } from "@/types";
import {
  fantasyProsOfficialConsensusFixture,
  fantasyProsPublicConsensusFixture,
} from "./fixtures/fantasyProsPublicSource.fixture";

const originalFantasyProsApiKey = process.env.FANTASYPROS_API_KEY;

function responseStub(options: {
  body?: unknown;
  html?: string;
  status?: number;
}): Response {
  const status = options.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Request failed",
    headers: new Headers(),
    json: async () => options.body,
    text: async () => options.html ?? "",
  } as Response;
}

function expandPlayers(
  templates: readonly Player[],
  count: number,
  prefix: string
): Player[] {
  return Array.from({ length: count }, (_, index) => ({
    ...templates[index % templates.length],
    id: `${prefix}-${index}`,
    name: `Player ${index}`,
    averageRank: index + 1,
    rankEcr: index + 1,
    rankAverage: index + 1,
  }));
}

function expandBoard(board: FantasyProsPublicBoard, count: number): FantasyProsPublicBoard {
  return {
    ...board,
    players: expandPlayers(board.players, count, "current"),
  };
}

describe("fantasyProsPublicSource", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFantasyProsApiKey === undefined) {
      delete process.env.FANTASYPROS_API_KEY;
    } else {
      process.env.FANTASYPROS_API_KEY = originalFantasyProsApiKey;
    }
  });

  it("parses the current public ecrData shape into published player fields", () => {
    const board = parseFantasyProsPublicConsensusPage(fantasyProsPublicConsensusFixture, {
      scoringFormat: "PPR",
      requestedPosition: "RB",
      sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
    });

    expect(board.requestedPosition).toBe("RB");
    expect(board.sourceScoring).toBe("PPR");
    expect(board.totalExperts).toBe(120);
    expect(board.upstreamUpdatedAt).toBe("2026-04-15T15:29:20.000Z");
    expect(board.players).toHaveLength(2);
    expect(board.players[0]).toMatchObject({
      id: "fp-23133",
      name: "Bijan Robinson",
      team: "ATL",
      position: "RB",
      averageRank: 1,
      rankEcr: 1,
      rankAverage: 1,
      positionRank: 1,
      minRank: 1,
      maxRank: 1,
      tier: 1,
      ownership: 94.9,
      lastUpdated: "2026-04-15T15:29:20.000Z",
    });
  });

  it("parses the official API shape through the shared validation and player transform", () => {
    const board = parseFantasyProsOfficialApiConsensusPayload(
      fantasyProsOfficialConsensusFixture,
      {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        officialApiPosition: "RB",
        sourceUrl:
          "https://api.fantasypros.com/public/v2/json/nfl/2026/consensus-rankings?position=RB&scoring=PPR&type=DRAFT&week=0",
        expectedSeason: 2026,
      }
    );

    expect(board.sourceLabel).toBe(FANTASY_PROS_OFFICIAL_API_SOURCE);
    expect(board.accessedAt).toBeNull();
    expect(board.players[0]).toMatchObject({
      id: "fp-23133",
      name: "Bijan Robinson",
      rankEcr: 1,
    });
    expect(board.players[0]).not.toHaveProperty("rankAverage");
    expect(board.players[0]).not.toHaveProperty("standardDeviation");
    expect(board.players[0]).not.toHaveProperty("minRank");
    expect(board.players[0]).not.toHaveProperty("maxRank");
  });

  it("uses exact redraft ALL/DRAFT parameters when a key is configured", async () => {
    process.env.FANTASYPROS_API_KEY = "test-fantasypros-key";
    const payload = {
      ...fantasyProsOfficialConsensusFixture,
      position_id: "ALL",
      scoring: "HALF",
    };
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(responseStub({ body: payload }));

    const board = await fetchFantasyProsPublicConsensusBoard(
      "HALF_PPR",
      "OVERALL",
      2026
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, init] = fetchMock.mock.calls[0];
    const sourceUrl = new URL(String(input));
    expect(`${sourceUrl.origin}${sourceUrl.pathname}`).toBe(
      "https://api.fantasypros.com/public/v2/json/nfl/2026/consensus-rankings"
    );
    expect(Object.fromEntries(sourceUrl.searchParams)).toEqual({
      position: "ALL",
      scoring: "HALF",
      type: "DRAFT",
      week: "0",
    });
    expect(init?.headers).toMatchObject({
      Accept: "application/json",
      "x-api-key": "test-fantasypros-key",
    });
    expect(String(input)).not.toContain("test-fantasypros-key");
    expect(board.sourceLabel).toBe(FANTASY_PROS_OFFICIAL_API_SOURCE);
    expect(board.sourceUrl).toBe(String(input));
  });

  it.each([
    ["PPR", "PPR"],
    ["STANDARD", "STD"],
  ] as const)(
    "maps redraft %s scoring to the official API %s value",
    async (scoringFormat, sourceScoring) => {
      process.env.FANTASYPROS_API_KEY = "test-fantasypros-key";
      const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(
        responseStub({
          body: {
            ...fantasyProsOfficialConsensusFixture,
            position_id: "ALL",
            scoring: sourceScoring,
          },
        })
      );

      await fetchFantasyProsPublicConsensusBoard(
        scoringFormat,
        "OVERALL",
        2026
      );

      const sourceUrl = new URL(String(fetchMock.mock.calls[0][0]));
      expect(Object.fromEntries(sourceUrl.searchParams)).toEqual({
        position: "ALL",
        scoring: sourceScoring,
        type: "DRAFT",
        week: "0",
      });
    }
  );

  it("rejects an official response whose position differs from the exact API request", () => {
    expect(() =>
      parseFantasyProsOfficialApiConsensusPayload(
        {
          ...fantasyProsOfficialConsensusFixture,
          position_id: "OP",
        },
        {
          scoringFormat: "PPR",
          requestedPosition: "OVERALL",
          officialApiPosition: "ALL",
          sourceUrl: "https://api.fantasypros.com/example",
          expectedSeason: 2026,
        }
      )
    ).toThrow(/OP for an exact ALL request/);
  });

  it("validates official API scoring even for a shared HTML position", () => {
    const players = fantasyProsOfficialConsensusFixture.players.map((player, index) => ({
      ...player,
      player_position_id: "QB",
      player_positions: "QB",
      pos_rank: `QB${index + 1}`,
    }));

    expect(() =>
      parseFantasyProsOfficialApiConsensusPayload(
        {
          ...fantasyProsOfficialConsensusFixture,
          position_id: "QB",
          scoring: "STD",
          players,
        },
        {
          scoringFormat: "PPR",
          requestedPosition: "QB",
          officialApiPosition: "QB",
          sourceUrl: "https://api.fantasypros.com/example",
          expectedSeason: 2026,
        }
      )
    ).toThrow(/scoring "STD" instead of PPR/);
  });

  it.each([
    ["zero", 0],
    ["fractional", 1747173394.5],
    ["millisecond-sized", 1747173394000],
    ["future", Math.floor(Date.now() / 1000) + 360],
  ])("rejects a %s official source timestamp", (_label, lastUpdated) => {
    expect(() =>
      parseFantasyProsOfficialApiConsensusPayload(
        {
          ...fantasyProsOfficialConsensusFixture,
          last_updated_ts: lastUpdated,
        },
        {
          scoringFormat: "PPR",
          requestedPosition: "RB",
          officialApiPosition: "RB",
          sourceUrl: "https://api.fantasypros.com/example",
          expectedSeason: 2026,
        }
      )
    ).toThrow(/invalid last_updated_ts timestamp/);
  });

  it("accepts the official documented timestamp example", () => {
    expect(() =>
      parseFantasyProsOfficialApiConsensusPayload(
        {
          ...fantasyProsOfficialConsensusFixture,
          last_updated_ts: 1747173394,
        },
        {
          scoringFormat: "PPR",
          requestedPosition: "RB",
          officialApiPosition: "RB",
          sourceUrl: "https://api.fantasypros.com/example",
          expectedSeason: 2026,
        }
      )
    ).not.toThrow();
  });

  it("allows the official source timestamp to lead the runner clock by 300 seconds", () => {
    expect(() =>
      parseFantasyProsOfficialApiConsensusPayload(
        {
          ...fantasyProsOfficialConsensusFixture,
          last_updated_ts: Math.floor(Date.now() / 1000) + 300,
        },
        {
          scoringFormat: "PPR",
          requestedPosition: "RB",
          officialApiPosition: "RB",
          sourceUrl: "https://api.fantasypros.com/example",
          expectedSeason: 2026,
        }
      )
    ).not.toThrow();
  });

  it("requires the official filters key before normalizing null", () => {
    const missingFilters: Record<string, unknown> = {
      ...fantasyProsOfficialConsensusFixture,
    };
    delete missingFilters.filters;

    expect(() =>
      parseFantasyProsOfficialApiConsensusPayload(missingFilters, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        officialApiPosition: "RB",
        sourceUrl: "https://api.fantasypros.com/example",
        expectedSeason: 2026,
      })
    ).toThrow(/missing required API response key "filters"/);
    expect(() =>
      parseFantasyProsOfficialApiConsensusPayload(
        { ...fantasyProsOfficialConsensusFixture, filters: [] },
        {
          scoringFormat: "PPR",
          requestedPosition: "RB",
          officialApiPosition: "RB",
          sourceUrl: "https://api.fantasypros.com/example",
          expectedSeason: 2026,
        }
      )
    ).toThrow(/invalid "filters" value/);
  });

  it.each([
    ["tier", { tier: 0 }, /invalid tier/],
    ["tier type", { tier: "1" }, /invalid tier/],
    ["position rank", { pos_rank: "not-a-rank" }, /invalid position rank/],
    ["position rank floor", { pos_rank: "RB0" }, /invalid position rank/],
    ["team", { player_team_id: undefined }, /invalid player_team_id/],
    ["empty team", { player_team_id: "" }, /invalid player_team_id/],
    ["bye week", { player_bye_week: undefined }, /invalid player_bye_week/],
    ["null bye week", { player_bye_week: null }, /invalid player_bye_week/],
    ["ownership", { player_owned_avg: undefined }, /invalid player_owned_avg/],
    ["null ownership", { player_owned_avg: null }, /invalid player_owned_avg/],
  ])("rejects an invalid official player %s", (_label, override, error) => {
    const players = fantasyProsOfficialConsensusFixture.players.map((player, index) =>
      index === 0 ? { ...player, ...override } : player
    );

    expect(() =>
      parseFantasyProsOfficialApiConsensusPayload(
        {
          ...fantasyProsOfficialConsensusFixture,
          players,
        },
        {
          scoringFormat: "PPR",
          requestedPosition: "RB",
          officialApiPosition: "RB",
          sourceUrl: "https://api.fantasypros.com/example",
          expectedSeason: 2026,
        }
      )
    ).toThrow(error);
  });

  it("uses public HTML only when the API key is absent", async () => {
    delete process.env.FANTASYPROS_API_KEY;
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(responseStub({ html: fantasyProsPublicConsensusFixture }));

    const board = await fetchFantasyProsPublicConsensusBoard("PPR", "RB", 2026);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php"
    );
    expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty("x-api-key");
    expect(board.sourceLabel).toBe(FANTASY_PROS_PUBLIC_SOURCE);
  });

  it("does not fall back to public HTML when a configured API request fails", async () => {
    process.env.FANTASYPROS_API_KEY = "configured-secret";
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(responseStub({ status: 401 }));

    await expect(
      fetchFantasyProsPublicConsensusBoard("PPR", "RB", 2026)
    ).rejects.toThrow(/FantasyPros official API/);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("api.fantasypros.com");
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("configured-secret");
  });

  it("fails fast when the public payload is missing required keys", () => {
    const brokenFixture = fantasyProsPublicConsensusFixture.replace('"rank_std":"0.00",', "");

    expect(() =>
      parseFantasyProsPublicConsensusPage(brokenFixture, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
      })
    ).toThrow(/rank_std/i);
  });

  it("rejects a board whose declared scope does not match the request", () => {
    const wrongPosition = fantasyProsPublicConsensusFixture.replace(
      '"position_id":"RB"',
      '"position_id":"WR"'
    );

    expect(() =>
      parseFantasyProsPublicConsensusPage(wrongPosition, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
      })
    ).toThrow(/WR for a RB request/);
  });

  it("rejects a stale season when the fetch supplies an expected season", () => {
    expect(() =>
      parseFantasyProsPublicConsensusPage(fantasyProsPublicConsensusFixture, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
        expectedSeason: 2027,
      })
    ).toThrow(/season 2026, expected 2027/);
  });

  it("rejects a truncated player array even when the remaining players parse", () => {
    const wrongCount = fantasyProsPublicConsensusFixture.replace('"count":2', '"count":3');

    expect(() =>
      parseFantasyProsPublicConsensusPage(wrongCount, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
      })
    ).toThrow(/declared 3 players but returned 2/);
  });

  it("rejects a board supported by too few experts", () => {
    const oneExpert = fantasyProsPublicConsensusFixture.replace(
      '"total_experts":120',
      '"total_experts":1'
    );

    expect(() =>
      parseFantasyProsPublicConsensusPage(oneExpert, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
      })
    ).toThrow(/only 1 contributing expert/);
  });

  it("allows a source-specific expert floor without weakening the default", () => {
    const sixExperts = fantasyProsPublicConsensusFixture.replace(
      '"total_experts":120',
      '"total_experts":6'
    );

    expect(() =>
      parseFantasyProsPublicConsensusPage(sixExperts, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/best-ball-overall.php",
        minimumExperts: 5,
      })
    ).not.toThrow();
    expect(() =>
      parseFantasyProsPublicConsensusPage(sixExperts, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
      })
    ).toThrow(/only 6 contributing experts/);

    const fourExperts = sixExperts.replace('"total_experts":6', '"total_experts":4');
    expect(() =>
      parseFantasyProsPublicConsensusPage(fourExperts, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/best-ball-overall.php",
        minimumExperts: 5,
      })
    ).toThrow(/only 4 contributing experts/);
  });

  it.each([0, -1])("rejects a nonpositive player id %s", (playerId) => {
    const invalidId = fantasyProsPublicConsensusFixture.replace(
      '"player_id":23133',
      `"player_id":${playerId}`
    );

    expect(() =>
      parseFantasyProsPublicConsensusPage(invalidId, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
      })
    ).toThrow(/invalid player_id/i);
  });

  it("rejects duplicate player ids", () => {
    const duplicateId = fantasyProsPublicConsensusFixture.replace(
      '"player_id":18877',
      '"player_id":23133'
    );

    expect(() =>
      parseFantasyProsPublicConsensusPage(duplicateId, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
      })
    ).toThrow(/duplicate player_id/i);
  });

  it("rejects an empty player name", () => {
    const emptyName = fantasyProsPublicConsensusFixture.replace(
      '"player_name":"Bijan Robinson"',
      '"player_name":"   "'
    );

    expect(() =>
      parseFantasyProsPublicConsensusPage(emptyName, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
      })
    ).toThrow(/empty player_name/i);
  });

  it("rejects an inverted expert rank distribution", () => {
    const invalidRange = fantasyProsPublicConsensusFixture.replace(
      '"rank_min":"1","rank_max":"1"',
      '"rank_min":"4","rank_max":"1"'
    );

    expect(() =>
      parseFantasyProsPublicConsensusPage(invalidRange, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
      })
    ).toThrow(/invalid expert rank distribution/i);
  });

  it("rejects a negative expert rank deviation", () => {
    const invalidDeviation = fantasyProsPublicConsensusFixture.replace(
      '"rank_std":"0.00"',
      '"rank_std":"-1.00"'
    );

    expect(() =>
      parseFantasyProsPublicConsensusPage(invalidDeviation, {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
      })
    ).toThrow(/invalid expert rank distribution/i);
  });

  it("rejects a board below the absolute position floor", () => {
    const board = parseFantasyProsPublicConsensusPage(fantasyProsPublicConsensusFixture, {
      scoringFormat: "PPR",
      requestedPosition: "RB",
      sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
    });

    expect(() => assertFantasyProsRefreshCoverage(board, [], 2026)).toThrow(
      /below the 100-player draft-room floor/
    );
  });

  it("requires at least 300 players on an overall board", () => {
    const parsedBoard = parseFantasyProsPublicConsensusPage(
      fantasyProsPublicConsensusFixture,
      {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
      }
    );
    const board: FantasyProsPublicBoard = {
      ...expandBoard(parsedBoard, 299),
      requestedPosition: "OVERALL",
    };

    expect(() => assertFantasyProsRefreshCoverage(board, [], 2026)).toThrow(
      /below the 300-player draft-room floor/
    );
  });

  it("rejects a same-season refresh that drops most of the prior board", () => {
    const parsedBoard = parseFantasyProsPublicConsensusPage(
      fantasyProsPublicConsensusFixture,
      {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
      }
    );
    const board = expandBoard(parsedBoard, 100);
    const previousPlayers = [
      ...board.players,
      ...expandPlayers(board.players, 50, "prior-only"),
    ];

    expect(() => assertFantasyProsRefreshCoverage(board, previousPlayers, 2026)).toThrow(
      /kept 100 of 150 rows/
    );
  });

  it("does not compare relative coverage across persisted NFL seasons", () => {
    const parsedBoard = parseFantasyProsPublicConsensusPage(
      fantasyProsPublicConsensusFixture,
      {
        scoringFormat: "PPR",
        requestedPosition: "RB",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
      }
    );
    const board = expandBoard(parsedBoard, 100);
    const previousPlayers = expandPlayers(board.players, 250, "prior").map((player) => ({
      ...player,
      lastUpdated: "2026-04-14T00:00:00.000Z",
    }));

    expect(() => assertFantasyProsRefreshCoverage(board, previousPlayers, 2025)).not.toThrow();
  });

  it("accepts the explicit best ball ranking type when requested", () => {
    const bestBallFixture = fantasyProsPublicConsensusFixture
      .replace('"type":"Draft PPR"', '"type":"Best Ball"')
      .replace('"ranking_type_name":"draft"', '"ranking_type_name":"best"')
      .replace('"position_id":"RB"', '"position_id":"ALL"');

    const board = parseFantasyProsPublicConsensusPage(bestBallFixture, {
      scoringFormat: "PPR",
      requestedPosition: "OVERALL",
      sourceUrl: "https://www.fantasypros.com/nfl/rankings/best-ball-overall.php",
      expectedRankingType: "best",
    });

    expect(board.players).toHaveLength(2);
  });

  it("treats the Superflex OP board as an overall player board", () => {
    const superflexFixture = fantasyProsPublicConsensusFixture.replace(
      '"position_id":"RB"',
      '"position_id":"OP"'
    );

    expect(() =>
      parseFantasyProsPublicConsensusPage(superflexFixture, {
        scoringFormat: "PPR",
        requestedPosition: "OVERALL",
        sourceUrl: "https://www.fantasypros.com/nfl/rankings/superflex-cheatsheets.php",
      })
    ).not.toThrow();
  });
});
