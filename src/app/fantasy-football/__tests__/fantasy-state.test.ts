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
      view: "list",
    });
  });

  it("reads the tier view flag", () => {
    expect(
      normalizeFantasyState({
        position: "qb",
        scoring: "ppr",
        view: "tiers",
      })
    ).toEqual({
      position: "qb",
      scoring: "ppr",
      view: "tiers",
    });
  });

  it("ignores unknown view values", () => {
    expect(
      normalizeFantasyState({
        position: "qb",
        scoring: "ppr",
        view: "invalid",
      }).view
    ).toBe("list");
  });

  it("builds canonical fantasy urls without view by default", () => {
    expect(
      buildFantasyHref(
        {
          position: "qb",
          scoring: "standard",
          view: "list",
        },
        new URLSearchParams("ref=test")
      )
    ).toBe("/fantasy-football?ref=test&position=qb&scoring=standard");
  });

  it("includes view=tiers when enabled", () => {
    expect(
      buildFantasyHref({
        position: "rb",
        scoring: "ppr",
        view: "tiers",
      })
    ).toBe("/fantasy-football?position=rb&scoring=ppr&view=tiers");
  });
});
