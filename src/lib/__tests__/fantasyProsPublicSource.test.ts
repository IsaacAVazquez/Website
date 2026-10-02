/**
 * @jest-environment node
 */
import {
  FANTASY_PROS_PUBLIC_SOURCE,
  assertFantasyProsRefreshCoverage,
  fetchFantasyProsPublicConsensusBoard,
  parseFantasyProsPublicConsensusPage,
  type FantasyProsPublicBoard,
} from "@/lib/fantasyProsPublicSource";
import type { Player } from "@/types";
import { fantasyProsPublicConsensusFixture } from "./fixtures/fantasyProsPublicSource.fixture";

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

  it("fetches the public consensus page", async () => {
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

  // A connection that hangs would otherwise hold the refresh job until its
  // 30 minute cap, and a job that times out is cancelled before it can report.
  it("gives a public page request 20 seconds before it aborts", async () => {
    const timeout = jest.spyOn(AbortSignal, "timeout");
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(responseStub({ html: fantasyProsPublicConsensusFixture }));

    await fetchFantasyProsPublicConsensusBoard("PPR", "RB", 2026);

    expect(timeout).toHaveBeenCalledWith(20_000);
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(timeout.mock.results[0].value);
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

  describe("weekly FLEX boards", () => {
    // Shapes taken from the live pages on 2026-08-21: ppr-flex.php serves
    // position_id "FLX", ranking_type_name "weekly", and RB/WR/TE rows that
    // each carry player_opponent and player_owned_avg.
    function weeklyFlexPage(players: object[], overrides: Record<string, unknown> = {}) {
      const payload = {
        sport: "NFL",
        type: "Weekly PPR",
        ranking_type_name: "weekly",
        year: "2026",
        week: "1",
        position_id: "FLX",
        scoring: "PPR",
        count: players.length,
        total_experts: 8,
        filters: "flex",
        last_updated: "8/21",
        last_updated_ts: 1787366591,
        players,
        ...overrides,
      };
      return `<script>var ecrData = ${JSON.stringify(payload)};</script>`;
    }

    const flexRow = (id: number, position: string) => ({
      player_id: id,
      player_name: `Player ${id}`,
      player_team_id: "DET",
      player_position_id: position,
      player_opponent: "vs. NO",
      player_owned_avg: 42.5,
      rank_ecr: id,
      rank_min: id,
      rank_max: id,
      rank_ave: id,
      rank_std: 1,
      pos_rank: `${position}${id}`,
    });

    it("accepts the flex-eligible positions and keeps the opponent", () => {
      const board = parseFantasyProsPublicConsensusPage(
        weeklyFlexPage([flexRow(1, "RB"), flexRow(2, "WR"), flexRow(3, "TE")]),
        {
          scoringFormat: "PPR",
          requestedPosition: "FLEX",
          sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-flex.php",
          expectedRankingType: "weekly",
          minimumExperts: 5,
        }
      );

      expect(board.requestedPosition).toBe("FLEX");
      expect(board.week).toBe(1);
      expect(board.players.map((entry) => entry.position)).toEqual(["RB", "WR", "TE"]);
      expect(board.players[0]).toMatchObject({ opponent: "vs. NO", ownership: 42.5 });
    });

    it("rejects a quarterback on a flex board", () => {
      expect(() =>
        parseFantasyProsPublicConsensusPage(
          weeklyFlexPage([flexRow(1, "RB"), flexRow(2, "QB")]),
          {
            scoringFormat: "PPR",
            requestedPosition: "FLEX",
            sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-flex.php",
            expectedRankingType: "weekly",
            minimumExperts: 5,
          }
        )
      ).toThrow(/is QB on a FLEX board/);
    });

    it("drops a stray off-position row from a single-position board", () => {
      // Every 2026 TE page carries one RB-tagged row around TE168. That is a
      // data quirk to skip, not a wrong board, so the board publishes without it.
      const rows = Array.from({ length: 20 }, (_, index) => flexRow(index + 1, "TE"));
      const board = parseFantasyProsPublicConsensusPage(
        weeklyFlexPage([...rows, flexRow(21, "RB")], { position_id: "TE" }),
        {
          scoringFormat: "PPR",
          requestedPosition: "TE",
          sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-te.php",
          expectedRankingType: "weekly",
          minimumExperts: 5,
        }
      );

      expect(board.players).toHaveLength(20);
      expect(board.players.every((entry) => entry.position === "TE")).toBe(true);
    });

    it("still rejects a board whose off-position rows exceed the share limit", () => {
      const rows = Array.from({ length: 18 }, (_, index) => flexRow(index + 1, "TE"));
      expect(() =>
        parseFantasyProsPublicConsensusPage(
          weeklyFlexPage(
            [...rows, flexRow(19, "RB"), flexRow(20, "RB"), flexRow(21, "WR")],
            { position_id: "TE" }
          ),
          {
            scoringFormat: "PPR",
            requestedPosition: "TE",
            sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-te.php",
            expectedRankingType: "weekly",
            minimumExperts: 5,
          }
        )
      ).toThrow(/player\[18\] is RB on a TE board/);
    });

    it("still refuses to satisfy an overall request with a flex board", () => {
      // FLX normalizes to its own name rather than onto OVERALL precisely so
      // widening the vocabulary for the weekly board cannot let a draft-season
      // overall request quietly accept a flex-only board.
      expect(() =>
        parseFantasyProsPublicConsensusPage(
          weeklyFlexPage([flexRow(1, "RB")]),
          {
            scoringFormat: "PPR",
            requestedPosition: "OVERALL",
            sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-cheatsheets.php",
            expectedRankingType: "weekly",
            minimumExperts: 5,
          }
        )
      ).toThrow(/returned FLEX for a OVERALL request/);
    });

    it("still rejects a draft board requested as weekly", () => {
      expect(() =>
        parseFantasyProsPublicConsensusPage(
          weeklyFlexPage([flexRow(1, "RB")], { ranking_type_name: "draft", type: "Draft PPR" }),
          {
            scoringFormat: "PPR",
            requestedPosition: "FLEX",
            sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-flex.php",
            expectedRankingType: "weekly",
            minimumExperts: 5,
          }
        )
      ).toThrow(/ranking type "draft" instead of weekly/);
    });
  });

});
