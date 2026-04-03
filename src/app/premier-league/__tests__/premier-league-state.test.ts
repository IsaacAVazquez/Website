import {
  buildPremierLeagueHref,
  DEFAULT_PREMIER_LEAGUE_STATE,
  normalizePremierLeagueState,
} from "../premier-league-state";

describe("premier-league-state", () => {
  it("normalizes invalid values back to the default route state", () => {
    expect(
      normalizePremierLeagueState({
        view: "invalid",
        team: "bad-team",
      })
    ).toEqual(DEFAULT_PREMIER_LEAGUE_STATE);
  });

  it("preserves valid view and team values", () => {
    expect(
      normalizePremierLeagueState({
        view: "team",
        team: "57",
      })
    ).toEqual({
      view: "team",
      team: "57",
    });
  });

  it("builds clean hrefs while preserving unrelated query params", () => {
    expect(
      buildPremierLeagueHref(
        {
          view: "fixtures",
          team: "57",
        },
        new URLSearchParams("ref=portfolio")
      )
    ).toBe("/premier-league?ref=portfolio&view=fixtures&team=57");

    expect(
      buildPremierLeagueHref(
        DEFAULT_PREMIER_LEAGUE_STATE,
        new URLSearchParams("ref=portfolio&view=team&team=57")
      )
    ).toBe("/premier-league?ref=portfolio");
  });
});
