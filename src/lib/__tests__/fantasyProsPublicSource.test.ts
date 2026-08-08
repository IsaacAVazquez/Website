/**
 * @jest-environment node
 */
import {
  assertFantasyProsRefreshCoverage,
  parseFantasyProsPublicConsensusPage,
  type FantasyProsPublicBoard,
} from "@/lib/fantasyProsPublicSource";
import type { Player } from "@/types";
import { fantasyProsPublicConsensusFixture } from "./fixtures/fantasyProsPublicSource.fixture";

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
