import { bracketTree, fixtureWinnerId } from "../bracketTree";
import type { WorldCupFixture, WorldCupKnockoutRound } from "@/types/worldCup";

function team(id: string): WorldCupFixture["homeTeam"] {
  return { id, code: id.slice(0, 3).toUpperCase(), shortName: id, crest: null };
}

function fixture(
  id: string,
  homeId: string,
  awayId: string,
  winner: "HOME_TEAM" | "AWAY_TEAM" | null,
  extra: Partial<WorldCupFixture["score"]> = {}
): WorldCupFixture {
  return {
    id,
    utcDate: "2026-07-01T00:00Z",
    status: winner ? "FINISHED" : "SCHEDULED",
    stage: "Knockout",
    group: null,
    matchday: null,
    venue: null,
    homeTeam: team(homeId),
    awayTeam: team(awayId),
    score: {
      winner,
      home: winner === "HOME_TEAM" ? 1 : winner === "AWAY_TEAM" ? 0 : null,
      away: winner === "AWAY_TEAM" ? 1 : winner === "HOME_TEAM" ? 0 : null,
      ...extra,
    },
  };
}

function round(
  id: string,
  name: string,
  order: number,
  fixtures: WorldCupFixture[]
): WorldCupKnockoutRound {
  return { id, name, order, fixtures };
}

describe("fixtureWinnerId", () => {
  it("reads the winner off the score field", () => {
    expect(fixtureWinnerId(fixture("1", "a", "b", "HOME_TEAM"))).toBe("a");
    expect(fixtureWinnerId(fixture("2", "a", "b", "AWAY_TEAM"))).toBe("b");
  });

  it("returns null for a fixture with no decided winner", () => {
    expect(fixtureWinnerId(fixture("3", "a", "b", null))).toBeNull();
  });

  it("falls back to the penalty shootout tally when winner is missing but pens are recorded", () => {
    const f = fixture("4", "a", "b", null, { shootoutHome: 3, shootoutAway: 5 });
    expect(fixtureWinnerId(f)).toBe("b");
  });
});

