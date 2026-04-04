import {
  buildLaLigaHref,
  DEFAULT_LA_LIGA_STATE,
  filterClubsForView,
  getDefaultClubForView,
  normalizeLaLigaState,
} from "../la-liga-state";

describe("la-liga-state", () => {
  it("normalizes invalid params back to the default route state", () => {
    expect(
      normalizeLaLigaState({
        view: "unknown",
        club: "unknown-club",
      })
    ).toEqual(DEFAULT_LA_LIGA_STATE);
  });

  it("keeps valid params intact", () => {
    expect(
      normalizeLaLigaState({
        view: "europe",
        club: "bet",
      })
    ).toEqual({
      view: "europe",
      club: "bet",
    });
  });

  it("returns the expected club slices for focused views", () => {
    expect(filterClubsForView("title-race").map((club) => club.id)).toEqual([
      "fcb",
      "rma",
      "vil",
      "atl",
    ]);
    expect(filterClubsForView("europe")).toHaveLength(6);
    expect(filterClubsForView("relegation").map((club) => club.id)).toEqual([
      "sev",
      "ala",
      "elc",
      "lev",
      "ovi",
    ]);
    expect(getDefaultClubForView("relegation")).toBe("sev");
  });

  it("builds clean hrefs while preserving unrelated query params", () => {
    expect(
      buildLaLigaHref(
        {
          view: "europe",
          club: "bet",
        },
        new URLSearchParams("ref=portfolio")
      )
    ).toBe("/la-liga?ref=portfolio&view=europe&club=bet");

    expect(
      buildLaLigaHref(
        DEFAULT_LA_LIGA_STATE,
        new URLSearchParams("ref=portfolio&view=europe&club=bet")
      )
    ).toBe("/la-liga?ref=portfolio");
  });
});
