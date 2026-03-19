import { buildFantasyHref, DEFAULT_FANTASY_STATE, normalizeFantasyState } from "../fantasy-state";

describe("fantasy-state", () => {
  it("falls back to defaults for invalid params", () => {
    expect(
      normalizeFantasyState({
        position: "invalid",
        scoring: "weird",
      })
    ).toEqual(DEFAULT_FANTASY_STATE);
  });

  it("normalizes supported aliases and casing", () => {
    expect(
      normalizeFantasyState({
        position: "RB",
        scoring: "HALF-PPR",
      })
    ).toEqual({
      position: "rb",
      scoring: "half_ppr",
    });
  });

  it("builds canonical fantasy urls", () => {
    expect(
      buildFantasyHref(
        {
          position: "qb",
          scoring: "standard",
        },
        new URLSearchParams("ref=test")
      )
    ).toBe("/fantasy-football?ref=test&position=qb&scoring=standard");
  });
});
