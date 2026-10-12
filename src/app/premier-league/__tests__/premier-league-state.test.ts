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
        view: "title-race",
        team: "57",
      })
    ).toEqual({
      view: "title-race",
      team: "57",
      detail: "fixtures",
    });
  });

  it("preserves valid detail tab values", () => {
    expect(
      normalizePremierLeagueState({
        view: "table",
        team: "57",
        detail: "scorers",
      }).detail
    ).toBe("scorers");
  });

  it("sends a link to the removed Club detail tab to the default tab", () => {
    // The Club detail tab was cut on 2026-10-11, since the drawer is the club detail.
    expect(normalizePremierLeagueState({ detail: "club" }).detail).toBe("fixtures");
  });

  it("builds clean hrefs while preserving unrelated query params", () => {
    expect(
      buildPremierLeagueHref(
        {
          view: "europe",
          team: "57",
        } as Parameters<typeof buildPremierLeagueHref>[0],
        new URLSearchParams("ref=portfolio")
      )
    ).toBe("/premier-league?ref=portfolio&view=europe&team=57");

    expect(
      buildPremierLeagueHref(
        DEFAULT_PREMIER_LEAGUE_STATE,
        new URLSearchParams("ref=portfolio&view=title-race&team=57")
      )
    ).toBe("/premier-league?ref=portfolio");
  });
});
