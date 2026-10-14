import type { GenericFixture } from "../FixtureCard";
import { groupFixtures } from "../fixtureGroups";

function fixture(id: string, matchday: number): GenericFixture {
  return {
    id,
    utcDate: "2026-10-04T17:00:00Z",
    status: "SCHEDULED",
    matchday,
    homeTeam: { id: "home", shortName: "Home", crest: null },
    awayTeam: { id: "away", shortName: "Away", crest: null },
    score: { winner: null, home: null, away: null },
  };
}

describe("groupFixtures", () => {
  it("keeps the order each label first appears in, and the fixtures' order inside it", () => {
    // Results arrive newest first, so the latest week has to stay on top.
    const groups = groupFixtures(
      [fixture("a", 5), fixture("b", 4), fixture("c", 5)],
      (game) => `Week ${game.matchday}`
    );

    expect(groups.map((group) => [group.label, group.fixtures.map((game) => game.id)])).toEqual([
      ["Week 5", ["a", "c"]],
      ["Week 4", ["b"]],
    ]);
  });
});
