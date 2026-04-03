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
        club: "real-betis",
      })
    ).toEqual({
      view: "europe",
      club: "real-betis",
    });
  });

  it("returns the expected club slices for focused views", () => {
    expect(filterClubsForView("title-race").map((club) => club.id)).toEqual([
      "barcelona",
      "real-madrid",
      "villarreal",
      "atletico-madrid",
    ]);
    expect(filterClubsForView("europe")).toHaveLength(6);
    expect(filterClubsForView("relegation").map((club) => club.id)).toEqual([
      "alaves",
      "elche",
      "mallorca",
      "levante",
      "real-oviedo",
    ]);
    expect(getDefaultClubForView("relegation")).toBe("alaves");
  });

  it("builds clean hrefs while preserving unrelated query params", () => {
    expect(
      buildLaLigaHref(
        {
          view: "europe",
          club: "real-betis",
        },
        new URLSearchParams("ref=portfolio")
      )
    ).toBe("/la-liga?ref=portfolio&view=europe&club=real-betis");

    expect(
      buildLaLigaHref(
        DEFAULT_LA_LIGA_STATE,
        new URLSearchParams("ref=portfolio&view=europe&club=real-betis")
      )
    ).toBe("/la-liga?ref=portfolio");
  });
});
