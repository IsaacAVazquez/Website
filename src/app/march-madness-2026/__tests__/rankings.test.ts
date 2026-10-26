import { RANKINGS } from "../march-madness-data";

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
