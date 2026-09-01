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
      ranking: "consensus",
      teams: 12,
      query: "",
    });
  });

  it("ignores the retired view param when normalizing", () => {
    expect(
      normalizeFantasyState({
        position: "qb",
        scoring: "ppr",
        view: "tiers",
      })
    ).toEqual({
      position: "qb",
      scoring: "ppr",
      ranking: "consensus",
      teams: 12,
      query: "",
    });
  });

  it("builds canonical fantasy urls and strips the retired view param", () => {
    expect(
      buildFantasyHref(
        {
          position: "qb",
          scoring: "standard",
          ranking: "consensus",
          teams: 12,
          query: "",
        },
        new URLSearchParams("ref=test&view=tiers")
      )
    ).toBe("/fantasy-football?ref=test&position=qb&scoring=standard");
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
      ranking: "consensus",
      teams: 12,
      query: "Ja'Marr Chase",
    });
    expect(buildFantasyHref(state)).toBe(
      "/fantasy-football?position=wr&scoring=ppr&q=Ja%27Marr+Chase"
    );
  });

  it("normalizes and serializes VORP with a supported league size", () => {
    const state = normalizeFantasyState({
      position: "overall",
      scoring: "PPR",
      ranking: "VORP",
      teams: "14",
    });

    expect(state).toMatchObject({ ranking: "vorp", teams: 14 });
    expect(buildFantasyHref(state)).toBe(
      "/fantasy-football?position=overall&scoring=ppr&ranking=vorp&teams=14"
    );
    expect(normalizeFantasyState({ ranking: "vorp", teams: "16" }).teams).toBe(12);
  });
});
