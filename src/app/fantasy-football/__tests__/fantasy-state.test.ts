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
      query: "",
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
      query: "",
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
          query: "",
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
        query: "",
      })
    ).toBe("/fantasy-football?position=rb&scoring=ppr&view=tiers");
  });

  it("normalizes and serializes the board search query", () => {
    const state = normalizeFantasyState({
      position: "WR",
      scoring: "PPR",
      q: "  Ja'Marr   Chase  ",
    });

    expect(state).toEqual({
      position: "wr",
      scoring: "ppr",
      view: "list",
      query: "Ja'Marr Chase",
    });
    expect(buildFantasyHref(state)).toBe(
      "/fantasy-football?position=wr&scoring=ppr&q=Ja%27Marr+Chase"
    );
  });
});
