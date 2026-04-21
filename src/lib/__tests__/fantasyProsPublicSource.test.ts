/**
 * @jest-environment node
 */
import { parseFantasyProsPublicConsensusPage } from "@/lib/fantasyProsPublicSource";
import { fantasyProsPublicConsensusFixture } from "./fixtures/fantasyProsPublicSource.fixture";

describe("fantasyProsPublicSource", () => {
  it("parses the current public ecrData shape into published player fields", () => {
    const board = parseFantasyProsPublicConsensusPage(fantasyProsPublicConsensusFixture, {
      scoringFormat: "PPR",
      requestedPosition: "RB",
      sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-rb-cheatsheets.php",
    });

    expect(board.requestedPosition).toBe("RB");
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
});