describe("bracketTree", () => {
  it("returns an empty tree for no knockout rounds, without throwing", () => {
    const tree = bracketTree([]);
    expect(tree.columns).toEqual([]);
    expect(tree.thirdPlace).toBeNull();
    expect(tree.championId).toBeNull();
  });

  it("handles a partial knockout where only the Round of 32 has been played", () => {
    const r32 = Array.from({ length: 16 }, (_, i) =>
      fixture(`r32-${i}`, `team-${i * 2}`, `team-${i * 2 + 1}`, "HOME_TEAM")
    );
    const rounds: WorldCupKnockoutRound[] = [
      round("round-of-32", "Round of 32", 0, r32),
      round("round-of-16", "Round of 16", 1, []),
      round("quarterfinals", "Quarterfinals", 2, []),
      round("semifinals", "Semifinals", 3, []),
      round("third-place", "Third-place match", 4, []),
      round("final", "Final", 5, []),
    ];

    const tree = bracketTree(rounds);

    expect(tree.columns.map((c) => c.fixtures.length)).toEqual([16, 0, 0, 0, 0]);
    expect(tree.columns.map((c) => c.id)).toEqual([
      "round-of-32",
      "round-of-16",
      "quarterfinals",
      "semifinals",
      "final",
    ]);
    // No later round to anchor to, so each fixture stands alone with no feed
    // link, evenly spaced rather than thrown.
    const r32Column = tree.columns[0];
    expect(r32Column.fixtures.every((f) => f.feedsTo === null)).toBe(true);
    expect(r32Column.fixtures[0].slot).toBe(0);
    expect(r32Column.fixtures[0].y).toBeCloseTo(0.5 / 16);
    expect(r32Column.fixtures[15].y).toBeCloseTo(15.5 / 16);
    expect(tree.thirdPlace).toBeNull();
    expect(tree.championId).toBeNull();
  });

  it("does not throw when a fixture's recorded winner matches nobody in the next round", () => {
    const semis = [
      fixture("sf-1", "team-a", "team-b", "HOME_TEAM"),
      fixture("sf-2", "team-c", "team-d", "HOME_TEAM"),
    ];
    // The final's two teams don't match either semifinal winner (team-a,
    // team-c), simulating a data mismatch.
    const final = [fixture("f-1", "nobody-x", "nobody-y", "HOME_TEAM")];
    const rounds: WorldCupKnockoutRound[] = [
      round("semifinals", "Semifinals", 0, semis),
      round("final", "Final", 1, final),
    ];

    const tree = bracketTree(rounds);

    const semiColumn = tree.columns[0];
    expect(semiColumn.fixtures).toHaveLength(2);
    expect(semiColumn.fixtures.every((f) => f.feedsTo === null)).toBe(true);
    // Falls back to even spacing rather than crashing on the missing anchor.
    expect(semiColumn.fixtures[0].y).toBeCloseTo(0.25);
    expect(semiColumn.fixtures[1].y).toBeCloseTo(0.75);
    expect(tree.championId).toBe("nobody-x");
  });

  it("lays out a full 16/8/4/2/1 bracket, linking each fixture to the one it feeds and ending at the champion", () => {
    // 16 Round-of-32 winners, indexed 0..15. Round-of-16 fixture j pairs
    // winners (2j) and (2j+1), matching how bracketTree walks back from the
    // final by team id rather than by list position.
    const r32 = Array.from({ length: 16 }, (_, i) =>
      fixture(`r32-${i}`, `w${i}`, `lose${i}`, "HOME_TEAM")
    );
    const r16 = Array.from({ length: 8 }, (_, j) =>
      fixture(`r16-${j}`, `w${2 * j}`, `w${2 * j + 1}`, "HOME_TEAM")
    );
    // r16 fixture j's winner is w(4j) by construction (home team always wins
    // above), so quarterfinal k pairs r16 winners (2k) and (2k+1) meaning
    // w(4*2k)=w(8k) and w(4*(2k+1))=w(8k+4).
    const qf = Array.from({ length: 4 }, (_, k) =>
      fixture(`qf-${k}`, `w${8 * k}`, `w${8 * k + 4}`, "HOME_TEAM")
    );
    // qf winner k is w(8k). Semifinal m pairs qf winners (2m) and (2m+1):
    // w(16m) and w(16m+8).
    const sf = Array.from({ length: 2 }, (_, m) =>
      fixture(`sf-${m}`, `w${16 * m}`, `w${16 * m + 8}`, "HOME_TEAM")
    );
    // sf winner m is w(16m): sf-0 -> w0, sf-1 -> w16.
    const final = [fixture("final-1", "w0", "w16", "HOME_TEAM")];
    const thirdPlaceFixture = fixture("third-1", "lose0", "lose1", "AWAY_TEAM");

    const rounds: WorldCupKnockoutRound[] = [
      round("round-of-32", "Round of 32", 0, r32),
      round("round-of-16", "Round of 16", 1, r16),
      round("quarterfinals", "Quarterfinals", 2, qf),
      round("semifinals", "Semifinals", 3, sf),
      round("third-place", "Third-place match", 4, [thirdPlaceFixture]),
      round("final", "Final", 5, final),
    ];

    const tree = bracketTree(rounds);

    expect(tree.columns.map((c) => c.id)).toEqual([
      "round-of-32",
      "round-of-16",
      "quarterfinals",
      "semifinals",
      "final",
    ]);
    expect(tree.columns.map((c) => c.fixtures.length)).toEqual([16, 8, 4, 2, 1]);

    // The third-place match is dropped from the tree and returned on its own.
    expect(tree.thirdPlace?.id).toBe("third-1");
    expect(tree.columns.some((c) => c.fixtures.some((f) => f.fixture.id === "third-1"))).toBe(
      false
    );

    // Round of 32 slot 0 (w0 vs lose0) feeds Round of 16 slot 0 (w0 vs w1),
    // which feeds quarterfinal slot 0 (w0 vs w4), which feeds semifinal slot
    // 0 (w0 vs w8), which feeds the final.
    const r32Column = tree.columns[0];
    const r16Column = tree.columns[1];
    const qfColumn = tree.columns[2];
    const sfColumn = tree.columns[3];
    const finalColumn = tree.columns[4];

    expect(r32Column.fixtures[0].fixture.id).toBe("r32-0");
    expect(r32Column.fixtures[0].feedsTo).toBe("r16-0");
    expect(r32Column.fixtures[0].winnerId).toBe("w0");
    expect(r16Column.fixtures[0].fixture.id).toBe("r16-0");
    expect(r16Column.fixtures[0].feedsTo).toBe("qf-0");
    expect(qfColumn.fixtures[0].feedsTo).toBe("sf-0");
    expect(sfColumn.fixtures[0].feedsTo).toBe("final-1");
    expect(finalColumn.fixtures[0].feedsTo).toBeNull();

    // Slot indices are 0-based positions within their column.
    expect(r32Column.fixtures.map((f) => f.slot)).toEqual([...Array(16).keys()]);

    // A fixture's y-centre averages the y-centres of the two earlier-round
    // fixtures that feed it, all the way up to a single centred final.
    expect(finalColumn.fixtures[0].y).toBeCloseTo(0.5);
    expect(qfColumn.fixtures[0].y).toBeCloseTo(
      (r16Column.fixtures[0].y + r16Column.fixtures[1].y) / 2
    );
    expect(sfColumn.fixtures[0].y).toBeCloseTo(
      (qfColumn.fixtures[0].y + qfColumn.fixtures[1].y) / 2
    );

    expect(tree.championId).toBe("w0");
  });
});
