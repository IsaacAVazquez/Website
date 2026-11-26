import { PICKS, RANKINGS } from "../march-madness-data";

describe("RANKINGS", () => {
  it("derives Avg by dropping each team's best and worst system rank", () => {
    const duke = RANKINGS.find((entry) => entry.team === "Duke");
    expect(duke?.avg).toBe(1.2);
  });

  it("ranks by Avg and gives tied teams the same rank", () => {
    expect(RANKINGS.map((entry) => entry.avg)).toEqual([...RANKINGS.map((entry) => entry.avg)].sort((a, b) => a - b));
    const gonzaga = RANKINGS.find((entry) => entry.team === "Gonzaga");
    const illinois = RANKINGS.find((entry) => entry.team === "Illinois");
    expect(gonzaga?.rank).toBe(illinois?.rank);
  });
});

describe("PICKS copy", () => {
  const rank = (team: string) => RANKINGS.find((entry) => entry.team === team)?.rank;
  const body = (pick: string) => PICKS.find((entry) => entry.pick.startsWith(pick))?.body ?? "";

  it("states the blended ranks the table carries", () => {
    expect(PICKS.map((entry) => `${entry.reason} ${entry.body}`).join(" ")).not.toMatch(/all 8 systems|every one of the 8/);
    expect(rank("Michigan")).toBe(2);
    expect(body("Michigan to the Final Four")).toContain("#2 in the blended");
    expect(rank("Arizona")).toBe(3);
    expect(body("Arizona to the Final Four")).toContain("#3 in the blended");
    expect(rank("Illinois")).toBe(9);
    expect(body("Illinois over N. Carolina")).toContain("tied for 9th in the blended");
    expect(rank("Virginia")).toBe(11);
    expect(body("Virginia over Tennessee")).toContain("11th in the blended");
  });
});
