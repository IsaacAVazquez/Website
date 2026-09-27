import { divisionBoard, last10Squares } from "../scoreboard";
import type { MlbStandingsRow } from "@/types/mlb";

function row(overrides: Partial<MlbStandingsRow>): MlbStandingsRow {
  return {
    id: "1",
    code: "NYY",
    name: "New York Yankees",
    shortName: "Yankees",
    league: "AL",
    division: "AL East",
    divisionRank: 1,
    leagueRank: 1,
    wildCardRank: null,
    gamesBack: 0,
    wildCardGamesBack: null,
    wins: 90,
    losses: 60,
    pct: 0.6,
    runsScored: 700,
    runsAllowed: 600,
    runDifferential: 100,
    streak: "W3",
    last10: "9-1",
    ...overrides,
  };
}

describe("last10Squares", () => {
  it("reads wins first then losses", () => {
    expect(last10Squares("9-1")).toEqual([
      "W", "W", "W", "W", "W", "W", "W", "W", "W", "L",
    ]);
  });

  it("handles an early-season count shorter than 10", () => {
    expect(last10Squares("3-2")).toEqual(["W", "W", "W", "L", "L"]);
  });

  it("guards malformed input instead of throwing", () => {
    expect(last10Squares("")).toEqual([]);
    expect(last10Squares("abc")).toEqual([]);
    expect(last10Squares(undefined as unknown as string)).toEqual([]);
  });

  it("clamps a count that overruns 10 games", () => {
    expect(last10Squares("20-5")).toEqual(Array(10).fill("W"));
  });
});

describe("divisionBoard", () => {
  it("returns nothing for empty standings", () => {
    expect(divisionBoard([])).toEqual([]);
  });

  it("tolerates a missing division and an unknown division name", () => {
    const result = divisionBoard([
      row({ id: "1", division: "AL East", divisionRank: 1 }),
      row({ id: "2", division: "Arizona Fall League", divisionRank: 1 }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("AL East");
  });

  it("orders the six divisions AL then NL, east/central/west, regardless of input order", () => {
    const result = divisionBoard([
      row({ id: "1", division: "NL West", divisionRank: 1 }),
      row({ id: "2", division: "AL East", divisionRank: 1 }),
      row({ id: "3", division: "AL Central", divisionRank: 1 }),
    ]);
    expect(result.map((d) => d.name)).toEqual(["AL East", "AL Central", "NL West"]);
  });

  it("sorts teams within a division by divisionRank", () => {
    const result = divisionBoard([
      row({ id: "2", division: "AL East", divisionRank: 2, code: "BOS" }),
      row({ id: "1", division: "AL East", divisionRank: 1, code: "NYY" }),
    ]);
    expect(result[0].teams.map((t) => t.code)).toEqual(["NYY", "BOS"]);
  });

  it("prints a dash for the division leader and a real gap for a team 15+ games clear", () => {
    const result = divisionBoard([
      row({ id: "1", division: "AL East", divisionRank: 1, gamesBack: 0 }),
      row({ id: "2", division: "AL East", divisionRank: 2, gamesBack: 18.5 }),
    ]);
    expect(result[0].teams[0].gamesBack).toBe("—");
    expect(result[0].teams[1].gamesBack).toBe("18.5");
  });

  it("carries record and squares onto each team", () => {
    const result = divisionBoard([
      row({ id: "1", division: "AL East", divisionRank: 1, wins: 91, losses: 59, last10: "6-4" }),
    ]);
    expect(result[0].teams[0]).toMatchObject({
      id: "1",
      record: "91-59",
      squares: ["W", "W", "W", "W", "W", "W", "L", "L", "L", "L"],
    });
  });
});
