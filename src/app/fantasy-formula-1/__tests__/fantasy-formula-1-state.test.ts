import {
  buildFantasyFormula1Href,
  DEFAULT_FANTASY_FORMULA1_STATE,
  normalizeFantasyFormula1State,
} from "../fantasy-formula-1-state";

describe("fantasy-formula-1-state", () => {
  it("falls back to defaults for unsupported params", () => {
    expect(
      normalizeFantasyFormula1State({
        view: "bad",
        sort: "wrong",
        focus: "all",
      })
    ).toEqual(DEFAULT_FANTASY_FORMULA1_STATE);
  });

  it("normalizes supported sort and focus params and drops the retired view param", () => {
    expect(
      normalizeFantasyFormula1State({
        view: "assets",
        sort: "projection",
        focus: "drivers",
      })
    ).toEqual({
      sort: "projection",
      focus: "drivers",
    });
  });

  it("builds clean hrefs while preserving unrelated query params", () => {
    expect(
      buildFantasyFormula1Href(
        {
          sort: "form",
          focus: "constructors",
        },
        new URLSearchParams("ref=portfolio&view=assets")
      )
    ).toBe("/fantasy-formula-1?ref=portfolio&sort=form&focus=constructors");

    expect(
      buildFantasyFormula1Href(
        DEFAULT_FANTASY_FORMULA1_STATE,
        new URLSearchParams("ref=portfolio&view=rules&sort=price&focus=drivers")
      )
    ).toBe("/fantasy-formula-1?ref=portfolio");
  });
});
