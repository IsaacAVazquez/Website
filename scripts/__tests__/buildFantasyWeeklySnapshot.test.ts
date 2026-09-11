/**
 * @jest-environment node
 */
import {
  FANTASY_PROS_PUBLIC_SOURCE,
  type FantasyProsPublicBoard,
} from "@/lib/fantasyProsPublicSource";
import { toSource } from "../buildFantasyWeeklySnapshot";

function board(overrides: Partial<FantasyProsPublicBoard> = {}): FantasyProsPublicBoard {
  return {
    sourceLabel: FANTASY_PROS_PUBLIC_SOURCE,
    sourceUrl: "https://www.fantasypros.com/nfl/rankings/ppr-flex.php",
    upstreamUpdatedAt: "2026-09-10T19:26:46.000Z",
    totalExperts: 157,
    requestedPosition: "FLEX",
    players: [{ id: "1" }, { id: "2" }],
    ...overrides,
  } as unknown as FantasyProsPublicBoard;
}

describe("buildFantasyWeeklySnapshot toSource", () => {
  it("labels the flex board by the page that was requested rather than the parser's cheat-sheet prose", () => {
    const source = toSource(board());
    expect(source.provider).toBe("FantasyPros weekly flex board");
    expect(source.provider).not.toMatch(/derived locally/);
    expect(source).toMatchObject({
      url: "https://www.fantasypros.com/nfl/rankings/ppr-flex.php",
      asOf: "2026-09-10T19:26:46.000Z",
      expertCount: 157,
      playerCount: 2,
    });
  });

  it("labels the quarterback board separately", () => {
    expect(
      toSource(
        board({
          requestedPosition: "QB",
          sourceUrl: "https://www.fantasypros.com/nfl/rankings/qb.php",
        })
      ).provider
    ).toBe("FantasyPros weekly quarterback board");
  });

  it("refuses a board it was not written for", () => {
    expect(() => toSource(board({ requestedPosition: "OVERALL" }))).toThrow(
      /neither the flex nor the quarterback page/
    );
    expect(() => toSource(board({ sourceLabel: "Somebody else" }))).toThrow(
      /unknown source label/
    );
  });
});
