import {
  buildGolfHref,
  DEFAULT_GOLF_STATE,
  normalizeGolfState,
} from "../golf-state";

describe("golf-state", () => {
  it("normalizes invalid values back to the default route state", () => {
    expect(
      normalizeGolfState({
        view: "bad-view",
        player: "not valid",
      })
    ).toEqual(DEFAULT_GOLF_STATE);
  });

  it("preserves valid view and player values", () => {
    expect(
      normalizeGolfState({
        view: "players",
        player: "scottie-scheffler",
      })
    ).toEqual({
      view: "players",
      player: "scottie-scheffler",
    });
  });

  it("builds clean hrefs while preserving unrelated query params", () => {
    expect(
      buildGolfHref(
        {
          view: "players",
          player: "justin-thomas",
        },
        new URLSearchParams("ref=portfolio")
      )
    ).toBe("/golf?ref=portfolio&view=players&player=justin-thomas");

    expect(
      buildGolfHref(
        DEFAULT_GOLF_STATE,
        new URLSearchParams("ref=portfolio&view=players&player=justin-thomas")
      )
    ).toBe("/golf?ref=portfolio");
  });
});
